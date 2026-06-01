import { GAME_CONFIG } from "../config";
import type { GameState, PartialGameState } from "../types";
import { normalizeConsumablesState } from "../consumables";
import { normalizeTowerDifficultyMode, normalizeTowerDifficultyStats } from "../difficulty";
import { normalizeInventoryItems, removeMissingEquipmentFromHeroes } from "../equipment";
import { normalizeExpeditions } from "../expeditions";
import { normalizeHero } from "../heroes";
import { normalizeAffinitiesState } from "../affinity";
import { normalizeMissionState } from "../missions";
import { normalizeRelicState } from "../relics";
import { normalizeRecruitmentState } from "../recruitment";
import { getCompletedTowerChapterIds } from "../tower";
import { createInitialState } from "./createInitialState";
import { normalizeTeamPresets } from "./teamPresets";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function arrayOrEmpty<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function ensureStateShape(input?: PartialGameState | null, now = Date.now()): GameState {
  const fresh = createInitialState(now);
  const source = asRecord(input);
  const merged = { ...fresh, ...source } as GameState;
  const resources = asRecord(source.resources);
  const baseRooms = asRecord(source.baseRooms);
  const narrative = asRecord(source.narrative);

  merged.saveVersion = Number.isInteger(source.saveVersion) ? Number(source.saveVersion) : GAME_CONFIG.saveVersion;
  merged.resources = {
    ...fresh.resources,
    gold: nonNegativeInteger(resources.gold ?? fresh.resources.gold),
    crystals: nonNegativeInteger(resources.crystals ?? fresh.resources.crystals),
    essence: nonNegativeInteger(resources.essence ?? fresh.resources.essence),
    fragments: nonNegativeInteger(resources.fragments ?? fresh.resources.fragments),
    energy: nonNegativeInteger(resources.energy ?? fresh.resources.energy),
    maxEnergy: nonNegativeInteger(resources.maxEnergy ?? fresh.resources.maxEnergy) || GAME_CONFIG.maxEnergy,
  };
  merged.resources.energy = Math.min(merged.resources.energy, merged.resources.maxEnergy);
  merged.baseRooms = { ...fresh.baseRooms, ...Object.fromEntries(Object.entries(baseRooms).map(([key, value]) => [key, nonNegativeInteger(value)])) };
  merged.heroes = arrayOrEmpty(source.heroes).map(normalizeHero);
  merged.inventory = normalizeInventoryItems(source.inventory);
  removeMissingEquipmentFromHeroes(merged.heroes, merged.inventory);
  merged.activeExpeditions = arrayOrEmpty(source.activeExpeditions) as GameState["activeExpeditions"];
  normalizeExpeditions(merged, now);
  merged.formation = arrayOrEmpty<string | null>(source.formation).slice(0, GAME_CONFIG.maxFormationSize);

  while (merged.formation.length < GAME_CONFIG.maxFormationSize) {
    merged.formation.push(null);
  }

  const validHeroIds = new Set(merged.heroes.map((hero) => hero.id).filter((id): id is string => typeof id === "string"));
  merged.formation = merged.formation.map((heroId) => (heroId && validHeroIds.has(heroId) ? heroId : null));
  merged.teamPresets = normalizeTeamPresets(source.teamPresets, validHeroIds);

  merged.pendingTowerEvent = source.pendingTowerEvent && typeof source.pendingTowerEvent === "object" ? source.pendingTowerEvent : null;
  merged.plannedTowerPostEvent =
    source.plannedTowerPostEvent && typeof source.plannedTowerPostEvent === "object" ? source.plannedTowerPostEvent : null;
  merged.pendingRecruitmentChoice =
    source.pendingRecruitmentChoice && typeof source.pendingRecruitmentChoice === "object"
      ? (source.pendingRecruitmentChoice as GameState["pendingRecruitmentChoice"])
      : null;
  merged.towerBattleEffects = arrayOrEmpty(source.towerBattleEffects);
  merged.towerEventHistory = arrayOrEmpty(source.towerEventHistory).slice(0, 8);
  merged.completedTowerChapters = getCompletedTowerChapterIds({
    completedTowerChapters: arrayOrEmpty<string>(source.completedTowerChapters),
    towerFloor: merged.towerFloor,
  });
  merged.lastChapterCompletion =
    source.lastChapterCompletion && typeof source.lastChapterCompletion === "object" ? source.lastChapterCompletion : null;
  merged.narrative = {
    seenSceneIds: arrayOrEmpty<string>(narrative.seenSceneIds),
    pendingScenes: arrayOrEmpty(narrative.pendingScenes),
  };
  merged.missionStats = asRecord(source.missionStats) as Record<string, number>;
  merged.echoFragments = nonNegativeInteger(source.echoFragments);
  merged.relics = asRecord(source.relics) as GameState["relics"];
  merged.heroContracts = nonNegativeInteger(source.heroContracts);
  merged.consumables = normalizeConsumablesState(source.consumables);
  merged.affinities = asRecord(source.affinities) as GameState["affinities"];
  merged.library = source.library && typeof source.library === "object" ? source.library : null;
  merged.towerDifficultyStats = normalizeTowerDifficultyStats(source.towerDifficultyStats);
  merged.pendingTowerDifficultyMode =
    typeof source.pendingTowerDifficultyMode === "string" ? normalizeTowerDifficultyMode(source.pendingTowerDifficultyMode) : null;
  merged.deadHeroes = arrayOrEmpty(source.deadHeroes);
  merged.summonHistory = arrayOrEmpty(source.summonHistory).slice(0, 12);
  merged.lastEnergyAt = Number.isFinite(Number(source.lastEnergyAt)) ? Number(source.lastEnergyAt) : now;
  normalizeMissionState(merged);
  normalizeAffinitiesState(merged);
  normalizeRelicState(merged);
  normalizeRecruitmentState(merged);

  return merged;
}
