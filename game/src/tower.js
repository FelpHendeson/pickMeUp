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
      rewardHint: "Chance de equipamento futuro",
    },
    {
      floor: 6,
      title: "Circulo da Marca",
      recommendedLevel: 3,
      mechanic: "Marca",
      enemyKeys: ["markedAcolyte", "markedAcolyte", "stoneSlime"],
      modifier: "Maldição leve: inimigos focam alvos feridos.",
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
      rewardHint: "Chance de equipamento incomum futuro",
    },
    {
      floor: 10,
      title: "Nucleo do Golem",
      recommendedLevel: 5,
      mechanic: "Chefe",
      enemyKeys: ["ironGolem", "markedAcolyte"],
      modifier: "Chefe de marco: vitoria desbloqueia a Oficina.",
      rewardHint: "Ouro, cristais e Oficina",
    },
  ];

  function getFloorData(floorNumber) {
    return TOWER_FLOORS.find((floor) => floor.floor === floorNumber) || null;
  }

  function getFloorPower(floorNumber) {
    return Math.round(80 + floorNumber * 35 + Math.pow(floorNumber, 1.25) * 10);
  }

  function scaleEnemyStats(baseStats, floorNumber, isBoss) {
    const floorScale = 0.75 + floorNumber * 0.12;
    const bossScale = isBoss ? 1.18 : 1;

    return Object.keys(baseStats).reduce((stats, key) => {
      const value = baseStats[key] * floorScale * bossScale;
      stats[key] = Math.max(1, Math.round(value));
      return stats;
    }, {});
  }

  function createEnemyUnit(enemyKey, floorNumber, index) {
    const archetype = ENEMY_ARCHETYPES[enemyKey] || ENEMY_ARCHETYPES.stoneSlime;
    const isBoss = archetype.role === "chefe" || floorNumber === 10;
    const stats = scaleEnemyStats(archetype.stats, floorNumber, isBoss);

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
      energy: floorNumber >= 9 ? 25 : 0,
      statuses: {},
      position: isBoss ? "front" : index < 2 ? "front" : "back",
    };
  }

  function createEnemiesForFloor(floorNumber) {
    const floorData = getFloorData(floorNumber);
    if (!floorData) return [];

    return floorData.enemyKeys.map((enemyKey, index) => createEnemyUnit(enemyKey, floorNumber, index));
  }

  function getFloorReward(floorNumber) {
    return {
      gold: 50 + floorNumber * 15,
      xp: 30 + floorNumber * 10,
      energyRefund: 3,
      crystalChance: Math.min(0.1 + floorNumber * 0.015, 0.28),
      crystalAmount: 8 + floorNumber * 2,
      essence: floorNumber === 6 ? 15 : floorNumber === 10 ? 20 : 0,
      fragments: floorNumber === 7 ? 15 : floorNumber === 10 ? 20 : 0,
      equipmentChance: Math.min(5 + floorNumber * 0.5, 35) / 100,
      guaranteedEquipment: floorNumber === 5 || floorNumber === 9 || floorNumber === 10,
    };
  }

  function describeReward(floorNumber) {
    const reward = getFloorReward(floorNumber);
    const parts = [`${reward.gold} ouro`, `${reward.xp} XP por heroi`, `${reward.energyRefund} energia recuperada`];

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
      return { ok: false, message: "A torre inicial ja foi concluida." };
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

  function buildTowerBattleIntro(floorNumber, floorData, playerTeam, enemyTeam, isRepeat) {
    return [
      `${isRepeat ? "Repeticao do andar" : "Andar"} ${floorNumber}: ${floorData.title}.`,
      `Equipe entrou com ${playerTeam.length} heroi(s). Inimigos: ${enemyTeam.map((enemy) => enemy.name).join(", ")}.`,
    ];
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

    Echoes.spendResource(state, "energy", Echoes.CONFIG.towerEnergyCost);
    state.lastEnergyAt = Date.now();

    const playerTeam = Echoes.createPlayerTeam(formationHeroes, state);
    const enemyTeam = createEnemiesForFloor(floorNumber);
    const battle = Echoes.runAutoBattle(playerTeam, enemyTeam, buildTowerBattleIntro(floorNumber, floorData, playerTeam, enemyTeam, isRepeat));

    if (battle.result === "victory") {
      Echoes.addBattleEvent(battle, "victory", `Equipe ${isRepeat ? "repetiu e venceu" : "venceu"} o andar ${floorNumber}.`);
      Echoes.grantTowerVictoryRewards(
        state,
        floorNumber,
        playerTeam.map((unit) => unit.sourceId),
        battle.log,
        battle,
        { advanceFloor: !isRepeat }
      );
    } else {
      Echoes.addBattleEvent(
        battle,
        "defeat",
        `Equipe foi derrotada ${isRepeat ? "ao repetir" : "no"} andar ${floorNumber}. O andar permanece disponivel.`
      );
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
  Echoes.TOWER_FLOORS = TOWER_FLOORS;
  Echoes.getFloorData = getFloorData;
  Echoes.getFloorPower = getFloorPower;
  Echoes.getHighestCompletedFloor = getHighestCompletedFloor;
  Echoes.canRepeatTowerFloor = canRepeatTowerFloor;
  Echoes.createEnemiesForFloor = createEnemiesForFloor;
  Echoes.getFloorReward = getFloorReward;
  Echoes.describeReward = describeReward;
  Echoes.runTowerBattle = runTowerBattle;
})(window);
