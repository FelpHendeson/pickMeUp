export { RELIC_DEFINITIONS } from "./definitions";
export {
  applyRelicStatModifiers,
  formatRelicBonusValue,
  getRelicAdjustedExpeditionDuration,
  getRelicBonusValue,
  getRelicCurrentEffectText,
  getRelicDefinition,
  getRelicEffectText,
  getRelicExpeditionDurationMultiplier,
  getRelicNextEffectText,
  getRelicState,
  getRelicSummonCostMultiplier,
  getRelicUnlockText,
  getRelicUpgradeCost,
  isRelicUnlocked,
  normalizeRelicState,
  upgradeRelic,
} from "./relicRules";
export type { RelicBonusType, RelicDefinition, RelicUnlockCondition } from "./definitions";
export type { UpgradeRelicResult } from "./relicRules";
