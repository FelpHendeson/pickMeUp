(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const STAT_KEYS = ["hp", "atk", "def", "spd", "focus", "luck"];

  const HERO_CLASSES = {
    warrior: {
      name: "Guerreiro",
      role: "frente",
      base: { hp: 118, atk: 20, def: 10, spd: 8, focus: 7, luck: 5 },
      growth: { hp: 14, atk: 3, def: 2, spd: 0.45, focus: 0.5, luck: 0.35 },
    },
    archer: {
      name: "Arqueiro",
      role: "tras",
      base: { hp: 86, atk: 24, def: 6, spd: 11, focus: 8, luck: 8 },
      growth: { hp: 9, atk: 3.4, def: 1.1, spd: 0.7, focus: 0.65, luck: 0.6 },
    },
    mage: {
      name: "Mago",
      role: "tras",
      base: { hp: 78, atk: 28, def: 5, spd: 8, focus: 12, luck: 6 },
      growth: { hp: 8, atk: 4, def: 0.9, spd: 0.45, focus: 0.9, luck: 0.45 },
    },
    priest: {
      name: "Sacerdote",
      role: "tras",
      base: { hp: 92, atk: 16, def: 7, spd: 9, focus: 13, luck: 7 },
      growth: { hp: 10, atk: 2.4, def: 1.2, spd: 0.5, focus: 1, luck: 0.5 },
    },
    rogue: {
      name: "Ladino",
      role: "tras",
      base: { hp: 82, atk: 23, def: 6, spd: 13, focus: 8, luck: 12 },
      growth: { hp: 8.5, atk: 3.3, def: 1, spd: 0.9, focus: 0.6, luck: 0.9 },
    },
    guardian: {
      name: "Guardiao",
      role: "frente",
      base: { hp: 132, atk: 16, def: 14, spd: 6, focus: 6, luck: 4 },
      growth: { hp: 16, atk: 2.2, def: 2.7, spd: 0.3, focus: 0.4, luck: 0.25 },
    },
  };

  const TRAITS = {
    brave: {
      name: "Corajoso",
      description: "+8% ATK",
      multipliers: { atk: 1.08 },
      xpMultiplier: 1,
    },
    cautious: {
      name: "Cauteloso",
      description: "+8% DEF",
      multipliers: { def: 1.08 },
      xpMultiplier: 1,
    },
    ambitious: {
      name: "Ambicioso",
      description: "+15% XP ganho",
      multipliers: {},
      xpMultiplier: 1.15,
    },
    loyal: {
      name: "Leal",
      description: "+6% HP",
      multipliers: { hp: 1.06 },
      xpMultiplier: 1,
    },
    unstable: {
      name: "Instavel",
      description: "+12% ATK, -8% DEF",
      multipliers: { atk: 1.12, def: 0.92 },
      xpMultiplier: 1,
    },
  };

  const GIVEN_NAMES = [
    "Arel",
    "Bryn",
    "Ciro",
    "Dara",
    "Elian",
    "Fayne",
    "Galen",
    "Hedra",
    "Iria",
    "Joren",
    "Luma",
    "Marek",
    "Nara",
    "Orin",
    "Pavel",
    "Runa",
    "Soren",
    "Talia",
    "Varek",
    "Ysol",
  ];

  const EPITHETS = [
    "do Eco",
    "da Brasa",
    "da Vigilia",
    "do Vau",
    "da Lua Fria",
    "do Juramento",
    "da Cinza",
    "do Vale",
    "da Lamina",
    "do Farol",
  ];

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createHeroId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return `hero_${global.crypto.randomUUID()}`;
    }

    return `hero_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getMaxLevelForRarity(rarity) {
    return rarity * 10;
  }

  function getHeroXpForNextLevel(level) {
    return Math.floor(100 * level * 1.15);
  }

  function createStatRolls() {
    return STAT_KEYS.reduce((rolls, key) => {
      rolls[key] = Number(randomBetween(0.92, 1.08).toFixed(3));
      return rolls;
    }, {});
  }

  function getRarityMultiplier(rarity) {
    return 0.88 + rarity * 0.16;
  }

  function recalculateHeroStats(hero) {
    const heroClass = HERO_CLASSES[hero.classKey] || HERO_CLASSES.warrior;
    const trait = TRAITS[hero.traitKey] || TRAITS.brave;
    const statRolls = hero.statRolls || createStatRolls();
    const rarityMultiplier = getRarityMultiplier(hero.rarity);
    const level = Math.max(1, hero.level || 1);

    hero.statRolls = statRolls;
    hero.stats = STAT_KEYS.reduce((stats, statKey) => {
      const baseValue = heroClass.base[statKey] + heroClass.growth[statKey] * (level - 1);
      const traitMultiplier = trait.multipliers[statKey] || 1;
      stats[statKey] = Math.max(1, Math.round(baseValue * rarityMultiplier * statRolls[statKey] * traitMultiplier));
      return stats;
    }, {});

    hero.maxLevel = getMaxLevelForRarity(hero.rarity);
    return hero;
  }

  function generateHero(options) {
    const rarity = options && options.rarity ? options.rarity : 1;
    const classKey = options && options.classKey ? options.classKey : pickRandom(Object.keys(HERO_CLASSES));
    const traitKey = options && options.traitKey ? options.traitKey : pickRandom(Object.keys(TRAITS));
    const name = `${pickRandom(GIVEN_NAMES)} ${pickRandom(EPITHETS)}`;

    const hero = {
      id: createHeroId(),
      name,
      rarity,
      classKey,
      className: HERO_CLASSES[classKey].name,
      level: 1,
      xp: 0,
      maxLevel: getMaxLevelForRarity(rarity),
      statRolls: createStatRolls(),
      stats: {},
      traitKey,
      traitName: TRAITS[traitKey].name,
      traitDescription: TRAITS[traitKey].description,
      equipment: {
        weapon: null,
        armor: null,
        accessory: null,
      },
    };

    return recalculateHeroStats(hero);
  }

  function normalizeHero(hero) {
    const normalized = Object.assign(
      {
        rarity: 1,
        classKey: "warrior",
        level: 1,
        xp: 0,
        traitKey: "brave",
        statRolls: createStatRolls(),
        equipment: { weapon: null, armor: null, accessory: null },
      },
      hero || {}
    );

    normalized.className = HERO_CLASSES[normalized.classKey]?.name || HERO_CLASSES.warrior.name;
    normalized.traitName = TRAITS[normalized.traitKey]?.name || TRAITS.brave.name;
    normalized.traitDescription = TRAITS[normalized.traitKey]?.description || TRAITS.brave.description;
    if (Echoes.normalizeHeroEquipmentSlots) {
      Echoes.normalizeHeroEquipmentSlots(normalized);
    }

    return recalculateHeroStats(normalized);
  }

  function addHeroXp(hero, xpAmount) {
    const trait = TRAITS[hero.traitKey] || TRAITS.brave;
    const gainedXp = Math.max(0, Math.floor(xpAmount * trait.xpMultiplier));
    const levelUps = [];

    hero.xp += gainedXp;

    while (hero.level < hero.maxLevel && hero.xp >= getHeroXpForNextLevel(hero.level)) {
      hero.xp -= getHeroXpForNextLevel(hero.level);
      hero.level += 1;
      recalculateHeroStats(hero);
      levelUps.push(hero.level);
    }

    if (hero.level >= hero.maxLevel) {
      hero.xp = Math.min(hero.xp, getHeroXpForNextLevel(hero.level) - 1);
    }

    return {
      gainedXp,
      levelUps,
    };
  }

  function getHeroPower(hero, state) {
    const stats = state && Echoes.getHeroEffectiveStats ? Echoes.getHeroEffectiveStats(state, hero) : hero.stats || {};
    return Math.round(
      stats.hp * 0.3 + stats.atk * 4 + stats.def * 3 + stats.spd * 5 + stats.focus * 2 + stats.luck
    );
  }

  function getRarityStars(rarity) {
    return "★".repeat(rarity) + "☆".repeat(Math.max(0, 5 - rarity));
  }

  Echoes.HERO_CLASSES = HERO_CLASSES;
  Echoes.TRAITS = TRAITS;
  Echoes.generateHero = generateHero;
  Echoes.normalizeHero = normalizeHero;
  Echoes.addHeroXp = addHeroXp;
  Echoes.getHeroPower = getHeroPower;
  Echoes.getHeroXpForNextLevel = getHeroXpForNextLevel;
  Echoes.getRarityStars = getRarityStars;
})(window);
