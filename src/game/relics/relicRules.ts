import { spendResource } from "../state/resources";
import type { GameState, RelicState, Stats } from "../types";
import { RELIC_DEFINITIONS, type RelicDefinition } from "./definitions";

export type UpgradeRelicResult =
  | { ok: true; relic: RelicDefinition; message: string }
  | { ok: false; message: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function getRelicDefinition(relicId: string): RelicDefinition | null {
  return RELIC_DEFINITIONS.find((relic) => relic.id === relicId) ?? null;
}

export function normalizeRelicState(state: GameState): Record<string, RelicState> {
  state.echoFragments = nonNegativeInteger(state.echoFragments);
  const source = asRecord(state.relics);

  state.relics = RELIC_DEFINITIONS.reduce<Record<string, RelicState>>((relics, relic) => {
    const saved = asRecord(source[relic.id]);
    relics[relic.id] = {
      level: Math.min(relic.maxLevel, nonNegativeInteger(saved.level)),
      unlockedAt: typeof saved.unlockedAt === "string" ? saved.unlockedAt : null,
    };
    return relics;
  }, {});

  return state.relics;
}

export function getRelicState(state: GameState, relicId: string): RelicState {
  normalizeRelicState(state);
  return state.relics[relicId] ?? { level: 0, unlockedAt: null };
}

export function isRelicUnlocked(state: GameState, relic: RelicDefinition): boolean {
  if (relic.unlock.type === "floorReached") {
    return Math.max(1, Number(state.towerFloor) || 1) >= relic.unlock.floor;
  }

  if (relic.unlock.type === "expeditionsCollected") {
    return Number(state.missionStats.expeditionsCollected || 0) >= relic.unlock.amount;
  }

  return true;
}

export function getRelicUnlockText(state: GameState, relic: RelicDefinition): string {
  return isRelicUnlocked(state, relic) ? "Desbloqueada" : relic.unlock.text;
}

export function getRelicUpgradeCost(relic: RelicDefinition, currentLevel: number): number {
  if (currentLevel >= relic.maxLevel) return 0;
  return relic.baseCost + currentLevel * relic.costStep;
}

export function getRelicBonusValue(state: GameState, relic: RelicDefinition): number {
  return getRelicState(state, relic.id).level * relic.valuePerLevel;
}

export function formatRelicBonusValue(relic: RelicDefinition, value: number): string {
  if (relic.bonusType === "statFlat") return `+${Math.round(value)} ${relic.stat?.toUpperCase() || ""}`.trim();
  return `${Math.round(value * 100)}%`;
}

export function getRelicEffectText(relic: RelicDefinition, level: number): string {
  const value = Math.max(0, level) * relic.valuePerLevel;
  const formatted = formatRelicBonusValue(relic, value);

  if (relic.bonusType === "statPercent") return `${formatted} ${relic.stat?.toUpperCase()} global`;
  if (relic.bonusType === "statFlat") return `${formatted} global`;
  if (relic.bonusType === "summonCostReduction") return `${formatted} de reducao no custo de invocacoes`;
  if (relic.bonusType === "expeditionDurationReduction") return `${formatted} de reducao na duracao das expedicoes`;
  return formatted;
}

export function getRelicCurrentEffectText(state: GameState, relic: RelicDefinition): string {
  return getRelicEffectText(relic, getRelicState(state, relic.id).level);
}

export function getRelicNextEffectText(state: GameState, relic: RelicDefinition): string {
  const level = getRelicState(state, relic.id).level;
  if (level >= relic.maxLevel) return "Nivel maximo";
  return getRelicEffectText(relic, level + 1);
}

export function upgradeRelic(state: GameState, relicId: string): UpgradeRelicResult {
  normalizeRelicState(state);
  const relic = getRelicDefinition(relicId);
  if (!relic) return { ok: false, message: "Reliquia nao encontrada." };
  if (!isRelicUnlocked(state, relic)) return { ok: false, message: `Reliquia bloqueada: ${relic.unlock.text}` };

  const relicState = getRelicState(state, relic.id);
  if (relicState.level >= relic.maxLevel) return { ok: false, message: "Reliquia no nivel maximo." };

  const cost = getRelicUpgradeCost(relic, relicState.level);
  if (!spendResource(state, "echoFragments", cost)) {
    return { ok: false, message: `Fragmentos de Eco insuficientes. Requer ${cost}.` };
  }

  relicState.level += 1;
  relicState.unlockedAt = relicState.unlockedAt || new Date().toISOString();

  return { ok: true, relic, message: `${relic.name} aprimorada para o nivel ${relicState.level}.` };
}

export function applyRelicStatModifiers(stats: Stats, state: GameState | null): Stats {
  if (!state) return stats;

  RELIC_DEFINITIONS.forEach((relic) => {
    const level = getRelicState(state, relic.id).level;
    if (level <= 0 || !relic.stat || stats[relic.stat] == null) return;

    if (relic.bonusType === "statPercent") {
      stats[relic.stat] = Math.max(1, Math.round(stats[relic.stat] * (1 + level * relic.valuePerLevel)));
    }

    if (relic.bonusType === "statFlat") {
      stats[relic.stat] = Math.max(1, Math.round(stats[relic.stat] + level * relic.valuePerLevel));
    }
  });

  return stats;
}

export function getRelicSummonCostMultiplier(state: GameState | null): number {
  if (!state) return 1;
  const relic = getRelicDefinition("portal_seal");
  if (!relic) return 1;
  return Math.max(0.85, 1 - getRelicBonusValue(state, relic));
}

export function getRelicExpeditionDurationMultiplier(state: GameState | null): number {
  if (!state) return 1;
  const relic = getRelicDefinition("arcane_hourglass");
  if (!relic) return 1;
  return Math.max(0.85, 1 - getRelicBonusValue(state, relic));
}

export function getRelicAdjustedExpeditionDuration(state: GameState | null, baseDurationMs: number): number {
  return Math.max(30 * 1000, Math.round(baseDurationMs * getRelicExpeditionDurationMultiplier(state)));
}
