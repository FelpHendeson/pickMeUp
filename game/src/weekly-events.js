(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const WEEKLY_EVENT_DEFINITIONS = [
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
      effects: ["+35% chance de drop de equipamentos", "+25% chance de suprimentos consumiveis", "Desmontar equipamentos rendera mais fragmentos quando a oficina existir"],
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

  function getLocalWeekNumber(date) {
    const currentDate = date ? new Date(date) : new Date();
    const firstDay = new Date(currentDate.getFullYear(), 0, 1);
    const elapsedDays = Math.floor((currentDate - firstDay) / 86400000);

    return Math.floor((elapsedDays + firstDay.getDay()) / 7) + 1;
  }

  function getActiveWeeklyEvent(date) {
    const weekNumber = getLocalWeekNumber(date);
    const index = (weekNumber - 1) % WEEKLY_EVENT_DEFINITIONS.length;

    return Object.assign({ weekNumber }, WEEKLY_EVENT_DEFINITIONS[index]);
  }

  function getWeeklyEventModifier(modifierKey, fallbackValue) {
    const event = getActiveWeeklyEvent();
    const fallback = fallbackValue === undefined ? 1 : fallbackValue;

    if (!event.modifiers || event.modifiers[modifierKey] === undefined) {
      return fallback;
    }

    return event.modifiers[modifierKey];
  }

  function getWeeklyEventBonus(modifierKey) {
    const event = getActiveWeeklyEvent();

    if (!event.modifiers || event.modifiers[modifierKey] === undefined) {
      return 0;
    }

    return event.modifiers[modifierKey];
  }

  function getActiveWeeklyEventSummary() {
    const event = getActiveWeeklyEvent();
    return `${event.name}: ${event.effects.join(" | ")}`;
  }

  Echoes.WEEKLY_EVENT_DEFINITIONS = WEEKLY_EVENT_DEFINITIONS;
  Echoes.getLocalWeekNumber = getLocalWeekNumber;
  Echoes.getActiveWeeklyEvent = getActiveWeeklyEvent;
  Echoes.getWeeklyEventModifier = getWeeklyEventModifier;
  Echoes.getWeeklyEventBonus = getWeeklyEventBonus;
  Echoes.getActiveWeeklyEventSummary = getActiveWeeklyEventSummary;
})(window);
