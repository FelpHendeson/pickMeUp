import type { HeroClassKey } from "../types";

export type PotentialInsightType =
  | "background"
  | "training"
  | "proficiency"
  | "behavior"
  | "hiddenAptitude"
  | "risk"
  | "recommendation";

export type PotentialConfidence = "low" | "medium" | "high";

export type PotentialAnalysisReason = "training" | "proficiency" | "manual" | "field";

export type PotentialLevelThreshold = {
  level: number;
  minXp: number;
  label: string;
};

// Niveis simples de analise, com progressao clara e lenta.
export const POTENTIAL_LEVEL_THRESHOLDS: readonly PotentialLevelThreshold[] = [
  { level: 0, minXp: 0, label: "Desconhecido" },
  { level: 1, minXp: 3, label: "Sinais iniciais" },
  { level: 2, minXp: 8, label: "Leitura de background" },
  { level: 3, minXp: 16, label: "Padrão de treino" },
  { level: 4, minXp: 28, label: "Indícios de aptidão oculta" },
  { level: 5, minXp: 44, label: "Potencial bem mapeado" },
];

export const POTENTIAL_MAX_LEVEL = 5;

export const POTENTIAL_CONFIG = {
  maxXp: 44,
  // Fontes leves de XP de analise.
  xpPerProficiencyProgress: 1,
  xpPerProficiencyRankUp: 2,
  // Acao manual "Analisar heroi": custo e ganho pequenos.
  manualAnalysisXp: 3,
  manualAnalysisGoldCost: 40,
} as const;

// Insights nucleares revelados por nivel de analise (chaves estaveis e persistidas).
// Os insights de risco sao dinamicos (dependem de moral/ferimento) e nao entram aqui.
export const CORE_INSIGHT_REQUIRED_LEVEL: Record<string, number> = {
  signals: 1,
  background: 2,
  personality: 2,
  training: 3,
  proficiency: 3,
  technique: 3,
  hiddenAptitude: 4,
  potentialMap: 5,
};

const CLASS_LABELS: Record<HeroClassKey, string> = {
  warrior: "Guerreiro",
  guardian: "Guardião",
  archer: "Arqueiro",
  rogue: "Ladino",
  mage: "Mago",
  priest: "Sacerdote",
};

export function getClassLabel(classKey: unknown): string {
  return (typeof classKey === "string" && CLASS_LABELS[classKey as HeroClassKey]) || "Herói";
}

export function getPotentialLevelForXp(xp: unknown): number {
  const normalized = Math.max(0, Math.floor(Number(xp) || 0));
  let level = 0;
  for (const threshold of POTENTIAL_LEVEL_THRESHOLDS) {
    if (normalized >= threshold.minXp) level = threshold.level;
  }
  return level;
}

export function getPotentialLevelLabel(level: number): string {
  const threshold = POTENTIAL_LEVEL_THRESHOLDS.find((entry) => entry.level === level);
  return threshold?.label ?? "Desconhecido";
}

export function getNextPotentialThreshold(xp: unknown): PotentialLevelThreshold | null {
  const normalized = Math.max(0, Math.floor(Number(xp) || 0));
  for (const threshold of POTENTIAL_LEVEL_THRESHOLDS) {
    if (normalized < threshold.minXp) return threshold;
  }
  return null;
}

// Chaves nucleares cujo requiredLevel <= nivel atual (usadas para marcar revelacao persistida).
export function getCoreInsightKeysForLevel(level: number): string[] {
  return Object.entries(CORE_INSIGHT_REQUIRED_LEVEL)
    .filter(([, requiredLevel]) => requiredLevel <= level)
    .map(([key]) => key);
}
