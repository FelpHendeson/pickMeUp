import type { EquipmentItem, EquipmentSlot, Hero, StatKey } from "../types";
import { EQUIPMENT_TYPES } from "./definitions";

export type EquipmentComparisonTone = "upgrade" | "downgrade" | "mixed" | "equal" | "empty";
export type EquipmentCompatibilityLevel = "high" | "medium" | "low";

export type EquipmentComparisonRow = {
  stat: StatKey;
  value: number;
  tone: EquipmentComparisonTone;
  label: string;
};

export type EquipmentComparison = {
  tone: EquipmentComparisonTone;
  label: string;
  rows: EquipmentComparisonRow[];
};

export type EquipmentCompatibility = {
  level: EquipmentCompatibilityLevel;
  badge: string;
  recommendation: string;
  warning: string | null;
};

export type EquipmentHeroAnalysis = {
  actionLabel: string;
  blockedReason: string | null;
  canEquip: boolean;
  compatibility: EquipmentCompatibility;
  comparison: EquipmentComparison;
  currentPower: number;
  itemPower: number;
  powerDelta: number;
};

const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spd: "SPD",
  focus: "FOCUS",
  luck: "LUCK",
};

const STAT_POWER_WEIGHTS: Record<StatKey, number> = {
  hp: 0.3,
  atk: 4,
  def: 3,
  spd: 5,
  focus: 2,
  luck: 1,
};

const CLASS_STAT_PRIORITIES: Record<string, Partial<Record<StatKey, number>>> = {
  warrior: { atk: 3, def: 3, hp: 2, spd: 1 },
  guardian: { hp: 3, def: 3, atk: 1.5 },
  archer: { atk: 3, spd: 3, luck: 2, hp: 1 },
  rogue: { spd: 3, luck: 3, atk: 2 },
  mage: { focus: 3, atk: 2, luck: 1 },
  priest: { focus: 3, hp: 2, def: 1.5, luck: 1 },
};

const DEFAULT_STAT_PRIORITIES: Partial<Record<StatKey, number>> = {
  atk: 2,
  def: 2,
  hp: 2,
  spd: 2,
  focus: 2,
  luck: 2,
};

export function getStatLabel(stat: StatKey | string): string {
  return STAT_LABELS[stat as StatKey] ?? stat.toUpperCase();
}

export function getEquipmentPowerImpact(item: EquipmentItem | null | undefined): number {
  if (!item) return 0;
  return Math.round(item.bonusValue * (STAT_POWER_WEIGHTS[item.bonusStat] ?? 1));
}

export function getEquipmentComparison(item: EquipmentItem, currentItem: EquipmentItem | null): EquipmentComparison {
  if (!currentItem) {
    return {
      tone: "empty",
      label: "Ganho direto: o slot está vazio.",
      rows: [{ stat: item.bonusStat, value: item.bonusValue, tone: "upgrade", label: "ganho novo" }],
    };
  }

  if (currentItem.id === item.id) {
    return {
      tone: "equal",
      label: "Este item já está equipado neste slot.",
      rows: [{ stat: item.bonusStat, value: 0, tone: "equal", label: "sem alteração" }],
    };
  }

  if (currentItem.bonusStat === item.bonusStat) {
    const delta = item.bonusValue - currentItem.bonusValue;
    const tone: EquipmentComparisonTone = delta > 0 ? "upgrade" : delta < 0 ? "downgrade" : "equal";
    return {
      tone,
      label: delta > 0 ? `+${delta} sobre o item atual.` : delta < 0 ? `${delta} abaixo do item atual.` : "Mesmo bônus do item atual.",
      rows: [{ stat: item.bonusStat, value: delta, tone, label: "diferença" }],
    };
  }

  return {
    tone: "mixed",
    label: `Troca ${getStatLabel(currentItem.bonusStat)} +${currentItem.bonusValue} por ${getStatLabel(item.bonusStat)} +${item.bonusValue}.`,
    rows: [
      { stat: item.bonusStat, value: item.bonusValue, tone: "upgrade", label: "ganha" },
      { stat: currentItem.bonusStat, value: -currentItem.bonusValue, tone: "downgrade", label: "perde" },
    ],
  };
}

export function getEquipmentCompatibility(hero: Hero, item: EquipmentItem, currentItem: EquipmentItem | null): EquipmentCompatibility {
  const priorities = CLASS_STAT_PRIORITIES[hero.classKey] ?? DEFAULT_STAT_PRIORITIES;
  const priority = priorities[item.bonusStat] ?? 0;
  const powerDelta = getEquipmentPowerImpact(item) - getEquipmentPowerImpact(currentItem);
  const className = hero.className || "Herói";

  if (priority >= 3) {
    return {
      level: "high",
      badge: "Alta compatibilidade",
      recommendation: `${className} aproveita muito bem ${getStatLabel(item.bonusStat)}.`,
      warning: powerDelta < 0 ? "O encaixe é bom, mas o poder estimado cai em relação ao item atual." : null,
    };
  }

  if (priority >= 2 || (priority > 0 && powerDelta > 0)) {
    return {
      level: "medium",
      badge: "Compatibilidade média",
      recommendation: "Funciona para esta build, mas talvez exista uma opção mais afinada.",
      warning: powerDelta < 0 ? "Pode ser equipado, mas reduz o poder estimado." : null,
    };
  }

  return {
    level: "low",
    badge: "Baixa compatibilidade",
    recommendation: "Pode ser equipado, mas não conversa com as prioridades atuais da classe.",
    warning: `Baixa compatibilidade: ${getStatLabel(item.bonusStat)} não é prioridade natural para ${className}.`,
  };
}

export function analyzeEquipmentForHero({
  currentItem,
  hero,
  item,
  slot,
}: {
  currentItem: EquipmentItem | null;
  hero: Hero;
  item: EquipmentItem;
  slot: EquipmentSlot;
}): EquipmentHeroAnalysis {
  const itemPower = getEquipmentPowerImpact(item);
  const currentPower = getEquipmentPowerImpact(currentItem);
  const powerDelta = itemPower - currentPower;
  const equippedOnHero = hero.equipment?.[slot] === item.id;
  const blockedReason =
    item.type !== slot ? `Slot diferente: este item é ${EQUIPMENT_TYPES[item.type]}, mas você está escolhendo ${EQUIPMENT_TYPES[slot]}.` : null;
  const compatibility = getEquipmentCompatibility(hero, item, currentItem);

  return {
    actionLabel: equippedOnHero ? "Equipado" : compatibility.level === "low" ? "Equipar mesmo assim" : "Equipar",
    blockedReason,
    canEquip: !blockedReason && !equippedOnHero,
    compatibility,
    comparison: getEquipmentComparison(item, currentItem),
    currentPower,
    itemPower,
    powerDelta,
  };
}
