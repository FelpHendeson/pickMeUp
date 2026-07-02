import { GAME_CONFIG } from "../config";
import {
  createHeroFromDefinition,
  getAvailableHeroDefinitions,
  getHeroDefinitionById,
  type HeroDefinition,
} from "../heroes";
import { recordHeroDiscovery } from "../library";
import { recordMissionProgress } from "../missions";
import { getRelicSummonCostMultiplier } from "../relics";
import { spendResource } from "../state/resources";
import { getWeeklyEventBonus, getWeeklyEventModifier } from "../weekly-events";
import type { GameState, Hero, SummonCost, SummonHistoryEntry, SummonRarityChance, SummonType } from "../types";
import {
  INITIAL_SPECIAL_OPTION_COUNT,
  INITIAL_SPECIAL_PREFERRED_RARITY,
  normalizeInitialSummonState,
} from "./initialSummonState";

export {
  INITIAL_SPECIAL_OPTION_COUNT,
  INITIAL_SPECIAL_PREFERRED_RARITY,
  STARTER_COMMON_SUMMON_COUNT,
  createInitialSummonState,
  normalizeInitialSummonState,
} from "./initialSummonState";

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

export type StarterSummonResult =
  | { ok: true; hero: Hero; message: string }
  | { ok: false; message: string };

export type InitialSpecialSummonOptionsResult =
  | { ok: true; options: HeroDefinition[]; message: string }
  | { ok: false; message: string };

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

export function getClosestAvailableDefinitionByRarity(
  availableDefinitions: readonly HeroDefinition[],
  targetRarity: number,
  random: () => number = Math.random,
): HeroDefinition | null {
  if (availableDefinitions.length === 0) return null;

  const normalizedTarget = Math.max(1, Math.floor(Number(targetRarity) || 1));
  const closestDistance = Math.min(
    ...availableDefinitions.map((definition) => Math.abs(definition.initialRarity - normalizedTarget)),
  );
  const closestDefinitions = availableDefinitions.filter(
    (definition) => Math.abs(definition.initialRarity - normalizedTarget) === closestDistance,
  );
  const randomIndex = Math.min(
    closestDefinitions.length - 1,
    Math.max(0, Math.floor(random() * closestDefinitions.length)),
  );

  return closestDefinitions[randomIndex] ?? closestDefinitions[0] ?? null;
}

export function ensureInitialSummonState(state: GameState) {
  state.initialSummon = normalizeInitialSummonState(state.initialSummon);
  return state.initialSummon;
}

export function getInitialSummonState(state: GameState) {
  return ensureInitialSummonState(state);
}

function getReservedInitialSpecialDefinitionIds(state: GameState): Set<string> {
  const initialSummon = ensureInitialSummonState(state);
  return initialSummon.specialAvailable && !initialSummon.specialClaimed
    ? new Set(initialSummon.specialOptions)
    : new Set<string>();
}

function getAvailableDefinitionsForRegularSummon(state: GameState): HeroDefinition[] {
  const reservedDefinitionIds = getReservedInitialSpecialDefinitionIds(state);
  return getAvailableHeroDefinitions(state).filter(
    (definition) => !reservedDefinitionIds.has(definition.definitionId),
  );
}

export function selectAvailableHeroDefinitionForSummon(
  state: GameState,
  type: unknown,
  options: { random?: () => number; dateInput?: Date | string | number } = {},
): HeroDefinition | null {
  const availableDefinitions = getAvailableDefinitionsForRegularSummon(state);
  if (availableDefinitions.length === 0) return null;

  const targetRarity = rollSummonRarity(type, options.random, options.dateInput);
  return getClosestAvailableDefinitionByRarity(availableDefinitions, targetRarity, options.random);
}

function registerSummonedHero(state: GameState, hero: Hero, summonType: SummonType): void {
  state.heroes.push(hero);
  recordHeroDiscovery(state, hero);
  addSummonHistory(state, hero, summonType);
  recordMissionProgress(state, "summons", 1);
}

function takeRandomDefinitions(
  definitions: readonly HeroDefinition[],
  count: number,
  random: () => number,
): HeroDefinition[] {
  const pool = [...definitions];
  const selected: HeroDefinition[] = [];

  while (selected.length < count && pool.length > 0) {
    const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

export function generateInitialSpecialSummonOptions(
  state: GameState,
  options: { random?: () => number } = {},
): InitialSpecialSummonOptionsResult {
  const initialSummon = ensureInitialSummonState(state);
  if (!initialSummon.specialAvailable || initialSummon.specialClaimed) {
    return { ok: false, message: "A invocacao especial inicial ja foi utilizada." };
  }

  const availableDefinitions = getAvailableHeroDefinitions(state);
  if (availableDefinitions.length === 0) {
    return { ok: false, message: "Nao ha herois disponiveis para a invocacao especial inicial." };
  }

  const availableById = new Map(availableDefinitions.map((definition) => [definition.definitionId, definition]));
  const persistedOptions = initialSummon.specialOptions
    .map((definitionId) => availableById.get(definitionId))
    .filter((definition): definition is HeroDefinition => Boolean(definition));
  const desiredOptionCount = Math.min(INITIAL_SPECIAL_OPTION_COUNT, availableDefinitions.length);

  if (persistedOptions.length === desiredOptionCount) {
    return { ok: true, options: persistedOptions, message: "Opcoes especiais preservadas." };
  }

  const random = options.random ?? Math.random;
  const preferred = availableDefinitions.filter(
    (definition) => definition.initialRarity >= INITIAL_SPECIAL_PREFERRED_RARITY,
  );
  const selected = takeRandomDefinitions(preferred, desiredOptionCount, random);
  const selectedIds = new Set(selected.map((definition) => definition.definitionId));
  const fallback = availableDefinitions
    .filter((definition) => !selectedIds.has(definition.definitionId))
    .sort((left, right) => right.initialRarity - left.initialRarity);

  selected.push(...fallback.slice(0, desiredOptionCount - selected.length));
  initialSummon.specialOptions = selected.map((definition) => definition.definitionId);

  return {
    ok: true,
    options: selected,
    message: selected.length === INITIAL_SPECIAL_OPTION_COUNT
      ? "Tres ecos raros responderam ao chamado especial."
      : `${selected.length} eco(s) responderam ao chamado especial.`,
  };
}

export function claimInitialSpecialSummonOption(
  state: GameState,
  definitionId: string,
  options: { random?: () => number } = {},
): StarterSummonResult {
  const initialSummon = ensureInitialSummonState(state);
  if (!initialSummon.specialAvailable || initialSummon.specialClaimed) {
    return { ok: false, message: "A invocacao especial inicial ja foi utilizada." };
  }
  if (!initialSummon.specialOptions.includes(definitionId)) {
    return { ok: false, message: "Escolha invalida para a invocacao especial inicial." };
  }

  const definition = getHeroDefinitionById(definitionId);
  const isAvailable = getAvailableHeroDefinitions(state).some(
    (availableDefinition) => availableDefinition.definitionId === definitionId,
  );
  if (!definition || !isAvailable) {
    return { ok: false, message: "Este heroi nao esta mais disponivel para a escolha especial." };
  }

  const hero = createHeroFromDefinition(definition, { random: options.random });
  registerSummonedHero(state, hero, "superior");
  initialSummon.specialClaimed = true;
  initialSummon.specialAvailable = false;
  initialSummon.specialOptions = [];

  return { ok: true, hero, message: `${hero.name} aceitou o pacto inicial do Lobby.` };
}

export function canUseStarterCommonSummon(state: GameState): boolean {
  return ensureInitialSummonState(state).commonRemaining > 0
    && getAvailableDefinitionsForRegularSummon(state).length > 0;
}

export function useStarterCommonSummon(
  state: GameState,
  options: { random?: () => number; dateInput?: Date | string | number } = {},
): StarterSummonResult {
  const initialSummon = ensureInitialSummonState(state);
  if (initialSummon.commonRemaining <= 0) {
    return { ok: false, message: "Os cinco tickets de invocacao inicial ja foram utilizados." };
  }

  const definition = selectAvailableHeroDefinitionForSummon(state, "common", options);
  if (!definition) {
    return { ok: false, message: "Nao ha novos herois disponiveis. O ticket inicial nao foi consumido." };
  }

  const hero = createHeroFromDefinition(definition, { random: options.random });
  registerSummonedHero(state, hero, "common");
  state.initialSummon.commonRemaining -= 1;

  return {
    ok: true,
    hero,
    message: `${hero.name} respondeu a um ticket inicial. Restam ${state.initialSummon.commonRemaining}.`,
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
  const definition = selectAvailableHeroDefinitionForSummon(state, summonType, options);

  if (!definition) {
    return {
      ok: false,
      cost,
      message: "Nao ha novos herois disponiveis no roster atual. Seus recursos nao foram consumidos.",
    };
  }

  if (!spendResource(state, cost.resource, cost.amount)) {
    return {
      ok: false,
      cost,
      message: `Recursos insuficientes para invocacao ${summonType === "superior" ? "superior" : "comum"}.`,
    };
  }

  const hero = createHeroFromDefinition(definition, { random: options.random });
  registerSummonedHero(state, hero, summonType);

  return {
    ok: true,
    hero,
    cost,
    message: `${hero.name} respondeu ao chamado.`,
  };
}
