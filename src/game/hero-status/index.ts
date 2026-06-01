export {
  HERO_INJURY_TYPES,
  INJURY_CONFIG,
  addHeroInjury,
  applyHeroInjuryModifiers,
  decrementHeroInjuriesAfterBattle,
  decrementRosterInjuriesAfterBattle,
  resolveBattleInjuries,
  getHeroActiveInjuries,
  getHeroInjurySummary,
  getHeroInjuryTreatmentCost,
  getInjuredHeroes,
  getInjuryDefinition,
  hasHeroInjuries,
  normalizeHeroInjuries,
  treatHeroInjuries,
} from "./injuries";
export {
  MORALE_CONFIG,
  MORALE_STATES,
  adjustHeroMorale,
  adjustFormationMorale,
  applyBattleMoraleChanges,
  applyHeroMoraleModifiers,
  clampMorale,
  createStartingMorale,
  getHeroMoraleState,
  normalizeHeroMorale,
  shouldUnitFailMoraleAction,
  updateUnusedHeroMorale,
} from "./morale";
export type { HeroInjuryDefinition } from "./injuries";
export type { MoraleState } from "./morale";
