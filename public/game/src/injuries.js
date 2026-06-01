(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const INJURY_CONFIG = {
    durationBattles: 3,
    victoryChance: 0.35,
    defeatChance: 0.6,
    treatmentCosts: {
      gold: 120,
      essence: 8,
    },
  };

  const HERO_INJURY_TYPES = {
    injuredArm: {
      name: "Braco machucado",
      stat: "atk",
      multiplier: 0.85,
      description: "ATK -15%",
    },
    brokenRib: {
      name: "Costela quebrada",
      stat: "hp",
      multiplier: 0.85,
      description: "HP maximo -15%",
    },
    arcaneTrauma: {
      name: "Trauma arcano",
      stat: "focus",
      multiplier: 0.82,
      description: "FOCUS -18%",
    },
    severeExhaustion: {
      name: "Exaustao severa",
      stat: "spd",
      multiplier: 0.85,
      description: "SPD -15%",
    },
  };

  function createInjuryId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return `injury_${global.crypto.randomUUID()}`;
    }

    return `injury_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function normalizeHeroInjuries(hero) {
    hero.injuries = Array.isArray(hero.injuries)
      ? hero.injuries
          .map((injury) => {
            const typeKey = HERO_INJURY_TYPES[injury && injury.typeKey] ? injury.typeKey : null;
            if (!typeKey) return null;

            return {
              id: typeof injury.id === "string" ? injury.id : createInjuryId(),
              typeKey,
              remainingBattles: Number.isFinite(injury.remainingBattles)
                ? Math.max(0, Math.round(injury.remainingBattles))
                : INJURY_CONFIG.durationBattles,
              createdAt: injury.createdAt || new Date().toISOString(),
            };
          })
          .filter((injury) => injury && injury.remainingBattles > 0)
      : [];

    return hero.injuries;
  }

  function getInjuryDefinition(typeKey) {
    return HERO_INJURY_TYPES[typeKey] || null;
  }

  function getHeroActiveInjuries(hero) {
    return normalizeHeroInjuries(hero).filter((injury) => injury.remainingBattles > 0);
  }

  function hasHeroInjuries(hero) {
    return getHeroActiveInjuries(hero).length > 0;
  }

  function getHeroInjurySummary(hero) {
    return getHeroActiveInjuries(hero)
      .map((injury) => {
        const definition = getInjuryDefinition(injury.typeKey);
        return `${definition.name} (${injury.remainingBattles} batalha${injury.remainingBattles === 1 ? "" : "s"})`;
      })
      .join(", ");
  }

  function applyHeroInjuryModifiers(stats, hero) {
    getHeroActiveInjuries(hero).forEach((injury) => {
      const definition = getInjuryDefinition(injury.typeKey);
      if (!definition) return;

      stats[definition.stat] = Math.max(1, Math.round((stats[definition.stat] || 1) * definition.multiplier));
    });

    return stats;
  }

  function decrementRosterInjuriesAfterBattle(state, battle) {
    const recovered = [];

    state.heroes.forEach((hero) => {
      const before = getHeroActiveInjuries(hero);
      if (before.length === 0) return;

      hero.injuries = before
        .map((injury) => Object.assign({}, injury, { remainingBattles: injury.remainingBattles - 1 }))
        .filter((injury) => injury.remainingBattles > 0);

      const afterTypeKeys = new Set(hero.injuries.map((injury) => injury.typeKey));
      before.forEach((injury) => {
        if (!afterTypeKeys.has(injury.typeKey)) {
          const definition = getInjuryDefinition(injury.typeKey);
          recovered.push(`${hero.name} se recuperou de ${definition.name}.`);
        }
      });
    });

    recovered.forEach((message) => {
      if (battle && Echoes.addBattleEvent) {
        Echoes.addBattleEvent(battle, "recovery", message);
      }
    });

    return recovered;
  }

  function addHeroInjury(hero, typeKey) {
    const activeInjuries = getHeroActiveInjuries(hero);
    const existing = activeInjuries.find((injury) => injury.typeKey === typeKey);

    if (existing) {
      existing.remainingBattles = INJURY_CONFIG.durationBattles;
      hero.injuries = activeInjuries;
      return { injury: existing, refreshed: true };
    }

    const injury = {
      id: createInjuryId(),
      typeKey,
      remainingBattles: INJURY_CONFIG.durationBattles,
      createdAt: new Date().toISOString(),
    };

    hero.injuries = activeInjuries.concat(injury);
    return { injury, refreshed: false };
  }

  function resolveBattleInjuries(state, playerTeam, battleResult, battle, battleModifiers) {
    decrementRosterInjuriesAfterBattle(state, battle);

    const fallenHeroIds = new Set(
      playerTeam.filter((unit) => unit.side === "player" && unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId)
    );
    const injuryChanceMultiplier =
      battleModifiers && Number.isFinite(battleModifiers.injuryChanceMultiplier) ? battleModifiers.injuryChanceMultiplier : 1;
    const injuryChance = (battleResult === "defeat" ? INJURY_CONFIG.defeatChance : INJURY_CONFIG.victoryChance) * injuryChanceMultiplier;

    fallenHeroIds.forEach((heroId) => {
      const hero = state.heroes.find((item) => item.id === heroId);
      if (!hero || Math.random() >= injuryChance) return;

      const typeKey = pickRandom(Object.keys(HERO_INJURY_TYPES));
      const result = addHeroInjury(hero, typeKey);
      const definition = getInjuryDefinition(typeKey);
      const verb = result.refreshed ? "agravou" : "recebeu";

      if (battle && Echoes.addBattleEvent) {
        Echoes.addBattleEvent(
          battle,
          "injury",
          `${hero.name} ${verb} um ferimento: ${definition.name} (${definition.description}, ${INJURY_CONFIG.durationBattles} batalhas).`
        );
      }

      if (Echoes.queueFirstSevereInjuryNarrative) {
        Echoes.queueFirstSevereInjuryNarrative(state);
      }
    });
  }

  function getHeroInjuryTreatmentCost(hero, resourceKey) {
    const costPerInjury = INJURY_CONFIG.treatmentCosts[resourceKey];
    if (!costPerInjury) return null;

    return getHeroActiveInjuries(hero).length * costPerInjury;
  }

  function treatHeroInjuries(state, heroId, resourceKey) {
    const hero = state.heroes.find((item) => item.id === heroId);
    if (!hero) return { ok: false, message: "Heroi nao encontrado." };

    const activeInjuries = getHeroActiveInjuries(hero);
    if (activeInjuries.length === 0) {
      return { ok: false, message: `${hero.name} nao tem ferimentos ativos.` };
    }

    const cost = getHeroInjuryTreatmentCost(hero, resourceKey);
    if (!cost) return { ok: false, message: "Recurso de tratamento invalido." };

    if (!Echoes.canSpendResource(state, resourceKey, cost)) {
      return { ok: false, message: `Recursos insuficientes para tratar ${hero.name}.` };
    }

    Echoes.spendResource(state, resourceKey, cost);
    hero.injuries = [];

    return {
      ok: true,
      message: `${hero.name} recebeu tratamento na Enfermaria e removeu ${activeInjuries.length} ferimento(s).`,
    };
  }

  function getInjuredHeroes(state) {
    return state.heroes.filter((hero) => hasHeroInjuries(hero));
  }

  Echoes.INJURY_CONFIG = INJURY_CONFIG;
  Echoes.HERO_INJURY_TYPES = HERO_INJURY_TYPES;
  Echoes.normalizeHeroInjuries = normalizeHeroInjuries;
  Echoes.getInjuryDefinition = getInjuryDefinition;
  Echoes.getHeroActiveInjuries = getHeroActiveInjuries;
  Echoes.hasHeroInjuries = hasHeroInjuries;
  Echoes.getHeroInjurySummary = getHeroInjurySummary;
  Echoes.applyHeroInjuryModifiers = applyHeroInjuryModifiers;
  Echoes.addHeroInjury = addHeroInjury;
  Echoes.resolveBattleInjuries = resolveBattleInjuries;
  Echoes.getHeroInjuryTreatmentCost = getHeroInjuryTreatmentCost;
  Echoes.treatHeroInjuries = treatHeroInjuries;
  Echoes.getInjuredHeroes = getInjuredHeroes;
})(window);
