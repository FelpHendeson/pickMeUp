export { EPITHETS, GIVEN_NAMES, HERO_CLASSES, STAT_KEYS, TRAITS } from "./definitions";
export {
  addHeroXp,
  createStatRolls,
  generateHero,
  getHeroPower,
  getHeroXpForNextLevel,
  getMaxLevelForRarity,
  getRarityMultiplier,
  getRarityStars,
  normalizeEquipmentSlots,
  normalizeHero,
  recalculateHeroStats,
} from "./heroFactory";
export type { AddHeroXpResult, GenerateHeroOptions, RandomSource } from "./heroFactory";
