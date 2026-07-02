import { isHeroOnExpedition } from "../expeditions";
import type { GameState, Hero } from "../types";
import {
  DEFAULT_TRAINING_FOCUS,
  TRAINING_CONFIG,
  getRecommendedTrainingFocusForClass,
  getTrainingFocusDefinition,
  isValidTrainingFocus,
  type TrainingFocus,
  type TrainingFocusDefinition,
} from "./definitions";

export type HeroTrainingProgress = {
  heroId: string;
  focus: TrainingFocus;
  xp: number;
  level: number;
  updatedAt: number;
};

export type TrainingState = {
  currentFocusByHeroId: Record<string, TrainingFocus>;
  heroProgress: Record<string, Partial<Record<TrainingFocus, HeroTrainingProgress>>>;
  lastTrainingAt: number | null;
};

export type TrainingBlockReason = "expedition" | "injury" | "criticalHp" | "lowMorale";

export type TrainingEligibility = {
  canTrain: boolean;
  reasonCode: TrainingBlockReason | null;
  reason: string;
};

export type HeroTrainingSummary = {
  heroId: string;
  heroName: string;
  focus: TrainingFocus;
  focusDefinition: TrainingFocusDefinition;
  recommendedFocus: TrainingFocus;
  isRecommendedFocus: boolean;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  atMaxLevel: boolean;
  progressLabel: string;
  eligibility: TrainingEligibility;
  statusLabel: string;
  readinessBonus: number;
  focusProgress: Array<{ focus: TrainingFocus; label: string; level: number; xp: number }>;
};

export type TrainingProgressResult = {
  appliedBlocks: number;
  xpPerHero: number;
  trainedHeroIds: string[];
  skippedHeroIds: string[];
  generatedAt: number;
};

export type LobbyTrainingReport = {
  generatedAt: number;
  trainingCount: number;
  pausedCount: number;
  entries: HeroTrainingSummary[];
  summary: string;
};

function normalizeTimestamp(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function normalizeXp(value: unknown): number {
  const maxXp = TRAINING_CONFIG.xpPerLevel * (TRAINING_CONFIG.maxLevel - 1) + TRAINING_CONFIG.xpPerLevel;
  return Math.max(0, Math.min(maxXp, Math.floor(Number(value) || 0)));
}

export function getTrainingLevelForXp(xp: number): number {
  const normalized = normalizeXp(xp);
  return Math.min(TRAINING_CONFIG.maxLevel, 1 + Math.floor(normalized / TRAINING_CONFIG.xpPerLevel));
}

function isAtMaxLevel(level: number): boolean {
  return level >= TRAINING_CONFIG.maxLevel;
}

export function createTrainingState(now = Date.now()): TrainingState {
  return {
    currentFocusByHeroId: {},
    heroProgress: {},
    lastTrainingAt: normalizeTimestamp(now, 0),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function normalizeTrainingState(state: GameState, now = Date.now()): void {
  const source = asRecord((state as { training?: unknown }).training);
  const validHeroIds = new Set(
    state.heroes.map((hero) => hero.id).filter((id): id is string => typeof id === "string"),
  );

  const currentFocusByHeroId: Record<string, TrainingFocus> = {};
  const rawFocus = asRecord(source.currentFocusByHeroId);
  for (const [heroId, focus] of Object.entries(rawFocus)) {
    if (validHeroIds.has(heroId) && isValidTrainingFocus(focus)) {
      currentFocusByHeroId[heroId] = focus;
    }
  }

  const heroProgress: TrainingState["heroProgress"] = {};
  const rawProgress = asRecord(source.heroProgress);
  for (const [heroId, focusMap] of Object.entries(rawProgress)) {
    if (!validHeroIds.has(heroId)) continue;
    const focusEntries = asRecord(focusMap);
    const normalizedFocusMap: Partial<Record<TrainingFocus, HeroTrainingProgress>> = {};
    for (const [focus, entry] of Object.entries(focusEntries)) {
      if (!isValidTrainingFocus(focus)) continue;
      const record = asRecord(entry);
      const xp = normalizeXp(record.xp);
      normalizedFocusMap[focus] = {
        heroId,
        focus,
        xp,
        level: getTrainingLevelForXp(xp),
        updatedAt: normalizeTimestamp(record.updatedAt, 0),
      };
    }
    if (Object.keys(normalizedFocusMap).length > 0) {
      heroProgress[heroId] = normalizedFocusMap;
    }
  }

  state.training = {
    currentFocusByHeroId,
    heroProgress,
    lastTrainingAt: normalizeTimestamp(source.lastTrainingAt, now),
  };
}

function getTraining(state: GameState): TrainingState {
  if (!state.training) {
    state.training = createTrainingState();
  }
  return state.training;
}

function findHero(state: GameState, heroId: string): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

export function getRecommendedTrainingFocusForHero(hero: Pick<Hero, "classKey">): TrainingFocus {
  return getRecommendedTrainingFocusForClass(hero?.classKey);
}

export function getHeroTrainingFocus(state: GameState, heroId: string): TrainingFocus {
  const training = getTraining(state);
  const stored = training.currentFocusByHeroId[heroId];
  if (isValidTrainingFocus(stored)) return stored;
  const hero = findHero(state, heroId);
  return hero ? getRecommendedTrainingFocusForHero(hero) : DEFAULT_TRAINING_FOCUS;
}

export function getHeroTrainingProgress(
  state: GameState,
  heroId: string,
  focus: TrainingFocus,
): HeroTrainingProgress {
  const training = getTraining(state);
  const stored = training.heroProgress[heroId]?.[focus];
  if (stored) return { ...stored };
  return { heroId, focus, xp: 0, level: 1, updatedAt: 0 };
}

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

function getCurrentHpRatio(hero: Hero): number {
  const maxHp = Math.max(1, Math.round(Number(hero.stats.hp) || 1));
  const currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  return Math.min(1, currentHp / maxHp);
}

export function getTrainingEligibility(state: GameState, hero: Hero): TrainingEligibility {
  if (isHeroOnExpedition(state, hero.id)) {
    return { canTrain: false, reasonCode: "expedition", reason: "Treino pausado: herói em expedição." };
  }
  if (hasActiveInjury(hero)) {
    return {
      canTrain: false,
      reasonCode: "injury",
      reason: "Treino pausado: recuperação necessária antes de voltar ao Campo de Treino.",
    };
  }
  if (getCurrentHpRatio(hero) <= TRAINING_CONFIG.criticalHpRatio) {
    return {
      canTrain: false,
      reasonCode: "criticalHp",
      reason: "Treino pausado: HP crítico exige descanso antes do Campo de Treino.",
    };
  }
  if (Number(hero.morale) < TRAINING_CONFIG.minMoraleToTrain) {
    return {
      canTrain: false,
      reasonCode: "lowMorale",
      reason: "Treino pausado: moral baixa demais para render no Campo de Treino.",
    };
  }
  return { canTrain: true, reasonCode: null, reason: "Treinando no Campo de Treino." };
}

export function assignHeroTrainingFocus(
  state: GameState,
  heroId: string,
  focus: TrainingFocus,
  now = Date.now(),
): { ok: boolean; message: string } {
  const hero = findHero(state, heroId);
  if (!hero) {
    return { ok: false, message: "Herói não encontrado para definir o treino." };
  }
  if (!isValidTrainingFocus(focus)) {
    return { ok: false, message: "Foco de treino inválido." };
  }

  const training = getTraining(state);
  training.currentFocusByHeroId[heroId] = focus;

  const focusDefinition = getTrainingFocusDefinition(focus);
  // Garante que exista um registro do foco escolhido para a UI ler de imediato.
  const heroProgress = (training.heroProgress[heroId] ??= {});
  if (!heroProgress[focus]) {
    heroProgress[focus] = {
      heroId,
      focus,
      xp: 0,
      level: 1,
      updatedAt: normalizeTimestamp(now, 0),
    };
  }

  return { ok: true, message: `${hero.name} agora treina ${focusDefinition?.label ?? focus}.` };
}

export function progressHeroTraining(
  state: GameState,
  heroId: string,
  amount: number,
  now = Date.now(),
): HeroTrainingProgress | null {
  const hero = findHero(state, heroId);
  if (!hero) return null;
  const normalizedAmount = Math.max(0, Math.floor(Number(amount) || 0));

  const training = getTraining(state);
  const focus = getHeroTrainingFocus(state, heroId);
  const heroProgress = (training.heroProgress[heroId] ??= {});
  const current = heroProgress[focus] ?? { heroId, focus, xp: 0, level: 1, updatedAt: 0 };
  const xp = normalizeXp(current.xp + normalizedAmount);
  const updated: HeroTrainingProgress = {
    heroId,
    focus,
    xp,
    level: getTrainingLevelForXp(xp),
    updatedAt: normalizeTimestamp(now, current.updatedAt),
  };
  heroProgress[focus] = updated;
  return { ...updated };
}

export function progressTrainingForElapsedTime(state: GameState, now = Date.now()): TrainingProgressResult {
  const training = getTraining(state);
  const generatedAt = normalizeTimestamp(now, 0);
  const last = normalizeTimestamp(training.lastTrainingAt, generatedAt);
  const elapsed = generatedAt - last;
  const rawBlocks = Math.floor(elapsed / TRAINING_CONFIG.blockMs);
  const blocks = Math.max(0, Math.min(TRAINING_CONFIG.maxBlocksPerCall, rawBlocks));

  const trainedHeroIds: string[] = [];
  const skippedHeroIds: string[] = [];

  if (blocks <= 0) {
    return { appliedBlocks: 0, xpPerHero: 0, trainedHeroIds, skippedHeroIds, generatedAt };
  }

  const xpPerHero = blocks * TRAINING_CONFIG.xpPerBlock;
  state.heroes.forEach((hero) => {
    const eligibility = getTrainingEligibility(state, hero);
    if (!eligibility.canTrain) {
      skippedHeroIds.push(hero.id);
      return;
    }
    progressHeroTraining(state, hero.id, xpPerHero, generatedAt);
    trainedHeroIds.push(hero.id);
  });

  // Consome todo o intervalo decorrido. O teto de blocos por chamada descarta
  // o excesso ocioso, impedindo farm em recargas repetidas.
  training.lastTrainingAt = generatedAt;

  return { appliedBlocks: blocks, xpPerHero, trainedHeroIds, skippedHeroIds, generatedAt };
}

export function getTrainingReadinessBonus(state: GameState, heroId: string): number {
  const focus = getHeroTrainingFocus(state, heroId);
  const progress = getHeroTrainingProgress(state, heroId, focus);
  const bonus = progress.level * TRAINING_CONFIG.readinessBonusPerLevel;
  return Math.min(TRAINING_CONFIG.readinessBonusCap, Math.round(bonus * 10) / 10);
}

function formatProgressLabel(level: number, xpIntoLevel: number, xpForNextLevel: number | null): string {
  if (xpForNextLevel === null) {
    return `nível ${level} (máximo)`;
  }
  return `nível ${level}, ${xpIntoLevel}/${xpForNextLevel} XP`;
}

export function getHeroTrainingSummary(state: GameState, heroId: string): HeroTrainingSummary | null {
  const hero = findHero(state, heroId);
  if (!hero) return null;

  const focus = getHeroTrainingFocus(state, heroId);
  const focusDefinition = getTrainingFocusDefinition(focus) ?? getTrainingFocusDefinition(DEFAULT_TRAINING_FOCUS)!;
  const recommendedFocus = getRecommendedTrainingFocusForHero(hero);
  const progress = getHeroTrainingProgress(state, heroId, focus);
  const level = progress.level;
  const atMaxLevel = isAtMaxLevel(level);
  const xpIntoLevel = progress.xp - (level - 1) * TRAINING_CONFIG.xpPerLevel;
  const xpForNextLevel = atMaxLevel ? null : TRAINING_CONFIG.xpPerLevel;
  const eligibility = getTrainingEligibility(state, hero);

  const focusProgress = getTrainingFocusDefinition(focus)
    ? Object.values(getTraining(state).heroProgress[heroId] ?? {})
        .filter((entry): entry is HeroTrainingProgress => Boolean(entry))
        .map((entry) => ({
          focus: entry.focus,
          label: getTrainingFocusDefinition(entry.focus)?.label ?? entry.focus,
          level: entry.level,
          xp: entry.xp,
        }))
        .sort((left, right) => right.level - left.level || right.xp - left.xp)
    : [];

  return {
    heroId,
    heroName: hero.name,
    focus,
    focusDefinition,
    recommendedFocus,
    isRecommendedFocus: focus === recommendedFocus,
    level,
    xp: progress.xp,
    xpIntoLevel: Math.max(0, xpIntoLevel),
    xpForNextLevel,
    atMaxLevel,
    progressLabel: formatProgressLabel(level, Math.max(0, xpIntoLevel), xpForNextLevel),
    eligibility,
    statusLabel: eligibility.canTrain ? "Treinando no Campo de Treino" : eligibility.reason,
    readinessBonus: getTrainingReadinessBonus(state, heroId),
    focusProgress,
  };
}

export function getLobbyTrainingReport(state: GameState, now = Date.now()): LobbyTrainingReport {
  const generatedAt = normalizeTimestamp(now, 0);
  const entries = state.heroes
    .map((hero) => getHeroTrainingSummary(state, hero.id))
    .filter((summary): summary is HeroTrainingSummary => Boolean(summary));

  const trainingCount = entries.filter((entry) => entry.eligibility.canTrain).length;
  const pausedCount = entries.length - trainingCount;

  const summary =
    entries.length === 0
      ? "O Campo de Treino está vazio. Recrute heróis para começar o desenvolvimento técnico."
      : `${trainingCount} herói(s) em desenvolvimento técnico${pausedCount > 0 ? `, ${pausedCount} com treino pausado.` : "."}`;

  return { generatedAt, trainingCount, pausedCount, entries, summary };
}
