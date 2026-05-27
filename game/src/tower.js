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
    ashImp: {
      name: "Diabrete de Cinzas",
      role: "veloz",
      stats: { hp: 82, atk: 24, def: 7, spd: 16, focus: 10, luck: 12 },
    },
    brimstoneBrute: {
      name: "Brutamontes de Enxofre",
      role: "tanque",
      stats: { hp: 138, atk: 27, def: 17, spd: 6, focus: 8, luck: 5 },
    },
    cinderWitch: {
      name: "Bruxa da Cinza",
      role: "suporte",
      stats: { hp: 94, atk: 24, def: 9, spd: 11, focus: 20, luck: 9 },
    },
    hellboundKnight: {
      name: "Cavaleiro Acorrentado",
      role: "dano",
      stats: { hp: 122, atk: 32, def: 14, spd: 10, focus: 12, luck: 8 },
    },
    abyssalSerpent: {
      name: "Serpente Abissal",
      role: "chefe",
      stats: { hp: 560, atk: 43, def: 24, spd: 12, focus: 24, luck: 12 },
    },
  };

  const TOWER_CHAPTERS = [
    {
      id: "awakening_ruins",
      number: 1,
      name: "Ruinas do Despertar",
      description: "Pedras antigas, ecos fracos e os primeiros sinais da torre consciente.",
      theme: "Runas antigas e corredores quebrados",
      tone: "ruins",
      startFloor: 1,
      endFloor: 10,
      predominantEnemies: ["Slimes de pedra", "Morcegos sombrios", "Saqueadores", "Acolitos marcados"],
      specificEvents: ["Fonte de cura", "Bau misterioso", "Prisioneiro"],
      eventKeys: {
        pre: ["healingFountain", "mysteryChest", "prisoner", "trap"],
        post: ["healingFountain", "mysteryChest", "prisoner"],
      },
      finalBoss: "Golem Antigo",
      regionalModifier: {
        label: "Pedra desperta",
        description: "DEF inimiga +4%",
        enemyDefMultiplier: 1.04,
      },
      completionReward: { gold: 420, crystals: 60, essence: 25, fragments: 25 },
    },
    {
      id: "bestial_forest",
      number: 2,
      name: "Floresta Bestial",
      description: "Raizes invadem a torre e criaturas famintas perseguem qualquer ruido.",
      theme: "Vegetacao escura, feras e emboscadas",
      tone: "forest",
      startFloor: 11,
      endFloor: 20,
      predominantEnemies: ["Sabuesos de brasa", "Harpias", "Vigias tumulares", "Videntes cristalinos"],
      specificEvents: ["Armadilha", "Prisioneiro", "Mercador perdido"],
      eventKeys: {
        pre: ["trap", "prisoner", "lostMerchant", "mysteryChest"],
        post: ["prisoner", "lostMerchant", "mysteryChest"],
      },
      finalBoss: "Oraculo Estilhacado",
      regionalModifier: {
        label: "Cacada viva",
        description: "SPD inimiga +6%",
        enemySpeedMultiplier: 1.06,
      },
      completionReward: { gold: 760, crystals: 90, essence: 45, fragments: 45 },
    },
    {
      id: "spectral_crypt",
      number: 3,
      name: "Cripta Espectral",
      description: "A torre mergulha em corredores frios, marcas e ecos de mortos inquietos.",
      theme: "Criptas, espectros e marcas sombrias",
      tone: "crypt",
      startFloor: 21,
      endFloor: 30,
      predominantEnemies: ["Ceifadores do vazio", "Vigias tumulares", "Harpias", "Oraculos"],
      specificEvents: ["Altar sombrio", "Fonte de cura", "Bau misterioso"],
      eventKeys: {
        pre: ["darkAltar", "healingFountain", "mysteryChest", "trap"],
        post: ["darkAltar", "healingFountain", "mysteryChest"],
      },
      finalBoss: "Avatar do Eclipse",
      regionalModifier: {
        label: "Assombro persistente",
        description: "equipe recebe +7% dano",
        playerDamageTakenMultiplier: 1.07,
      },
      completionReward: { gold: 1150, crystals: 130, essence: 70, fragments: 70 },
    },
    {
      id: "infernal_abyss",
      number: 4,
      name: "Abismo Infernal",
      description: "A torre abre uma fenda ardente onde correntes, cinzas e demonios testam a equipe.",
      theme: "Fogo negro, correntes e abismos vivos",
      tone: "abyss",
      startFloor: 31,
      endFloor: 40,
      predominantEnemies: ["Diabretes", "Brutamontes de enxofre", "Bruxas da cinza", "Cavaleiros acorrentados"],
      specificEvents: ["Altar sombrio", "Armadilha", "Mercador perdido"],
      eventKeys: {
        pre: ["darkAltar", "trap", "lostMerchant", "mysteryChest"],
        post: ["darkAltar", "trap", "lostMerchant"],
      },
      finalBoss: "Serpente Abissal",
      regionalModifier: {
        label: "Calor infernal",
        description: "ATK inimigo +8% e curas da equipe -8%",
        enemyAtkMultiplier: 1.08,
        healingDoneMultiplier: 0.92,
      },
      completionReward: { gold: 1600, crystals: 180, essence: 100, fragments: 100 },
    },
  ];

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
    {
      floor: 31,
      title: "Portao de Enxofre",
      recommendedLevel: 16,
      mechanic: "Pressao inicial",
      enemyKeys: ["ashImp", "ashImp", "brimstoneBrute"],
      modifierKeys: ["fastEnemies"],
      rewardHint: "Ouro e XP",
    },
    {
      floor: 32,
      title: "Pontes de Correntes",
      recommendedLevel: 16,
      mechanic: "Dano focado",
      enemyKeys: ["hellboundKnight", "ashImp", "ashImp"],
      modifierKeys: ["exposedTeam"],
      rewardHint: "Cristais",
    },
    {
      floor: 33,
      title: "Caldeirao das Cinzas",
      recommendedLevel: 17,
      mechanic: "Suporte infernal",
      enemyKeys: ["cinderWitch", "brimstoneBrute", "ashImp"],
      modifierKeys: ["reducedHealing"],
      rewardHint: "Essencia",
    },
    {
      floor: 34,
      title: "Muralha de Ossos Quentes",
      recommendedLevel: 17,
      mechanic: "Defesa alta",
      enemyKeys: ["brimstoneBrute", "brimstoneBrute", "cinderWitch"],
      modifierKeys: ["drainedStart"],
      rewardHint: "Fragmentos",
    },
    {
      floor: 35,
      title: "Arena dos Acorrentados",
      recommendedLevel: 18,
      mechanic: "Elite",
      enemyKeys: ["hellboundKnight", "hellboundKnight", "brimstoneBrute"],
      modifierKeys: ["exposedTeam", "fastEnemies"],
      rewardHint: "Equipamento garantido",
    },
    {
      floor: 36,
      title: "Forno Sem Ceu",
      recommendedLevel: 18,
      mechanic: "Cura pressionada",
      enemyKeys: ["cinderWitch", "ashImp", "hellboundKnight", "ashImp"],
      modifierKeys: ["reducedHealing", "fastEnemies"],
      rewardHint: "Cristais",
    },
    {
      floor: 37,
      title: "Desfiladeiro Rubro",
      recommendedLevel: 19,
      mechanic: "Ataques pesados",
      enemyKeys: ["hellboundKnight", "brimstoneBrute", "hellboundKnight"],
      modifierKeys: ["exposedTeam"],
      rewardHint: "XP alto",
    },
    {
      floor: 38,
      title: "Capela da Brasa Negra",
      recommendedLevel: 19,
      mechanic: "Marca e suporte",
      enemyKeys: ["cinderWitch", "markedAcolyte", "brimstoneBrute", "ashImp"],
      modifierKeys: ["reducedHealing", "drainedStart"],
      rewardHint: "Ouro alto",
    },
    {
      floor: 39,
      title: "Limiar do Abismo",
      recommendedLevel: 20,
      mechanic: "Teste final",
      enemyKeys: ["ashImp", "hellboundKnight", "cinderWitch", "brimstoneBrute"],
      modifierKeys: ["fastEnemies", "exposedTeam", "reducedHealing"],
      rewardHint: "Chance muito alta de equipamento",
    },
    {
      floor: 40,
      title: "Garganta da Serpente",
      recommendedLevel: 20,
      mechanic: "Chefe: veneno abissal",
      enemyKeys: ["abyssalSerpent", "cinderWitch", "hellboundKnight"],
      modifierKeys: ["drainedStart", "exposedTeam", "reducedHealing"],
      modifier: "Chefe final do Abismo: a Serpente pressiona toda a equipe com ataques brutais.",
      rewardHint: "Grande recompensa final do capitulo",
    },
  ];

  function getFloorData(floorNumber) {
    return TOWER_FLOORS.find((floor) => floor.floor === floorNumber) || null;
  }

  function getTowerChapterByFloor(floorNumber) {
    return TOWER_CHAPTERS.find((chapter) => floorNumber >= chapter.startFloor && floorNumber <= chapter.endFloor) || TOWER_CHAPTERS[TOWER_CHAPTERS.length - 1];
  }

  function getTowerChapterById(chapterId) {
    return TOWER_CHAPTERS.find((chapter) => chapter.id === chapterId) || null;
  }

  function getCompletedTowerChapterIds(state) {
    const completed = new Set(Array.isArray(state.completedTowerChapters) ? state.completedTowerChapters : []);
    const currentFloor = Number(state.towerFloor) || 1;

    TOWER_CHAPTERS.forEach((chapter) => {
      if (currentFloor > chapter.endFloor) {
        completed.add(chapter.id);
      }
    });

    return Array.from(completed);
  }

  function isTowerChapterCompleted(state, chapterId) {
    return getCompletedTowerChapterIds(state).includes(chapterId);
  }

  function getChapterEventKeys(floorNumber, phase, fallbackKeys) {
    const chapter = getTowerChapterByFloor(floorNumber);
    const keys = chapter && chapter.eventKeys && chapter.eventKeys[phase];
    return Array.isArray(keys) && keys.length > 0 ? keys : fallbackKeys;
  }

  function getFloorPower(floorNumber) {
    return Math.round(90 + floorNumber * 42 + Math.pow(floorNumber, 1.18) * 15 + Math.max(0, floorNumber - 10) * 18);
  }

  function getFloorModifierValues(floorData) {
    const modifierKeys = (floorData && floorData.modifierKeys) || [];
    const chapter = floorData ? getTowerChapterByFloor(floorData.floor) : null;

    const modifiers = modifierKeys.reduce(
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
        enemyAtkMultiplier: 1,
        enemyDefMultiplier: 1,
        enemyHpMultiplier: 1,
        enemyFocusMultiplier: 1,
      }
    );

    if (chapter && chapter.regionalModifier) {
      const regional = chapter.regionalModifier;
      modifiers.keys.push(`chapter_${chapter.id}`);
      modifiers.labels.push(regional.label);
      modifiers.descriptions.push(regional.description);
      modifiers.healingDoneMultiplier *= regional.healingDoneMultiplier || 1;
      modifiers.enemySpeedMultiplier *= regional.enemySpeedMultiplier || 1;
      modifiers.enemyAtkMultiplier *= regional.enemyAtkMultiplier || 1;
      modifiers.enemyDefMultiplier *= regional.enemyDefMultiplier || 1;
      modifiers.enemyHpMultiplier *= regional.enemyHpMultiplier || 1;
      modifiers.enemyFocusMultiplier *= regional.enemyFocusMultiplier || 1;
      modifiers.playerDamageTakenMultiplier *= regional.playerDamageTakenMultiplier || 1;
      modifiers.playerInitialEnergyPenalty += regional.playerInitialEnergyPenalty || 0;
    }

    return modifiers;
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

    stats.hp = Math.max(1, Math.round(stats.hp * (modifiers.enemyHpMultiplier || 1)));
    stats.atk = Math.max(1, Math.round(stats.atk * (modifiers.enemyAtkMultiplier || 1)));
    stats.def = Math.max(1, Math.round(stats.def * (modifiers.enemyDefMultiplier || 1)));
    stats.focus = Math.max(1, Math.round(stats.focus * (modifiers.enemyFocusMultiplier || 1)));

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
    const chapter = getTowerChapterByFloor(floorNumber);
    const bossFloor = chapter && floorNumber === chapter.endFloor;
    const milestoneFloor =
      floorNumber === 5 ||
      floorNumber === 9 ||
      floorNumber === 15 ||
      floorNumber === 19 ||
      floorNumber === 25 ||
      floorNumber === 29 ||
      floorNumber === 35 ||
      floorNumber === 39;

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

  function isChapterFinalFloor(floorNumber) {
    const chapter = getTowerChapterByFloor(floorNumber);
    return Boolean(chapter && chapter.endFloor === floorNumber);
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
  Echoes.TOWER_CHAPTERS = TOWER_CHAPTERS;
  Echoes.TOWER_FLOORS = TOWER_FLOORS;
  Echoes.getFloorData = getFloorData;
  Echoes.getTowerChapterByFloor = getTowerChapterByFloor;
  Echoes.getTowerChapterById = getTowerChapterById;
  Echoes.getCompletedTowerChapterIds = getCompletedTowerChapterIds;
  Echoes.isTowerChapterCompleted = isTowerChapterCompleted;
  Echoes.getChapterEventKeys = getChapterEventKeys;
  Echoes.getFloorPower = getFloorPower;
  Echoes.getFloorModifierValues = getFloorModifierValues;
  Echoes.getFloorModifierSummary = getFloorModifierSummary;
  Echoes.getHighestCompletedFloor = getHighestCompletedFloor;
  Echoes.canRepeatTowerFloor = canRepeatTowerFloor;
  Echoes.validateTowerBattleStart = validateTowerBattleStart;
  Echoes.isBossFloor = isBossFloor;
  Echoes.isChapterFinalFloor = isChapterFinalFloor;
  Echoes.createEnemiesForFloor = createEnemiesForFloor;
  Echoes.getFloorReward = getFloorReward;
  Echoes.describeReward = describeReward;
  Echoes.runTowerBattle = runTowerBattle;
})(window);
