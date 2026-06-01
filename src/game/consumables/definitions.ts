export type ConsumableTarget = "hero" | "none";
export type ConsumableEffect =
  | "healHp"
  | "restoreMorale"
  | "reduceInjury"
  | "nextBattleFocus"
  | "nextBattleInjuryProtection"
  | "safeEventExit";

export type ConsumableDefinition = {
  id: string;
  name: string;
  description: string;
  effect: ConsumableEffect;
  target: ConsumableTarget;
  moment: string;
  value: number;
};

export const CONSUMABLE_DEFINITIONS: Record<string, ConsumableDefinition> = {
  small_healing_potion: {
    id: "small_healing_potion",
    name: "Pocao pequena de cura",
    description: "Restaura 35% do HP maximo de um heroi fora de combate.",
    effect: "healHp",
    target: "hero",
    moment: "Fora de combate",
    value: 0.35,
  },
  vigor_potion: {
    id: "vigor_potion",
    name: "Pocao de vigor",
    description: "Recupera 18 pontos de moral de um heroi.",
    effect: "restoreMorale",
    target: "hero",
    moment: "Fora de combate",
    value: 18,
  },
  medical_kit: {
    id: "medical_kit",
    name: "Kit medico",
    description: "Reduz em 1 batalha a duracao de um ferimento ativo.",
    effect: "reduceInjury",
    target: "hero",
    moment: "Fora de combate",
    value: 1,
  },
  focus_scroll: {
    id: "focus_scroll",
    name: "Pergaminho de foco",
    description: "Aumenta FOCUS da formacao em 18% na proxima batalha.",
    effect: "nextBattleFocus",
    target: "none",
    moment: "Antes do andar",
    value: 1.18,
  },
  protection_amulet: {
    id: "protection_amulet",
    name: "Amuleto de protecao",
    description: "Reduz em 35% a chance de ferimento na proxima batalha.",
    effect: "nextBattleInjuryProtection",
    target: "none",
    moment: "Antes do andar",
    value: 0.65,
  },
  return_stone: {
    id: "return_stone",
    name: "Pedra de retorno",
    description: "Cancela com seguranca um evento perigoso pendente da torre.",
    effect: "safeEventExit",
    target: "none",
    moment: "Evento perigoso",
    value: 1,
  },
};

export const RANDOM_CONSUMABLE_POOL = [
  "small_healing_potion",
  "small_healing_potion",
  "vigor_potion",
  "medical_kit",
  "focus_scroll",
  "protection_amulet",
  "return_stone",
] as const;
