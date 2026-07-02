export {
  PROMOTION_MAX_RARITY,
  PROMOTION_TIER_REQUIREMENTS,
  getProficiencyRankIndex,
  getProficiencyRankLabel,
  getPromotionTierRequirement,
} from "./definitions";
export type {
  PromotionReadiness,
  PromotionRequirement,
  PromotionRequirementKey,
  PromotionRequirementStatus,
  PromotionTierRequirement,
} from "./definitions";
export {
  getHeroPromotionPreview,
  getPromotionReadiness,
  getPromotionRecommendations,
  getPromotionRequirementsForHero,
  getPromotionTargetRarity,
  promoteHero,
} from "./promotionRules";
export type { HeroPromotionPreview } from "./promotionRules";
