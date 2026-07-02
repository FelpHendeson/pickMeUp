export {
  PROMOTION_MAX_RARITY,
  PROMOTION_TIER_REQUIREMENTS,
  formatPromotionCost,
  getProficiencyRankIndex,
  getProficiencyRankLabel,
  getPromotionResourceLabel,
  getPromotionTierRequirement,
} from "./definitions";
export type {
  PromotionReadiness,
  PromotionRequirement,
  PromotionRequirementKey,
  PromotionRequirementStatus,
  PromotionResourceCost,
  PromotionResourceKey,
  PromotionTierRequirement,
} from "./definitions";
export {
  PROMOTION_UNAVAILABLE_ABOVE_TARGET,
  getHeroPromotionPreview,
  getPromotionReadiness,
  getPromotionRecommendations,
  getPromotionRequirementsForHero,
  getPromotionTargetRarity,
  promoteHero,
} from "./promotionRules";
export type { HeroPromotionPreview } from "./promotionRules";
