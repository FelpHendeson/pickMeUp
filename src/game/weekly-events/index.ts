import type { ActiveWeeklyEvent, WeeklyEventDefinition, WeeklyEventModifiers } from "../types";

export const WEEKLY_EVENT_DEFINITIONS: WeeklyEventDefinition[] = [
  {
    id: "unstable_tower",
    name: "Semana da Torre Instavel",
    tone: "danger",
    summary: "A torre paga melhor, mas os inimigos estao mais agressivos.",
    effects: ["+20% ouro em andares da torre", "Inimigos da torre recebem +10% ATK"],
    modifiers: {
      towerGoldMultiplier: 1.2,
      enemyAtkMultiplier: 1.1,
    },
  },
  {
    id: "summon_festival",
    name: "Festival de Invocacao",
    tone: "arcane",
    summary: "O portal superior exige menos cristais e favorece ecos raros.",
    effects: ["Invocacao superior custa 10% menos", "Chance levemente maior de 4 estrelas"],
    modifiers: {
      superiorSummonCostMultiplier: 0.9,
      superiorFourStarBonus: 3,
    },
  },
  {
    id: "fragment_hunt",
    name: "Cacada aos Fragmentos",
    tone: "reward",
    summary: "A torre deixa mais equipamento para tras e os fragmentos circulam com mais forca.",
    effects: [
      "+35% chance de drop de equipamentos",
      "+25% chance de suprimentos consumiveis",
      "Desmontar equipamentos rendera mais fragmentos quando a oficina existir",
    ],
    modifiers: {
      equipmentDropMultiplier: 1.35,
      consumableDropMultiplier: 1.25,
      dismantleFragmentMultiplier: 1.25,
    },
  },
  {
    id: "intensive_training",
    name: "Treinamento Intensivo",
    tone: "support",
    summary: "Instrutores da base aceleram o crescimento dos herois.",
    effects: ["Herois ganham +25% XP em recompensas da torre"],
    modifiers: {
      heroXpMultiplier: 1.25,
    },
  },
];

export function getLocalWeekNumber(dateInput: Date | string | number = new Date()): number {
  const currentDate = new Date(dateInput);
  const validDate = Number.isNaN(currentDate.getTime()) ? new Date() : currentDate;
  const firstDay = new Date(validDate.getFullYear(), 0, 1);
  const elapsedDays = Math.floor((validDate.getTime() - firstDay.getTime()) / 86400000);

  return Math.floor((elapsedDays + firstDay.getDay()) / 7) + 1;
}

export function getActiveWeeklyEvent(dateInput: Date | string | number = new Date()): ActiveWeeklyEvent {
  const weekNumber = getLocalWeekNumber(dateInput);
  const index = (weekNumber - 1) % WEEKLY_EVENT_DEFINITIONS.length;
  const definition = WEEKLY_EVENT_DEFINITIONS[index] ?? WEEKLY_EVENT_DEFINITIONS[0];

  return { ...definition, weekNumber };
}

export function getWeeklyEventModifier<K extends keyof WeeklyEventModifiers>(
  modifierKey: K,
  fallbackValue: NonNullable<WeeklyEventModifiers[K]> = 1 as NonNullable<WeeklyEventModifiers[K]>,
  dateInput: Date | string | number = new Date(),
): NonNullable<WeeklyEventModifiers[K]> {
  const event = getActiveWeeklyEvent(dateInput);
  const modifier = event.modifiers[modifierKey];

  return (modifier ?? fallbackValue) as NonNullable<WeeklyEventModifiers[K]>;
}

export function getWeeklyEventBonus<K extends keyof WeeklyEventModifiers>(
  modifierKey: K,
  dateInput: Date | string | number = new Date(),
): number {
  return Number(getActiveWeeklyEvent(dateInput).modifiers[modifierKey] ?? 0);
}

export function getActiveWeeklyEventSummary(dateInput: Date | string | number = new Date()): string {
  const event = getActiveWeeklyEvent(dateInput);
  return `${event.name}: ${event.effects.join(" | ")}`;
}

export function getWeeklyTowerRewardOptions(dateInput: Date | string | number = new Date()) {
  const modifiers = getActiveWeeklyEvent(dateInput).modifiers;

  return {
    towerGoldMultiplier: modifiers.towerGoldMultiplier,
    equipmentDropMultiplier: modifiers.equipmentDropMultiplier,
    consumableDropMultiplier: modifiers.consumableDropMultiplier,
    heroXpMultiplier: modifiers.heroXpMultiplier,
  };
}

export function getWeeklyEnemyOptions(dateInput: Date | string | number = new Date()) {
  return {
    weeklyEnemyAtkMultiplier: getWeeklyEventModifier("enemyAtkMultiplier", 1, dateInput),
  };
}
