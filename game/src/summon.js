(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const SUMMON_RARITY_TABLES = {
    common: [
      { rarity: 1, chance: 60 },
      { rarity: 2, chance: 28 },
      { rarity: 3, chance: 10 },
      { rarity: 4, chance: 2 },
    ],
    superior: [
      { rarity: 2, chance: 50 },
      { rarity: 3, chance: 35 },
      { rarity: 4, chance: 12 },
      { rarity: 5, chance: 3 },
    ],
  };

  function normalizeSummonType(type) {
    return type === "superior" ? "superior" : "common";
  }

  function rollSummonRarity(type) {
    const table = SUMMON_RARITY_TABLES[type] || SUMMON_RARITY_TABLES.common;
    const roll = Math.random() * 100;
    let accumulated = 0;

    for (const entry of table) {
      accumulated += entry.chance;
      if (roll <= accumulated) {
        return entry.rarity;
      }
    }

    return table[table.length - 1].rarity;
  }

  function getSummonCost(type) {
    if (normalizeSummonType(type) === "superior") {
      return { resource: "crystals", amount: Echoes.CONFIG.superiorSummonCost };
    }

    return { resource: "gold", amount: Echoes.CONFIG.commonSummonCost };
  }

  function createSummonHistoryEntry(hero, summonType) {
    return {
      id: hero.id,
      name: hero.name,
      rarity: hero.rarity,
      className: hero.className,
      type: summonType,
      at: new Date().toISOString(),
    };
  }

  function addSummonHistory(state, hero, summonType) {
    state.summonHistory.unshift(createSummonHistoryEntry(hero, summonType));
    state.summonHistory = state.summonHistory.slice(0, 12);
  }

  function summonHero(state, type) {
    const summonType = normalizeSummonType(type);
    const cost = getSummonCost(summonType);

    if (!Echoes.spendResource(state, cost.resource, cost.amount)) {
      return {
        ok: false,
        message: `Recursos insuficientes para invocacao ${summonType === "superior" ? "superior" : "comum"}.`,
      };
    }

    const rarity = rollSummonRarity(summonType);
    const hero = Echoes.generateHero({ rarity });
    state.heroes.push(hero);
    addSummonHistory(state, hero, summonType);

    return {
      ok: true,
      hero,
      message: `${hero.name} respondeu ao chamado.`,
    };
  }

  Echoes.SUMMON_RARITY_TABLES = SUMMON_RARITY_TABLES;
  Echoes.rollSummonRarity = rollSummonRarity;
  Echoes.getSummonCost = getSummonCost;
  Echoes.summonHero = summonHero;
})(window);
