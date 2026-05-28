(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const DAILY_MISSION_DEFINITIONS = [
    {
      id: "tower_wins_3",
      title: "Limpar a trilha",
      description: "Venca 3 combates na torre.",
      statKey: "towerVictories",
      target: 3,
      reward: { gold: 180, crystals: 20, consumables: { small_healing_potion: 1 } },
    },
    {
      id: "summon_1",
      title: "Chamado do portal",
      description: "Faca 1 invocacao.",
      statKey: "summons",
      target: 1,
      reward: { gold: 80, essence: 8 },
    },
    {
      id: "start_expedition_1",
      title: "Ordens de campo",
      description: "Envie 1 expedicao.",
      statKey: "expeditionsStarted",
      target: 1,
      reward: { gold: 120, fragments: 8 },
    },
    {
      id: "equip_item_1",
      title: "Preparacao de combate",
      description: "Equipe 1 item em qualquer heroi.",
      statKey: "itemsEquipped",
      target: 1,
      reward: { gold: 100, crystals: 10 },
    },
    {
      id: "collect_expedition_1",
      title: "Relatorio de retorno",
      description: "Colete recompensa de 1 expedicao.",
      statKey: "expeditionsCollected",
      target: 1,
      reward: { crystals: 15, essence: 10, consumables: { vigor_potion: 1 } },
    },
  ];

  const ACHIEVEMENT_DEFINITIONS = [
    {
      id: "floor_10",
      title: "Primeiro marco",
      description: "Chegue ao andar 10.",
      target: 10,
      getProgress: (state) => Math.min(Echoes.CONFIG.towerMaxFloor, Math.max(1, Number(state.towerFloor) || 1)),
      reward: { gold: 500, crystals: 60, essence: 20, echoFragments: 6, heroContracts: 1, consumables: { medical_kit: 1 } },
    },
    {
      id: "floor_20",
      title: "Ressonancia profunda",
      description: "Chegue ao andar 20.",
      target: 20,
      getProgress: (state) => Math.min(Echoes.CONFIG.towerMaxFloor, Math.max(1, Number(state.towerFloor) || 1)),
      reward: { gold: 900, crystals: 110, fragments: 35, echoFragments: 10, heroContracts: 1 },
    },
    {
      id: "summon_10",
      title: "Companhia crescente",
      description: "Invoque 10 herois.",
      target: 10,
      getProgress: (state) => Math.max(getMissionStat(state, "summons"), (state.heroes || []).length),
      reward: { gold: 350, crystals: 80 },
    },
    {
      id: "rarity_4_hero",
      title: "Eco raro",
      description: "Tenha um heroi 4 estrelas ou superior.",
      target: 1,
      getProgress: (state) => ((state.heroes || []).some((hero) => hero.rarity >= 4) ? 1 : 0),
      reward: { crystals: 120, essence: 35, echoFragments: 6 },
    },
    {
      id: "boss_no_fallen",
      title: "Vitoria impecavel",
      description: "Venca um chefe sem perder herois.",
      target: 1,
      statKey: "bossNoCasualtyWins",
      reward: { gold: 600, crystals: 90, essence: 25, echoFragments: 8, heroContracts: 1, consumables: { protection_amulet: 1 } },
    },
    {
      id: "equip_5",
      title: "Arsenal desperto",
      description: "Equipe 5 itens.",
      target: 5,
      statKey: "itemsEquipped",
      reward: { gold: 300, fragments: 45 },
    },
    {
      id: "expeditions_10",
      title: "Rede de exploradores",
      description: "Complete 10 expedicoes.",
      target: 10,
      statKey: "expeditionsCollected",
      reward: { gold: 450, crystals: 70, fragments: 30, echoFragments: 8 },
    },
  ];

  const TRACKED_STATS = [
    "towerVictories",
    "summons",
    "expeditionsStarted",
    "expeditionsCollected",
    "itemsEquipped",
    "bossNoCasualtyWins",
  ];

  function getLocalDateKey(date) {
    const currentDate = date || new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function createDailyMissionState(dateKey) {
    return {
      dateKey: dateKey || getLocalDateKey(),
      progress: {},
      claimed: {},
    };
  }

  function normalizeMissionStats(state) {
    state.missionStats = state.missionStats && typeof state.missionStats === "object" ? state.missionStats : {};

    TRACKED_STATS.forEach((statKey) => {
      state.missionStats[statKey] = Math.max(0, Math.floor(Number(state.missionStats[statKey]) || 0));
    });

    state.missionStats.summons = Math.max(state.missionStats.summons, (state.heroes || []).length);
  }

  function normalizeDailyMissions(state) {
    const today = getLocalDateKey();
    const saved = state.dailyMissions && typeof state.dailyMissions === "object" ? state.dailyMissions : null;

    if (!saved || saved.dateKey !== today) {
      state.dailyMissions = createDailyMissionState(today);
      return state.dailyMissions;
    }

    state.dailyMissions = {
      dateKey: today,
      progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
      claimed: saved.claimed && typeof saved.claimed === "object" ? saved.claimed : {},
    };

    DAILY_MISSION_DEFINITIONS.forEach((mission) => {
      state.dailyMissions.progress[mission.statKey] = Math.max(
        0,
        Math.floor(Number(state.dailyMissions.progress[mission.statKey]) || 0)
      );
      state.dailyMissions.claimed[mission.id] = Boolean(state.dailyMissions.claimed[mission.id]);
    });

    return state.dailyMissions;
  }

  function normalizeAchievements(state) {
    state.achievements = state.achievements && typeof state.achievements === "object" ? state.achievements : {};

    ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
      state.achievements[achievement.id] = {
        claimed: Boolean(state.achievements[achievement.id] && state.achievements[achievement.id].claimed),
      };
    });
  }

  function normalizeMissionState(state) {
    normalizeMissionStats(state);
    normalizeDailyMissions(state);
    normalizeAchievements(state);
    return state;
  }

  function getMissionStat(state, statKey) {
    normalizeMissionStats(state);
    return state.missionStats[statKey] || 0;
  }

  function recordMissionProgress(state, statKey, amount) {
    const increment = Math.max(0, Math.floor(Number(amount) || 0));
    if (!statKey || increment <= 0) return;

    normalizeMissionState(state);

    state.missionStats[statKey] = (state.missionStats[statKey] || 0) + increment;
    state.dailyMissions.progress[statKey] = (state.dailyMissions.progress[statKey] || 0) + increment;
  }

  function getDailyMissionProgress(state, mission) {
    normalizeMissionState(state);
    return Math.min(mission.target, state.dailyMissions.progress[mission.statKey] || 0);
  }

  function getAchievementProgress(state, achievement) {
    normalizeMissionState(state);

    if (typeof achievement.getProgress === "function") {
      return Math.min(achievement.target, Math.max(0, Math.floor(Number(achievement.getProgress(state)) || 0)));
    }

    return Math.min(achievement.target, getMissionStat(state, achievement.statKey));
  }

  function isDailyMissionComplete(state, mission) {
    return getDailyMissionProgress(state, mission) >= mission.target;
  }

  function isAchievementComplete(state, achievement) {
    return getAchievementProgress(state, achievement) >= achievement.target;
  }

  function formatMissionReward(reward) {
    const resources = Object.keys(reward)
      .filter((resourceKey) => resourceKey !== "consumables" && reward[resourceKey] > 0)
      .map((resourceKey) => `${reward[resourceKey]} ${getRewardResourceName(resourceKey)}`);
    const consumables = Echoes.formatConsumableReward ? Echoes.formatConsumableReward(reward.consumables) : "";

    return resources.concat(consumables ? [consumables] : []).join(" | ");
  }

  function getRewardResourceName(resourceKey) {
    if (resourceKey === "gold") return "ouro";
    if (resourceKey === "crystals") return "cristais";
    if (resourceKey === "essence") return "essencia";
    if (resourceKey === "fragments") return "fragmentos";
    if (resourceKey === "echoFragments") return "fragmentos de eco";
    if (resourceKey === "heroContracts") return "contrato(s) de heroi";
    return resourceKey;
  }

  function grantMissionReward(state, reward) {
    Object.keys(reward).forEach((resourceKey) => {
      if (resourceKey === "consumables") return;
      if (reward[resourceKey] > 0) {
        Echoes.addResource(state, resourceKey, reward[resourceKey]);
      }
    });

    Object.keys(reward.consumables || {}).forEach((consumableId) => {
      if (reward.consumables[consumableId] > 0 && Echoes.addConsumable) {
        Echoes.addConsumable(state, consumableId, reward.consumables[consumableId]);
      }
    });
  }

  function claimDailyMissionReward(state, missionId) {
    normalizeMissionState(state);

    const mission = DAILY_MISSION_DEFINITIONS.find((item) => item.id === missionId);
    if (!mission) return { ok: false, message: "Missao diaria nao encontrada." };
    if (state.dailyMissions.claimed[mission.id]) return { ok: false, message: "Recompensa diaria ja coletada." };
    if (!isDailyMissionComplete(state, mission)) return { ok: false, message: "Missao diaria ainda incompleta." };

    grantMissionReward(state, mission.reward);
    state.dailyMissions.claimed[mission.id] = true;

    return {
      ok: true,
      message: `Missao concluida: ${mission.title}. Recompensa: ${formatMissionReward(mission.reward)}.`,
    };
  }

  function claimAchievementReward(state, achievementId) {
    normalizeMissionState(state);

    const achievement = ACHIEVEMENT_DEFINITIONS.find((item) => item.id === achievementId);
    if (!achievement) return { ok: false, message: "Conquista nao encontrada." };
    if (state.achievements[achievement.id].claimed) return { ok: false, message: "Conquista ja coletada." };
    if (!isAchievementComplete(state, achievement)) return { ok: false, message: "Conquista ainda incompleta." };

    grantMissionReward(state, achievement.reward);
    state.achievements[achievement.id].claimed = true;

    return {
      ok: true,
      message: `Conquista desbloqueada: ${achievement.title}. Recompensa: ${formatMissionReward(achievement.reward)}.`,
    };
  }

  function getClaimableMissionCount(state) {
    normalizeMissionState(state);

    const dailyCount = DAILY_MISSION_DEFINITIONS.filter(
      (mission) => isDailyMissionComplete(state, mission) && !state.dailyMissions.claimed[mission.id]
    ).length;
    const achievementCount = ACHIEVEMENT_DEFINITIONS.filter(
      (achievement) => isAchievementComplete(state, achievement) && !state.achievements[achievement.id].claimed
    ).length;

    return dailyCount + achievementCount;
  }

  Echoes.DAILY_MISSION_DEFINITIONS = DAILY_MISSION_DEFINITIONS;
  Echoes.ACHIEVEMENT_DEFINITIONS = ACHIEVEMENT_DEFINITIONS;
  Echoes.normalizeMissionState = normalizeMissionState;
  Echoes.getLocalDateKey = getLocalDateKey;
  Echoes.recordMissionProgress = recordMissionProgress;
  Echoes.getDailyMissionProgress = getDailyMissionProgress;
  Echoes.getAchievementProgress = getAchievementProgress;
  Echoes.isDailyMissionComplete = isDailyMissionComplete;
  Echoes.isAchievementComplete = isAchievementComplete;
  Echoes.formatMissionReward = formatMissionReward;
  Echoes.claimDailyMissionReward = claimDailyMissionReward;
  Echoes.claimAchievementReward = claimAchievementReward;
  Echoes.getClaimableMissionCount = getClaimableMissionCount;
})(window);
