import { getHeroDefinitionById } from "../heroes/heroRoster";
import { getHeroProficiencySummary } from "../proficiencies";
import { getHeroTrainingSummary } from "../training";
import type { GameState, Hero } from "../types";
import {
  CORE_INSIGHT_REQUIRED_LEVEL,
  POTENTIAL_CONFIG,
  POTENTIAL_MAX_LEVEL,
  getClassLabel,
  getCoreInsightKeysForLevel,
  getNextPotentialThreshold,
  getPotentialLevelForXp,
  getPotentialLevelLabel,
  type PotentialAnalysisReason,
  type PotentialConfidence,
  type PotentialInsightType,
} from "./definitions";

export type HeroPotentialProgress = {
  heroId: string;
  xp: number;
  level: number;
  revealedInsightKeys: string[];
  updatedAt: number;
};

export type PotentialState = {
  heroAnalysis: Record<string, HeroPotentialProgress>;
};

export type PotentialInsight = {
  key: string;
  type: PotentialInsightType;
  label: string;
  description: string;
  revealed: boolean;
  confidence: PotentialConfidence;
};

export type HeroPotentialReport = {
  heroId: string;
  heroName: string;
  rarity: number;
  analysisLevel: number;
  analysisLevelLabel: string;
  analysisXp: number;
  xpForNextLevel: number | null;
  hiddenPotentialSignal: boolean;
  isLowRarity: boolean;
  summary: string;
  insights: PotentialInsight[];
  revealedInsights: PotentialInsight[];
  lockedInsights: PotentialInsight[];
  recommendations: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeXp(value: unknown): number {
  return Math.max(0, Math.min(POTENTIAL_CONFIG.maxXp, Math.floor(Number(value) || 0)));
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function normalizeRevealedKeys(value: unknown, level: number): string[] {
  const validKeys = new Set(Object.keys(CORE_INSIGHT_REQUIRED_LEVEL));
  const fromInput = Array.isArray(value)
    ? value.filter((key): key is string => typeof key === "string" && validKeys.has(key))
    : [];
  // Garante coerencia com o nivel: chaves cujo requiredLevel <= nivel estao reveladas.
  const merged = new Set<string>([...fromInput, ...getCoreInsightKeysForLevel(level)]);
  return [...merged];
}

export function createPotentialState(): PotentialState {
  return { heroAnalysis: {} };
}

export function normalizePotentialState(state: GameState): void {
  const source = asRecord((state as { potential?: unknown }).potential);
  const validHeroIds = new Set(
    state.heroes.map((hero) => hero.id).filter((id): id is string => typeof id === "string"),
  );

  const heroAnalysis: PotentialState["heroAnalysis"] = {};
  const rawAnalysis = asRecord(source.heroAnalysis);
  for (const [heroId, entry] of Object.entries(rawAnalysis)) {
    if (!validHeroIds.has(heroId)) continue;
    const record = asRecord(entry);
    const xp = normalizeXp(record.xp);
    const level = getPotentialLevelForXp(xp);
    heroAnalysis[heroId] = {
      heroId,
      xp,
      level,
      revealedInsightKeys: normalizeRevealedKeys(record.revealedInsightKeys, level),
      updatedAt: normalizeTimestamp(record.updatedAt, 0),
    };
  }

  state.potential = { heroAnalysis };
}

function getPotential(state: GameState): PotentialState {
  if (!state.potential) {
    state.potential = createPotentialState();
  }
  return state.potential;
}

function findHero(state: GameState, heroId: string): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

export function getHeroPotentialProgress(state: GameState, heroId: string): HeroPotentialProgress {
  const stored = getPotential(state).heroAnalysis[heroId];
  if (stored) return { ...stored, revealedInsightKeys: [...stored.revealedInsightKeys] };
  return { heroId, xp: 0, level: 0, revealedInsightKeys: [], updatedAt: 0 };
}

export function progressHeroPotentialAnalysis(
  state: GameState,
  heroId: string,
  amount: number,
  reason: PotentialAnalysisReason = "training",
  now = Date.now(),
): HeroPotentialProgress | null {
  if (!findHero(state, heroId)) return null;
  const normalizedAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (normalizedAmount <= 0) return null;
  void reason;

  const potential = getPotential(state);
  const current = potential.heroAnalysis[heroId] ?? {
    heroId,
    xp: 0,
    level: 0,
    revealedInsightKeys: [] as string[],
    updatedAt: 0,
  };
  const xp = normalizeXp(current.xp + normalizedAmount);
  const level = getPotentialLevelForXp(xp);
  const revealedInsightKeys = normalizeRevealedKeys(current.revealedInsightKeys, level);
  const updated: HeroPotentialProgress = {
    heroId,
    xp,
    level,
    revealedInsightKeys,
    updatedAt: normalizeTimestamp(now, current.updatedAt),
  };
  potential.heroAnalysis[heroId] = updated;
  return { ...updated, revealedInsightKeys: [...updated.revealedInsightKeys] };
}

export type PotentialProficiencyOutcome = {
  heroId: string;
  progressed: boolean;
  rankUps: number;
};

// Alimenta a analise a partir dos desdobramentos do treino sobre as proficiencias.
// Nao cria tick proprio: acompanha o resultado ja calculado do treino/proficiencia.
export function progressPotentialFromProficiencyOutcomes(
  state: GameState,
  outcomes: readonly PotentialProficiencyOutcome[],
  now = Date.now(),
): void {
  if (!Array.isArray(outcomes)) return;
  outcomes.forEach((outcome) => {
    let xp = 0;
    if (outcome.progressed) xp += POTENTIAL_CONFIG.xpPerProficiencyProgress;
    xp += Math.max(0, Math.floor(Number(outcome.rankUps) || 0)) * POTENTIAL_CONFIG.xpPerProficiencyRankUp;
    if (xp > 0) progressHeroPotentialAnalysis(state, outcome.heroId, xp, "proficiency", now);
  });
}

export function analyzeHeroPotential(
  state: GameState,
  heroId: string,
  now = Date.now(),
): { ok: boolean; message: string } {
  const hero = findHero(state, heroId);
  if (!hero) {
    return { ok: false, message: "Herói não encontrado para análise." };
  }

  const progress = getHeroPotentialProgress(state, heroId);
  if (progress.level >= POTENTIAL_MAX_LEVEL && progress.xp >= POTENTIAL_CONFIG.maxXp) {
    return { ok: false, message: `A análise de ${hero.name} já está completa.` };
  }

  const cost = POTENTIAL_CONFIG.manualAnalysisGoldCost;
  const currentGold = Math.floor(Number(state.resources.gold) || 0);
  if (currentGold < cost) {
    return { ok: false, message: `Ouro insuficiente para analisar ${hero.name} (custo ${cost}).` };
  }

  state.resources.gold = currentGold - cost;
  progressHeroPotentialAnalysis(state, heroId, POTENTIAL_CONFIG.manualAnalysisXp, "manual", now);
  return { ok: true, message: `Análise de ${hero.name} aprofundada.` };
}

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

const LOCKED_DESCRIPTION = "Indício ainda não compreendido. Continue treinando e analisando o herói.";

type InsightCandidate = {
  key: string;
  type: PotentialInsightType;
  label: string;
  description: string;
  confidence: PotentialConfidence;
  requiredLevel: number;
};

export function getPotentialInsightsForHero(state: GameState, heroId: string): PotentialInsight[] {
  const hero = findHero(state, heroId);
  if (!hero) return [];

  const progress = getHeroPotentialProgress(state, heroId);
  const revealedKeys = new Set(progress.revealedInsightKeys);
  const definition = getHeroDefinitionById(hero.definitionId);
  const classLabel = getClassLabel(hero.classKey);
  const trainingSummary = getHeroTrainingSummary(state, heroId);
  const proficiencySummary = getHeroProficiencySummary(state, heroId);
  const hasHidden = Boolean(definition && definition.hiddenAptitudeTags.length > 0);

  const candidates: InsightCandidate[] = [];

  candidates.push({
    key: "signals",
    type: "behavior",
    label: "Sinais iniciais",
    description: `Os primeiros sinais de um ${classLabel} começam a aparecer na rotina do Lobby.`,
    confidence: "low",
    requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.signals,
  });

  if (definition) {
    candidates.push({
      key: "background",
      type: "background",
      label: "Background",
      description: `${definition.origin}: ${definition.background}`,
      confidence: "medium",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.background,
    });
    candidates.push({
      key: "personality",
      type: "behavior",
      label: "Temperamento",
      description: definition.personality,
      confidence: "low",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.personality,
    });
  }

  if (trainingSummary) {
    candidates.push({
      key: "training",
      type: "training",
      label: "Treino",
      description: `O foco atual em ${trainingSummary.focusDefinition.label} reforça a leitura técnica do herói.`,
      confidence: "medium",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.training,
    });
  }

  const topProficiency = proficiencySummary?.discovered[0] ?? null;
  candidates.push({
    key: "proficiency",
    type: "proficiency",
    label: "Proficiência",
    description: topProficiency
      ? `A proficiência ${topProficiency.label} foi revelada, indicando aptidão prática em desenvolvimento.`
      : "Nenhuma proficiência revelada ainda; o treino técnico pode revelar caminhos.",
    confidence: "medium",
    requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.proficiency,
  });

  const topTechnique = proficiencySummary?.unlockedTechniques[0] ?? null;
  if (topTechnique) {
    candidates.push({
      key: "technique",
      type: "proficiency",
      label: "Técnica leve",
      description: `Já demonstra técnicas leves como ${topTechnique.name}.`,
      confidence: "medium",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.technique,
    });
  }

  if (hasHidden) {
    // Nunca expoe os hiddenAptitudeTags: apenas sinaliza que existe algo a revelar.
    candidates.push({
      key: "hiddenAptitude",
      type: "hiddenAptitude",
      label: "Aptidão oculta",
      description:
        "Há sinais de uma aptidão ainda não compreendida. Continue observando o herói em treino e missões.",
      confidence: "low",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.hiddenAptitude,
    });
    candidates.push({
      key: "potentialMap",
      type: "recommendation",
      label: "Potencial mapeado",
      description: `O potencial de ${hero.name} está bem mapeado: um ${classLabel} com vocação que vai além da raridade inicial.`,
      confidence: "high",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.potentialMap,
    });
  } else {
    candidates.push({
      key: "potentialMap",
      type: "recommendation",
      label: "Potencial mapeado",
      description: `O potencial de ${hero.name} está bem mapeado como ${classLabel}, com espaço para especialização.`,
      confidence: "high",
      requiredLevel: CORE_INSIGHT_REQUIRED_LEVEL.potentialMap,
    });
  }

  const insights: PotentialInsight[] = candidates.map((candidate) => {
    const revealed = revealedKeys.has(candidate.key) || progress.level >= candidate.requiredLevel;
    return {
      key: candidate.key,
      type: candidate.type,
      label: candidate.label,
      description: revealed ? candidate.description : LOCKED_DESCRIPTION,
      revealed,
      confidence: candidate.confidence,
    };
  });

  // Insights de risco sao dinamicos e aparecem quando ha sinal atual relevante.
  if (progress.level >= 1) {
    if (Number(hero.morale) < 40) {
      insights.push({
        key: "risk_morale",
        type: "risk",
        label: "Risco",
        description: "Moral baixa pode distorcer a leitura atual do potencial.",
        revealed: true,
        confidence: "medium",
      });
    }
    if (hasActiveInjury(hero)) {
      insights.push({
        key: "risk_injury",
        type: "risk",
        label: "Risco",
        description: "Ferimentos ativos dificultam avaliar o desempenho real do herói.",
        revealed: true,
        confidence: "medium",
      });
    }
  }

  return insights;
}

function buildSummary(hero: Hero, level: number, isLowRarity: boolean): string {
  if (level <= 0) {
    return isLowRarity
      ? `${hero.name} é um herói comum: o potencial inicial é pouco evidente. Treino, proficiências e uso em campo podem revelar caminhos inesperados.`
      : `${hero.name} ainda foi pouco analisado. Parte do potencial já é visível pela raridade, mas há descobertas a fazer.`;
  }
  if (isLowRarity) {
    return `${hero.name} mostra que raridade baixa não significa descarte: a análise revela caminhos que valem investimento.`;
  }
  return `${hero.name} tem parte do potencial evidente pela raridade, e a análise aprofunda os detalhes que faltavam.`;
}

function buildRecommendations(
  hero: Hero,
  level: number,
  isLowRarity: boolean,
  hasHidden: boolean,
): string[] {
  const recommendations: string[] = [];
  if (isLowRarity) {
    recommendations.push("Invista em treino e uso em campo: heróis comuns podem revelar caminhos inesperados.");
  }
  if (level < 3) {
    recommendations.push(`Mantenha ${hero.name} treinando para aprofundar a leitura de potencial.`);
  }
  if (hasHidden && level < 4) {
    recommendations.push("Há indícios de aptidão oculta; continue observando o herói para revelá-los aos poucos.");
  }
  if (Number(hero.morale) < 40) {
    recommendations.push("Recupere a moral antes de confiar na leitura atual do potencial.");
  }
  if (recommendations.length === 0) {
    recommendations.push(`A análise de ${hero.name} está avançada; considere-o para desafios maiores da Torre.`);
  }
  return recommendations;
}

export function getHeroPotentialReport(state: GameState, heroId: string): HeroPotentialReport | null {
  const hero = findHero(state, heroId);
  if (!hero) return null;

  const progress = getHeroPotentialProgress(state, heroId);
  const definition = getHeroDefinitionById(hero.definitionId);
  const hasHidden = Boolean(definition && definition.hiddenAptitudeTags.length > 0);
  const rarity = Math.max(1, Math.floor(Number(hero.rarity) || 1));
  const isLowRarity = rarity <= 2;
  const nextThreshold = getNextPotentialThreshold(progress.xp);

  const insights = getPotentialInsightsForHero(state, heroId);

  return {
    heroId,
    heroName: hero.name,
    rarity,
    analysisLevel: progress.level,
    analysisLevelLabel: getPotentialLevelLabel(progress.level),
    analysisXp: progress.xp,
    xpForNextLevel: nextThreshold?.minXp ?? null,
    hiddenPotentialSignal: hasHidden,
    isLowRarity,
    summary: buildSummary(hero, progress.level, isLowRarity),
    insights,
    revealedInsights: insights.filter((insight) => insight.revealed),
    lockedInsights: insights.filter((insight) => !insight.revealed),
    recommendations: buildRecommendations(hero, progress.level, isLowRarity, hasHidden),
  };
}
