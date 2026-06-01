import { applyHeroInjuryModifiers, applyHeroMoraleModifiers } from "../hero-status";
import { applyRelicStatModifiers } from "../relics";
import { applySpecializationStatModifiers } from "../specializations";
import type { EquipmentItem, EquipmentSlot, GameState, Hero, Stats } from "../types";
import { normalizeEquipmentSlots } from "../heroes";
import { EQUIPMENT_SLOTS } from "./definitions";

export function findEquipment(state: Pick<GameState, "inventory">, equipmentId: string | null | undefined): EquipmentItem | null {
  if (!equipmentId) return null;
  return state.inventory.find((item) => item.id === equipmentId) ?? null;
}

export function getEquippedItems(state: GameState, hero: Hero): Partial<Record<EquipmentSlot, EquipmentItem>> {
  normalizeEquipmentSlots(hero.equipment);

  return EQUIPMENT_SLOTS.reduce<Partial<Record<EquipmentSlot, EquipmentItem>>>((items, slot) => {
    const item = hero.equipment[slot] ? findEquipment(state, hero.equipment[slot]) : null;
    if (item) items[slot] = item;
    return items;
  }, {});
}

export function getHeroEffectiveStats(state: GameState | null, hero: Hero): Stats {
  const stats: Stats = { ...hero.stats };
  const equippedItems = state ? getEquippedItems(state, hero) : {};

  Object.values(equippedItems).forEach((item) => {
    if (!item) return;
    stats[item.bonusStat] = Math.max(1, Math.round((stats[item.bonusStat] || 0) + item.bonusValue));
  });

  applySpecializationStatModifiers(stats, hero);
  if (state) applyRelicStatModifiers(stats, state);
  applyHeroInjuryModifiers(stats, hero);
  applyHeroMoraleModifiers(stats, hero);

  return stats;
}

export function getHeroPowerWithEquipment(state: GameState, hero: Hero): number {
  const stats = getHeroEffectiveStats(state, hero);
  return Math.round(stats.hp * 0.3 + stats.atk * 4 + stats.def * 3 + stats.spd * 5 + stats.focus * 2 + stats.luck);
}
