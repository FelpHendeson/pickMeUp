(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const MORALE_CONFIG = {
    min: 0,
    max: 100,
    startingMin: 60,
    startingMax: 100,
    victoryGain: 4,
    defeatLoss: 8,
    allyFallLoss: 3,
    selfFallLoss: 4,
    unusedBattleLimit: 3,
    unusedLoss: 1,
    lowFailChance: 0.04,
    criticalFailChance: 0.08,
  };

  const MORALE_STATES = {
    inspired: {
      label: "Inspirado",
      tone: "inspired",
      description: "bonus leve",
    },
    stable: {
      label: "Estavel",
      tone: "stable",
      description: "sem efeito",
    },
    shaken: {
      label: "Abalado",
      tone: "shaken",
      description: "pode hesitar",
    },
    collapse: {
      label: "Em colapso",
      tone: "collapse",
      description: "atributos reduzidos",
    },
  };

  function clampMorale(value) {
    return Math.max(MORALE_CONFIG.min, Math.min(MORALE_CONFIG.max, Math.round(value)));
  }

  function createStartingMorale() {
    return Math.floor(MORALE_CONFIG.startingMin + Math.random() * (MORALE_CONFIG.startingMax - MORALE_CONFIG.startingMin + 1));
  }

  function normalizeHeroMorale(hero) {
    hero.morale = Number.isFinite(hero.morale) ? clampMorale(hero.morale) : createStartingMorale();
    hero.battlesSinceLastUsed = Number.isFinite(hero.battlesSinceLastUsed)
      ? Math.max(0, Math.round(hero.battlesSinceLastUsed))
      : 0;
    hero.lastUsedAt = hero.lastUsedAt || null;
    return hero.morale;
  }

  function getHeroMoraleState(hero) {
    const morale = Number.isFinite(hero.morale) ? clampMorale(hero.morale) : createStartingMorale();

    if (morale > 80) return MORALE_STATES.inspired;
    if (morale < 20) return MORALE_STATES.collapse;
    if (morale < 40) return MORALE_STATES.shaken;
    return MORALE_STATES.stable;
  }

  function adjustHeroMorale(hero, amount) {
    normalizeHeroMorale(hero);
    const before = hero.morale;
    hero.morale = clampMorale(hero.morale + amount);
    return hero.morale - before;
  }

  function getInspiredStat(hero) {
    return hero.classKey === "archer" || hero.classKey === "rogue" ? "spd" : "atk";
  }

  function applyHeroMoraleModifiers(stats, hero) {
    normalizeHeroMorale(hero);

    if (hero.morale > 80) {
      const statKey = getInspiredStat(hero);
      stats[statKey] = Math.max(1, Math.round((stats[statKey] || 1) * 1.04));
      return stats;
    }

    if (hero.morale < 20) {
      ["hp", "atk", "def", "spd", "focus"].forEach((statKey) => {
        stats[statKey] = Math.max(1, Math.round((stats[statKey] || 1) * 0.94));
      });
    }

    return stats;
  }

  function shouldUnitFailMoraleAction(unit) {
    if (!unit || unit.side !== "player") return false;
    const morale = Number.isFinite(unit.morale) ? unit.morale : 100;
    if (morale >= 40) return false;

    const chance = morale < 20 ? MORALE_CONFIG.criticalFailChance : MORALE_CONFIG.lowFailChance;
    return Math.random() < chance;
  }

  function updateUnusedHeroMorale(hero, now) {
    normalizeHeroMorale(hero);
    hero.battlesSinceLastUsed += 1;

    if (hero.battlesSinceLastUsed < MORALE_CONFIG.unusedBattleLimit || hero.morale <= 50) {
      return 0;
    }

    hero.lastUsedAt = hero.lastUsedAt || now;
    return adjustHeroMorale(hero, -MORALE_CONFIG.unusedLoss);
  }

  function applyBattleMoraleChanges(state, playerTeam, battleResult, battle) {
    const now = Date.now();
    const participatingHeroIds = new Set(playerTeam.map((unit) => unit.sourceId).filter(Boolean));
    const fallenHeroIds = new Set(playerTeam.filter((unit) => unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId));
    const fallenCount = fallenHeroIds.size;
    const messages = [];

    state.heroes.forEach((hero) => {
      normalizeHeroMorale(hero);

      if (!participatingHeroIds.has(hero.id)) {
        if (Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id)) {
          hero.battlesSinceLastUsed = 0;
          return;
        }

        const moraleBefore = hero.morale;
        const delta = updateUnusedHeroMorale(hero, now);
        if (moraleBefore >= 20 && hero.morale < 20 && Echoes.queueFirstCriticalMoraleNarrative) {
          Echoes.queueFirstCriticalMoraleNarrative(state);
        }
        if (delta < 0) {
          messages.push(`${hero.name} perdeu ${Math.abs(delta)} de moral por ficar fora da torre por muito tempo.`);
        }
        return;
      }

      let delta = battleResult === "victory" ? MORALE_CONFIG.victoryGain : -MORALE_CONFIG.defeatLoss;
      if (fallenHeroIds.has(hero.id)) {
        delta -= MORALE_CONFIG.selfFallLoss;
      }

      const witnessedFalls = Math.max(0, fallenCount - (fallenHeroIds.has(hero.id) ? 1 : 0));
      if (witnessedFalls > 0) {
        delta -= Math.min(6, witnessedFalls * MORALE_CONFIG.allyFallLoss);
      }

      const moraleBefore = hero.morale;
      const actualDelta = adjustHeroMorale(hero, delta);
      hero.battlesSinceLastUsed = 0;
      hero.lastUsedAt = now;

      if (moraleBefore >= 20 && hero.morale < 20 && Echoes.queueFirstCriticalMoraleNarrative) {
        Echoes.queueFirstCriticalMoraleNarrative(state);
      }

      if (actualDelta !== 0) {
        const signal = actualDelta > 0 ? `ganhou ${actualDelta}` : `perdeu ${Math.abs(actualDelta)}`;
        messages.push(`${hero.name} ${signal} de moral (${hero.morale}/100).`);
      }
    });

    messages.forEach((message) => {
      if (battle && Echoes.addBattleEvent) {
        Echoes.addBattleEvent(battle, "morale", message);
      }
    });

    return messages;
  }

  function adjustFormationMorale(state, amount, reason) {
    const heroes = Echoes.getFormationHeroes ? Echoes.getFormationHeroes(state).filter(Boolean) : [];
    const changed = heroes
      .map((hero) => ({ hero, delta: adjustHeroMorale(hero, amount) }))
      .filter((entry) => entry.delta !== 0);

    if (changed.length === 0) return "";

    const direction = amount > 0 ? "Moral +" : "Moral ";
    return `${reason} ${direction}${amount} para a equipe ativa.`;
  }

  Echoes.MORALE_CONFIG = MORALE_CONFIG;
  Echoes.MORALE_STATES = MORALE_STATES;
  Echoes.createStartingMorale = createStartingMorale;
  Echoes.normalizeHeroMorale = normalizeHeroMorale;
  Echoes.getHeroMoraleState = getHeroMoraleState;
  Echoes.adjustHeroMorale = adjustHeroMorale;
  Echoes.applyHeroMoraleModifiers = applyHeroMoraleModifiers;
  Echoes.shouldUnitFailMoraleAction = shouldUnitFailMoraleAction;
  Echoes.applyBattleMoraleChanges = applyBattleMoraleChanges;
  Echoes.adjustFormationMorale = adjustFormationMorale;
})(window);
