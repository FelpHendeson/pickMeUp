(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const TOWER_DIFFICULTY_MODES = {
    normal: {
      id: "normal",
      name: "Normal",
      shortName: "Normal",
      description: "Regras atuais, recompensas padrao e sem morte permanente.",
      enemyPowerMultiplier: 1,
      rewardMultiplier: 1,
      injuryChanceMultiplier: 1,
      eventChanceMultiplier: 1,
      equipmentChanceMultiplier: 1,
      equipmentRarityBonusFloors: 0,
      permanentDeathChance: 0,
      tone: "normal",
    },
    challenge: {
      id: "challenge",
      name: "Desafio",
      shortName: "Desafio",
      description: "Inimigos mais fortes, mais eventos perigosos e recompensas melhores.",
      enemyPowerMultiplier: 1.25,
      rewardMultiplier: 1.5,
      injuryChanceMultiplier: 1.15,
      eventChanceMultiplier: 1.35,
      equipmentChanceMultiplier: 1.45,
      equipmentRarityBonusFloors: 5,
      permanentDeathChance: 0,
      tone: "challenge",
    },
    hardcore: {
      id: "hardcore",
      name: "Hardcore",
      shortName: "Hardcore",
      description: "Risco real de morte permanente para herois que caem em combate.",
      enemyPowerMultiplier: 1.5,
      rewardMultiplier: 2.2,
      injuryChanceMultiplier: 1.3,
      eventChanceMultiplier: 1.55,
      equipmentChanceMultiplier: 1.9,
      equipmentRarityBonusFloors: 10,
      permanentDeathChance: 0.25,
      tone: "hardcore",
    },
  };

  function getTowerDifficultyMode(modeId) {
    return TOWER_DIFFICULTY_MODES[modeId] || TOWER_DIFFICULTY_MODES.normal;
  }

  function normalizeTowerDifficultyMode(modeId) {
    return TOWER_DIFFICULTY_MODES[modeId] ? modeId : "normal";
  }

  function createTowerDifficultyStats() {
    return {
      victories: {
        normal: 0,
        challenge: 0,
        hardcore: 0,
      },
      hardcoreDeaths: 0,
    };
  }

  function normalizeTowerDifficultyState(state) {
    state.towerDifficultyStats = state.towerDifficultyStats || {};
    const defaults = createTowerDifficultyStats();
    const savedVictories = state.towerDifficultyStats.victories || {};

    state.towerDifficultyStats.victories = Object.keys(defaults.victories).reduce((result, modeId) => {
      result[modeId] = Math.max(0, Math.floor(Number(savedVictories[modeId]) || 0));
      return result;
    }, {});
    state.towerDifficultyStats.hardcoreDeaths = Math.max(0, Math.floor(Number(state.towerDifficultyStats.hardcoreDeaths) || 0));
    state.pendingTowerDifficultyMode = state.pendingTowerDifficultyMode
      ? normalizeTowerDifficultyMode(state.pendingTowerDifficultyMode)
      : null;
    state.deadHeroes = Array.isArray(state.deadHeroes) ? state.deadHeroes : [];

    return state.towerDifficultyStats;
  }

  function getDifficultyPercentLabel(value) {
    return `${Math.round(value * 100)}%`;
  }

  function getTowerDifficultySummary(modeId) {
    const mode = getTowerDifficultyMode(modeId);
    const injuryBonus = Math.round((mode.injuryChanceMultiplier - 1) * 100);

    return {
      id: mode.id,
      name: mode.name,
      description: mode.description,
      enemyPower: getDifficultyPercentLabel(mode.enemyPowerMultiplier),
      reward: getDifficultyPercentLabel(mode.rewardMultiplier),
      injuryRisk: injuryBonus > 0 ? `+${injuryBonus}%` : "padrao",
      permanentDeath:
        mode.permanentDeathChance > 0 ? `${Math.round(mode.permanentDeathChance * 100)}% se cair em combate` : "nao existe",
    };
  }

  function applyDifficultyToEnemyStats(stats, modeId) {
    const mode = getTowerDifficultyMode(modeId);
    if (mode.enemyPowerMultiplier === 1) return stats;

    ["hp", "atk", "def", "spd", "focus"].forEach((statKey) => {
      if (stats[statKey] == null) return;
      stats[statKey] = Math.max(1, Math.round(stats[statKey] * mode.enemyPowerMultiplier));
    });

    return stats;
  }

  function applyDifficultyToFloorReward(reward, modeId) {
    const mode = getTowerDifficultyMode(modeId);
    if (mode.rewardMultiplier === 1 && mode.equipmentChanceMultiplier === 1) {
      reward.difficultyMode = mode.id;
      reward.difficultyRewardMultiplier = mode.rewardMultiplier;
      reward.equipmentRarityBonusFloors = mode.equipmentRarityBonusFloors;
      return reward;
    }

    ["gold", "xp", "essence", "fragments", "crystalAmount", "echoFragmentAmount"].forEach((resourceKey) => {
      if (reward[resourceKey] > 0) {
        reward[resourceKey] = Math.max(1, Math.round(reward[resourceKey] * mode.rewardMultiplier));
      }
    });

    reward.crystalChance = Math.min(0.95, reward.crystalChance * Math.sqrt(mode.rewardMultiplier));
    reward.echoFragmentChance = Math.min(0.95, reward.echoFragmentChance * Math.sqrt(mode.rewardMultiplier));
    reward.consumableChance = Math.min(0.95, reward.consumableChance * Math.sqrt(mode.rewardMultiplier));
    reward.equipmentChance = Math.min(0.95, reward.equipmentChance * mode.equipmentChanceMultiplier);
    reward.difficultyMode = mode.id;
    reward.difficultyRewardMultiplier = mode.rewardMultiplier;
    reward.equipmentRarityBonusFloors = mode.equipmentRarityBonusFloors;

    return reward;
  }

  function applyDifficultyToBattleModifiers(floorModifiers, modeId) {
    const mode = getTowerDifficultyMode(modeId);
    floorModifiers.difficultyMode = mode.id;
    floorModifiers.injuryChanceMultiplier = (floorModifiers.injuryChanceMultiplier || 1) * mode.injuryChanceMultiplier;
    floorModifiers.permanentDeathChance = mode.permanentDeathChance;
    return floorModifiers;
  }

  function getDifficultyEventChanceMultiplier(modeId) {
    return getTowerDifficultyMode(modeId).eventChanceMultiplier;
  }

  function recordTowerDifficultyVictory(state, modeId) {
    normalizeTowerDifficultyState(state);
    const normalized = normalizeTowerDifficultyMode(modeId);
    state.towerDifficultyStats.victories[normalized] += 1;
  }

  function clearHeroFromLists(state, heroId) {
    state.formation = Array.isArray(state.formation) ? state.formation.map((id) => (id === heroId ? null : id)) : state.formation;

    if (state.teamPresets) {
      ["tower", "expedition"].forEach((presetType) => {
        const presets = Array.isArray(state.teamPresets[presetType]) ? state.teamPresets[presetType] : [];
        presets.forEach((preset) => {
          preset.heroIds = Array.isArray(preset.heroIds) ? preset.heroIds.map((id) => (id === heroId ? null : id)) : [];
        });
      });
    }
  }

  function resolveHardcoreDeaths(state, playerTeam, battle, battleModifiers) {
    const deathChance = battleModifiers && Number.isFinite(battleModifiers.permanentDeathChance)
      ? battleModifiers.permanentDeathChance
      : 0;
    if (deathChance <= 0) return [];

    normalizeTowerDifficultyState(state);
    const fallenHeroIds = Array.from(
      new Set(playerTeam.filter((unit) => unit.side === "player" && unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId))
    );
    const deaths = [];

    fallenHeroIds.forEach((heroId) => {
      const heroIndex = state.heroes.findIndex((hero) => hero.id === heroId);
      if (heroIndex < 0 || Math.random() >= deathChance) return;

      const hero = state.heroes[heroIndex];
      const memorialEntry = {
        id: hero.id,
        name: hero.name,
        classKey: hero.classKey,
        rarity: hero.rarity,
        level: hero.level,
        lostAtFloor: battle ? battle.floor : null,
        lostAt: new Date().toISOString(),
        mode: "hardcore",
      };

      state.heroes.splice(heroIndex, 1);
      clearHeroFromLists(state, heroId);
      state.deadHeroes.push(memorialEntry);
      state.towerDifficultyStats.hardcoreDeaths += 1;
      deaths.push(memorialEntry);

      if (battle && Echoes.addBattleEvent) {
        Echoes.addBattleEvent(
          battle,
          "death",
          `${hero.name} caiu definitivamente no modo Hardcore e foi registrado no memorial.`
        );
      }
    });

    return deaths;
  }

  Echoes.TOWER_DIFFICULTY_MODES = TOWER_DIFFICULTY_MODES;
  Echoes.getTowerDifficultyMode = getTowerDifficultyMode;
  Echoes.normalizeTowerDifficultyMode = normalizeTowerDifficultyMode;
  Echoes.createTowerDifficultyStats = createTowerDifficultyStats;
  Echoes.normalizeTowerDifficultyState = normalizeTowerDifficultyState;
  Echoes.getTowerDifficultySummary = getTowerDifficultySummary;
  Echoes.applyDifficultyToEnemyStats = applyDifficultyToEnemyStats;
  Echoes.applyDifficultyToFloorReward = applyDifficultyToFloorReward;
  Echoes.applyDifficultyToBattleModifiers = applyDifficultyToBattleModifiers;
  Echoes.getDifficultyEventChanceMultiplier = getDifficultyEventChanceMultiplier;
  Echoes.recordTowerDifficultyVictory = recordTowerDifficultyVictory;
  Echoes.resolveHardcoreDeaths = resolveHardcoreDeaths;
})(window);
