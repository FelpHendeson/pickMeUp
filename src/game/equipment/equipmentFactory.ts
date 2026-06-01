import type { EquipmentItem, EquipmentSlot, Hero, StatKey } from "../types";
import { normalizeEquipmentSlots } from "../heroes";
import { EQUIPMENT_BONUS_STATS, EQUIPMENT_EPITHETS, EQUIPMENT_NAME_PARTS, EQUIPMENT_SLOTS, EQUIPMENT_TYPES } from "./definitions";

export type RandomSource = () => number;
const EQUIPMENT_BONUS_STAT_SET = new Set<StatKey>(EQUIPMENT_BONUS_STATS);

export type GenerateEquipmentOptions = {
  floorNumber?: number;
  type?: EquipmentSlot;
  rarity?: number;
  bonusStat?: StatKey;
  id?: string;
  name?: string;
  obtainedAt?: string;
  random?: RandomSource;
};

function pickRandom<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function createEquipmentId(): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `eq_${globalThis.crypto.randomUUID()}`;
  }

  return `eq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEquipmentSlot(value: unknown): EquipmentSlot {
  return typeof value === "string" && EQUIPMENT_SLOTS.includes(value as EquipmentSlot) ? (value as EquipmentSlot) : "weapon";
}

function normalizeBonusStat(value: unknown): StatKey {
  return typeof value === "string" && EQUIPMENT_BONUS_STAT_SET.has(value as StatKey) ? (value as StatKey) : "atk";
}

export function getEquipmentRarityForFloor(floorNumber: number, random: RandomSource = Math.random): number {
  const floor = Math.max(1, Math.floor(Number(floorNumber) || 1));
  const roll = random();

  if (floor >= 30 && roll < 0.1) return 4;
  if (floor >= 20 && roll < 0.24) return 3;
  if (floor >= 11 && roll < 0.36) return 2;
  if (floor >= 9 && roll < 0.08) return 3;
  if (floor >= 5 && roll < 0.28) return 2;
  return 1;
}

export function getEquipmentBonusValue(statKey: StatKey | string, rarity: number, floorNumber: number): number {
  const baseByStat: Record<string, number> = {
    hp: 18,
    atk: 4,
    def: 3,
    spd: 1,
    luck: 2,
  };
  const floor = Math.max(1, Math.floor(Number(floorNumber) || 1));
  const safeRarity = Math.min(5, Math.max(1, Math.floor(Number(rarity) || 1)));
  const floorScale = 1 + floor * 0.08;
  const rarityScale = 0.8 + safeRarity * 0.55;

  return Math.max(1, Math.round((baseByStat[statKey] || 2) * floorScale * rarityScale));
}

export function createEquipmentName(type: EquipmentSlot, rarity: number, random: RandomSource = Math.random): string {
  const prefix = rarity >= 3 ? "Raro" : rarity === 2 ? "Reforcado" : "Simples";
  return `${pickRandom(EQUIPMENT_NAME_PARTS[type], random)} ${prefix} ${pickRandom(EQUIPMENT_EPITHETS, random)}`;
}

export function generateEquipment(options: GenerateEquipmentOptions = {}): EquipmentItem {
  const random = options.random ?? Math.random;
  const floorNumber = Math.max(1, Math.floor(Number(options.floorNumber) || 1));
  const type = options.type ?? pickRandom(EQUIPMENT_SLOTS, random);
  const rarity = Math.min(5, Math.max(1, Math.floor(Number(options.rarity) || getEquipmentRarityForFloor(floorNumber, random))));
  const bonusStat = options.bonusStat ?? pickRandom(EQUIPMENT_BONUS_STATS, random);

  return {
    id: options.id ?? createEquipmentId(),
    name: options.name ?? createEquipmentName(type, rarity, random),
    type,
    rarity,
    bonusStat,
    bonusValue: getEquipmentBonusValue(bonusStat, rarity, floorNumber),
    floorNumber,
    obtainedAt: options.obtainedAt ?? new Date().toISOString(),
  };
}

export function normalizeEquipmentItem(input: unknown): EquipmentItem {
  const raw = input && typeof input === "object" ? (input as Partial<EquipmentItem> & Record<string, unknown>) : {};
  const type = normalizeEquipmentSlot(raw.type);
  const rarity = Math.min(5, Math.max(1, Math.floor(Number(raw.rarity) || 1)));
  const bonusStat = normalizeBonusStat(raw.bonusStat);
  const floorNumber = Math.max(1, Math.floor(Number(raw.floorNumber) || 1));
  const bonusValue = Number.isFinite(Number(raw.floorNumber))
    ? getEquipmentBonusValue(bonusStat, rarity, floorNumber)
    : Number.isFinite(Number(raw.bonusValue))
      ? Math.max(1, Math.round(Number(raw.bonusValue)))
      : getEquipmentBonusValue(bonusStat, rarity, floorNumber);

  return {
    ...raw,
    id: typeof raw.id === "string" && raw.id ? raw.id : createEquipmentId(),
    name: typeof raw.name === "string" && raw.name ? raw.name : createEquipmentName(type, rarity),
    type,
    rarity,
    bonusStat,
    bonusValue,
    floorNumber,
    obtainedAt: typeof raw.obtainedAt === "string" ? raw.obtainedAt : new Date().toISOString(),
  };
}

export function normalizeInventoryItems(items: unknown): EquipmentItem[] {
  return Array.isArray(items) ? items.map(normalizeEquipmentItem) : [];
}

export function removeMissingEquipmentFromHeroes(heroes: Hero[], inventory: EquipmentItem[]): Hero[] {
  const ownedItemIds = new Set(inventory.map((item) => item.id));

  heroes.forEach((hero) => {
    hero.equipment = normalizeEquipmentSlots(hero.equipment);
    EQUIPMENT_SLOTS.forEach((slot) => {
      if (hero.equipment[slot] && !ownedItemIds.has(hero.equipment[slot])) {
        hero.equipment[slot] = null;
      }
    });
  });

  return heroes;
}

export function getEquipmentTypeName(type: EquipmentSlot | string): string {
  return EQUIPMENT_TYPES[type as EquipmentSlot] || type;
}

export function getEquipmentBonusLabel(item: EquipmentItem): string {
  return `${item.bonusStat.toUpperCase()} +${item.bonusValue}`;
}
