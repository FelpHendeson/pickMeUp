(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const RELIC_DEFINITIONS = [
    {
      id: "tower_core",
      name: "Nucleo da Torre",
      description: "Um fragmento estavel do primeiro marco. Fortalece a vitalidade de todos os herois.",
      maxLevel: 5,
      baseCost: 6,
      costStep: 4,
      bonusType: "statPercent",
      stat: "hp",
      valuePerLevel: 0.025,
      unlock: { type: "floorReached", floor: 1, text: "Disponivel desde o inicio da escalada." },
    },
    {
      id: "commander_flame",
      name: "Chama do Comandante",
      description: "Uma chama fria que responde a ordens firmes. Aumenta o ataque global da equipe.",
      maxLevel: 5,
      baseCost: 8,
      costStep: 5,
      bonusType: "statPercent",
      stat: "atk",
      valuePerLevel: 0.018,
      unlock: { type: "floorReached", floor: 5, text: "Alcance o andar 5." },
    },
    {
      id: "survivor_shield",
      name: "Escudo dos Sobreviventes",
      description: "Placas gravadas com nomes antigos. Aumenta a defesa de todos os herois.",
      maxLevel: 5,
      baseCost: 9,
      costStep: 5,
      bonusType: "statPercent",
      stat: "def",
      valuePerLevel: 0.02,
      unlock: { type: "floorReached", floor: 10, text: "Conclua o primeiro capitulo." },
    },
    {
      id: "destiny_eye",
      name: "Olho do Destino",
      description: "Um olho mineral que antecipa brechas improvaveis. Aumenta LUCK global.",
      maxLevel: 5,
      baseCost: 10,
      costStep: 6,
      bonusType: "statFlat",
      stat: "luck",
      valuePerLevel: 1,
      unlock: { type: "floorReached", floor: 10, text: "Conclua o primeiro capitulo." },
    },
    {
      id: "portal_seal",
      name: "Selo do Portal",
      description: "Reduz o atrito do portal de invocacao e diminui levemente seus custos.",
      maxLevel: 5,
      baseCost: 12,
      costStep: 7,
      bonusType: "summonCostReduction",
      valuePerLevel: 0.02,
      unlock: { type: "floorReached", floor: 15, text: "Alcance o andar 15." },
    },
    {
      id: "arcane_hourglass",
      name: "Ampulheta Arcana",
      description: "Dobra pequenos intervalos de tempo e reduz a duracao das expedicoes.",
      maxLevel: 5,
      baseCost: 12,
      costStep: 7,
      bonusType: "expeditionDurationReduction",
      valuePerLevel: 0.03,
      unlock: { type: "expeditionsCollected", amount: 1, text: "Colete ao menos 1 expedicao." },
    },
  ];

  function getRelicDefinition(relicId) {
    return RELIC_DEFINITIONS.find((relic) => relic.id === relicId) || null;
  }

  function normalizeRelicState(state) {
    state.echoFragments = Math.max(0, Math.floor(Number(state.echoFragments) || 0));
    state.relics = state.relics && typeof state.relics === "object" ? state.relics : {};

    RELIC_DEFINITIONS.forEach((relic) => {
      const saved = state.relics[relic.id] && typeof state.relics[relic.id] === "object" ? state.relics[relic.id] : {};
      state.relics[relic.id] = {
        level: Math.min(relic.maxLevel, Math.max(0, Math.floor(Number(saved.level) || 0))),
        unlockedAt: typeof saved.unlockedAt === "string" ? saved.unlockedAt : null,
      };
    });

    return state.relics;
  }

  function getRelicState(state, relicId) {
    normalizeRelicState(state);
    return state.relics[relicId] || { level: 0, unlockedAt: null };
  }

  function getHighestReachedFloor(state) {
    return Math.max(1, Number(state.towerFloor) || 1);
  }

  function isRelicUnlocked(state, relic) {
    const condition = relic.unlock || {};

    if (condition.type === "floorReached") {
      return getHighestReachedFloor(state) >= condition.floor;
    }

    if (condition.type === "expeditionsCollected") {
      const collected = state.missionStats ? Number(state.missionStats.expeditionsCollected) || 0 : 0;
      return collected >= condition.amount;
    }

    return true;
  }

  function getRelicUnlockText(state, relic) {
    return isRelicUnlocked(state, relic) ? "Desbloqueada" : relic.unlock.text;
  }

  function getRelicUpgradeCost(relic, currentLevel) {
    if (currentLevel >= relic.maxLevel) return 0;
    return relic.baseCost + currentLevel * relic.costStep;
  }

  function getRelicBonusValue(state, relic) {
    return getRelicState(state, relic.id).level * relic.valuePerLevel;
  }

  function formatRelicBonusValue(relic, value) {
    if (relic.bonusType === "statFlat") return `+${Math.round(value)} ${relic.stat.toUpperCase()}`;
    return `${Math.round(value * 100)}%`;
  }

  function getRelicEffectText(relic, level) {
    const value = Math.max(0, level) * relic.valuePerLevel;
    const formatted = formatRelicBonusValue(relic, value);

    if (relic.bonusType === "statPercent") return `${formatted} ${relic.stat.toUpperCase()} global`;
    if (relic.bonusType === "statFlat") return `${formatted} global`;
    if (relic.bonusType === "summonCostReduction") return `${formatted} de reducao no custo de invocacoes`;
    if (relic.bonusType === "expeditionDurationReduction") return `${formatted} de reducao na duracao das expedicoes`;
    return formatted;
  }

  function getRelicCurrentEffectText(state, relic) {
    return getRelicEffectText(relic, getRelicState(state, relic.id).level);
  }

  function getRelicNextEffectText(state, relic) {
    const level = getRelicState(state, relic.id).level;
    if (level >= relic.maxLevel) return "Nivel maximo";
    return getRelicEffectText(relic, level + 1);
  }

  function upgradeRelic(state, relicId) {
    normalizeRelicState(state);

    const relic = getRelicDefinition(relicId);
    if (!relic) return { ok: false, message: "Reliquia nao encontrada." };
    if (!isRelicUnlocked(state, relic)) return { ok: false, message: `Reliquia bloqueada: ${relic.unlock.text}` };

    const relicState = getRelicState(state, relic.id);
    if (relicState.level >= relic.maxLevel) return { ok: false, message: "Reliquia no nivel maximo." };

    const cost = getRelicUpgradeCost(relic, relicState.level);
    if (!Echoes.spendResource(state, "echoFragments", cost)) {
      return { ok: false, message: `Fragmentos de Eco insuficientes. Requer ${cost}.` };
    }

    relicState.level += 1;
    relicState.unlockedAt = relicState.unlockedAt || new Date().toISOString();

    return {
      ok: true,
      relic,
      message: `${relic.name} aprimorada para o nivel ${relicState.level}.`,
    };
  }

  function applyRelicStatModifiers(stats, state) {
    if (!state) return stats;

    RELIC_DEFINITIONS.forEach((relic) => {
      const level = getRelicState(state, relic.id).level;
      if (level <= 0) return;

      if (relic.bonusType === "statPercent" && stats[relic.stat] != null) {
        stats[relic.stat] = Math.max(1, Math.round(stats[relic.stat] * (1 + level * relic.valuePerLevel)));
      }

      if (relic.bonusType === "statFlat" && stats[relic.stat] != null) {
        stats[relic.stat] = Math.max(1, Math.round(stats[relic.stat] + level * relic.valuePerLevel));
      }
    });

    return stats;
  }

  function getRelicSummonCostMultiplier(state) {
    if (!state) return 1;
    const relic = getRelicDefinition("portal_seal");
    const reduction = getRelicBonusValue(state, relic);
    return Math.max(0.85, 1 - reduction);
  }

  function getRelicExpeditionDurationMultiplier(state) {
    if (!state) return 1;
    const relic = getRelicDefinition("arcane_hourglass");
    const reduction = getRelicBonusValue(state, relic);
    return Math.max(0.85, 1 - reduction);
  }

  function getRelicAdjustedExpeditionDuration(state, baseDurationMs) {
    return Math.max(30 * 1000, Math.round(baseDurationMs * getRelicExpeditionDurationMultiplier(state)));
  }

  Echoes.RELIC_DEFINITIONS = RELIC_DEFINITIONS;
  Echoes.getRelicDefinition = getRelicDefinition;
  Echoes.normalizeRelicState = normalizeRelicState;
  Echoes.getRelicState = getRelicState;
  Echoes.isRelicUnlocked = isRelicUnlocked;
  Echoes.getRelicUnlockText = getRelicUnlockText;
  Echoes.getRelicUpgradeCost = getRelicUpgradeCost;
  Echoes.getRelicCurrentEffectText = getRelicCurrentEffectText;
  Echoes.getRelicNextEffectText = getRelicNextEffectText;
  Echoes.upgradeRelic = upgradeRelic;
  Echoes.applyRelicStatModifiers = applyRelicStatModifiers;
  Echoes.getRelicSummonCostMultiplier = getRelicSummonCostMultiplier;
  Echoes.getRelicAdjustedExpeditionDuration = getRelicAdjustedExpeditionDuration;
})(window);
