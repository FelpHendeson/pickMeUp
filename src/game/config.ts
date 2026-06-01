export const GAME_CONFIG = {
  saveKey: "ascensao-dos-ecos-save-v1",
  saveVersion: 1,
  gameVersion: "0.10.0",
  commonSummonCost: 100,
  superiorSummonCost: 100,
  towerEnergyCost: 5,
  maxEnergy: 30,
  energyRegenMs: 5 * 60 * 1000,
  maxFormationSize: 5,
  frontSlots: 2,
  maxTowerTeamPresets: 3,
  maxExpeditionTeamPresets: 3,
  towerMaxFloor: 40,
  maxExpeditionHeroes: 3,
} as const;

export type TeamPresetType = "tower" | "expedition";
