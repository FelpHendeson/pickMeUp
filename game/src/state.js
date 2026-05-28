(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const CONFIG = {
    saveKey: "ascensao-dos-ecos-save-v1",
    saveVersion: 1,
    gameVersion: "0.6.0",
    commonSummonCost: 100,
    superiorSummonCost: 100,
    towerEnergyCost: 5,
    maxEnergy: 30,
    energyRegenMs: 5 * 60 * 1000,
    maxFormationSize: 5,
    frontSlots: 2,
    maxTowerTeamPresets: 3,
    maxExpeditionTeamPresets: 3,
    towerMaxFloor: 40,
    maxExpeditionHeroes: 3,
  };

  function createTeamPreset(type, index, size) {
    const label = type === "tower" ? "Torre" : "Expedicao";

    return {
      id: `${type}_${index + 1}`,
      name: `${label} ${index + 1}`,
      heroIds: Array(size).fill(null),
    };
  }

  function createTeamPresetList(type) {
    const count = type === "tower" ? CONFIG.maxTowerTeamPresets : CONFIG.maxExpeditionTeamPresets;
    const size = type === "tower" ? CONFIG.maxFormationSize : CONFIG.maxExpeditionHeroes;

    return Array.from({ length: count }, (_, index) => createTeamPreset(type, index, size));
  }

  function normalizeTeamPresetList(type, savedPresets, validHeroIds) {
    const defaults = createTeamPresetList(type);
    const size = type === "tower" ? CONFIG.maxFormationSize : CONFIG.maxExpeditionHeroes;

    return defaults.map((defaultPreset, index) => {
      const savedPreset = Array.isArray(savedPresets) ? savedPresets[index] : null;
      const savedHeroIds = savedPreset && Array.isArray(savedPreset.heroIds) ? savedPreset.heroIds : [];
      const used = new Set();
      const heroIds = Array(size).fill(null);

      savedHeroIds.slice(0, size).forEach((heroId, slotIndex) => {
        if (!heroId || used.has(heroId) || !validHeroIds.has(heroId)) return;
        used.add(heroId);
        heroIds[slotIndex] = heroId;
      });

      return {
        id: defaultPreset.id,
        name: typeof savedPreset?.name === "string" && savedPreset.name.trim() ? savedPreset.name.trim() : defaultPreset.name,
        heroIds,
      };
    });
  }

  function normalizeTeamPresets(savedPresets, validHeroIds) {
    const heroIdSet = validHeroIds instanceof Set ? validHeroIds : new Set();

    return {
      tower: normalizeTeamPresetList("tower", savedPresets && savedPresets.tower, heroIdSet),
      expedition: normalizeTeamPresetList("expedition", savedPresets && savedPresets.expedition, heroIdSet),
    };
  }

  function createInitialState() {
    const now = Date.now();

    return {
      schemaVersion: 1,
      saveVersion: CONFIG.saveVersion,
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
      echoFragments: 0,
      relics: {},
      heroContracts: 0,
      heroes: [],
      inventory: [],
      activeExpeditions: [],
      formation: [null, null, null, null, null],
      teamPresets: {
        tower: createTeamPresetList("tower"),
        expedition: createTeamPresetList("expedition"),
      },
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
      pendingRecruitmentChoice: null,
      towerBattleEffects: [],
      towerEventHistory: [],
      completedTowerChapters: [],
      lastChapterCompletion: null,
      narrative: {
        seenSceneIds: [],
        pendingScenes: [],
      },
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
    if (resourceKey === "echoFragments") {
      return Number(state.echoFragments || 0);
    }

    if (resourceKey === "heroContracts") {
      return Number(state.heroContracts || 0);
    }

    return Number(state.resources[resourceKey] || 0);
  }

  function canSpendResource(state, resourceKey, amount) {
    return getResourceAmount(state, resourceKey) >= amount;
  }

  function spendResource(state, resourceKey, amount) {
    if (!canSpendResource(state, resourceKey, amount)) {
      return false;
    }

    if (resourceKey === "echoFragments") {
      state.echoFragments -= amount;
      return true;
    }

    if (resourceKey === "heroContracts") {
      state.heroContracts -= amount;
      return true;
    }

    state.resources[resourceKey] -= amount;
    return true;
  }

  function addResource(state, resourceKey, amount) {
    const currentAmount = getResourceAmount(state, resourceKey);
    const nextAmount = currentAmount + amount;

    if (resourceKey === "echoFragments") {
      state.echoFragments = Math.max(0, nextAmount);
      return state.echoFragments;
    }

    if (resourceKey === "heroContracts") {
      state.heroContracts = Math.max(0, nextAmount);
      return state.heroContracts;
    }

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

    safe.saveVersion = Number.isInteger(safe.saveVersion) ? safe.saveVersion : CONFIG.saveVersion;
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
    safe.pendingRecruitmentChoice =
      safe.pendingRecruitmentChoice && typeof safe.pendingRecruitmentChoice === "object" ? safe.pendingRecruitmentChoice : null;
    safe.towerBattleEffects = Array.isArray(safe.towerBattleEffects) ? safe.towerBattleEffects : [];
    safe.towerEventHistory = Array.isArray(safe.towerEventHistory) ? safe.towerEventHistory.slice(0, 8) : [];
    safe.completedTowerChapters = Array.isArray(safe.completedTowerChapters) ? safe.completedTowerChapters : [];
    safe.lastChapterCompletion =
      safe.lastChapterCompletion && typeof safe.lastChapterCompletion === "object" ? safe.lastChapterCompletion : null;
    safe.narrative = safe.narrative && typeof safe.narrative === "object" ? safe.narrative : fresh.narrative;
    safe.missionStats = safe.missionStats && typeof safe.missionStats === "object" ? safe.missionStats : {};
    safe.achievements = safe.achievements && typeof safe.achievements === "object" ? safe.achievements : {};
    safe.echoFragments = Math.max(0, Math.floor(Number(safe.echoFragments) || 0));
    safe.relics = safe.relics && typeof safe.relics === "object" ? safe.relics : {};
    safe.heroContracts = Math.max(0, Math.floor(Number(safe.heroContracts) || 0));

    while (safe.formation.length < CONFIG.maxFormationSize) {
      safe.formation.push(null);
    }

    const validHeroIds = new Set(safe.heroes.map((hero) => hero.id));
    safe.formation = safe.formation.map((heroId) => (validHeroIds.has(heroId) ? heroId : null));
    safe.teamPresets = normalizeTeamPresets(safe.teamPresets, validHeroIds);
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

    if (Echoes.normalizeNarrativeState) {
      Echoes.normalizeNarrativeState(safe);
    }

    if (Echoes.normalizeRelicState) {
      Echoes.normalizeRelicState(safe);
    }

    if (Echoes.normalizeRecruitmentState) {
      Echoes.normalizeRecruitmentState(safe);
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
  Echoes.createTeamPresetList = createTeamPresetList;
  Echoes.normalizeTeamPresets = normalizeTeamPresets;
  Echoes.ensureStateShape = ensureStateShape;
})(window);
