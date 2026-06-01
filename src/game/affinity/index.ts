import type { AffinityLevel, AffinityRecord, AffinitySummary, GameState, Hero } from "../types";

export const AFFINITY_LEVELS: AffinityLevel[] = [
  { level: 0, label: "Desconhecidos", minXp: 0 },
  { level: 1, label: "Companheiros", minXp: 3 },
  { level: 2, label: "Confiaveis", minXp: 8 },
  { level: 3, label: "Irmandade", minXp: 16 },
  { level: 4, label: "Lenda Viva", minXp: 30 },
];

type BattleAffinityUnit = {
  sourceId?: string | null;
  hp: number;
};

type AffinityBattleUnit = {
  name: string;
  sourceId?: string | null;
  side?: string;
  hp: number;
  morale?: number;
  energy?: number;
  affinityLevels?: Record<string, number>;
};

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function splitPairKey(key: string): [string, string] {
  const parts = key.split("_");
  return [parts[0] || "", parts.slice(1).join("_") || ""];
}

export function getAffinityPairKey(heroAId: string, heroBId: string): string {
  return [heroAId, heroBId].sort().join("_");
}

export function normalizeAffinityRecord(record: unknown, key: string): AffinityRecord {
  const raw = record && typeof record === "object" ? (record as Partial<AffinityRecord>) : {};
  const [heroAIdFromKey, heroBIdFromKey] = splitPairKey(key);

  return {
    heroAId: typeof raw.heroAId === "string" ? raw.heroAId : heroAIdFromKey,
    heroBId: typeof raw.heroBId === "string" ? raw.heroBId : heroBIdFromKey,
    xp: nonNegativeInteger(raw.xp),
  };
}

export function normalizeAffinitiesState(state: Pick<GameState, "affinities" | "heroes">): Record<string, AffinityRecord> {
  const source = state.affinities && typeof state.affinities === "object" ? state.affinities : {};
  const validHeroIds = new Set((state.heroes || []).map((hero) => hero.id));
  const normalized: Record<string, AffinityRecord> = {};

  Object.entries(source).forEach(([key, value]) => {
    const record = normalizeAffinityRecord(value, key);
    if (!record.heroAId || !record.heroBId || record.heroAId === record.heroBId) return;
    if (validHeroIds.size > 0 && (!validHeroIds.has(record.heroAId) || !validHeroIds.has(record.heroBId))) return;

    const pairKey = getAffinityPairKey(record.heroAId, record.heroBId);
    const ordered = splitPairKey(pairKey);
    normalized[pairKey] = { ...record, heroAId: ordered[0], heroBId: ordered[1] };
  });

  state.affinities = normalized;
  return normalized;
}

export function getAffinityLevelFromXp(xp: number): AffinityLevel {
  return AFFINITY_LEVELS.reduce((current, level) => (xp >= level.minXp ? level : current), AFFINITY_LEVELS[0]);
}

export function getNextAffinityLevel(xp: number): AffinityLevel | null {
  return AFFINITY_LEVELS.find((level) => level.minXp > xp) ?? null;
}

export function getAffinityBonusText(level: number): string {
  if (level <= 0) return "Sem bonus ativo";
  return `Moral +${level}, energia +${level * 2}, XP +${level}% e protecao ${level * 3}%`;
}

export function getAffinityRecord(state: Pick<GameState, "affinities" | "heroes">, heroAId: string, heroBId: string): AffinityRecord {
  normalizeAffinitiesState(state);
  const key = getAffinityPairKey(heroAId, heroBId);
  const ordered = splitPairKey(key);

  return state.affinities[key] ?? { heroAId: ordered[0], heroBId: ordered[1], xp: 0 };
}

export function getAffinitySummary(state: Pick<GameState, "affinities" | "heroes">, heroAId: string, heroBId: string): AffinitySummary {
  const record = getAffinityRecord(state, heroAId, heroBId);
  const level = getAffinityLevelFromXp(record.xp);
  const next = getNextAffinityLevel(record.xp);

  return {
    ...record,
    key: getAffinityPairKey(heroAId, heroBId),
    level: level.level,
    label: level.label,
    nextXp: next ? next.minXp : null,
    bonusText: getAffinityBonusText(level.level),
  };
}

export function addAffinityPairXp(
  state: Pick<GameState, "affinities" | "heroes">,
  heroAId: string,
  heroBId: string,
  amount: number,
): AffinityRecord | null {
  if (!heroAId || !heroBId || heroAId === heroBId) return null;

  normalizeAffinitiesState(state);
  const key = getAffinityPairKey(heroAId, heroBId);
  const previous = getAffinityRecord(state, heroAId, heroBId);
  const ordered = splitPairKey(key);

  state.affinities[key] = {
    heroAId: previous.heroAId || ordered[0],
    heroBId: previous.heroBId || ordered[1],
    xp: previous.xp + nonNegativeInteger(amount),
  };

  return state.affinities[key];
}

export function addAffinityForGroup(
  state: Pick<GameState, "affinities" | "heroes">,
  heroIds: Array<string | null | undefined>,
  amount: number,
): AffinityRecord[] {
  const uniqueHeroIds = Array.from(new Set(heroIds.filter((heroId): heroId is string => Boolean(heroId))));
  const changed: AffinityRecord[] = [];

  for (let i = 0; i < uniqueHeroIds.length; i += 1) {
    for (let j = i + 1; j < uniqueHeroIds.length; j += 1) {
      const record = addAffinityPairXp(state, uniqueHeroIds[i], uniqueHeroIds[j], amount);
      if (record) changed.push(record);
    }
  }

  return changed;
}

export function recordBattleAffinity(
  state: Pick<GameState, "affinities" | "heroes">,
  playerTeam: BattleAffinityUnit[],
  battleResult: "victory" | "defeat" | string,
  isBoss: boolean,
): AffinityRecord[] {
  const changed: AffinityRecord[] = [];
  const allHeroIds = playerTeam.map((unit) => unit.sourceId).filter((heroId): heroId is string => Boolean(heroId));
  const livingHeroIds = playerTeam.filter((unit) => unit.hp > 0).map((unit) => unit.sourceId).filter((heroId): heroId is string => Boolean(heroId));

  if (battleResult === "victory") changed.push(...addAffinityForGroup(state, allHeroIds, 1));
  if (battleResult === "victory" && isBoss) changed.push(...addAffinityForGroup(state, allHeroIds, 2));
  changed.push(...addAffinityForGroup(state, livingHeroIds, 1));

  return changed;
}

export function recordExpeditionAffinity(
  state: Pick<GameState, "affinities" | "heroes">,
  heroIds: Array<string | null | undefined>,
): AffinityRecord[] {
  return addAffinityForGroup(state, heroIds, 1);
}

export function recordDangerousEventAffinity(state: Pick<GameState, "affinities" | "heroes" | "formation">): AffinityRecord[] {
  const formationIds = state.formation.filter((heroId): heroId is string => Boolean(heroId));
  return addAffinityForGroup(state, formationIds, 1);
}

export function getHeroAffinitySummaries(
  state: Pick<GameState, "affinities" | "heroes">,
  heroId: string,
): Array<AffinitySummary & { allyId: string; ally: Hero }> {
  normalizeAffinitiesState(state);

  return Object.values(state.affinities)
    .filter((record) => record.heroAId === heroId || record.heroBId === heroId)
    .map((record) => {
      const allyId = record.heroAId === heroId ? record.heroBId : record.heroAId;
      const ally = state.heroes.find((candidate) => candidate.id === allyId);
      return ally ? { ...getAffinitySummary(state, heroId, allyId), allyId, ally } : null;
    })
    .filter((summary): summary is AffinitySummary & { allyId: string; ally: Hero } => Boolean(summary))
    .sort((a, b) => b.level - a.level || b.xp - a.xp || a.ally.name.localeCompare(b.ally.name));
}

export function getGroupAffinityLevelSum(state: Pick<GameState, "affinities" | "heroes">, heroId: string, groupHeroIds: string[]): number {
  return groupHeroIds
    .filter((allyId) => allyId && allyId !== heroId)
    .reduce((total, allyId) => total + getAffinitySummary(state, heroId, allyId).level, 0);
}

export function applyAffinityBattleStartBonuses(
  state: Pick<GameState, "affinities" | "heroes">,
  playerTeam: AffinityBattleUnit[],
  maxUnitEnergy = 125,
): string[] {
  const heroIds = playerTeam.map((unit) => unit.sourceId).filter((heroId): heroId is string => Boolean(heroId));
  const lines: string[] = [];

  playerTeam.forEach((unit) => {
    if (!unit.sourceId) return;
    const levelSum = getGroupAffinityLevelSum(state, unit.sourceId, heroIds);
    if (levelSum <= 0) return;

    const moraleBonus = Math.min(6, levelSum);
    const energyBonus = Math.min(8, levelSum * 2);
    unit.morale = Math.min(100, (unit.morale || 80) + moraleBonus);
    unit.energy = Math.min(maxUnitEnergy, (unit.energy || 0) + energyBonus);
    lines.push(`${unit.name} recebeu +${moraleBonus} moral e +${energyBonus} energia por afinidade.`);
  });

  return lines;
}

export function getAffinityXpMultiplier(state: Pick<GameState, "affinities" | "heroes">, heroId: string, groupHeroIds: string[]): number {
  const levelSum = getGroupAffinityLevelSum(state, heroId, groupHeroIds);
  return 1 + Math.min(0.08, levelSum * 0.01);
}

export function getAffinityProtectionTarget<T extends AffinityBattleUnit>(
  target: T | null | undefined,
  candidates: T[],
  attacker: { side?: string } | null | undefined,
  random: () => number = Math.random,
): T | null | undefined {
  if (!target || target.side !== "player" || !target.sourceId || !attacker || attacker.side !== "enemy") return target;

  const allies = candidates
    .filter((unit) => unit.hp > 0 && unit.side === "player" && unit.sourceId && unit.sourceId !== target.sourceId)
    .map((unit) => ({
      unit,
      affinity: target.affinityLevels ? target.affinityLevels[unit.sourceId as string] || 0 : 0,
    }))
    .filter((entry) => entry.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity);

  if (allies.length === 0) return target;

  const protector = allies[0];
  const chance = Math.min(0.12, protector.affinity * 0.03);
  return random() < chance ? protector.unit : target;
}
