import { normalizeEquipmentSlots } from "../heroes";
import { recordMissionProgress } from "../missions";
import type { EquipmentItem, EquipmentSlot, GameState, Hero } from "../types";
import { EQUIPMENT_TYPES } from "./definitions";
import { findEquipment } from "./heroEffectiveStats";

export type EquipmentActionResult = { ok: true; message: string } | { ok: false; message: string };

export function findEquipmentOwner(state: Pick<GameState, "heroes">, equipmentId: string): Hero | null {
  return state.heroes.find((hero) => Object.values(hero.equipment || {}).includes(equipmentId)) ?? null;
}

export function equipItem(state: GameState, heroId: string, equipmentId: string): EquipmentActionResult {
  const hero = state.heroes.find((item) => item.id === heroId) ?? null;
  const item = findEquipment(state, equipmentId);

  if (!hero) return { ok: false, message: "Heroi nao encontrado." };
  if (!item) return { ok: false, message: "Equipamento nao encontrado." };

  normalizeEquipmentSlots(hero.equipment);

  const previousOwner = findEquipmentOwner(state, equipmentId);
  if (previousOwner) {
    normalizeEquipmentSlots(previousOwner.equipment);
    previousOwner.equipment[item.type] = null;
  }

  hero.equipment[item.type] = item.id;
  recordMissionProgress(state, "itemsEquipped", 1);
  return { ok: true, message: `${item.name} equipado em ${hero.name}.` };
}

export function unequipItem(state: GameState, heroId: string, slot: EquipmentSlot): EquipmentActionResult {
  const hero = state.heroes.find((item) => item.id === heroId) ?? null;
  if (!hero) return { ok: false, message: "Heroi nao encontrado." };
  if (!EQUIPMENT_TYPES[slot]) return { ok: false, message: "Slot invalido." };

  normalizeEquipmentSlots(hero.equipment);

  if (!hero.equipment[slot]) {
    return { ok: false, message: "Nao ha equipamento nesse slot." };
  }

  const item = findEquipment(state, hero.equipment[slot]);
  hero.equipment[slot] = null;

  return { ok: true, message: `${item ? item.name : "Equipamento"} removido de ${hero.name}.` };
}

export function getUnequippedInventory(state: Pick<GameState, "heroes" | "inventory">): EquipmentItem[] {
  const equippedIds = new Set(
    state.heroes.flatMap((hero) => Object.values(hero.equipment || {}).filter((equipmentId): equipmentId is string => Boolean(equipmentId))),
  );
  return state.inventory.filter((item) => !equippedIds.has(item.id));
}
