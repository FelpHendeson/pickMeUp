import type { TeamPresetType } from "./config";

export type ResourceKey = "gold" | "crystals" | "essence" | "fragments" | "energy" | "maxEnergy";
export type AccountResourceKey = ResourceKey | "echoFragments" | "heroContracts";

export type StatKey = "hp" | "atk" | "def" | "spd" | "focus" | "luck";
export type EquipmentSlot = "weapon" | "armor" | "accessory";
export type HeroClassKey = "warrior" | "archer" | "mage" | "priest" | "rogue" | "guardian";

export type Stats = Record<StatKey, number>;
export type EquipmentSlots = Record<EquipmentSlot, string | null>;

export type Hero = {
  id: string;
  name: string;
  rarity: number;
  classKey: HeroClassKey | string;
  className: string;
  level: number;
  xp: number;
  maxLevel: number;
  statRolls: Partial<Record<StatKey, number>>;
  stats: Stats;
  traitKey: string;
  traitName: string;
  traitDescription: string;
  injuries: unknown[];
  currentHp: number | null;
  morale: number;
  battlesSinceLastUsed: number;
  lastUsedAt: number | null;
  specializationKey: string | null;
  recruitmentTag: string;
  equipment: EquipmentSlots;
};

export type EquipmentItem = {
  id: string;
  name: string;
  type: EquipmentSlot;
  rarity: number;
  bonusStat: StatKey;
  bonusValue: number;
  floorNumber?: number;
};

export type TeamPreset = {
  id: string;
  name: string;
  heroIds: Array<string | null>;
};

export type TeamPresets = Record<TeamPresetType, TeamPreset[]>;

export type ResourceState = Record<ResourceKey, number>;

export type NarrativeState = {
  seenSceneIds: string[];
  pendingScenes: unknown[];
};

export type TowerDifficultyStats = {
  victories: {
    normal: number;
    challenge: number;
    hardcore: number;
  };
  hardcoreDeaths: number;
};

export type GameState = {
  schemaVersion: number;
  saveVersion: number;
  accountLevel: number;
  accountXp: number;
  towerFloor: number;
  resources: ResourceState;
  echoFragments: number;
  relics: Record<string, unknown>;
  heroContracts: number;
  consumables: Record<string, number>;
  affinities: Record<string, unknown>;
  library: unknown | null;
  towerDifficultyStats: TowerDifficultyStats | null;
  pendingTowerDifficultyMode: string | null;
  deadHeroes: unknown[];
  heroes: Hero[];
  inventory: EquipmentItem[];
  activeExpeditions: unknown[];
  formation: Array<string | null>;
  teamPresets: TeamPresets;
  baseRooms: Record<string, number>;
  summonHistory: unknown[];
  lastBattle: unknown | null;
  pendingTowerEvent: unknown | null;
  plannedTowerPostEvent: unknown | null;
  pendingRecruitmentChoice: unknown | null;
  towerBattleEffects: unknown[];
  towerEventHistory: unknown[];
  completedTowerChapters: string[];
  lastChapterCompletion: unknown | null;
  narrative: NarrativeState;
  missionStats: Record<string, number>;
  dailyMissions: unknown | null;
  achievements: Record<string, unknown>;
  lastSavedAt: string | null;
  lastEnergyAt: number;
};

export type PartialGameState = Partial<GameState> & Record<string, unknown>;
