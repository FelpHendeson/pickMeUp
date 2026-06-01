import type { TeamPresetType } from "./config";

export type ResourceKey = "gold" | "crystals" | "essence" | "fragments" | "energy" | "maxEnergy";
export type AccountResourceKey = ResourceKey | "echoFragments" | "heroContracts";

export type StatKey = "hp" | "atk" | "def" | "spd" | "focus" | "luck";
export type EquipmentSlot = "weapon" | "armor" | "accessory";
export type HeroClassKey = "warrior" | "archer" | "mage" | "priest" | "rogue" | "guardian";

export type Stats = Record<StatKey, number>;
export type EquipmentSlots = Record<EquipmentSlot, string | null>;

export type HeroSpecialization = {
  key: string;
  name: string;
  passiveName: string;
  description: string;
  statMultipliers: Partial<Record<StatKey, number>>;
};

export type WeeklyEventModifiers = {
  towerGoldMultiplier?: number;
  enemyAtkMultiplier?: number;
  superiorSummonCostMultiplier?: number;
  superiorFourStarBonus?: number;
  equipmentDropMultiplier?: number;
  consumableDropMultiplier?: number;
  dismantleFragmentMultiplier?: number;
  heroXpMultiplier?: number;
};

export type WeeklyEventDefinition = {
  id: string;
  name: string;
  tone: "danger" | "arcane" | "reward" | "support";
  summary: string;
  effects: string[];
  modifiers: WeeklyEventModifiers;
};

export type ActiveWeeklyEvent = WeeklyEventDefinition & {
  weekNumber: number;
};

export type AffinityRecord = {
  heroAId: string;
  heroBId: string;
  xp: number;
};

export type AffinityLevel = {
  level: number;
  label: string;
  minXp: number;
};

export type AffinitySummary = AffinityRecord & {
  key: string;
  level: number;
  label: string;
  nextXp: number | null;
  bonusText: string;
};

export type LibraryEnemyRecord = {
  key: string;
  encountered: number;
  defeated: number;
  firstFloor: number | null;
  lastFloor: number | null;
  region: string;
};

export type LibraryBossRecord = {
  key: string;
  chapterId: string;
  chapterName: string;
  attempts: number;
  defeated: boolean;
  bestResult: "victory" | "defeat" | "";
  specialReward: string;
};

export type LibraryEventRecord = {
  key: string;
  encountered: number;
  results: string[];
};

export type LibraryHeroDiscovery = {
  key: string;
  name: string;
  description?: string;
  count?: number;
  discovered: boolean;
};

export type LibraryState = {
  enemies: Record<string, LibraryEnemyRecord>;
  bosses: Record<string, LibraryBossRecord>;
  events: Record<string, LibraryEventRecord>;
  heroes: {
    classes: Record<string, LibraryHeroDiscovery>;
    rarities: Record<string, LibraryHeroDiscovery>;
    traits: Record<string, LibraryHeroDiscovery>;
  };
};

export type HeroInjury = {
  id: string;
  typeKey: string;
  remainingBattles: number;
  createdAt: string;
};

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
  injuries: HeroInjury[];
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
  obtainedAt?: string;
};

export type TeamPreset = {
  id: string;
  name: string;
  heroIds: Array<string | null>;
};

export type TeamPresets = Record<TeamPresetType, TeamPreset[]>;

export type ResourceState = Record<ResourceKey, number>;

export type ExpeditionRewardType = "xp" | "gold" | "crystals";

export type ExpeditionReward = {
  type: ExpeditionRewardType;
  amount: number;
  power?: number;
  multiplier?: number;
  baseAmount?: number;
};

export type MissionReward = Partial<Record<AccountResourceKey, number>> & {
  consumables?: Record<string, number>;
};

export type DailyMissionState = {
  dateKey: string;
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
};

export type AchievementState = Record<string, { claimed: boolean }>;

export type RelicState = {
  level: number;
  unlockedAt: string | null;
};

export type RecruitmentChoice = {
  id: string;
  source: string;
  title: string;
  description: string;
  options: Hero[];
  createdAt: string;
};

export type ActiveExpedition = {
  id: string;
  expeditionId: string;
  heroIds: string[];
  startedAt: number;
  endsAt: number;
  reward: ExpeditionReward;
};

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
  relics: Record<string, RelicState>;
  heroContracts: number;
  consumables: Record<string, number>;
  affinities: Record<string, AffinityRecord>;
  library: LibraryState;
  towerDifficultyStats: TowerDifficultyStats | null;
  pendingTowerDifficultyMode: string | null;
  deadHeroes: unknown[];
  heroes: Hero[];
  inventory: EquipmentItem[];
  activeExpeditions: ActiveExpedition[];
  formation: Array<string | null>;
  teamPresets: TeamPresets;
  baseRooms: Record<string, number>;
  summonHistory: unknown[];
  lastBattle: unknown | null;
  pendingTowerEvent: unknown | null;
  plannedTowerPostEvent: unknown | null;
  pendingRecruitmentChoice: RecruitmentChoice | null;
  towerBattleEffects: unknown[];
  towerEventHistory: unknown[];
  completedTowerChapters: string[];
  lastChapterCompletion: unknown | null;
  narrative: NarrativeState;
  missionStats: Record<string, number>;
  dailyMissions: DailyMissionState;
  achievements: AchievementState;
  lastSavedAt: string | null;
  lastEnergyAt: number;
};

export type PartialGameState = Partial<GameState> & Record<string, unknown>;
