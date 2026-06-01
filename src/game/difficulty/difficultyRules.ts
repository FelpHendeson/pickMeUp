import type { GameState, Stats, TowerDifficultyStats } from "../types";
import { TOWER_DIFFICULTY_MODE_IDS, TOWER_DIFFICULTY_MODES, type TowerDifficultyMode, type TowerDifficultyModeId } from "./definitions";

type MutableReward = Record<string, unknown>;
type MutableBattleModifiers = Record<string, unknown>;

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getDifficultyPercentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function isTowerDifficultyModeId(value: unknown): value is TowerDifficultyModeId {
  return typeof value === "string" && value in TOWER_DIFFICULTY_MODES;
}

export function getTowerDifficultyMode(modeId: unknown): TowerDifficultyMode {
  return isTowerDifficultyModeId(modeId) ? TOWER_DIFFICULTY_MODES[modeId] : TOWER_DIFFICULTY_MODES.normal;
}

export function normalizeTowerDifficultyMode(modeId: unknown): TowerDifficultyModeId {
  return getTowerDifficultyMode(modeId).id;
}

export function createTowerDifficultyStats(): TowerDifficultyStats {
  return {
    victories: {
      normal: 0,
      challenge: 0,
      hardcore: 0,
    },
    hardcoreDeaths: 0,
  };
}

export function normalizeTowerDifficultyStats(input: unknown): TowerDifficultyStats {
  const source = input && typeof input === "object" ? (input as Partial<TowerDifficultyStats>) : {};
  const savedVictories =
    source.victories && typeof source.victories === "object" ? (source.victories as Partial<Record<TowerDifficultyModeId, unknown>>) : {};
  const stats = createTowerDifficultyStats();

  TOWER_DIFFICULTY_MODE_IDS.forEach((modeId) => {
    stats.victories[modeId] = nonNegativeInteger(savedVictories[modeId]);
  });
  stats.hardcoreDeaths = nonNegativeInteger(source.hardcoreDeaths);

  return stats;
}

export function normalizeTowerDifficultyState(state: GameState): TowerDifficultyStats {
  state.towerDifficultyStats = normalizeTowerDifficultyStats(state.towerDifficultyStats);
  state.pendingTowerDifficultyMode =
    state.pendingTowerDifficultyMode === null ? null : normalizeTowerDifficultyMode(state.pendingTowerDifficultyMode);
  state.deadHeroes = Array.isArray(state.deadHeroes) ? state.deadHeroes : [];
  return state.towerDifficultyStats;
}

export function getTowerDifficultySummary(modeId: unknown): Record<string, string> & { id: TowerDifficultyModeId; name: string } {
  const mode = getTowerDifficultyMode(modeId);
  const injuryBonus = Math.round((mode.injuryChanceMultiplier - 1) * 100);

  return {
    id: mode.id,
    name: mode.name,
    description: mode.description,
    enemyPower: getDifficultyPercentLabel(mode.enemyPowerMultiplier),
    reward: getDifficultyPercentLabel(mode.rewardMultiplier),
    injuryRisk: injuryBonus > 0 ? `+${injuryBonus}%` : "padrao",
    permanentDeath: mode.permanentDeathChance > 0 ? `${Math.round(mode.permanentDeathChance * 100)}% se cair em combate` : "nao existe",
  };
}

export function applyDifficultyToEnemyStats<T extends Partial<Stats>>(stats: T, modeId: unknown): T {
  const mode = getTowerDifficultyMode(modeId);
  if (mode.enemyPowerMultiplier === 1) return stats;
  const mutableStats = stats as Partial<Record<keyof Stats, number>>;

  (["hp", "atk", "def", "spd", "focus"] as const).forEach((statKey) => {
    if (mutableStats[statKey] == null) return;
    mutableStats[statKey] = Math.max(1, Math.round(Number(mutableStats[statKey]) * mode.enemyPowerMultiplier));
  });

  return stats;
}

export function applyDifficultyToFloorReward<T extends MutableReward>(reward: T, modeId: unknown): T {
  const mode = getTowerDifficultyMode(modeId);
  const mutableReward = reward as MutableReward;

  ["gold", "xp", "essence", "fragments", "crystalAmount", "echoFragmentAmount"].forEach((resourceKey) => {
    const value = Number(mutableReward[resourceKey]);
    if (value > 0 && mode.rewardMultiplier !== 1) {
      mutableReward[resourceKey] = Math.max(1, Math.round(value * mode.rewardMultiplier));
    }
  });

  const sqrtRewardMultiplier = Math.sqrt(mode.rewardMultiplier);
  if (Number(mutableReward.crystalChance) > 0) {
    mutableReward.crystalChance = Math.min(0.95, Number(mutableReward.crystalChance) * sqrtRewardMultiplier);
  }
  if (Number(mutableReward.echoFragmentChance) > 0) {
    mutableReward.echoFragmentChance = Math.min(0.95, Number(mutableReward.echoFragmentChance) * sqrtRewardMultiplier);
  }
  if (Number(mutableReward.consumableChance) > 0) {
    mutableReward.consumableChance = Math.min(0.95, Number(mutableReward.consumableChance) * sqrtRewardMultiplier);
  }
  if (Number(mutableReward.equipmentChance) > 0) {
    mutableReward.equipmentChance = Math.min(0.95, Number(mutableReward.equipmentChance) * mode.equipmentChanceMultiplier);
  }

  mutableReward.difficultyMode = mode.id;
  mutableReward.difficultyRewardMultiplier = mode.rewardMultiplier;
  mutableReward.equipmentRarityBonusFloors = mode.equipmentRarityBonusFloors;

  return reward;
}

export function applyDifficultyToBattleModifiers<T extends MutableBattleModifiers>(floorModifiers: T, modeId: unknown): T {
  const mode = getTowerDifficultyMode(modeId);
  const mutableModifiers = floorModifiers as MutableBattleModifiers;
  mutableModifiers.difficultyMode = mode.id;
  mutableModifiers.injuryChanceMultiplier = Number(mutableModifiers.injuryChanceMultiplier || 1) * mode.injuryChanceMultiplier;
  mutableModifiers.permanentDeathChance = mode.permanentDeathChance;
  return floorModifiers;
}

export function getDifficultyEventChanceMultiplier(modeId: unknown): number {
  return getTowerDifficultyMode(modeId).eventChanceMultiplier;
}

export function recordTowerDifficultyVictory(state: GameState, modeId: unknown): void {
  const stats = normalizeTowerDifficultyState(state);
  const normalized = normalizeTowerDifficultyMode(modeId);
  stats.victories[normalized] += 1;
}

function clearHeroFromLists(state: GameState, heroId: string): void {
  state.formation = state.formation.map((id) => (id === heroId ? null : id));

  (["tower", "expedition"] as const).forEach((presetType) => {
    const presets = Array.isArray(state.teamPresets[presetType]) ? state.teamPresets[presetType] : [];
    presets.forEach((preset) => {
      preset.heroIds = preset.heroIds.map((id) => (id === heroId ? null : id));
    });
  });
}

type FallenBattleUnit = {
  side?: string;
  sourceId?: string;
  hp: number;
};

type HardcoreBattleLog = {
  floor?: number;
  log: string[];
  events: unknown[];
  playerTeam: FallenBattleUnit[];
  enemyTeam: FallenBattleUnit[];
  round?: number;
  rounds?: number;
};

export function resolveHardcoreDeaths(
  state: GameState,
  playerTeam: FallenBattleUnit[],
  battle: HardcoreBattleLog | null | undefined,
  battleModifiers: { permanentDeathChance?: number } | null | undefined,
  addEvent?: (message: string) => void,
  random: () => number = Math.random,
): Array<{ id: string; name: string }> {
  const deathChance = battleModifiers && Number.isFinite(battleModifiers.permanentDeathChance)
    ? Number(battleModifiers.permanentDeathChance)
    : 0;
  if (deathChance <= 0) return [];

  normalizeTowerDifficultyState(state);
  const fallenHeroIds = Array.from(
    new Set(playerTeam.filter((unit) => unit.side === "player" && unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId as string)),
  );
  const deaths: Array<{ id: string; name: string }> = [];

  fallenHeroIds.forEach((heroId) => {
    const heroIndex = state.heroes.findIndex((hero) => hero.id === heroId);
    if (heroIndex < 0 || random() >= deathChance) return;

    const hero = state.heroes[heroIndex];
    const memorialEntry = {
      id: hero.id,
      name: hero.name,
      classKey: hero.classKey,
      rarity: hero.rarity,
      level: hero.level,
      lostAtFloor: battle?.floor ?? null,
      lostAt: new Date().toISOString(),
      mode: "hardcore" as const,
    };

    state.heroes.splice(heroIndex, 1);
    clearHeroFromLists(state, heroId);
    state.deadHeroes.push(memorialEntry);
    state.towerDifficultyStats!.hardcoreDeaths += 1;
    deaths.push({ id: hero.id, name: hero.name });

    if (addEvent) {
      addEvent(`${hero.name} caiu definitivamente no modo Hardcore e foi registrado no memorial.`);
    }
  });

  return deaths;
}
