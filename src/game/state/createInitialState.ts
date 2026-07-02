import { GAME_CONFIG } from "../config";
import { createTowerDifficultyStats } from "../difficulty";
import { createLibraryState } from "../library";
import { createDailyMissionState, normalizeAchievements } from "../missions";
import { RELIC_DEFINITIONS } from "../relics";
import type { GameState } from "../types";
import { createTeamPresets } from "./teamPresets";
import { CURRENT_SAVE_SCHEMA_VERSION } from "../save/migrations";
import { createInitialSummonState } from "../summon/initialSummonState";
import { createTrainingState } from "../training";
import { createProficiencyState } from "../proficiencies";
import { createPotentialState } from "../potential";

export function createInitialState(now = Date.now()): GameState {
  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveVersion: GAME_CONFIG.saveVersion,
    accountLevel: 1,
    accountXp: 0,
    towerFloor: 1,
    resources: {
      gold: 500,
      crystals: 100,
      essence: 0,
      fragments: 0,
      energy: GAME_CONFIG.maxEnergy,
      maxEnergy: GAME_CONFIG.maxEnergy,
    },
    echoFragments: 0,
    relics: Object.fromEntries(RELIC_DEFINITIONS.map((relic) => [relic.id, { level: 0, unlockedAt: null }])),
    heroContracts: 0,
    consumables: {},
    affinities: {},
    library: createLibraryState(),
    towerDifficultyStats: createTowerDifficultyStats(),
    pendingTowerDifficultyMode: null,
    deadHeroes: [],
    heroes: [],
    inventory: [],
    activeExpeditions: [],
    formation: Array<string | null>(GAME_CONFIG.maxFormationSize).fill(null),
    teamPresets: createTeamPresets(),
    baseRooms: {
      summonPortal: 1,
      barracks: 1,
      trainingGround: 1,
      infirmary: 1,
      workshop: 0,
      missionBoard: 1,
    },
    summonHistory: [],
    initialSummon: createInitialSummonState(),
    lastBattle: null,
    pendingTowerEvent: null,
    plannedTowerPostEvent: null,
    pendingRecruitmentChoice: null,
    towerBattleEffects: [],
    towerEventHistory: [],
    completedTowerChapters: [],
    lastChapterCompletion: null,
    narrative: {
      seenSceneIds: [],
      pendingScenes: [],
    },
    training: createTrainingState(now),
    proficiencies: createProficiencyState(),
    potential: createPotentialState(),
    missionStats: {},
    dailyMissions: createDailyMissionState(),
    achievements: normalizeAchievements({}),
    lastSavedAt: null,
    lastEnergyAt: now,
  };
}
