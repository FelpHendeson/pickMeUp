(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const ENEMY_DETAILS_UNLOCK_DEFEATS = 3;

  function createLibraryState() {
    return {
      enemies: {},
      bosses: {},
      events: {},
      heroes: {
        classes: {},
        rarities: {},
        traits: {},
      },
    };
  }

  function normalizeLibraryState(state) {
    const fresh = createLibraryState();
    const saved = state.library && typeof state.library === "object" ? state.library : {};

    state.library = {
      enemies: saved.enemies && typeof saved.enemies === "object" ? saved.enemies : {},
      bosses: saved.bosses && typeof saved.bosses === "object" ? saved.bosses : {},
      events: saved.events && typeof saved.events === "object" ? saved.events : {},
      heroes: Object.assign({}, fresh.heroes, saved.heroes || {}),
    };

    state.library.heroes.classes =
      state.library.heroes.classes && typeof state.library.heroes.classes === "object" ? state.library.heroes.classes : {};
    state.library.heroes.rarities =
      state.library.heroes.rarities && typeof state.library.heroes.rarities === "object" ? state.library.heroes.rarities : {};
    state.library.heroes.traits =
      state.library.heroes.traits && typeof state.library.heroes.traits === "object" ? state.library.heroes.traits : {};

    Object.keys(state.library.enemies).forEach((enemyKey) => {
      const record = state.library.enemies[enemyKey] || {};
      state.library.enemies[enemyKey] = {
        key: enemyKey,
        encountered: Math.max(0, Math.floor(Number(record.encountered) || 0)),
        defeated: Math.max(0, Math.floor(Number(record.defeated) || 0)),
        firstFloor: Number.isFinite(record.firstFloor) ? record.firstFloor : null,
        lastFloor: Number.isFinite(record.lastFloor) ? record.lastFloor : null,
        region: typeof record.region === "string" ? record.region : "",
      };
    });

    Object.keys(state.library.bosses).forEach((bossKey) => {
      const record = state.library.bosses[bossKey] || {};
      state.library.bosses[bossKey] = {
        key: bossKey,
        chapterId: typeof record.chapterId === "string" ? record.chapterId : "",
        chapterName: typeof record.chapterName === "string" ? record.chapterName : "",
        attempts: Math.max(0, Math.floor(Number(record.attempts) || 0)),
        defeated: Boolean(record.defeated),
        bestResult: record.bestResult === "victory" ? "victory" : record.bestResult === "defeat" ? "defeat" : "",
        specialReward: typeof record.specialReward === "string" ? record.specialReward : "",
      };
    });

    Object.keys(state.library.events).forEach((eventKey) => {
      const record = state.library.events[eventKey] || {};
      state.library.events[eventKey] = {
        key: eventKey,
        encountered: Math.max(0, Math.floor(Number(record.encountered) || 0)),
        results: Array.isArray(record.results) ? record.results.slice(0, 8) : [],
      };
    });

    (state.heroes || []).forEach((hero) => recordHeroDiscovery(state, hero));
    return state.library;
  }

  function getEnemyDescription(enemyKey, enemy) {
    const descriptions = {
      stoneSlime: "Criatura rochosa lenta que desgasta a linha de frente.",
      duskBat: "Predador veloz que testa a retaguarda.",
      ridgeRaider: "Humano corrompido pela torre, focado em dano direto.",
      markedAcolyte: "Servo marcado que procura alvos feridos.",
      emberHound: "Fera agressiva das regioes bestiais.",
      graveWarden: "Guardiao de cripta com defesa elevada.",
      crystalSeer: "Conjurador que canaliza ecos cristalinos.",
      stormHarpy: "Inimigo rapido que pressiona por velocidade.",
      voidReaver: "Algoz espectral focado em dano pesado.",
      ashImp: "Demonio menor rapido e oportunista.",
      brimstoneBrute: "Tanque infernal que segura a frente.",
      cinderWitch: "Bruxa sombria com foco alto.",
      hellboundKnight: "Cavaleiro infernal de dano consistente.",
    };

    if (enemy && enemy.role === "chefe") return "Chefe de capitulo com atributos elevados e presenca unica.";
    return descriptions[enemyKey] || "Habitante hostil da torre, ainda pouco compreendido.";
  }

  function getEnemyAbilities(enemyKey, enemy) {
    if (enemy && enemy.role === "chefe") return ["Pressao de chefe", "Atributos superiores"];
    if (enemyKey === "markedAcolyte") return ["Prioriza feridos"];
    if (enemy && enemy.role === "veloz") return ["Alta velocidade"];
    if (enemy && enemy.role === "tanque") return ["Alta resistencia"];
    if (enemy && enemy.role === "suporte") return ["Foco elevado"];
    return ["Ataque direto"];
  }

  function getEnemyDrops(enemyKey, enemy) {
    if (enemy && enemy.role === "chefe") return ["Equipamento garantido", "Fragmentos de Eco", "Contrato de Heroi"];
    return ["Ouro", "XP", "Cristais", "Equipamento", "Consumivel raro"];
  }

  function getLibraryEnemyView(state, enemyKey) {
    const enemy = Echoes.ENEMY_ARCHETYPES ? Echoes.ENEMY_ARCHETYPES[enemyKey] : null;
    const record = state.library && state.library.enemies ? state.library.enemies[enemyKey] : null;
    const discovered = Boolean(record && record.encountered > 0);
    const detailsUnlocked = Boolean(record && record.defeated >= ENEMY_DETAILS_UNLOCK_DEFEATS);

    return {
      key: enemyKey,
      discovered,
      detailsUnlocked,
      name: discovered && enemy ? enemy.name : "Desconhecido",
      role: discovered && enemy ? enemy.role : "???",
      description: discovered ? getEnemyDescription(enemyKey, enemy) : "Ainda nao encontrado.",
      region: record && record.region ? record.region : "???",
      stats: detailsUnlocked && enemy ? enemy.stats : null,
      abilities: detailsUnlocked ? getEnemyAbilities(enemyKey, enemy) : [],
      drops: detailsUnlocked ? getEnemyDrops(enemyKey, enemy) : [],
      encountered: record ? record.encountered : 0,
      defeated: record ? record.defeated : 0,
      firstFloor: record ? record.firstFloor : null,
      lastFloor: record ? record.lastFloor : null,
    };
  }

  function recordHeroDiscovery(state, hero) {
    if (!hero) return;
    normalizeLibraryStateShallow(state);

    if (hero.classKey) {
      state.library.heroes.classes[hero.classKey] = {
        key: hero.classKey,
        name: hero.className || hero.classKey,
        count: (state.library.heroes.classes[hero.classKey]?.count || 0) + 0,
        discovered: true,
      };
    }

    if (hero.rarity) {
      const rarityKey = String(hero.rarity);
      state.library.heroes.rarities[rarityKey] = {
        key: rarityKey,
        name: `${hero.rarity} estrela(s)`,
        discovered: true,
      };
    }

    if (hero.traitKey) {
      state.library.heroes.traits[hero.traitKey] = {
        key: hero.traitKey,
        name: hero.traitName || hero.traitKey,
        description: hero.traitDescription || "",
        discovered: true,
      };
    }
  }

  function normalizeLibraryStateShallow(state) {
    if (!state.library) {
      state.library = createLibraryState();
    }
    state.library.heroes = state.library.heroes || { classes: {}, rarities: {}, traits: {} };
    state.library.heroes.classes = state.library.heroes.classes || {};
    state.library.heroes.rarities = state.library.heroes.rarities || {};
    state.library.heroes.traits = state.library.heroes.traits || {};
    state.library.enemies = state.library.enemies || {};
    state.library.bosses = state.library.bosses || {};
    state.library.events = state.library.events || {};
  }

  function recordEnemyEncounter(state, enemyTeam, floorNumber, floorData) {
    normalizeLibraryStateShallow(state);
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;
    const region = chapter ? chapter.name : "";

    (enemyTeam || []).forEach((enemy) => {
      if (!enemy.enemyKey) return;
      const record = state.library.enemies[enemy.enemyKey] || {
        key: enemy.enemyKey,
        encountered: 0,
        defeated: 0,
        firstFloor: floorNumber,
        lastFloor: floorNumber,
        region,
      };

      record.encountered += 1;
      record.firstFloor = record.firstFloor || floorNumber;
      record.lastFloor = floorNumber;
      record.region = record.region || region;
      state.library.enemies[enemy.enemyKey] = record;

      if (enemy.role === "chefe") {
        const boss = state.library.bosses[enemy.enemyKey] || {
          key: enemy.enemyKey,
          chapterId: chapter ? chapter.id : "",
          chapterName: chapter ? chapter.name : "",
          attempts: 0,
          defeated: false,
          bestResult: "",
          specialReward: "",
        };
        boss.attempts += 1;
        boss.chapterId = boss.chapterId || (chapter ? chapter.id : "");
        boss.chapterName = boss.chapterName || (chapter ? chapter.name : "");
        state.library.bosses[enemy.enemyKey] = boss;
      }
    });
  }

  function recordEnemyBattleResult(state, enemyTeam, battleResult, floorNumber) {
    normalizeLibraryStateShallow(state);
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;

    (enemyTeam || []).forEach((enemy) => {
      if (!enemy.enemyKey) return;
      const record = state.library.enemies[enemy.enemyKey];
      if (record && enemy.hp <= 0) record.defeated += 1;

      if (enemy.role === "chefe") {
        const boss = state.library.bosses[enemy.enemyKey] || {};
        boss.bestResult = battleResult === "victory" ? "victory" : boss.bestResult || "defeat";
        boss.defeated = boss.defeated || battleResult === "victory";
        if (boss.defeated && chapter && chapter.completionReward && Echoes.formatLibraryReward) {
          boss.specialReward = Echoes.formatLibraryReward(chapter.completionReward);
        }
        state.library.bosses[enemy.enemyKey] = boss;
      }
    });
  }

  function formatLibraryReward(reward) {
    return Object.keys(reward || {})
      .filter((key) => reward[key] > 0)
      .map((key) => `${reward[key]} ${key}`)
      .join(", ");
  }

  function recordTowerEventDiscovery(state, event, choice, message) {
    normalizeLibraryStateShallow(state);
    if (!event || !event.typeKey) return;

    const record = state.library.events[event.typeKey] || {
      key: event.typeKey,
      encountered: 0,
      results: [],
    };
    record.encountered += 1;

    const result = choice && choice.label ? choice.label : message || "Resultado observado";
    if (result && !record.results.includes(result)) {
      record.results.push(result);
      record.results = record.results.slice(0, 8);
    }

    state.library.events[event.typeKey] = record;
  }

  Echoes.ENEMY_DETAILS_UNLOCK_DEFEATS = ENEMY_DETAILS_UNLOCK_DEFEATS;
  Echoes.createLibraryState = createLibraryState;
  Echoes.normalizeLibraryState = normalizeLibraryState;
  Echoes.getLibraryEnemyView = getLibraryEnemyView;
  Echoes.recordEnemyEncounter = recordEnemyEncounter;
  Echoes.recordEnemyBattleResult = recordEnemyBattleResult;
  Echoes.recordTowerEventDiscovery = recordTowerEventDiscovery;
  Echoes.recordHeroDiscovery = recordHeroDiscovery;
  Echoes.formatLibraryReward = formatLibraryReward;
})(window);
