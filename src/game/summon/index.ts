import { GAME_CONFIG } from "../config";
import { generateHero } from "../heroes";
import { recordHeroDiscovery } from "../library";
import { getRelicSummonCostMultiplier } from "../relics";
import { spendResource } from "../state/resources";
import { getWeeklyEventBonus, getWeeklyEventModifier } from "../weekly-events";
import type { GameState, Hero, SummonCost, SummonHistoryEntry, SummonRarityChance, SummonType } from "../types";

export const SUMMON_RARITY_TABLES: Record<SummonType, SummonRarityChance[]> = {
  common: [
    { rarity: 1, chance: 60 },
    { rarity: 2, chance: 28 },
    { rarity: 3, chance: 10 },
    { rarity: 4, chance: 2 },
  ],
  superior: [
    { rarity: 2, chance: 50 },
    { rarity: 3, chance: 35 },
    { rarity: 4, chance: 12 },
    { rarity: 5, chance: 3 },
  ],
};

export type SummonHeroResult =
  | { ok: true; hero: Hero; message: string; cost: SummonCost }
  | { ok: false; message: string; cost: SummonCost };

export function normalizeSummonType(type: unknown): SummonType {
  return type === "superior" ? "superior" : "common";
}

export function normalizeSummonHistory(history: unknown): SummonHistoryEntry[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const raw = entry && typeof entry === "object" ? (entry as Partial<SummonHistoryEntry>) : {};
      if (!raw.id || !raw.name) return null;

      return {
        id: String(raw.id),
        name: String(raw.name),
        rarity: Math.max(1, Math.floor(Number(raw.rarity) || 1)),
        className: typeof raw.className === "string" ? raw.className : "Classe desconhecida",
        type: normalizeSummonType(raw.type),
        at: typeof raw.at === "string" ? raw.at : new Date().toISOString(),
      };
    })
    .filter((entry): entry is SummonHistoryEntry => Boolean(entry))
    .slice(0, 12);
}

export function getAdjustedSummonRarityTable(type: unknown, dateInput: Date | string | number = new Date()): SummonRarityChance[] {
  const summonType = normalizeSummonType(type);
  const table = SUMMON_RARITY_TABLES[summonType].map((entry) => ({ ...entry }));

  if (summonType !== "superior") return table;

  const fourStarBonus = getWeeklyEventBonus("superiorFourStarBonus", dateInput);
  if (fourStarBonus <= 0) return table;

  const fourStar = table.find((entry) => entry.rarity === 4);
  const lowestRarity = table[0];

  if (fourStar && lowestRarity && lowestRarity.chance > fourStarBonus) {
    fourStar.chance += fourStarBonus;
    lowestRarity.chance -= fourStarBonus;
  }

  return table;
}

export function rollSummonRarity(type: unknown, random: () => number = Math.random, dateInput: Date | string | number = new Date()): number {
  const table = getAdjustedSummonRarityTable(type, dateInput);
  const roll = random() * 100;
  let accumulated = 0;

  for (const entry of table) {
    accumulated += entry.chance;
    if (roll <= accumulated) return entry.rarity;
  }

  return table[table.length - 1].rarity;
}

export function getSummonCost(state: GameState | null, type: unknown, dateInput: Date | string | number = new Date()): SummonCost {
  const summonType = normalizeSummonType(type);
  const relicMultiplier = getRelicSummonCostMultiplier(state);

  if (summonType === "superior") {
    const weeklyMultiplier = getWeeklyEventModifier("superiorSummonCostMultiplier", 1, dateInput);
    return {
      resource: "crystals",
      amount: Math.max(1, Math.round(GAME_CONFIG.superiorSummonCost * weeklyMultiplier * relicMultiplier)),
    };
  }

  return {
    resource: "gold",
    amount: Math.max(1, Math.round(GAME_CONFIG.commonSummonCost * relicMultiplier)),
  };
}

export function createSummonHistoryEntry(hero: Hero, summonType: SummonType, at = new Date().toISOString()): SummonHistoryEntry {
  return {
    id: hero.id,
    name: hero.name,
    rarity: hero.rarity,
    className: hero.className,
    type: summonType,
    at,
  };
}

export function addSummonHistory(state: GameState, hero: Hero, summonType: SummonType): SummonHistoryEntry[] {
  state.summonHistory.unshift(createSummonHistoryEntry(hero, summonType));
  state.summonHistory = normalizeSummonHistory(state.summonHistory);
  return state.summonHistory;
}

export function summonHero(
  state: GameState,
  type: unknown,
  options: { random?: () => number; dateInput?: Date | string | number } = {},
): SummonHeroResult {
  const summonType = normalizeSummonType(type);
  const cost = getSummonCost(state, summonType, options.dateInput);

  if (!spendResource(state, cost.resource, cost.amount)) {
    return {
      ok: false,
      cost,
      message: `Recursos insuficientes para invocacao ${summonType === "superior" ? "superior" : "comum"}.`,
    };
  }

  const rarity = rollSummonRarity(summonType, options.random, options.dateInput);
  const hero = generateHero({ rarity, random: options.random });
  state.heroes.push(hero);
  recordHeroDiscovery(state, hero);
  addSummonHistory(state, hero, summonType);

  return {
    ok: true,
    hero,
    cost,
    message: `${hero.name} respondeu ao chamado.`,
  };
}
