(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const CONSUMABLE_DEFINITIONS = {
    small_healing_potion: {
      id: "small_healing_potion",
      name: "Pocao pequena de cura",
      description: "Restaura 35% do HP maximo de um heroi fora de combate.",
      effect: "healHp",
      target: "hero",
      moment: "Fora de combate",
      value: 0.35,
    },
    vigor_potion: {
      id: "vigor_potion",
      name: "Pocao de vigor",
      description: "Recupera 18 pontos de moral de um heroi.",
      effect: "restoreMorale",
      target: "hero",
      moment: "Fora de combate",
      value: 18,
    },
    medical_kit: {
      id: "medical_kit",
      name: "Kit medico",
      description: "Reduz em 1 batalha a duracao de um ferimento ativo.",
      effect: "reduceInjury",
      target: "hero",
      moment: "Fora de combate",
      value: 1,
    },
    focus_scroll: {
      id: "focus_scroll",
      name: "Pergaminho de foco",
      description: "Aumenta FOCUS da formacao em 18% na proxima batalha.",
      effect: "nextBattleFocus",
      target: "none",
      moment: "Antes do andar",
      value: 1.18,
    },
    protection_amulet: {
      id: "protection_amulet",
      name: "Amuleto de protecao",
      description: "Reduz em 35% a chance de ferimento na proxima batalha.",
      effect: "nextBattleInjuryProtection",
      target: "none",
      moment: "Antes do andar",
      value: 0.65,
    },
    return_stone: {
      id: "return_stone",
      name: "Pedra de retorno",
      description: "Cancela com seguranca um evento perigoso pendente da torre.",
      effect: "safeEventExit",
      target: "none",
      moment: "Evento perigoso",
      value: 1,
    },
  };

  const RANDOM_CONSUMABLE_POOL = [
    "small_healing_potion",
    "small_healing_potion",
    "vigor_potion",
    "medical_kit",
    "focus_scroll",
    "protection_amulet",
    "return_stone",
  ];

  function normalizeConsumablesState(state) {
    state.consumables = state.consumables && typeof state.consumables === "object" ? state.consumables : {};

    Object.keys(CONSUMABLE_DEFINITIONS).forEach((consumableId) => {
      state.consumables[consumableId] = Math.max(0, Math.floor(Number(state.consumables[consumableId]) || 0));
    });

    return state.consumables;
  }

  function getConsumableDefinition(consumableId) {
    return CONSUMABLE_DEFINITIONS[consumableId] || null;
  }

  function getConsumableQuantity(state, consumableId) {
    normalizeConsumablesState(state);
    return state.consumables[consumableId] || 0;
  }

  function addConsumable(state, consumableId, amount) {
    const definition = getConsumableDefinition(consumableId);
    if (!definition) return 0;

    normalizeConsumablesState(state);
    const increment = Math.max(0, Math.floor(Number(amount) || 0));
    state.consumables[consumableId] += increment;
    return state.consumables[consumableId];
  }

  function spendConsumable(state, consumableId) {
    if (getConsumableQuantity(state, consumableId) <= 0) return false;
    state.consumables[consumableId] -= 1;
    return true;
  }

  function getRandomConsumableId() {
    return RANDOM_CONSUMABLE_POOL[Math.floor(Math.random() * RANDOM_CONSUMABLE_POOL.length)];
  }

  function getHeroMaxHp(state, hero) {
    const stats = Echoes.getHeroEffectiveStats ? Echoes.getHeroEffectiveStats(state, hero) : hero.stats || {};
    return Math.max(1, Math.round(stats.hp || 1));
  }

  function normalizeHeroCurrentHp(state, hero) {
    const maxHp = getHeroMaxHp(state, hero);
    hero.currentHp = Number.isFinite(hero.currentHp) ? Math.max(0, Math.round(hero.currentHp)) : maxHp;
    hero.currentHp = Math.min(maxHp, hero.currentHp);
    return hero.currentHp;
  }

  function getHeroHpSummary(state, hero) {
    return {
      current: normalizeHeroCurrentHp(state, hero),
      max: getHeroMaxHp(state, hero),
    };
  }

  function queueConsumableBattleEffect(state, effect) {
    state.towerBattleEffects = Array.isArray(state.towerBattleEffects) ? state.towerBattleEffects : [];
    state.towerBattleEffects.push(
      Object.assign(
        {
          id: `consumable_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          scope: "nextBattle",
          createdAt: new Date().toISOString(),
        },
        effect
      )
    );
  }

  function useHealingPotion(state, hero, definition) {
    const hp = getHeroHpSummary(state, hero);
    if (hp.current >= hp.max) return { ok: false, message: `${hero.name} ja esta com HP cheio.` };

    const recovered = Math.max(1, Math.round(hp.max * definition.value));
    hero.currentHp = Math.min(hp.max, hp.current + recovered);
    return { ok: true, message: `${hero.name} recuperou ${hero.currentHp - hp.current} HP.` };
  }

  function useVigorPotion(hero, definition) {
    const morale = Number.isFinite(hero.morale) ? hero.morale : 80;
    if (morale >= 100) return { ok: false, message: `${hero.name} ja esta com moral maxima.` };

    hero.morale = Math.min(100, morale + definition.value);
    return { ok: true, message: `${hero.name} recuperou ${hero.morale - morale} moral.` };
  }

  function useMedicalKit(hero) {
    const injuries = Echoes.getHeroActiveInjuries ? Echoes.getHeroActiveInjuries(hero) : [];
    if (injuries.length === 0) return { ok: false, message: `${hero.name} nao tem ferimentos ativos.` };

    const target = injuries.slice().sort((a, b) => b.remainingBattles - a.remainingBattles)[0];
    const before = target.remainingBattles;
    target.remainingBattles -= 1;
    hero.injuries = injuries.filter((injury) => injury.remainingBattles > 0);

    return {
      ok: true,
      message:
        target.remainingBattles > 0
          ? `${hero.name} reduziu um ferimento de ${before} para ${target.remainingBattles} batalha(s).`
          : `${hero.name} removeu um ferimento com o kit medico.`,
    };
  }

  function useFocusScroll(state) {
    queueConsumableBattleEffect(state, {
      label: "Pergaminho de foco",
      description: "FOCUS +18% na proxima batalha.",
      modifiers: { focusMultiplier: 1.18 },
    });

    return { ok: true, message: "Pergaminho preparado. A proxima batalha tera FOCUS aumentado." };
  }

  function useProtectionAmulet(state) {
    queueConsumableBattleEffect(state, {
      label: "Amuleto de protecao",
      description: "Chance de ferimento -35% na proxima batalha.",
      modifiers: { injuryChanceMultiplier: 0.65 },
    });

    return { ok: true, message: "Amuleto preparado. A proxima batalha tera menor chance de ferimentos." };
  }

  function useReturnStone(state) {
    const event = state.pendingTowerEvent;
    const dangerous = event && (event.typeKey === "trap" || event.typeKey === "darkAltar");

    if (!dangerous) {
      return { ok: false, message: "A Pedra de retorno so pode cancelar Armadilha ou Altar sombrio pendente." };
    }

    state.pendingTowerEvent = null;
    state.plannedTowerPostEvent = null;
    return { ok: true, message: "Pedra de retorno ativada. O evento perigoso foi abandonado sem penalidade." };
  }

  function useConsumable(state, consumableId, heroId) {
    normalizeConsumablesState(state);

    const definition = getConsumableDefinition(consumableId);
    if (!definition) return { ok: false, message: "Consumivel inexistente." };
    if (getConsumableQuantity(state, consumableId) <= 0) return { ok: false, message: `${definition.name} indisponivel.` };

    const hero = definition.target === "hero" ? Echoes.findHero(state, heroId) : null;
    if (definition.target === "hero" && !hero) return { ok: false, message: "Selecione um heroi valido." };

    let result = null;
    if (definition.effect === "healHp") result = useHealingPotion(state, hero, definition);
    if (definition.effect === "restoreMorale") result = useVigorPotion(hero, definition);
    if (definition.effect === "reduceInjury") result = useMedicalKit(hero, definition);
    if (definition.effect === "nextBattleFocus") result = useFocusScroll(state);
    if (definition.effect === "nextBattleInjuryProtection") result = useProtectionAmulet(state);
    if (definition.effect === "safeEventExit") result = useReturnStone(state);

    if (!result || !result.ok) return result || { ok: false, message: "Consumivel sem efeito configurado." };
    if (!spendConsumable(state, consumableId)) return { ok: false, message: `${definition.name} indisponivel.` };

    return { ok: true, message: result.message };
  }

  function formatConsumableReward(consumables) {
    return Object.keys(consumables || {})
      .filter((consumableId) => consumables[consumableId] > 0 && getConsumableDefinition(consumableId))
      .map((consumableId) => `${consumables[consumableId]} ${getConsumableDefinition(consumableId).name}`)
      .join(" | ");
  }

  Echoes.CONSUMABLE_DEFINITIONS = CONSUMABLE_DEFINITIONS;
  Echoes.normalizeConsumablesState = normalizeConsumablesState;
  Echoes.getConsumableDefinition = getConsumableDefinition;
  Echoes.getConsumableQuantity = getConsumableQuantity;
  Echoes.addConsumable = addConsumable;
  Echoes.getRandomConsumableId = getRandomConsumableId;
  Echoes.getHeroHpSummary = getHeroHpSummary;
  Echoes.normalizeHeroCurrentHp = normalizeHeroCurrentHp;
  Echoes.useConsumable = useConsumable;
  Echoes.formatConsumableReward = formatConsumableReward;
})(window);
