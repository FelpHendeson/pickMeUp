import type { EquipmentSlot, StatKey } from "../types";

export const EQUIPMENT_TYPES: Record<EquipmentSlot, string> = {
  weapon: "Arma",
  armor: "Armadura",
  accessory: "Acessorio",
};

export const EQUIPMENT_SLOTS = ["weapon", "armor", "accessory"] as const satisfies readonly EquipmentSlot[];
export const EQUIPMENT_BONUS_STATS = ["atk", "def", "hp", "spd", "luck"] as const satisfies readonly StatKey[];

export const EQUIPMENT_NAME_PARTS: Record<EquipmentSlot, readonly string[]> = {
  weapon: ["Lamina", "Arco", "Cajado", "Martelo", "Punhal"],
  armor: ["Cota", "Manto", "Couraca", "Veste", "Escudo"],
  accessory: ["Anel", "Amuleto", "Selo", "Talisma", "Broche"],
};

export const EQUIPMENT_EPITHETS = ["do Eco", "da Vigilia", "da Brasa", "do Vale", "da Torre", "da Cinza"] as const;
