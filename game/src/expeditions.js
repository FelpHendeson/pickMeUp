(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const EXPEDITION_DEFINITIONS = [
    {
      id: "training_field",
      name: "Campo de Treino",
      description: "Treino supervisionado para ganhar experiencia fora da torre.",
      durationMs: 2 * 60 * 1000,
      recommendedPower: 180,
      reward: { type: "xp", amount: 80 },
    },
    {
      id: "old_mine",
      name: "Mina Antiga",
      description: "Exploracao segura de veios abandonados em busca de ouro.",
      durationMs: 3 * 60 * 1000,
      recommendedPower: 220,
      reward: { type: "gold", amount: 180 },
    },
    {
      id: "crystal_ruins",
      name: "Ruinas Cristalinas",
      description: "Varredura em ruinas instaveis para recuperar cristais.",
      durationMs: 5 * 60 * 1000,
      recommendedPower: 260,
      reward: { type: "crystals", amount: 35 },
    },
  ];

  function createExpeditionId(expeditionId) {
    return `exp_${expeditionId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function getExpeditionDefinition(expeditionId) {
    return EXPEDITION_DEFINITIONS.find((expedition) => expedition.id === expeditionId) || null;
  }

  function normalizeExpeditions(state) {
    const validHeroIds = new Set((state.heroes || []).map((hero) => hero.id));
    const validExpeditionIds = new Set(EXPEDITION_DEFINITIONS.map((expedition) => expedition.id));

    state.activeExpeditions = Array.isArray(state.activeExpeditions)
      ? state.activeExpeditions
          .filter((expedition) => expedition && validExpeditionIds.has(expedition.expeditionId))
          .map((expedition) => {
            const definition = getExpeditionDefinition(expedition.expeditionId);
            const heroIds = Array.isArray(expedition.heroIds)
              ? expedition.heroIds
                  .filter((heroId, index, list) => validHeroIds.has(heroId) && list.indexOf(heroId) === index)
                  .slice(0, Echoes.CONFIG.maxExpeditionHeroes)
              : [];
            const startedAt = Number.isFinite(expedition.startedAt) ? expedition.startedAt : Date.now();
            const endsAt = Number.isFinite(expedition.endsAt) ? expedition.endsAt : startedAt + definition.durationMs;
            const preview = getExpeditionRewardPreview(state, definition, heroIds);
            const savedReward = expedition.reward || {};
            const reward = {
              power: Number.isFinite(savedReward.power) ? savedReward.power : preview.power,
              multiplier: Number.isFinite(savedReward.multiplier) ? savedReward.multiplier : preview.multiplier,
              type: savedReward.type === definition.reward.type ? savedReward.type : preview.type,
              amount: Number.isFinite(savedReward.amount) ? savedReward.amount : preview.amount,
              baseAmount: Number.isFinite(savedReward.baseAmount) ? savedReward.baseAmount : preview.baseAmount,
            };

            return Object.assign({}, expedition, {
              id: expedition.id || createExpeditionId(expedition.expeditionId),
              heroIds,
              startedAt,
              endsAt,
              reward,
            });
          })
          .filter((expedition) => expedition.heroIds.length > 0)
      : [];

    return state.activeExpeditions;
  }

  function getActiveExpedition(state, expeditionId) {
    return (state.activeExpeditions || []).find((expedition) => expedition.expeditionId === expeditionId) || null;
  }

  function isHeroOnExpedition(state, heroId) {
    return (state.activeExpeditions || []).some((expedition) => expedition.heroIds.includes(heroId));
  }

  function getHeroExpedition(state, heroId) {
    const active = (state.activeExpeditions || []).find((expedition) => expedition.heroIds.includes(heroId));
    return active ? getExpeditionDefinition(active.expeditionId) : null;
  }

  function getExpeditionPower(state, heroIds) {
    return heroIds.reduce((total, heroId) => {
      const hero = Echoes.findHero(state, heroId);
      return total + (hero ? Echoes.getHeroPower(hero, state) : 0);
    }, 0);
  }

  function getExpeditionRewardMultiplier(power, recommendedPower) {
    if (recommendedPower <= 0) return 1;
    return Math.max(0.5, power / recommendedPower);
  }

  function getExpeditionRewardPreview(state, definition, heroIds) {
    const power = getExpeditionPower(state, heroIds);
    const multiplier = getExpeditionRewardMultiplier(power, definition.recommendedPower);

    return {
      power,
      multiplier,
      type: definition.reward.type,
      amount: Math.max(1, Math.floor(definition.reward.amount * multiplier)),
      baseAmount: definition.reward.amount,
    };
  }

  function getActiveExpeditionReward(state, activeExpedition) {
    const definition = getExpeditionDefinition(activeExpedition.expeditionId);
    if (!definition) return null;

    if (activeExpedition.reward && activeExpedition.reward.type === definition.reward.type) {
      return activeExpedition.reward;
    }

    return getExpeditionRewardPreview(state, definition, activeExpedition.heroIds);
  }

  function getExpeditionRemainingMs(activeExpedition, now) {
    return Math.max(0, activeExpedition.endsAt - (now || Date.now()));
  }

  function isExpeditionComplete(activeExpedition, now) {
    return getExpeditionRemainingMs(activeExpedition, now) <= 0;
  }

  function startExpedition(state, expeditionId, heroIds) {
    const definition = getExpeditionDefinition(expeditionId);
    if (!definition) return { ok: false, message: "Expedicao nao encontrada." };
    if (getActiveExpedition(state, expeditionId)) return { ok: false, message: "Essa expedicao ja esta em andamento." };
    if (!Array.isArray(heroIds) || heroIds.length === 0) return { ok: false, message: "Selecione ao menos 1 heroi." };
    if (heroIds.length > Echoes.CONFIG.maxExpeditionHeroes) {
      return { ok: false, message: `Envie no maximo ${Echoes.CONFIG.maxExpeditionHeroes} herois.` };
    }

    const uniqueHeroIds = Array.from(new Set(heroIds));
    if (uniqueHeroIds.length !== heroIds.length) return { ok: false, message: "Ha herois duplicados na expedicao." };

    const invalidHero = uniqueHeroIds.find((heroId) => !Echoes.findHero(state, heroId));
    if (invalidHero) return { ok: false, message: "Heroi invalido selecionado." };

    const busyHero = uniqueHeroIds.find((heroId) => isHeroOnExpedition(state, heroId));
    if (busyHero) return { ok: false, message: "Um dos herois selecionados ja esta em expedicao." };

    const now = Date.now();
    const reward = getExpeditionRewardPreview(state, definition, uniqueHeroIds);
    const activeExpedition = {
      id: createExpeditionId(expeditionId),
      expeditionId,
      heroIds: uniqueHeroIds,
      startedAt: now,
      endsAt: now + definition.durationMs,
      reward,
    };

    state.activeExpeditions = Array.isArray(state.activeExpeditions) ? state.activeExpeditions : [];
    state.activeExpeditions.push(activeExpedition);

    return {
      ok: true,
      expedition: activeExpedition,
      message: `${definition.name} iniciada com ${uniqueHeroIds.length} heroi(s).`,
    };
  }

  function applyExpeditionReward(state, activeExpedition, definition) {
    const reward = getActiveExpeditionReward(state, activeExpedition) || getExpeditionRewardPreview(state, definition, activeExpedition.heroIds);

    if (reward.type === "xp") {
      activeExpedition.heroIds.forEach((heroId) => {
        const hero = Echoes.findHero(state, heroId);
        if (hero) Echoes.addHeroXp(hero, reward.amount);
      });
    } else {
      Echoes.addResource(state, reward.type, reward.amount);
    }

    return reward;
  }

  function collectExpedition(state, expeditionId) {
    const activeExpedition = getActiveExpedition(state, expeditionId);
    const definition = getExpeditionDefinition(expeditionId);

    if (!activeExpedition || !definition) return { ok: false, message: "Expedicao nao encontrada." };
    if (!isExpeditionComplete(activeExpedition)) return { ok: false, message: "Essa expedicao ainda nao terminou." };

    const reward = applyExpeditionReward(state, activeExpedition, definition);
    state.activeExpeditions = state.activeExpeditions.filter((expedition) => expedition.id !== activeExpedition.id);

    return {
      ok: true,
      reward,
      message: `${definition.name} concluida: +${reward.amount} ${getExpeditionRewardName(reward.type)}.`,
    };
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function getExpeditionRewardName(type) {
    if (type === "xp") return "XP";
    if (type === "gold") return "ouro";
    if (type === "crystals") return "cristais";
    return type;
  }

  Echoes.EXPEDITION_DEFINITIONS = EXPEDITION_DEFINITIONS;
  Echoes.normalizeExpeditions = normalizeExpeditions;
  Echoes.getExpeditionDefinition = getExpeditionDefinition;
  Echoes.getActiveExpedition = getActiveExpedition;
  Echoes.isHeroOnExpedition = isHeroOnExpedition;
  Echoes.getHeroExpedition = getHeroExpedition;
  Echoes.getExpeditionPower = getExpeditionPower;
  Echoes.getExpeditionRewardMultiplier = getExpeditionRewardMultiplier;
  Echoes.getExpeditionRewardPreview = getExpeditionRewardPreview;
  Echoes.getActiveExpeditionReward = getActiveExpeditionReward;
  Echoes.getExpeditionRemainingMs = getExpeditionRemainingMs;
  Echoes.isExpeditionComplete = isExpeditionComplete;
  Echoes.startExpedition = startExpedition;
  Echoes.collectExpedition = collectExpedition;
  Echoes.formatDuration = formatDuration;
  Echoes.getExpeditionRewardName = getExpeditionRewardName;
})(window);
