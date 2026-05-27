(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const ENEMY_ARCHETYPES = {
    stoneSlime: {
      name: "Slime de Pedra",
      role: "tanque",
      stats: { hp: 58, atk: 10, def: 7, spd: 4, focus: 3, luck: 2 },
    },
    duskBat: {
      name: "Morcego Sombrio",
      role: "veloz",
      stats: { hp: 38, atk: 13, def: 3, spd: 12, focus: 4, luck: 8 },
    },
    ridgeRaider: {
      name: "Saqueador da Serra",
      role: "dano",
      stats: { hp: 54, atk: 15, def: 5, spd: 8, focus: 5, luck: 6 },
    },
    markedAcolyte: {
      name: "Acolito Marcado",
      role: "suporte",
      stats: { hp: 48, atk: 13, def: 4, spd: 7, focus: 10, luck: 5 },
    },
    ironGolem: {
      name: "Golem Antigo",
      role: "chefe",
      stats: { hp: 210, atk: 23, def: 14, spd: 5, focus: 8, luck: 4 },
    },
    emberHound: {
      name: "Sabueso de Brasa",
      role: "dano",
      stats: { hp: 70, atk: 20, def: 6, spd: 11, focus: 5, luck: 8 },
    },
    graveWarden: {
      name: "Vigia Tumular",
      role: "tanque",
      stats: { hp: 96, atk: 16, def: 13, spd: 6, focus: 7, luck: 4 },
    },
    crystalSeer: {
      name: "Vidente Cristalino",
      role: "suporte",
      stats: { hp: 68, atk: 17, def: 7, spd: 9, focus: 15, luck: 8 },
    },
    stormHarpy: {
      name: "Harpia Tempestuosa",
      role: "veloz",
      stats: { hp: 64, atk: 19, def: 5, spd: 15, focus: 8, luck: 11 },
    },
    voidReaver: {
      name: "Ceifador do Vazio",
      role: "dano",
      stats: { hp: 88, atk: 25, def: 8, spd: 10, focus: 9, luck: 9 },
    },
    shardOracle: {
      name: "Oraculo Estilhacado",
      role: "chefe",
      stats: { hp: 310, atk: 28, def: 15, spd: 9, focus: 18, luck: 8 },
    },
    eclipseAvatar: {
      name: "Avatar do Eclipse",
      role: "chefe",
      stats: { hp: 430, atk: 36, def: 20, spd: 10, focus: 20, luck: 10 },
    },
  };

  const FLOOR_MODIFIERS = {
    reducedHealing: {
      label: "Cura reduzida",
      description: "curas da equipe -25%",
      healingDoneMultiplier: 0.75,
    },
    fastEnemies: {
      label: "Inimigos mais rapidos",
      description: "SPD inimiga +14%",
      enemySpeedMultiplier: 1.14,
    },
    exposedTeam: {
      label: "Dano recebido aumentado",
      description: "equipe recebe +12% dano",
      playerDamageTakenMultiplier: 1.12,
    },
    drainedStart: {
      label: "Energia inicial reduzida",
      description: "herois com -15 energia inicial",
      playerInitialEnergyPenalty: 15,
    },
  };

  const TOWER_FLOORS = [
    {
      floor: 1,
      title: "Ecos no Atrio",
      recommendedLevel: 1,
      mechanic: "Tutorial",
      enemyKeys: ["stoneSlime", "stoneSlime"],
      rewardHint: "Ouro",
    },
    {
      floor: 2,
      title: "Asas na Penumbra",
      recommendedLevel: 1,
      mechanic: "Velocidade",
      enemyKeys: ["stoneSlime", "duskBat", "duskBat"],
      rewardHint: "Ouro + XP",
    },
    {
      floor: 3,
      title: "Ponte dos Saqueadores",
      recommendedLevel: 2,
      mechanic: "Dano fisico",
      enemyKeys: ["ridgeRaider", "ridgeRaider"],
      rewardHint: "Cristais",
    },
    {
      floor: 4,
      title: "Ninho Escuro",
      recommendedLevel: 2,
      mechanic: "Alvos frageis",
      enemyKeys: ["duskBat", "duskBat", "duskBat", "duskBat"],
      rewardHint: "XP",
    },
    {
      floor: 5,
      title: "Capitao da Serra",
      recommendedLevel: 3,
      mechanic: "Mini-chefe",
      enemyKeys: ["ridgeRaider", "ridgeRaider", "stoneSlime"],
      rewardHint: "Chance de equipamento",
    },
    {
      floor: 6,
      title: "Circulo da Marca",
      recommendedLevel: 3,
      mechanic: "Marca",
      enemyKeys: ["markedAcolyte", "markedAcolyte", "stoneSlime"],
      modifier: "Maldicao leve: inimigos focam alvos feridos.",
      rewardHint: "Essencia",
    },
    {
      floor: 7,
      title: "Muralha Viva",
      recommendedLevel: 4,
      mechanic: "Defesa alta",
      enemyKeys: ["stoneSlime", "stoneSlime", "stoneSlime"],
      modifier: "Terreno estreito: frente recebe mais ataques.",
      rewardHint: "Fragmentos",
    },
    {
      floor: 8,
      title: "Camara Mista",
      recommendedLevel: 4,
      mechanic: "Formacao",
      enemyKeys: ["stoneSlime", "duskBat", "ridgeRaider", "markedAcolyte"],
      modifier: "Nevoa: turnos mais imprevisiveis.",
      rewardHint: "Cristais",
    },
    {
      floor: 9,
      title: "Pressao Rubra",
      recommendedLevel: 5,
      mechanic: "Pressao",
      enemyKeys: ["markedAcolyte", "ridgeRaider", "ridgeRaider", "duskBat"],
      modifier: "Mana instavel: habilidades aparecem mais cedo.",
      rewardHint: "Chance de equipamento incomum",
    },
    {
      floor: 10,
      title: "Nucleo do Golem",
      recommendedLevel: 5,
      mechanic: "Chefe: esmagamento em area",
      enemyKeys: ["ironGolem", "markedAcolyte"],
      modifier: "Chefe de marco: o Golem atinge ate 2 alvos com sua habilidade.",
      rewardHint: "Ouro, cristais e Oficina",
    },
    {
      floor: 11,
      title: "Enfermaria Quebrada",
      recommendedLevel: 6,
      mechanic: "Cura reduzida",
      enemyKeys: ["emberHound", "stoneSlime", "markedAcolyte"],
      modifierKeys: ["reducedHealing"],
      rewardHint: "Ouro e XP",
    },
    {
      floor: 12,
      title: "Galeria dos Uivos",
      recommendedLevel: 6,
      mechanic: "Velocidade inimiga",
      enemyKeys: ["emberHound", "emberHound", "duskBat"],
      modifierKeys: ["fastEnemies"],
      rewardHint: "Cristais",
    },
    {
      floor: 13,
      title: "Passagem Tumular",
      recommendedLevel: 7,
      mechanic: "Defesa inimiga",
      enemyKeys: ["graveWarden", "ridgeRaider", "markedAcolyte"],
      modifierKeys: ["exposedTeam"],
      rewardHint: "Essencia",
    },
    {
      floor: 14,
      title: "Escadaria Sem Folego",
      recommendedLevel: 7,
      mechanic: "Energia inicial baixa",
      enemyKeys: ["graveWarden", "duskBat", "emberHound"],
      modifierKeys: ["drainedStart"],
      rewardHint: "Fragmentos",
    },
    {
      floor: 15,
      title: "Forja Fraturada",
      recommendedLevel: 8,
      mechanic: "Dano constante",
      enemyKeys: ["emberHound", "graveWarden", "ridgeRaider"],
      modifierKeys: ["exposedTeam"],
      rewardHint: "Equipamento garantido",
    },
    {
      floor: 16,
      title: "Sala dos Prismas",
      recommendedLevel: 8,
      mechanic: "Suporte inimigo",
      enemyKeys: ["crystalSeer", "stoneSlime", "emberHound"],
      modifierKeys: ["reducedHealing"],
      rewardHint: "Cristais",
    },
    {
      floor: 17,
      title: "Corrente de Vidro",
      recommendedLevel: 9,
      mechanic: "Rapidez e foco",
      enemyKeys: ["crystalSeer", "duskBat", "stormHarpy"],
      modifierKeys: ["fastEnemies"],
      rewardHint: "XP alto",
    },
    {
      floor: 18,
      title: "Patio dos Vigias",
      recommendedLevel: 9,
      mechanic: "Tanques",
      enemyKeys: ["graveWarden", "graveWarden", "crystalSeer"],
      modifierKeys: ["drainedStart"],
      rewardHint: "Ouro alto",
    },
    {
      floor: 19,
      title: "Antesala Estilhada",
      recommendedLevel: 10,
      mechanic: "Preparacao de chefe",
      enemyKeys: ["stormHarpy", "voidReaver", "crystalSeer"],
      modifierKeys: ["reducedHealing", "fastEnemies"],
      rewardHint: "Chance alta de equipamento",
    },
    {
      floor: 20,
      title: "Trono do Oraculo",
      recommendedLevel: 10,
      mechanic: "Chefe: marcas multiplas",
      enemyKeys: ["shardOracle", "crystalSeer"],
      modifierKeys: ["reducedHealing"],
      modifier: "Chefe de marco: o Oraculo marca dois alvos vulneraveis.",
      rewardHint: "Equipamento garantido e cristais",
    },
    {
      floor: 21,
      title: "Ponte Tempestuosa",
      recommendedLevel: 11,
      mechanic: "Velocidade alta",
      enemyKeys: ["stormHarpy", "stormHarpy", "emberHound"],
      modifierKeys: ["fastEnemies", "exposedTeam"],
      rewardHint: "Ouro e XP",
    },
    {
      floor: 22,
      title: "Cripta Veloz",
      recommendedLevel: 11,
      mechanic: "Pressao na retaguarda",
      enemyKeys: ["stormHarpy", "voidReaver", "duskBat"],
      modifierKeys: ["fastEnemies"],
      rewardHint: "Cristais",
    },
    {
      floor: 23,
      title: "Camara Sem Pulso",
      recommendedLevel: 12,
      mechanic: "Cura limitada",
      enemyKeys: ["voidReaver", "graveWarden", "markedAcolyte"],
      modifierKeys: ["reducedHealing", "drainedStart"],
      rewardHint: "Essencia",
    },
    {
      floor: 24,
      title: "Muralha dos Ceifadores",
      recommendedLevel: 12,
      mechanic: "Dano pesado",
      enemyKeys: ["voidReaver", "voidReaver", "graveWarden"],
      modifierKeys: ["exposedTeam"],
      rewardHint: "Fragmentos",
    },
    {
      floor: 25,
      title: "Forja do Eclipse",
      recommendedLevel: 13,
      mechanic: "Elite",
      enemyKeys: ["voidReaver", "crystalSeer", "graveWarden", "emberHound"],
      modifierKeys: ["exposedTeam", "drainedStart"],
      rewardHint: "Equipamento garantido",
    },
    {
      floor: 26,
      title: "Galeria Invertida",
      recommendedLevel: 13,
      mechanic: "Turnos rapidos",
      enemyKeys: ["stormHarpy", "stormHarpy", "crystalSeer", "duskBat"],
      modifierKeys: ["fastEnemies", "reducedHealing"],
      rewardHint: "Cristais",
    },
    {
      floor: 27,
      title: "Fenda Abissal",
      recommendedLevel: 14,
      mechanic: "Dano e marca",
      enemyKeys: ["voidReaver", "markedAcolyte", "voidReaver"],
      modifierKeys: ["exposedTeam", "reducedHealing"],
      rewardHint: "XP alto",
    },
    {
      floor: 28,
      title: "Guarda do Eclipse",
      recommendedLevel: 14,
      mechanic: "Tanque e suporte",
      enemyKeys: ["graveWarden", "graveWarden", "crystalSeer", "voidReaver"],
      modifierKeys: ["drainedStart", "fastEnemies"],
      rewardHint: "Ouro alto",
    },
    {
      floor: 29,
      title: "Limiar Escurecido",
      recommendedLevel: 15,
      mechanic: "Teste final",
      enemyKeys: ["stormHarpy", "voidReaver", "crystalSeer", "emberHound"],
      modifierKeys: ["reducedHealing", "fastEnemies", "exposedTeam"],
      rewardHint: "Chance muito alta de equipamento",
    },
    {
      floor: 30,
      title: "Coroa do Eclipse",
      recommendedLevel: 15,
      mechanic: "Chefe: dreno de energia",
      enemyKeys: ["eclipseAvatar", "voidReaver", "crystalSeer"],
      modifierKeys: ["drainedStart", "exposedTeam"],
      modifier: "Chefe final: o Avatar drena energia da equipe e causa dano em area.",
      rewardHint: "Grande recompensa final",
    },
  ];

  function getFloorData(floorNumber) {
    return TOWER_FLOORS.find((floor) => floor.floor === floorNumber) || null;
  }

  function getFloorPower(floorNumber) {
    return Math.round(90 + floorNumber * 42 + Math.pow(floorNumber, 1.18) * 15 + Math.max(0, floorNumber - 10) * 18);
  }

  function getFloorModifierValues(floorData) {
    const modifierKeys = (floorData && floorData.modifierKeys) || [];

    return modifierKeys.reduce(
      (modifiers, modifierKey) => {
        const rule = FLOOR_MODIFIERS[modifierKey];
        if (!rule) return modifiers;

        modifiers.keys.push(modifierKey);
        modifiers.labels.push(rule.label);
        modifiers.descriptions.push(rule.description);
        modifiers.healingDoneMultiplier *= rule.healingDoneMultiplier || 1;
        modifiers.enemySpeedMultiplier *= rule.enemySpeedMultiplier || 1;
        modifiers.playerDamageTakenMultiplier *= rule.playerDamageTakenMultiplier || 1;
        modifiers.playerInitialEnergyPenalty += rule.playerInitialEnergyPenalty || 0;

        return modifiers;
      },
      {
        keys: [],
        labels: [],
        descriptions: [],
        healingDoneMultiplier: 1,
        enemySpeedMultiplier: 1,
        playerDamageTakenMultiplier: 1,
        playerInitialEnergyPenalty: 0,
      }
    );
  }

  function getFloorModifierSummary(floorData) {
    const modifiers = getFloorModifierValues(floorData);
    const descriptions = modifiers.descriptions.slice();
    const enemyAtkMultiplier = Echoes.getWeeklyEventModifier ? Echoes.getWeeklyEventModifier("enemyAtkMultiplier", 1) : 1;

    if (enemyAtkMultiplier > 1) {
      descriptions.push(`evento semanal: ATK inimigo +${Math.round((enemyAtkMultiplier - 1) * 100)}%`);
    }

    return descriptions.length > 0 ? descriptions.join(" | ") : "";
  }

  function scaleEnemyStats(baseStats, floorNumber, isBoss) {
    const floorScale = 0.82 + floorNumber * 0.085 + Math.max(0, floorNumber - 10) * 0.018;
    const bossScale = isBoss ? 1.2 : 1;

    return Object.keys(baseStats).reduce((stats, key) => {
      const value = baseStats[key] * floorScale * bossScale;
      stats[key] = Math.max(1, Math.round(value));
      return stats;
    }, {});
  }

  function getEnemyStartingEnergy(enemyKey, floorNumber, isBoss) {
    if (enemyKey === "shardOracle" || enemyKey === "eclipseAvatar") return 45;
    if (isBoss) return 35;
    return floorNumber >= 21 ? 30 : floorNumber >= 9 ? 25 : 0;
  }

  function createEnemyUnit(enemyKey, floorNumber, index, floorData) {
    const archetype = ENEMY_ARCHETYPES[enemyKey] || ENEMY_ARCHETYPES.stoneSlime;
    const isBoss = archetype.role === "chefe";
    const modifiers = getFloorModifierValues(floorData);
    const stats = scaleEnemyStats(archetype.stats, floorNumber, isBoss);

    if (modifiers.enemySpeedMultiplier > 1) {
      stats.spd = Math.max(1, Math.round(stats.spd * modifiers.enemySpeedMultiplier));
    }

    if (Echoes.getWeeklyEventModifier) {
      stats.atk = Math.max(1, Math.round(stats.atk * Echoes.getWeeklyEventModifier("enemyAtkMultiplier", 1)));
    }

    return {
      id: `enemy_${floorNumber}_${index}_${enemyKey}`,
      name: index > 0 ? `${archetype.name} ${index + 1}` : archetype.name,
      side: "enemy",
      enemyKey,
      role: archetype.role,
      rarity: isBoss ? 4 : 1,
      level: Math.max(1, Math.ceil(floorNumber / 2)),
      stats,
      maxHp: stats.hp,
      hp: stats.hp,
      energy: getEnemyStartingEnergy(enemyKey, floorNumber, isBoss),
      statuses: {},
      position: isBoss || index < 2 ? "front" : "back",
    };
  }

  function createEnemiesForFloor(floorNumber) {
    const floorData = getFloorData(floorNumber);
    if (!floorData) return [];

    return floorData.enemyKeys.map((enemyKey, index) => createEnemyUnit(enemyKey, floorNumber, index, floorData));
  }

  function getFloorReward(floorNumber) {
    const bossFloor = floorNumber === 10 || floorNumber === 20 || floorNumber === 30;
    const milestoneFloor = floorNumber === 5 || floorNumber === 9 || floorNumber === 15 || floorNumber === 19 || floorNumber === 25 || floorNumber === 29;

    const reward = {
      gold: 45 + floorNumber * 18 + Math.floor(Math.max(0, floorNumber - 10) * 9),
      xp: 28 + floorNumber * 11 + Math.floor(Math.max(0, floorNumber - 10) * 5),
      energyRefund: bossFloor ? 5 : floorNumber >= 11 ? 4 : 3,
      crystalChance: Math.min(0.1 + floorNumber * 0.012, 0.42),
      crystalAmount: 8 + floorNumber * 2 + Math.floor(floorNumber / 10) * 8,
      essence: floorNumber === 6 ? 15 : floorNumber === 10 ? 20 : floorNumber >= 13 && floorNumber % 5 === 3 ? 18 + floorNumber : 0,
      fragments: floorNumber === 7 ? 15 : floorNumber === 10 ? 20 : floorNumber >= 14 && floorNumber % 5 === 4 ? 18 + floorNumber : 0,
      equipmentChance: Math.min(8 + floorNumber * 0.9, 48) / 100,
      guaranteedEquipment: bossFloor || milestoneFloor,
    };

    if (Echoes.getWeeklyEventModifier) {
      reward.gold = Math.max(1, Math.round(reward.gold * Echoes.getWeeklyEventModifier("towerGoldMultiplier", 1)));
      reward.equipmentChance = Math.min(0.9, reward.equipmentChance * Echoes.getWeeklyEventModifier("equipmentDropMultiplier", 1));
    }

    return reward;
  }

  function describeReward(floorNumber) {
    const reward = getFloorReward(floorNumber);
    const displayedXp = Math.max(
      1,
      Math.round(reward.xp * (Echoes.getWeeklyEventModifier ? Echoes.getWeeklyEventModifier("heroXpMultiplier", 1) : 1))
    );
    const parts = [`${reward.gold} ouro`, `${displayedXp} XP por heroi`, `${reward.energyRefund} energia recuperada`];

    if (reward.essence > 0) parts.push(`${reward.essence} essencia`);
    if (reward.fragments > 0) parts.push(`${reward.fragments} fragmentos`);
    parts.push(`${Math.round(reward.crystalChance * 100)}% de cristais`);
    parts.push(reward.guaranteedEquipment ? "equipamento garantido" : `${Math.round(reward.equipmentChance * 100)}% de equipamento`);

    return parts.join(" | ");
  }

  function getHighestCompletedFloor(state) {
    return Math.min(Echoes.CONFIG.towerMaxFloor, Math.max(0, (state.towerFloor || 1) - 1));
  }

  function canRepeatTowerFloor(state, floorNumber) {
    return Number.isInteger(floorNumber) && floorNumber >= 1 && floorNumber <= getHighestCompletedFloor(state);
  }

  function validateTowerBattleStart(state, floorData, formationHeroes) {
    if (!floorData) {
      return { ok: false, message: "A torre atual ja foi concluida." };
    }

    if (formationHeroes.length === 0) {
      return { ok: false, message: "Monte uma formacao antes de iniciar combate." };
    }

    const busyHero = formationHeroes.find((hero) => Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id));
    if (busyHero) {
      const expedition = Echoes.getHeroExpedition(state, busyHero.id);
      return { ok: false, message: `${busyHero.name} esta em expedicao${expedition ? `: ${expedition.name}` : ""}.` };
    }

    if (!Echoes.canSpendResource(state, "energy", Echoes.CONFIG.towerEnergyCost)) {
      return { ok: false, message: "Energia insuficiente para tentar a torre." };
    }

    return { ok: true };
  }

  function isBossFloor(floorData) {
    return Boolean(
      floorData &&
        floorData.enemyKeys.some((enemyKey) => {
          const enemy = ENEMY_ARCHETYPES[enemyKey];
          return enemy && enemy.role === "chefe";
        })
    );
  }

  function buildTowerBattleIntro(floorNumber, floorData, playerTeam, enemyTeam, isRepeat) {
    const intro = [
      `${isRepeat ? "Repeticao do andar" : "Andar"} ${floorNumber}: ${floorData.title}.`,
      `Equipe entrou com ${playerTeam.length} heroi(s). Inimigos: ${enemyTeam.map((enemy) => enemy.name).join(", ")}.`,
    ];
    const modifierSummary = getFloorModifierSummary(floorData);

    if (modifierSummary) {
      intro.push(`Modificadores: ${modifierSummary}.`);
    }

    if (Echoes.getActiveWeeklyEventSummary) {
      intro.push(`Evento semanal ativo: ${Echoes.getActiveWeeklyEventSummary()}.`);
    }

    return intro;
  }

  function applyPreBattleFloorModifiers(playerTeam, floorModifiers) {
    if (!floorModifiers || floorModifiers.playerInitialEnergyPenalty <= 0) return;

    playerTeam.forEach((unit) => {
      unit.energy = Math.max(0, unit.energy - floorModifiers.playerInitialEnergyPenalty);
    });
  }

  function runTowerBattle(state, options) {
    const repeatFloor = options && Number(options.repeatFloor);
    const isRepeat = Number.isInteger(repeatFloor);
    const floorNumber = isRepeat ? repeatFloor : state.towerFloor;
    const floorData = getFloorData(floorNumber);
    const formationHeroes = Echoes.getFormationHeroes(state);
    const selectedHeroes = formationHeroes.filter(Boolean);

    if (isRepeat && !canRepeatTowerFloor(state, floorNumber)) {
      return { ok: false, message: "Esse andar ainda nao foi vencido e nao pode ser repetido." };
    }

    const validation = validateTowerBattleStart(state, floorData, selectedHeroes);

    if (!validation.ok) {
      return validation;
    }

    if (!isRepeat && !(options && options.skipEventRoll) && Echoes.planTowerEventForAttempt) {
      const plannedEvent = Echoes.planTowerEventForAttempt(state, { floorNumber, floorData, isBoss: isBossFloor(floorData) });

      if (plannedEvent && plannedEvent.phase === "pre") {
        return {
          ok: true,
          event: true,
          phase: "pre",
          message: plannedEvent.message,
        };
      }
    }

    Echoes.spendResource(state, "energy", Echoes.CONFIG.towerEnergyCost);
    state.lastEnergyAt = Date.now();

    const floorModifiers = getFloorModifierValues(floorData);
    const playerTeam = Echoes.createPlayerTeam(formationHeroes, state);
    const enemyTeam = createEnemiesForFloor(floorNumber);
    const introLines = buildTowerBattleIntro(floorNumber, floorData, playerTeam, enemyTeam, isRepeat);

    applyPreBattleFloorModifiers(playerTeam, floorModifiers);

    if (Echoes.applyAndConsumeTowerBattleEffects) {
      introLines.push(...Echoes.applyAndConsumeTowerBattleEffects(state, playerTeam, floorModifiers));
    }

    const battle = Echoes.runAutoBattle(
      playerTeam,
      enemyTeam,
      introLines,
      floorModifiers
    );

    if (battle.result === "victory") {
      Echoes.addBattleEvent(battle, "victory", `Equipe ${isRepeat ? "repetiu e venceu" : "venceu"} o andar ${floorNumber}.`);
      if (Echoes.recordMissionProgress) {
        Echoes.recordMissionProgress(state, "towerVictories", 1);
      }

      if (isBossFloor(floorData) && playerTeam.every((unit) => unit.hp > 0) && Echoes.recordMissionProgress) {
        Echoes.recordMissionProgress(state, "bossNoCasualtyWins", 1);
        Echoes.addBattleEvent(battle, "reward", "Conquista possivel: chefe vencido sem herois caidos.");
      }

      Echoes.grantTowerVictoryRewards(
        state,
        floorNumber,
        playerTeam.map((unit) => unit.sourceId),
        battle.log,
        battle,
        { advanceFloor: !isRepeat }
      );

      if (!isRepeat && Echoes.activatePlannedTowerPostEvent && Echoes.activatePlannedTowerPostEvent(state, floorNumber)) {
        Echoes.addBattleEvent(battle, "info", "Um evento surgiu depois do combate. Volte para a Torre para decidir.");
      }
    } else {
      Echoes.addBattleEvent(
        battle,
        "defeat",
        `Equipe foi derrotada ${isRepeat ? "ao repetir" : "no"} andar ${floorNumber}. O andar permanece disponivel.`
      );

      if (Echoes.clearPlannedTowerPostEvent) {
        Echoes.clearPlannedTowerPostEvent(state);
      }
    }

    if (Echoes.resolveBattleInjuries) {
      Echoes.resolveBattleInjuries(state, playerTeam, battle.result, battle);
    }

    if (Echoes.applyBattleMoraleChanges) {
      Echoes.applyBattleMoraleChanges(state, playerTeam, battle.result, battle);
    }

    state.lastBattle = Echoes.createBattleResult(
      battle.result,
      floorNumber,
      battle.rounds,
      playerTeam,
      enemyTeam,
      battle.log,
      battle.events
    );
    return state.lastBattle;
  }

  Echoes.ENEMY_ARCHETYPES = ENEMY_ARCHETYPES;
  Echoes.FLOOR_MODIFIERS = FLOOR_MODIFIERS;
  Echoes.TOWER_FLOORS = TOWER_FLOORS;
  Echoes.getFloorData = getFloorData;
  Echoes.getFloorPower = getFloorPower;
  Echoes.getFloorModifierValues = getFloorModifierValues;
  Echoes.getFloorModifierSummary = getFloorModifierSummary;
  Echoes.getHighestCompletedFloor = getHighestCompletedFloor;
  Echoes.canRepeatTowerFloor = canRepeatTowerFloor;
  Echoes.validateTowerBattleStart = validateTowerBattleStart;
  Echoes.isBossFloor = isBossFloor;
  Echoes.createEnemiesForFloor = createEnemiesForFloor;
  Echoes.getFloorReward = getFloorReward;
  Echoes.describeReward = describeReward;
  Echoes.runTowerBattle = runTowerBattle;
})(window);
