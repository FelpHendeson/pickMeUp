import type { GameState, Hero } from "../types";
import { getHeroDefinitionById } from "../heroes/heroRoster";
import type { TrainingFocus } from "../training/definitions";
import type { TrainingProgressResult } from "../training/trainingRules";
import { getHeroTrainingFocus } from "../training/trainingRules";
import {
  LIGHT_TECHNIQUE_DEFINITIONS,
  PROFICIENCY_CONFIG,
  PROFICIENCY_DEFINITIONS,
  getNextRankThreshold,
  getProficiencyDefinition,
  getRankForXp,
  getRankIndex,
  getRankLabel,
  getWeaponProficiencyForClass,
  isValidProficiencyKey,
  resolveFocusProficiencyPlan,
  type LightTechniqueDefinition,
  type ProficiencyKey,
  type ProficiencyRank,
} from "./definitions";

export type HeroProficiencyProgress = {
  heroId: string;
  key: ProficiencyKey;
  xp: number;
  rank: ProficiencyRank;
  discovered: boolean;
  updatedAt: number;
};

export type ProficiencyState = {
  heroProgress: Record<string, Partial<Record<ProficiencyKey, HeroProficiencyProgress>>>;
};

export type HeroLightTechnique = {
  key: string;
  name: string;
  description: string;
  sourceProficiency: ProficiencyKey;
  requiredRank: ProficiencyRank;
  unlocked: boolean;
};

export type HeroProficiencyView = {
  key: ProficiencyKey;
  label: string;
  description: string;
  xp: number;
  rank: ProficiencyRank;
  rankLabel: string;
  discovered: boolean;
  nextRank: ProficiencyRank | null;
  nextRankXp: number | null;
  isRecommended: boolean;
};

export type HeroProficiencySummary = {
  heroId: string;
  heroName: string;
  discovered: HeroProficiencyView[];
  recommended: ProficiencyKey[];
  undiscoveredRecommended: HeroProficiencyView[];
  techniques: HeroLightTechnique[];
  unlockedTechniques: HeroLightTechnique[];
  readinessBonus: number;
  hasHiddenPotential: boolean;
  potentialHint: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeXp(value: unknown): number {
  return Math.max(0, Math.min(PROFICIENCY_CONFIG.maxXp, Math.floor(Number(value) || 0)));
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

export function createProficiencyState(): ProficiencyState {
  return { heroProgress: {} };
}

export function normalizeProficiencyState(state: GameState): void {
  const source = asRecord((state as { proficiencies?: unknown }).proficiencies);
  const validHeroIds = new Set(
    state.heroes.map((hero) => hero.id).filter((id): id is string => typeof id === "string"),
  );

  const heroProgress: ProficiencyState["heroProgress"] = {};
  const rawProgress = asRecord(source.heroProgress);
  for (const [heroId, keyMap] of Object.entries(rawProgress)) {
    if (!validHeroIds.has(heroId)) continue;
    const keyEntries = asRecord(keyMap);
    const normalizedKeyMap: Partial<Record<ProficiencyKey, HeroProficiencyProgress>> = {};
    for (const [key, entry] of Object.entries(keyEntries)) {
      if (!isValidProficiencyKey(key)) continue;
      const record = asRecord(entry);
      const xp = normalizeXp(record.xp);
      normalizedKeyMap[key] = {
        heroId,
        key,
        xp,
        rank: getRankForXp(xp),
        discovered: Boolean(record.discovered) || xp > 0,
        updatedAt: normalizeTimestamp(record.updatedAt, 0),
      };
    }
    if (Object.keys(normalizedKeyMap).length > 0) {
      heroProgress[heroId] = normalizedKeyMap;
    }
  }

  state.proficiencies = { heroProgress };
}

function getProficiencies(state: GameState): ProficiencyState {
  if (!state.proficiencies) {
    state.proficiencies = createProficiencyState();
  }
  return state.proficiencies;
}

function findHero(state: GameState, heroId: string): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

export function getProficiencyDefinitions() {
  return PROFICIENCY_DEFINITIONS.map((definition) => ({ ...definition }));
}

export function getHeroProficiencyProgress(
  state: GameState,
  heroId: string,
  key: ProficiencyKey,
): HeroProficiencyProgress {
  const stored = getProficiencies(state).heroProgress[heroId]?.[key];
  if (stored) return { ...stored };
  return { heroId, key, xp: 0, rank: "unknown", discovered: false, updatedAt: 0 };
}

// Proficiencias recomendadas por classe. Usa hiddenAptitudeTags do roster apenas
// como leve reforco, sem revelar automaticamente aptidoes ocultas.
export function getRecommendedProficienciesForHero(hero: Pick<Hero, "classKey">): ProficiencyKey[] {
  const classKey = hero?.classKey;
  const recommended = new Set<ProficiencyKey>();
  recommended.add(getWeaponProficiencyForClass(classKey));
  PROFICIENCY_DEFINITIONS.forEach((definition) => {
    if (typeof classKey === "string" && definition.recommendedClassKeys.includes(classKey)) {
      recommended.add(definition.key);
    }
  });
  return [...recommended];
}

// Potencial oculto vem do roster (hiddenAptitudeTags da definicao), sem revelar
// quais aptidoes sao: apenas sinaliza que existe algo ainda nao analisado.
function heroHasHiddenPotential(hero: Hero): boolean {
  const definition = getHeroDefinitionById(hero.definitionId);
  return Boolean(definition && definition.hiddenAptitudeTags.length > 0);
}

export function progressHeroProficiency(
  state: GameState,
  heroId: string,
  key: ProficiencyKey,
  amount: number,
  now = Date.now(),
): HeroProficiencyProgress | null {
  if (!findHero(state, heroId)) return null;
  if (!isValidProficiencyKey(key)) return null;
  const normalizedAmount = Math.max(0, Math.floor(Number(amount) || 0));

  const proficiencies = getProficiencies(state);
  const heroProgress = (proficiencies.heroProgress[heroId] ??= {});
  const current = heroProgress[key] ?? { heroId, key, xp: 0, rank: "unknown" as ProficiencyRank, discovered: false, updatedAt: 0 };
  const xp = normalizeXp(current.xp + normalizedAmount);
  const updated: HeroProficiencyProgress = {
    heroId,
    key,
    xp,
    rank: getRankForXp(xp),
    // Descoberta ao ganhar o primeiro XP de proficiencia.
    discovered: current.discovered || xp > 0,
    updatedAt: normalizeTimestamp(now, current.updatedAt),
  };
  heroProgress[key] = updated;
  return { ...updated };
}

export function progressHeroProficienciesFromTraining(
  state: GameState,
  heroId: string,
  trainingFocus: TrainingFocus,
  amount: number,
  now = Date.now(),
): { primary: HeroProficiencyProgress | null; secondary: HeroProficiencyProgress | null } {
  const hero = findHero(state, heroId);
  if (!hero) return { primary: null, secondary: null };
  const normalizedAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const plan = resolveFocusProficiencyPlan(trainingFocus, hero.classKey);

  // Principal recebe uma fatia maior; secundaria acompanha de forma mais lenta.
  const primaryXp = Math.ceil(normalizedAmount / PROFICIENCY_CONFIG.primaryDivisor);
  const secondaryXp = Math.floor(normalizedAmount / PROFICIENCY_CONFIG.secondaryDivisor);

  const primary = primaryXp > 0 ? progressHeroProficiency(state, heroId, plan.primary, primaryXp, now) : null;
  const secondary =
    plan.secondary && secondaryXp > 0 ? progressHeroProficiency(state, heroId, plan.secondary, secondaryXp, now) : null;

  return { primary, secondary };
}

export function progressProficienciesForTrainingResult(
  state: GameState,
  trainingResult: Pick<TrainingProgressResult, "trainedHeroIds" | "xpPerHero">,
  now = Date.now(),
): void {
  if (!trainingResult || trainingResult.xpPerHero <= 0) return;
  trainingResult.trainedHeroIds.forEach((heroId) => {
    const focus = getHeroTrainingFocus(state, heroId);
    progressHeroProficienciesFromTraining(state, heroId, focus, trainingResult.xpPerHero, now);
  });
}

function buildTechniqueView(state: GameState, heroId: string, definition: LightTechniqueDefinition): HeroLightTechnique {
  const progress = getHeroProficiencyProgress(state, heroId, definition.sourceProficiency);
  const unlocked =
    progress.discovered && getRankIndex(progress.rank) >= getRankIndex(definition.requiredRank);
  return {
    key: definition.key,
    name: definition.name,
    description: definition.description,
    sourceProficiency: definition.sourceProficiency,
    requiredRank: definition.requiredRank,
    unlocked,
  };
}

export function getHeroLightTechniques(state: GameState, heroId: string): HeroLightTechnique[] {
  return LIGHT_TECHNIQUE_DEFINITIONS.map((definition) => buildTechniqueView(state, heroId, definition));
}

export function getProficiencyReadinessBonus(state: GameState, heroId: string): number {
  const heroProgress = getProficiencies(state).heroProgress[heroId] ?? {};
  const total = Object.values(heroProgress)
    .filter((entry): entry is HeroProficiencyProgress => Boolean(entry?.discovered))
    .reduce((sum, entry) => sum + (PROFICIENCY_CONFIG.readinessBonusPerRank[entry.rank] ?? 0), 0);
  const capped = Math.min(PROFICIENCY_CONFIG.readinessBonusPerHeroCap, total);
  return Math.round(capped * 10) / 10;
}

function buildProficiencyView(
  state: GameState,
  heroId: string,
  key: ProficiencyKey,
  recommendedSet: Set<ProficiencyKey>,
): HeroProficiencyView {
  const definition = getProficiencyDefinition(key)!;
  const progress = getHeroProficiencyProgress(state, heroId, key);
  const next = getNextRankThreshold(progress.xp);
  return {
    key,
    label: definition.label,
    description: definition.description,
    xp: progress.xp,
    rank: progress.rank,
    rankLabel: getRankLabel(progress.rank),
    discovered: progress.discovered,
    nextRank: next?.rank ?? null,
    nextRankXp: next?.minXp ?? null,
    isRecommended: recommendedSet.has(key),
  };
}

export function getHeroProficiencySummary(state: GameState, heroId: string): HeroProficiencySummary | null {
  const hero = findHero(state, heroId);
  if (!hero) return null;

  const recommended = getRecommendedProficienciesForHero(hero);
  const recommendedSet = new Set(recommended);
  const heroProgress = getProficiencies(state).heroProgress[heroId] ?? {};

  const discovered = Object.values(heroProgress)
    .filter((entry): entry is HeroProficiencyProgress => Boolean(entry?.discovered))
    .map((entry) => buildProficiencyView(state, heroId, entry.key, recommendedSet))
    .sort((left, right) => right.xp - left.xp || left.label.localeCompare(right.label));

  const discoveredKeys = new Set(discovered.map((view) => view.key));
  const undiscoveredRecommended = recommended
    .filter((key) => !discoveredKeys.has(key))
    .map((key) => buildProficiencyView(state, heroId, key, recommendedSet));

  const techniques = getHeroLightTechniques(state, heroId);
  const unlockedTechniques = techniques.filter((technique) => technique.unlocked);

  const hasHiddenPotential = heroHasHiddenPotential(hero);

  return {
    heroId,
    heroName: hero.name,
    discovered,
    recommended,
    undiscoveredRecommended,
    techniques,
    unlockedTechniques,
    readinessBonus: getProficiencyReadinessBonus(state, heroId),
    hasHiddenPotential,
    potentialHint: hasHiddenPotential ? "Há sinais de uma aptidão ainda não analisada." : null,
  };
}
