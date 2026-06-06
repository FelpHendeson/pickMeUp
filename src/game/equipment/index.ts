export { EQUIPMENT_BONUS_STATS, EQUIPMENT_EPITHETS, EQUIPMENT_NAME_PARTS, EQUIPMENT_SLOTS, EQUIPMENT_TYPES } from "./definitions";
export {
  createEquipmentName,
  generateEquipment,
  getEquipmentBonusLabel,
  getEquipmentBonusValue,
  getEquipmentRarityForFloor,
  getEquipmentTypeName,
  normalizeEquipmentItem,
  normalizeInventoryItems,
  addEquipmentToInventory,
  removeMissingEquipmentFromHeroes,
} from "./equipmentFactory";
export { findEquipment, getEquippedItems, getHeroEffectiveStats, getHeroPowerWithEquipment } from "./heroEffectiveStats";
export {
  equipItem,
  findEquipmentOwner,
  getUnequippedInventory,
  unequipItem,
  type EquipmentActionResult,
} from "./equipmentActions";
export {
  analyzeEquipmentForHero,
  getEquipmentComparison,
  getEquipmentCompatibility,
  getEquipmentPowerImpact,
  getStatLabel,
  type EquipmentComparison,
  type EquipmentComparisonRow,
  type EquipmentComparisonTone,
  type EquipmentCompatibility,
  type EquipmentCompatibilityLevel,
  type EquipmentHeroAnalysis,
} from "./equipmentAnalysis";
export type { GenerateEquipmentOptions } from "./equipmentFactory";
