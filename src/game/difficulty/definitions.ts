export type TowerDifficultyModeId = "normal" | "challenge" | "hardcore";
export type TowerDifficultyTone = TowerDifficultyModeId;

export type TowerDifficultyMode = {
  id: TowerDifficultyModeId;
  name: string;
  shortName: string;
  description: string;
  enemyPowerMultiplier: number;
  rewardMultiplier: number;
  injuryChanceMultiplier: number;
  eventChanceMultiplier: number;
  equipmentChanceMultiplier: number;
  equipmentRarityBonusFloors: number;
  permanentDeathChance: number;
  tone: TowerDifficultyTone;
};

export const TOWER_DIFFICULTY_MODES: Record<TowerDifficultyModeId, TowerDifficultyMode> = {
  normal: {
    id: "normal",
    name: "Normal",
    shortName: "Normal",
    description: "Regras atuais, recompensas padrao e sem morte permanente.",
    enemyPowerMultiplier: 1,
    rewardMultiplier: 1,
    injuryChanceMultiplier: 1,
    eventChanceMultiplier: 1,
    equipmentChanceMultiplier: 1,
    equipmentRarityBonusFloors: 0,
    permanentDeathChance: 0,
    tone: "normal",
  },
  challenge: {
    id: "challenge",
    name: "Desafio",
    shortName: "Desafio",
    description: "Inimigos mais fortes, mais eventos perigosos e recompensas melhores.",
    enemyPowerMultiplier: 1.25,
    rewardMultiplier: 1.5,
    injuryChanceMultiplier: 1.15,
    eventChanceMultiplier: 1.35,
    equipmentChanceMultiplier: 1.45,
    equipmentRarityBonusFloors: 5,
    permanentDeathChance: 0,
    tone: "challenge",
  },
  hardcore: {
    id: "hardcore",
    name: "Hardcore",
    shortName: "Hardcore",
    description: "Risco real de morte permanente para herois que caem em combate.",
    enemyPowerMultiplier: 1.5,
    rewardMultiplier: 2.2,
    injuryChanceMultiplier: 1.3,
    eventChanceMultiplier: 1.55,
    equipmentChanceMultiplier: 1.9,
    equipmentRarityBonusFloors: 10,
    permanentDeathChance: 0.25,
    tone: "hardcore",
  },
};

export const TOWER_DIFFICULTY_MODE_IDS = Object.keys(TOWER_DIFFICULTY_MODES) as TowerDifficultyModeId[];
