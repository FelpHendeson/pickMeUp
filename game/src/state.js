(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const CONFIG = {
    saveKey: "ascensao-dos-ecos-save-v1",
    commonSummonCost: 100,
    superiorSummonCost: 100,
    towerEnergyCost: 5,
    maxEnergy: 30,
    energyRegenMs: 5 * 60 * 1000,
    maxFormationSize: 5,
    frontSlots: 2,
    towerMaxFloor: 40,
    maxExpeditionHeroes: 3,
  };

  function createInitialState() {
    const now = Date.now();

    return {
      schemaVersion: 1,
      accountLevel: 1,
      accountXp: 0,
      towerFloor: 1,
      resources: {
        gold: 500,
        crystals: 100,
        essence: 0,
        fragments: 0,
        energy: CONFIG.maxEnergy,
        maxEnergy: CONFIG.maxEnergy,
      },
      heroes: [],
      inventory: [],
      activeExpeditions: [],
      formation: [null, null, null, null, null],
      baseRooms: {
        summonPortal: 1,
        barracks: 1,
        trainingGround: 1,
        infirmary: 1,
        workshop: 0,
        missionBoard: 1,
      },
      summonHistory: [],
      lastBattle: null,
      pendingTowerEvent: null,
      plannedTowerPostEvent: null,
      towerBattleEffects: [],
      towerEventHistory: [],
      completedTowerChapters: [],
      lastChapterCompletion: null,
      missionStats: {},
      dailyMissions: null,
      achievements: {},
      lastSavedAt: null,
      lastEnergyAt: now,
    };
  }

  function getAccountXpForNextLevel(level) {
    return Math.floor(120 * level * 1.2);
  }

  function addAccountXp(state, xpAmount) {
    state.accountXp += xpAmount;

    while (state.accountXp >= getAccountXpForNextLevel(state.accountLevel)) {
      state.accountXp -= getAccountXpForNextLevel(state.accountLevel);
      state.accountLevel += 1;
    }
  }

  function getResourceAmount(state, resourceKey) {
    return Number(state.resources[resourceKey] || 0);
  }

  function canSpendResource(state, resourceKey, amount) {
    return getResourceAmount(state, resourceKey) >= amount;
  }

  function spendResource(state, resourceKey, amount) {
    if (!canSpendResource(state, resourceKey, amount)) {
      return false;
    }

    state.resources[resourceKey] -= amount;
    return true;
  }

  function addResource(state, resourceKey, amount) {
    const currentAmount = getResourceAmount(state, resourceKey);
    const nextAmount = currentAmount + amount;

    if (resourceKey === "energy") {
      state.resources.energy = Math.min(state.resources.maxEnergy || CONFIG.maxEnergy, nextAmount);
      return state.resources.energy;
    }

    state.resources[resourceKey] = nextAmount;
    return nextAmount;
  }

  function regenerateEnergy(state, now) {
    const currentTime = now || Date.now();
    const maxEnergy = state.resources.maxEnergy || CONFIG.maxEnergy;
    const currentEnergy = state.resources.energy;

    if (currentEnergy >= maxEnergy) {
      state.resources.energy = maxEnergy;
      state.lastEnergyAt = currentTime;
      return 0;
    }

    const elapsed = currentTime - state.lastEnergyAt;
    const gained = Math.floor(elapsed / CONFIG.energyRegenMs);

    if (gained <= 0) {
      return 0;
    }

    state.resources.energy = Math.min(maxEnergy, currentEnergy + gained);
    state.lastEnergyAt += gained * CONFIG.energyRegenMs;

    if (state.resources.energy >= maxEnergy) {
      state.lastEnergyAt = currentTime;
    }

    return gained;
  }

  function ensureStateShape(state) {
    const fresh = createInitialState();
    const safe = Object.assign({}, fresh, state || {});

    safe.resources = Object.assign({}, fresh.resources, safe.resources || {});
    safe.baseRooms = Object.assign({}, fresh.baseRooms, safe.baseRooms || {});
    safe.heroes = Array.isArray(safe.heroes) ? safe.heroes : [];
    safe.inventory = Array.isArray(safe.inventory) ? safe.inventory : [];
    safe.activeExpeditions = Array.isArray(safe.activeExpeditions) ? safe.activeExpeditions : [];
    safe.formation = Array.isArray(safe.formation) ? safe.formation.slice(0, CONFIG.maxFormationSize) : fresh.formation;
    safe.pendingTowerEvent =
      safe.pendingTowerEvent && typeof safe.pendingTowerEvent === "object" ? safe.pendingTowerEvent : null;
    safe.plannedTowerPostEvent =
      safe.plannedTowerPostEvent && typeof safe.plannedTowerPostEvent === "object" ? safe.plannedTowerPostEvent : null;
    safe.towerBattleEffects = Array.isArray(safe.towerBattleEffects) ? safe.towerBattleEffects : [];
    safe.towerEventHistory = Array.isArray(safe.towerEventHistory) ? safe.towerEventHistory.slice(0, 8) : [];
    safe.completedTowerChapters = Array.isArray(safe.completedTowerChapters) ? safe.completedTowerChapters : [];
    safe.lastChapterCompletion =
      safe.lastChapterCompletion && typeof safe.lastChapterCompletion === "object" ? safe.lastChapterCompletion : null;
    safe.missionStats = safe.missionStats && typeof safe.missionStats === "object" ? safe.missionStats : {};
    safe.achievements = safe.achievements && typeof safe.achievements === "object" ? safe.achievements : {};

    while (safe.formation.length < CONFIG.maxFormationSize) {
      safe.formation.push(null);
    }

    const validHeroIds = new Set(safe.heroes.map((hero) => hero.id));
    safe.formation = safe.formation.map((heroId) => (validHeroIds.has(heroId) ? heroId : null));
    safe.summonHistory = Array.isArray(safe.summonHistory) ? safe.summonHistory.slice(0, 12) : [];
    safe.lastEnergyAt = Number.isFinite(safe.lastEnergyAt) ? safe.lastEnergyAt : Date.now();

    if (Echoes.normalizeInventory) {
      Echoes.normalizeInventory(safe);
    }

    if (Echoes.normalizeExpeditions) {
      Echoes.normalizeExpeditions(safe);
    }

    if (Echoes.normalizeMissionState) {
      Echoes.normalizeMissionState(safe);
    }

    return safe;
  }

  Echoes.CONFIG = CONFIG;
  Echoes.createInitialState = createInitialState;
  Echoes.getAccountXpForNextLevel = getAccountXpForNextLevel;
  Echoes.addAccountXp = addAccountXp;
  Echoes.getResourceAmount = getResourceAmount;
  Echoes.canSpendResource = canSpendResource;
  Echoes.spendResource = spendResource;
  Echoes.addResource = addResource;
  Echoes.regenerateEnergy = regenerateEnergy;
  Echoes.ensureStateShape = ensureStateShape;
})(window);
