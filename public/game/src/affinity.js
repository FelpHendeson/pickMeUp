(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const AFFINITY_LEVELS = [
    { level: 0, label: "Desconhecidos", minXp: 0 },
    { level: 1, label: "Companheiros", minXp: 3 },
    { level: 2, label: "Confiaveis", minXp: 8 },
    { level: 3, label: "Irmandade", minXp: 16 },
    { level: 4, label: "Lenda Viva", minXp: 30 },
  ];

  function getAffinityPairKey(heroAId, heroBId) {
    return [heroAId, heroBId].sort().join("_");
  }

  function normalizeAffinityRecord(record, key) {
    const heroIds = key.split("_");
    return {
      heroAId: typeof record.heroAId === "string" ? record.heroAId : heroIds[0] || "",
      heroBId: typeof record.heroBId === "string" ? record.heroBId : heroIds.slice(1).join("_") || "",
      xp: Math.max(0, Math.floor(Number(record.xp) || 0)),
    };
  }

  function normalizeAffinitiesState(state) {
    state.affinities = state.affinities && typeof state.affinities === "object" ? state.affinities : {};

    const validHeroIds = new Set((state.heroes || []).map((hero) => hero.id));
    const normalized = {};

    Object.keys(state.affinities).forEach((key) => {
      const record = normalizeAffinityRecord(state.affinities[key] || {}, key);
      if (!record.heroAId || !record.heroBId || record.heroAId === record.heroBId) return;
      if (validHeroIds.size > 0 && (!validHeroIds.has(record.heroAId) || !validHeroIds.has(record.heroBId))) return;

      normalized[getAffinityPairKey(record.heroAId, record.heroBId)] = record;
    });

    state.affinities = normalized;
    return state.affinities;
  }

  function getAffinityLevelFromXp(xp) {
    let current = AFFINITY_LEVELS[0];
    AFFINITY_LEVELS.forEach((level) => {
      if (xp >= level.minXp) current = level;
    });
    return current;
  }

  function getNextAffinityLevel(xp) {
    return AFFINITY_LEVELS.find((level) => level.minXp > xp) || null;
  }

  function getAffinityRecord(state, heroAId, heroBId) {
    normalizeAffinitiesState(state);
    const key = getAffinityPairKey(heroAId, heroBId);
    return state.affinities[key] || { heroAId, heroBId, xp: 0 };
  }

  function getAffinitySummary(state, heroAId, heroBId) {
    const record = getAffinityRecord(state, heroAId, heroBId);
    const level = getAffinityLevelFromXp(record.xp);
    const next = getNextAffinityLevel(record.xp);

    return {
      key: getAffinityPairKey(heroAId, heroBId),
      heroAId: record.heroAId,
      heroBId: record.heroBId,
      xp: record.xp,
      level: level.level,
      label: level.label,
      nextXp: next ? next.minXp : null,
      bonusText: getAffinityBonusText(level.level),
    };
  }

  function addAffinityPairXp(state, heroAId, heroBId, amount) {
    if (!heroAId || !heroBId || heroAId === heroBId) return null;

    normalizeAffinitiesState(state);
    const key = getAffinityPairKey(heroAId, heroBId);
    const previous = state.affinities[key] || { heroAId, heroBId, xp: 0 };
    const ordered = [heroAId, heroBId].sort();

    state.affinities[key] = {
      heroAId: previous.heroAId || ordered[0],
      heroBId: previous.heroBId || ordered[1],
      xp: Math.max(0, previous.xp + Math.max(0, Math.floor(Number(amount) || 0))),
    };

    return state.affinities[key];
  }

  function addAffinityForGroup(state, heroIds, amount) {
    const uniqueHeroIds = Array.from(new Set((heroIds || []).filter(Boolean)));
    const changed = [];

    for (let i = 0; i < uniqueHeroIds.length; i += 1) {
      for (let j = i + 1; j < uniqueHeroIds.length; j += 1) {
        const record = addAffinityPairXp(state, uniqueHeroIds[i], uniqueHeroIds[j], amount);
        if (record) changed.push(record);
      }
    }

    return changed;
  }

  function recordBattleAffinity(state, playerTeam, battleResult, isBoss) {
    const allHeroIds = playerTeam.map((unit) => unit.sourceId).filter(Boolean);
    const livingHeroIds = playerTeam.filter((unit) => unit.hp > 0).map((unit) => unit.sourceId).filter(Boolean);

    if (battleResult === "victory") addAffinityForGroup(state, allHeroIds, 1);
    if (battleResult === "victory" && isBoss) addAffinityForGroup(state, allHeroIds, 2);
    addAffinityForGroup(state, livingHeroIds, 1);
  }

  function recordExpeditionAffinity(state, heroIds) {
    return addAffinityForGroup(state, heroIds, 1);
  }

  function recordDangerousEventAffinity(state) {
    const heroIds = Echoes.getFormationHeroes ? Echoes.getFormationHeroes(state).filter(Boolean).map((hero) => hero.id) : [];
    return addAffinityForGroup(state, heroIds, 1);
  }

  function getAffinityBonusText(level) {
    if (level <= 0) return "Sem bonus ativo";
    return `Moral +${level}, energia +${level * 2}, XP +${level}% e protecao ${level * 3}%`;
  }

  function getHeroAffinitySummaries(state, heroId) {
    normalizeAffinitiesState(state);

    return Object.values(state.affinities)
      .filter((record) => record.heroAId === heroId || record.heroBId === heroId)
      .map((record) => {
        const allyId = record.heroAId === heroId ? record.heroBId : record.heroAId;
        const ally = Echoes.findHero ? Echoes.findHero(state, allyId) : null;
        return Object.assign(getAffinitySummary(state, heroId, allyId), { allyId, ally });
      })
      .filter((summary) => summary.ally)
      .sort((a, b) => b.level - a.level || b.xp - a.xp || a.ally.name.localeCompare(b.ally.name));
  }

  function getGroupAffinityLevelSum(state, heroId, groupHeroIds) {
    return (groupHeroIds || [])
      .filter((allyId) => allyId && allyId !== heroId)
      .reduce((total, allyId) => total + getAffinitySummary(state, heroId, allyId).level, 0);
  }

  function applyAffinityBattleStartBonuses(state, playerTeam) {
    const heroIds = playerTeam.map((unit) => unit.sourceId).filter(Boolean);
    const lines = [];

    playerTeam.forEach((unit) => {
      const levelSum = getGroupAffinityLevelSum(state, unit.sourceId, heroIds);
      if (levelSum <= 0) return;

      const moraleBonus = Math.min(6, levelSum);
      const energyBonus = Math.min(8, levelSum * 2);
      unit.morale = Math.min(100, (unit.morale || 80) + moraleBonus);
      unit.energy = Math.min(Echoes.BATTLE_CONFIG ? Echoes.BATTLE_CONFIG.maxUnitEnergy : 125, (unit.energy || 0) + energyBonus);
      lines.push(`${unit.name} recebeu +${moraleBonus} moral e +${energyBonus} energia por afinidade.`);
    });

    return lines;
  }

  function getAffinityXpMultiplier(state, heroId, groupHeroIds) {
    const levelSum = getGroupAffinityLevelSum(state, heroId, groupHeroIds);
    return 1 + Math.min(0.08, levelSum * 0.01);
  }

  function getAffinityProtectionTarget(target, candidates, attacker) {
    if (!target || target.side !== "player" || !target.sourceId || !attacker || attacker.side !== "enemy") return target;

    const allies = candidates
      .filter((unit) => unit.hp > 0 && unit.side === "player" && unit.sourceId && unit.sourceId !== target.sourceId)
      .map((unit) => ({
        unit,
        affinity: target.affinityLevels ? target.affinityLevels[unit.sourceId] || 0 : 0,
      }))
      .filter((entry) => entry.affinity > 0)
      .sort((a, b) => b.affinity - a.affinity);

    if (allies.length === 0) return target;

    const protector = allies[0];
    const chance = Math.min(0.12, protector.affinity * 0.03);
    return Math.random() < chance ? protector.unit : target;
  }

  Echoes.AFFINITY_LEVELS = AFFINITY_LEVELS;
  Echoes.normalizeAffinitiesState = normalizeAffinitiesState;
  Echoes.getAffinityPairKey = getAffinityPairKey;
  Echoes.getAffinitySummary = getAffinitySummary;
  Echoes.getHeroAffinitySummaries = getHeroAffinitySummaries;
  Echoes.addAffinityForGroup = addAffinityForGroup;
  Echoes.recordBattleAffinity = recordBattleAffinity;
  Echoes.recordExpeditionAffinity = recordExpeditionAffinity;
  Echoes.recordDangerousEventAffinity = recordDangerousEventAffinity;
  Echoes.applyAffinityBattleStartBonuses = applyAffinityBattleStartBonuses;
  Echoes.getAffinityXpMultiplier = getAffinityXpMultiplier;
  Echoes.getAffinityProtectionTarget = getAffinityProtectionTarget;
})(window);
