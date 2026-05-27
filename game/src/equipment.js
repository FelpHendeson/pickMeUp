(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const EQUIPMENT_TYPES = {
    weapon: "Arma",
    armor: "Armadura",
    accessory: "Acessorio",
  };

  const EQUIPMENT_BONUS_STATS = ["atk", "def", "hp", "spd", "luck"];
  const EQUIPMENT_SLOTS = Object.keys(EQUIPMENT_TYPES);

  const EQUIPMENT_NAME_PARTS = {
    weapon: ["Lamina", "Arco", "Cajado", "Martelo", "Punhal"],
    armor: ["Cota", "Manto", "Couraca", "Veste", "Escudo"],
    accessory: ["Anel", "Amuleto", "Selo", "Talisma", "Broche"],
  };

  const EQUIPMENT_EPITHETS = ["do Eco", "da Vigilia", "da Brasa", "do Vale", "da Torre", "da Cinza"];

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function createEquipmentId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return `eq_${global.crypto.randomUUID()}`;
    }

    return `eq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getEquipmentRarityForFloor(floorNumber) {
    const roll = Math.random();

    if (floorNumber >= 30 && roll < 0.1) return 4;
    if (floorNumber >= 20 && roll < 0.24) return 3;
    if (floorNumber >= 11 && roll < 0.36) return 2;
    if (floorNumber >= 9 && roll < 0.08) return 3;
    if (floorNumber >= 5 && roll < 0.28) return 2;
    return 1;
  }

  function getEquipmentBonusValue(statKey, rarity, floorNumber) {
    const baseByStat = {
      hp: 18,
      atk: 4,
      def: 3,
      spd: 1,
      luck: 2,
    };
    const floorScale = 1 + floorNumber * 0.08;
    const rarityScale = 0.8 + rarity * 0.55;

    return Math.max(1, Math.round((baseByStat[statKey] || 2) * floorScale * rarityScale));
  }

  function createEquipmentName(type, rarity) {
    const prefix = rarity >= 3 ? "Raro" : rarity === 2 ? "Reforcado" : "Simples";
    return `${pickRandom(EQUIPMENT_NAME_PARTS[type])} ${prefix} ${pickRandom(EQUIPMENT_EPITHETS)}`;
  }

  function generateEquipment(floorNumber) {
    const type = pickRandom(EQUIPMENT_SLOTS);
    const rarity = getEquipmentRarityForFloor(floorNumber);
    const bonusStat = pickRandom(EQUIPMENT_BONUS_STATS);

    return {
      id: createEquipmentId(),
      name: createEquipmentName(type, rarity),
      type,
      rarity,
      bonusStat,
      bonusValue: getEquipmentBonusValue(bonusStat, rarity, floorNumber),
      obtainedAt: new Date().toISOString(),
    };
  }

  function normalizeEquipmentItem(item) {
    const rawItem = item || {};
    const type = EQUIPMENT_TYPES[rawItem.type] ? rawItem.type : "weapon";
    const rarity = Number.isFinite(rawItem.rarity) ? Math.min(5, Math.max(1, rawItem.rarity)) : 1;
    const bonusStat = EQUIPMENT_BONUS_STATS.includes(rawItem.bonusStat) ? rawItem.bonusStat : "atk";
    const bonusValue = Number.isFinite(rawItem.bonusValue) ? Math.max(1, Math.round(rawItem.bonusValue)) : 1;

    return Object.assign(
      {
        id: createEquipmentId(),
        name: createEquipmentName(type, rarity),
        type,
        rarity,
        bonusStat,
        bonusValue,
        obtainedAt: new Date().toISOString(),
      },
      rawItem,
      { type, rarity, bonusStat, bonusValue }
    );
  }

  function normalizeHeroEquipmentSlots(hero) {
    hero.equipment = Object.assign({ weapon: null, armor: null, accessory: null }, hero.equipment || {});
    EQUIPMENT_SLOTS.forEach((slot) => {
      if (typeof hero.equipment[slot] !== "string") {
        hero.equipment[slot] = null;
      }
    });
    return hero;
  }

  function normalizeInventory(state) {
    state.inventory = Array.isArray(state.inventory) ? state.inventory.map(normalizeEquipmentItem) : [];

    const ownedItemIds = new Set(state.inventory.map((item) => item.id));
    state.heroes.forEach((hero) => {
      normalizeHeroEquipmentSlots(hero);
      EQUIPMENT_SLOTS.forEach((slot) => {
        if (hero.equipment[slot] && !ownedItemIds.has(hero.equipment[slot])) {
          hero.equipment[slot] = null;
        }
      });
    });

    return state.inventory;
  }

  function findEquipment(state, equipmentId) {
    return (state.inventory || []).find((item) => item.id === equipmentId) || null;
  }

  function findEquipmentOwner(state, equipmentId) {
    return state.heroes.find((hero) => {
      normalizeHeroEquipmentSlots(hero);
      return EQUIPMENT_SLOTS.some((slot) => hero.equipment[slot] === equipmentId);
    }) || null;
  }

  function getEquippedItems(state, hero) {
    normalizeHeroEquipmentSlots(hero);
    return EQUIPMENT_SLOTS.reduce((items, slot) => {
      const item = hero.equipment[slot] ? findEquipment(state, hero.equipment[slot]) : null;
      if (item) items[slot] = item;
      return items;
    }, {});
  }

  function getHeroEffectiveStats(state, hero) {
    const stats = Object.assign({}, hero.stats || {});
    const equippedItems = state ? getEquippedItems(state, hero) : {};

    Object.values(equippedItems).forEach((item) => {
      stats[item.bonusStat] = Math.max(1, Math.round((stats[item.bonusStat] || 0) + item.bonusValue));
    });

    if (Echoes.applyHeroInjuryModifiers) {
      Echoes.applyHeroInjuryModifiers(stats, hero);
    }

    if (Echoes.applyHeroMoraleModifiers) {
      Echoes.applyHeroMoraleModifiers(stats, hero);
    }

    return stats;
  }

  function getHeroPowerWithEquipment(state, hero) {
    const stats = getHeroEffectiveStats(state, hero);
    return Math.round(
      stats.hp * 0.3 + stats.atk * 4 + stats.def * 3 + stats.spd * 5 + stats.focus * 2 + stats.luck
    );
  }

  function equipItem(state, heroId, equipmentId) {
    const hero = Echoes.findHero(state, heroId);
    const item = findEquipment(state, equipmentId);

    if (!hero) return { ok: false, message: "Heroi nao encontrado." };
    if (!item) return { ok: false, message: "Equipamento nao encontrado." };

    normalizeHeroEquipmentSlots(hero);

    const previousOwner = findEquipmentOwner(state, equipmentId);
    if (previousOwner) {
      normalizeHeroEquipmentSlots(previousOwner);
      previousOwner.equipment[item.type] = null;
    }

    hero.equipment[item.type] = item.id;
    return { ok: true, message: `${item.name} equipado em ${hero.name}.` };
  }

  function unequipItem(state, heroId, slot) {
    const hero = Echoes.findHero(state, heroId);
    if (!hero) return { ok: false, message: "Heroi nao encontrado." };
    if (!EQUIPMENT_TYPES[slot]) return { ok: false, message: "Slot invalido." };

    normalizeHeroEquipmentSlots(hero);

    if (!hero.equipment[slot]) {
      return { ok: false, message: "Nao ha equipamento nesse slot." };
    }

    const item = findEquipment(state, hero.equipment[slot]);
    hero.equipment[slot] = null;

    return { ok: true, message: `${item ? item.name : "Equipamento"} removido de ${hero.name}.` };
  }

  function addEquipmentToInventory(state, item) {
    const normalizedItem = normalizeEquipmentItem(item);
    state.inventory.push(normalizedItem);
    return normalizedItem;
  }

  function getEquipmentTypeName(type) {
    return EQUIPMENT_TYPES[type] || type;
  }

  function getEquipmentBonusLabel(item) {
    return `${item.bonusStat.toUpperCase()} +${item.bonusValue}`;
  }

  Echoes.EQUIPMENT_TYPES = EQUIPMENT_TYPES;
  Echoes.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;
  Echoes.generateEquipment = generateEquipment;
  Echoes.normalizeHeroEquipmentSlots = normalizeHeroEquipmentSlots;
  Echoes.normalizeInventory = normalizeInventory;
  Echoes.findEquipment = findEquipment;
  Echoes.findEquipmentOwner = findEquipmentOwner;
  Echoes.getEquippedItems = getEquippedItems;
  Echoes.getHeroEffectiveStats = getHeroEffectiveStats;
  Echoes.getHeroPowerWithEquipment = getHeroPowerWithEquipment;
  Echoes.equipItem = equipItem;
  Echoes.unequipItem = unequipItem;
  Echoes.addEquipmentToInventory = addEquipmentToInventory;
  Echoes.getEquipmentTypeName = getEquipmentTypeName;
  Echoes.getEquipmentBonusLabel = getEquipmentBonusLabel;
})(window);
