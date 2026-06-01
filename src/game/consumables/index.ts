export { CONSUMABLE_DEFINITIONS, RANDOM_CONSUMABLE_POOL } from "./definitions";
export {
  addConsumable,
  formatConsumableReward,
  getConsumableDefinition,
  getConsumableQuantity,
  getHeroHpSummary,
  getRandomConsumableId,
  normalizeConsumablesState,
  spendConsumable,
  useConsumable,
} from "./consumableInventory";
export type { ConsumableDefinition, ConsumableEffect, ConsumableTarget } from "./definitions";
export type { ConsumableUseResult } from "./consumableInventory";
