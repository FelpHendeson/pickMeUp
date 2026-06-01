import type { Stats } from "../types";
import { applyDifficultyToEnemyStats } from "../difficulty";
import { getFloorModifierValues, type TowerFloorLike } from "./chapters";

export type EnemyRole = "tanque" | "veloz" | "dano" | "suporte" | "chefe";

export type EnemyArchetype = {
  name: string;
  role: EnemyRole;
  stats: Stats;
};

export type EnemyUnit = {
  id: string;
  name: string;
  side: "enemy";
  enemyKey: string;
  role: EnemyRole;
  rarity: number;
  level: number;
  stats: Stats;
  maxHp: number;
  hp: number;
  energy: number;
  statuses: Record<string, unknown>;
  position: "front" | "back";
};

export type CreateEnemyUnitOptions = {
  difficultyMode?: unknown;
  weeklyEnemyAtkMultiplier?: number;
};

export const ENEMY_ARCHETYPES: Record<string, EnemyArchetype> = {
  stoneSlime: {
    name: "Slime de Pedra",
    role: "tanque",
    stats: { hp: 58, atk: 10, def: 7, spd: 4, focus: 3, luck: 2 },
  },
  duskBat: {
    name: "Morcego Sombrio",
    role: "veloz",
    stats: { hp: 38, atk: 13, def: 3, spd: 12, focus: 4, luck: 8 },
  },
  ridgeRaider: {
    name: "Saqueador da Serra",
    role: "dano",
    stats: { hp: 54, atk: 15, def: 5, spd: 8, focus: 5, luck: 6 },
  },
  markedAcolyte: {
    name: "Acolito Marcado",
    role: "suporte",
    stats: { hp: 48, atk: 13, def: 4, spd: 7, focus: 10, luck: 5 },
  },
  ironGolem: {
    name: "Golem Antigo",
    role: "chefe",
    stats: { hp: 210, atk: 23, def: 14, spd: 5, focus: 8, luck: 4 },
  },
  emberHound: {
    name: "Sabueso de Brasa",
    role: "dano",
    stats: { hp: 70, atk: 20, def: 6, spd: 11, focus: 5, luck: 8 },
  },
  graveWarden: {
    name: "Vigia Tumular",
    role: "tanque",
    stats: { hp: 96, atk: 16, def: 13, spd: 6, focus: 7, luck: 4 },
  },
  crystalSeer: {
    name: "Vidente Cristalino",
    role: "suporte",
    stats: { hp: 68, atk: 17, def: 7, spd: 9, focus: 15, luck: 8 },
  },
  stormHarpy: {
    name: "Harpia Tempestuosa",
    role: "veloz",
    stats: { hp: 64, atk: 19, def: 5, spd: 15, focus: 8, luck: 11 },
  },
  voidReaver: {
    name: "Ceifador do Vazio",
    role: "dano",
    stats: { hp: 88, atk: 25, def: 8, spd: 10, focus: 9, luck: 9 },
  },
  shardOracle: {
    name: "Oraculo Estilhacado",
    role: "chefe",
    stats: { hp: 310, atk: 28, def: 15, spd: 9, focus: 18, luck: 8 },
  },
  eclipseAvatar: {
    name: "Avatar do Eclipse",
    role: "chefe",
    stats: { hp: 430, atk: 36, def: 20, spd: 10, focus: 20, luck: 10 },
  },
  ashImp: {
    name: "Diabrete de Cinzas",
    role: "veloz",
    stats: { hp: 82, atk: 24, def: 7, spd: 16, focus: 10, luck: 12 },
  },
  brimstoneBrute: {
    name: "Brutamontes de Enxofre",
    role: "tanque",
    stats: { hp: 138, atk: 27, def: 17, spd: 6, focus: 8, luck: 5 },
  },
  cinderWitch: {
    name: "Bruxa da Cinza",
    role: "suporte",
    stats: { hp: 94, atk: 24, def: 9, spd: 11, focus: 20, luck: 9 },
  },
  hellboundKnight: {
    name: "Cavaleiro Acorrentado",
    role: "dano",
    stats: { hp: 122, atk: 32, def: 14, spd: 10, focus: 12, luck: 8 },
  },
  abyssalSerpent: {
    name: "Serpente Abissal",
    role: "chefe",
    stats: { hp: 560, atk: 43, def: 24, spd: 12, focus: 24, luck: 12 },
  },
};

export function getEnemyArchetype(enemyKey: string): EnemyArchetype {
  return ENEMY_ARCHETYPES[enemyKey] ?? ENEMY_ARCHETYPES.stoneSlime;
}

export function scaleEnemyStats(baseStats: Stats, floorNumber: number, isBoss: boolean): Stats {
  const floorScale = 0.82 + floorNumber * 0.085 + Math.max(0, floorNumber - 10) * 0.018;
  const bossScale = isBoss ? 1.2 : 1;

  return Object.keys(baseStats).reduce((stats, key) => {
    const statKey = key as keyof Stats;
    const value = baseStats[statKey] * floorScale * bossScale;
    stats[statKey] = Math.max(1, Math.round(value));
    return stats;
  }, {} as Stats);
}

export function getEnemyStartingEnergy(enemyKey: string, floorNumber: number, isBoss: boolean): number {
  if (enemyKey === "shardOracle" || enemyKey === "eclipseAvatar") return 45;
  if (isBoss) return 35;
  return floorNumber >= 21 ? 30 : floorNumber >= 9 ? 25 : 0;
}

export function createEnemyUnit(
  enemyKey: string,
  floorNumber: number,
  index: number,
  floorData: TowerFloorLike | null,
  options: CreateEnemyUnitOptions = {},
): EnemyUnit {
  const archetype = getEnemyArchetype(enemyKey);
  const isBoss = archetype.role === "chefe";
  const modifiers = getFloorModifierValues(floorData);
  const stats = scaleEnemyStats(archetype.stats, floorNumber, isBoss);

  if (modifiers.enemySpeedMultiplier > 1) {
    stats.spd = Math.max(1, Math.round(stats.spd * modifiers.enemySpeedMultiplier));
  }

  stats.hp = Math.max(1, Math.round(stats.hp * (modifiers.enemyHpMultiplier || 1)));
  stats.atk = Math.max(1, Math.round(stats.atk * (modifiers.enemyAtkMultiplier || 1)));
  stats.def = Math.max(1, Math.round(stats.def * (modifiers.enemyDefMultiplier || 1)));
  stats.focus = Math.max(1, Math.round(stats.focus * (modifiers.enemyFocusMultiplier || 1)));
  stats.atk = Math.max(1, Math.round(stats.atk * (options.weeklyEnemyAtkMultiplier || 1)));

  applyDifficultyToEnemyStats(stats, options.difficultyMode);

  return {
    id: `enemy_${floorNumber}_${index}_${enemyKey}`,
    name: index > 0 ? `${archetype.name} ${index + 1}` : archetype.name,
    side: "enemy",
    enemyKey,
    role: archetype.role,
    rarity: isBoss ? 4 : 1,
    level: Math.max(1, Math.ceil(floorNumber / 2)),
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    energy: getEnemyStartingEnergy(enemyKey, floorNumber, isBoss),
    statuses: {},
    position: isBoss || index < 2 ? "front" : "back",
  };
}
