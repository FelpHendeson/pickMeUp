export const BATTLE_CONFIG = {
  maxRounds: 45,
  frontTargetChance: 0.72,
  tauntTargetChance: 0.86,
  priestHealThreshold: 0.65,
  maxUnitEnergy: 125,
  skillEnergyCost: 100,
  frontSlotStartingEnergy: 15,
  attackEnergyGain: 25,
  damageEnergyGain: 10,
  killEnergyGain: 20,
} as const;

export const PLAYER_SKILLS = {
  warrior: { name: "Golpe Pesado", multiplier: 1.75, critBonus: 0.03 },
  archer: { name: "Flecha Precisa", multiplier: 1.35, critBonus: 0.3 },
  rogue: { name: "Ataque Sombrio", multiplier: 1.55, executeMultiplier: 2.05, critBonus: 0.14 },
} as const;
