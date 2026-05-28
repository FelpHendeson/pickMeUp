(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});
  const TOWER_EVENT_CHANCE = 0.3;
  const MAX_HISTORY_ITEMS = 8;

  const RESOURCE_NAMES = {
    gold: "ouro",
    crystals: "cristais",
    essence: "essencia",
    fragments: "fragmentos",
    energy: "energia",
  };

  const TOWER_EVENT_DEFINITIONS = {
    healingFountain: {
      title: "Fonte de cura",
      tone: "support",
      description: "Uma fonte azul pulsa entre runas antigas. A agua pode restaurar a equipe, mas a torre raramente oferece algo sem custo.",
      choices: [
        {
          id: "carefulDrink",
          label: "Beber com cuidado",
          description: "Remove ferimentos de eventos e concede energia inicial na proxima luta.",
        },
        {
          id: "deepDrink",
          label: "Aceitar a corrente profunda",
          description: "Grande chance de bencao ofensiva, pequena chance de maldicao.",
        },
      ],
    },
    mysteryChest: {
      title: "Bau misterioso",
      tone: "reward",
      description: "Um bau lacrado repousa no corredor. O metal vibra como se algo vivo estivesse preso la dentro.",
      choices: [
        {
          id: "openCarefully",
          label: "Abrir com cuidado",
          description: "Pode render ouro, cristais ou equipamento. Baixa chance de armadilha.",
        },
        {
          id: "breakSeal",
          label: "Quebrar o selo",
          description: "Recompensa melhor, mas risco alto de dano antes da proxima luta.",
        },
      ],
    },
    lostMerchant: {
      title: "Mercador perdido",
      tone: "merchant",
      description: "Um vendedor coberto de poeira oferece suprimentos simples antes de desaparecer entre as escadas.",
      choices: [
        {
          id: "buyPotion",
          label: "Comprar pocao",
          description: "Custa 70 ouro. Remove ferimentos e melhora curas na proxima luta.",
          cost: { resource: "gold", amount: 70 },
        },
        {
          id: "buyEquipment",
          label: "Comprar equipamento comum",
          description: "Custa 140 ouro. Adiciona um equipamento ao inventario.",
          cost: { resource: "gold", amount: 140 },
        },
        {
          id: "buyTonic",
          label: "Comprar tonico de combate",
          description: "Custa 90 ouro. ATK e SPD aumentam na proxima luta.",
          cost: { resource: "gold", amount: 90 },
        },
        {
          id: "leaveMerchant",
          label: "Guardar ouro",
          description: "Nao compra nada e segue em frente.",
        },
      ],
    },
    darkAltar: {
      title: "Altar sombrio",
      tone: "danger",
      description: "Um altar negro pede um juramento. O poder oferecido e real, mas a penalidade tambem.",
      choices: [
        {
          id: "bloodPact",
          label: "Firmar pacto de sangue",
          description: "+20% ATK na proxima luta, mas -10% HP maximo temporario.",
        },
        {
          id: "consumeAshes",
          label: "Consumir as cinzas",
          description: "+25% ATK, mas a equipe entra ferida e recebe mais dano.",
        },
        {
          id: "rejectAltar",
          label: "Quebrar o circulo",
          description: "Evita o pacto e recolhe fragmentos instaveis.",
        },
      ],
    },
    prisoner: {
      title: "Prisioneiro",
      tone: "choice",
      description: "Uma cela improvisada prende alguem que jura ter sido capturado pelos monstros da torre.",
      choices: [
        {
          id: "freePrisoner",
          label: "Libertar",
          description: "Chance de recrutar um heroi comum ou incomum. Tambem pode ser uma emboscada.",
        },
        {
          id: "demandOath",
          label: "Exigir juramento",
          description: "Menor chance de sucesso, mas melhor chance de heroi incomum. Risco maior de emboscada.",
        },
      ],
    },
    trap: {
      title: "Armadilha",
      tone: "danger",
      description: "O piso cede e runas vermelhas acendem. A equipe precisa reagir antes do proximo confronto.",
      choices: [
        {
          id: "disarmTrap",
          label: "Tentar desarmar",
          description: "Boa chance de evitar o dano e ganhar fragmentos. Falha causa dano.",
        },
        {
          id: "rushThrough",
          label: "Atravessar correndo",
          description: "Sofre dano leve, mas ganha SPD na proxima luta.",
        },
        {
          id: "braceImpact",
          label: "Proteger a linha de frente",
          description: "Recebe menos dano e ganha DEF temporaria.",
        },
      ],
    },
  };

  const PRE_EVENT_KEYS = ["healingFountain", "mysteryChest", "lostMerchant", "darkAltar", "prisoner", "trap"];
  const POST_EVENT_KEYS = ["healingFountain", "mysteryChest", "lostMerchant", "darkAltar", "prisoner"];

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getResourceName(resourceKey) {
    return RESOURCE_NAMES[resourceKey] || resourceKey;
  }

  function getFloorEventScale(floorNumber) {
    return Math.max(1, Number(floorNumber) || 1);
  }

  function ensureTowerEventState(state) {
    state.pendingTowerEvent = state.pendingTowerEvent || null;
    state.plannedTowerPostEvent = state.plannedTowerPostEvent || null;
    state.towerBattleEffects = Array.isArray(state.towerBattleEffects) ? state.towerBattleEffects : [];
    state.towerEventHistory = Array.isArray(state.towerEventHistory) ? state.towerEventHistory : [];
  }

  function createTowerEvent(typeKey, phase, floorNumber, floorTitle) {
    return {
      id: randomId("tower_event"),
      typeKey,
      phase,
      floor: floorNumber,
      floorTitle: floorTitle || "",
      createdAt: new Date().toISOString(),
    };
  }

  function getTowerEventDefinition(typeKey) {
    return TOWER_EVENT_DEFINITIONS[typeKey] || null;
  }

  function getTowerEventChoice(definition, choiceId) {
    return definition && definition.choices.find((choice) => choice.id === choiceId);
  }

  function getTowerEventPhaseLabel(phase) {
    return phase === "post" ? "Depois do combate" : "Antes do combate";
  }

  function canChooseTowerEventOption(state, event, choiceId) {
    const definition = getTowerEventDefinition(event && event.typeKey);
    const choice = getTowerEventChoice(definition, choiceId);

    if (!choice) return { ok: false, message: "Escolha invalida." };
    if (!choice.cost) return { ok: true };

    const currentAmount = Echoes.getResourceAmount(state, choice.cost.resource);
    if (currentAmount < choice.cost.amount) {
      return {
        ok: false,
        message: `Requer ${choice.cost.amount} ${getResourceName(choice.cost.resource)}.`,
      };
    }

    return { ok: true };
  }

  function addTowerBattleEffect(state, effect) {
    ensureTowerEventState(state);
    state.towerBattleEffects.push(
      Object.assign(
        {
          id: randomId("tower_effect"),
          scope: "nextBattle",
          createdAt: new Date().toISOString(),
        },
        effect
      )
    );
  }

  function clearInitialDamageEffects(state) {
    ensureTowerEventState(state);
    const before = state.towerBattleEffects.length;
    state.towerBattleEffects = state.towerBattleEffects.filter(
      (effect) => !(effect.modifiers && effect.modifiers.initialDamagePct > 0)
    );
    return before - state.towerBattleEffects.length;
  }

  function recordTowerEventHistory(state, event, choice, message) {
    ensureTowerEventState(state);
    const definition = getTowerEventDefinition(event.typeKey);

    state.towerEventHistory.unshift({
      id: event.id,
      typeKey: event.typeKey,
      title: definition ? definition.title : event.typeKey,
      phase: event.phase,
      floor: event.floor,
      choice: choice.label,
      message,
      resolvedAt: new Date().toISOString(),
    });

    state.towerEventHistory = state.towerEventHistory.slice(0, MAX_HISTORY_ITEMS);
  }

  function grantGold(state, amount) {
    Echoes.addResource(state, "gold", amount);
    return `+${amount} ouro`;
  }

  function grantCrystals(state, amount) {
    Echoes.addResource(state, "crystals", amount);
    return `+${amount} cristais`;
  }

  function grantFragments(state, amount) {
    Echoes.addResource(state, "fragments", amount);
    return `+${amount} fragmentos`;
  }

  function grantEquipment(state, floorNumber, rarityOverride) {
    const item = Echoes.generateEquipment(Math.max(1, floorNumber));
    item.floorNumber = Math.max(1, floorNumber);
    if (rarityOverride) {
      item.rarity = rarityOverride;
    }

    const normalizedItem = Echoes.normalizeEquipmentItem ? Echoes.normalizeEquipmentItem(item) : item;
    Echoes.addEquipmentToInventory(state, normalizedItem);
    return normalizedItem;
  }

  function grantHero(state, rarity) {
    const hero = Echoes.generateHero({ rarity });
    state.heroes.push(hero);
    return hero;
  }

  function appendMoraleChange(state, message, amount, reason) {
    if (!Echoes.adjustFormationMorale || amount === 0) return message;

    const moraleMessage = Echoes.adjustFormationMorale(state, amount, reason);
    return moraleMessage ? `${message} ${moraleMessage}` : message;
  }

  function resolveHealingFountain(state, event, choiceId) {
    if (choiceId === "carefulDrink") {
      const cleared = clearInitialDamageEffects(state);
      addTowerBattleEffect(state, {
        label: "Agua serena",
        description: "+10 energia inicial e curas +8% na proxima luta.",
        modifiers: { initialEnergyBonus: 10, healingDoneMultiplier: 1.08 },
      });

      const message = cleared > 0
        ? "A fonte fechou ferimentos recentes e fortaleceu a equipe para a proxima luta."
        : "A equipe bebeu com cuidado. A proxima luta comeca com energia extra.";
      return appendMoraleChange(state, message, 2, "A fonte acalmou a equipe.");
    }

    if (Math.random() < 0.72) {
      clearInitialDamageEffects(state);
      addTowerBattleEffect(state, {
        label: "Corrente revigorante",
        description: "ATK +12%, +18 energia inicial e curas +12% na proxima luta.",
        modifiers: { atkMultiplier: 1.12, initialEnergyBonus: 18, healingDoneMultiplier: 1.12 },
      });
      return appendMoraleChange(state, "A corrente aceitou a equipe. Um vigor azul envolve os herois.", 4, "A bencao elevou o animo.");
    }

    addTowerBattleEffect(state, {
      label: "Agua envenenada",
      description: "A equipe entra com 12% de dano na proxima luta.",
      modifiers: { initialDamagePct: 0.12 },
    });
    return appendMoraleChange(state, "A fonte estava corrompida. A equipe segue ferida para o proximo combate.", -4, "A corrupcao abalou a equipe.");
  }

  function resolveMysteryChest(state, event, choiceId) {
    const floorScale = getFloorEventScale(event.floor);
    const roll = Math.random();

    if (choiceId === "openCarefully") {
      if (roll < 0.45) {
        return appendMoraleChange(state, `O bau continha moedas antigas: ${grantGold(state, 55 + floorScale * 11)}.`, 1, "O achado animou a equipe.");
      }

      if (roll < 0.7) {
        return appendMoraleChange(
          state,
          `Cristais cairam do lacre quebrado: ${grantCrystals(state, 8 + Math.floor(floorScale * 1.4))}.`,
          1,
          "O achado animou a equipe."
        );
      }

      if (roll < 0.88) {
        const item = grantEquipment(state, event.floor);
        return appendMoraleChange(state, `Equipamento encontrado: ${item.name}.`, 1, "O achado animou a equipe.");
      }

      addTowerBattleEffect(state, {
        label: "Dardos ocultos",
        description: "A equipe entra com 8% de dano na proxima luta.",
        modifiers: { initialDamagePct: 0.08 },
      });
      return appendMoraleChange(state, "O bau disparou dardos ocultos. A equipe foi ferida.", -3, "A armadilha reduziu a confianca.");
    }

    if (roll < 0.35) {
      const item = grantEquipment(state, event.floor + 2);
      return appendMoraleChange(state, `O selo se partiu e revelou equipamento melhor: ${item.name}.`, 2, "A recompensa fortaleceu a confianca.");
    }

    if (roll < 0.65) {
      const gold = 85 + floorScale * 15;
      const crystals = 10 + Math.floor(floorScale * 1.8);
      Echoes.addResource(state, "gold", gold);
      Echoes.addResource(state, "crystals", crystals);
      return appendMoraleChange(state, `O bau despejou riqueza instavel: +${gold} ouro e +${crystals} cristais.`, 2, "A recompensa fortaleceu a confianca.");
    }

    addTowerBattleEffect(state, {
      label: "Explosao do selo",
      description: "A equipe entra com 14% de dano e DEF -8% na proxima luta.",
      modifiers: { initialDamagePct: 0.14, defMultiplier: 0.92 },
    });
    return appendMoraleChange(state, "O selo explodiu. A recompensa virou uma armadilha.", -4, "A explosao abalou a equipe.");
  }

  function resolveLostMerchant(state, event, choice) {
    if (choice.id === "buyPotion") {
      clearInitialDamageEffects(state);
      addTowerBattleEffect(state, {
        label: "Pocao turva",
        description: "HP maximo +6% e curas +12% na proxima luta.",
        modifiers: { maxHpMultiplier: 1.06, healingDoneMultiplier: 1.12 },
      });
      return appendMoraleChange(state, "A pocao tem gosto pessimo, mas estabiliza a equipe.", 2, "Os suprimentos trouxeram alivio.");
    }

    if (choice.id === "buyEquipment") {
      const item = grantEquipment(state, Math.max(1, event.floor - 1), 1);
      return appendMoraleChange(state, `O mercador entregou ${item.name}.`, 1, "O novo equipamento animou a equipe.");
    }

    if (choice.id === "buyTonic") {
      addTowerBattleEffect(state, {
        label: "Tonico de combate",
        description: "ATK +10% e SPD +8% na proxima luta.",
        modifiers: { atkMultiplier: 1.1, spdMultiplier: 1.08 },
      });
      return appendMoraleChange(state, "O tonico aquece o sangue da equipe. A proxima luta sera mais agressiva.", 1, "A preparacao trouxe foco.");
    }

    return "A equipe recusou a oferta e guardou o ouro.";
  }

  function resolveDarkAltar(state, event, choiceId) {
    if (choiceId === "bloodPact") {
      addTowerBattleEffect(state, {
        label: "Pacto sombrio",
        description: "ATK +20%, mas HP maximo -10% na proxima luta.",
        modifiers: { atkMultiplier: 1.2, maxHpMultiplier: 0.9 },
      });
      return appendMoraleChange(state, "O altar aceitou sangue. Poder bruto acompanha a equipe.", -5, "O pacto cobrou um peso emocional.");
    }

    if (choiceId === "consumeAshes") {
      addTowerBattleEffect(state, {
        label: "Cinzas famintas",
        description: "ATK +25%, mas 8% de dano inicial e dano recebido +10%.",
        modifiers: { atkMultiplier: 1.25, initialDamagePct: 0.08, playerDamageTakenMultiplier: 1.1 },
      });
      return appendMoraleChange(state, "As cinzas queimam por dentro. A equipe ganhou forca, mas ficou vulneravel.", -7, "As cinzas perturbaram a equipe.");
    }

    const fragments = 8 + Math.floor(getFloorEventScale(event.floor) * 1.5);
    return appendMoraleChange(state, `O circulo foi quebrado sem pacto. ${grantFragments(state, fragments)}.`, 2, "Recusar o altar firmou a vontade.");
  }

  function resolvePrisoner(state, event, choiceId) {
    const roll = Math.random();

    if (choiceId === "freePrisoner") {
      if (roll < 0.55) {
        const hero = grantHero(state, Math.random() < 0.22 ? 2 : 1);
        return appendMoraleChange(state, `${hero.name} se juntou a equipe.`, 3, "Salvar o prisioneiro inspirou a equipe.");
      }

      if (roll < 0.75) {
        const gold = 45 + getFloorEventScale(event.floor) * 9;
        return appendMoraleChange(state, `O prisioneiro fugiu, mas deixou uma bolsa: ${grantGold(state, gold)}.`, 1, "A equipe aceitou o pequeno ganho.");
      }

      addTowerBattleEffect(state, {
        label: "Emboscada do falso prisioneiro",
        description: "A equipe entra com 10% de dano e dano recebido +6% na proxima luta.",
        modifiers: { initialDamagePct: 0.1, playerDamageTakenMultiplier: 1.06 },
      });
      return appendMoraleChange(state, "Era uma emboscada. A equipe escapou, mas sofreu ferimentos.", -5, "A traicao abalou a equipe.");
    }

    if (roll < 0.42) {
      const hero = grantHero(state, Math.random() < 0.45 ? 2 : 1);
      return appendMoraleChange(state, `${hero.name} aceitou o juramento e foi recrutado.`, 2, "O juramento trouxe esperanca.");
    }

    if (roll < 0.62) {
      const crystals = 6 + Math.floor(getFloorEventScale(event.floor) * 1.2);
      return appendMoraleChange(state, `O prisioneiro comprou a liberdade com ${grantCrystals(state, crystals)}.`, 1, "A equipe aceitou o acordo.");
    }

    addTowerBattleEffect(state, {
      label: "Traicao na cela",
      description: "A equipe entra com 14% de dano na proxima luta.",
      modifiers: { initialDamagePct: 0.14 },
    });
    return appendMoraleChange(state, "O juramento era falso. A cela escondia uma emboscada.", -6, "A emboscada quebrou a confianca.");
  }

  function resolveTrap(state, event, choiceId) {
    if (choiceId === "disarmTrap") {
      if (Math.random() < 0.6) {
        const fragments = 6 + Math.floor(getFloorEventScale(event.floor));
        return appendMoraleChange(state, `A armadilha foi desmontada. ${grantFragments(state, fragments)}.`, 2, "A precisao da equipe elevou a moral.");
      }

      addTowerBattleEffect(state, {
        label: "Falha ao desarmar",
        description: "A equipe entra com 10% de dano na proxima luta.",
        modifiers: { initialDamagePct: 0.1 },
      });
      return appendMoraleChange(state, "O mecanismo disparou durante a tentativa. A equipe sofreu dano.", -4, "A falha abalou a equipe.");
    }

    if (choiceId === "rushThrough") {
      addTowerBattleEffect(state, {
        label: "Corrida pela armadilha",
        description: "A equipe entra com 8% de dano, mas SPD +12% na proxima luta.",
        modifiers: { initialDamagePct: 0.08, spdMultiplier: 1.12 },
      });
      return appendMoraleChange(state, "A equipe atravessou a zona letal correndo. Houve ferimentos, mas todos estao alertas.", -2, "A corrida deixou a equipe tensa.");
    }

    addTowerBattleEffect(state, {
      label: "Impacto bloqueado",
      description: "A equipe entra com 5% de dano e DEF +12% na proxima luta.",
      modifiers: { initialDamagePct: 0.05, defMultiplier: 1.12 },
    });
    return appendMoraleChange(state, "A linha de frente conteve o impacto e reorganizou a defesa.", 1, "A defesa bem sucedida conteve o medo.");
  }

  function resolveEventEffect(state, event, choice) {
    if (event.typeKey === "healingFountain") return resolveHealingFountain(state, event, choice.id);
    if (event.typeKey === "mysteryChest") return resolveMysteryChest(state, event, choice.id);
    if (event.typeKey === "lostMerchant") return resolveLostMerchant(state, event, choice);
    if (event.typeKey === "darkAltar") return resolveDarkAltar(state, event, choice.id);
    if (event.typeKey === "prisoner") return resolvePrisoner(state, event, choice.id);
    if (event.typeKey === "trap") return resolveTrap(state, event, choice.id);
    return "O evento se dissipou sem efeito.";
  }

  function spendChoiceCost(state, choice) {
    if (!choice.cost) return true;
    return Echoes.spendResource(state, choice.cost.resource, choice.cost.amount);
  }

  function resolveTowerEventChoice(state, choiceId) {
    ensureTowerEventState(state);

    const event = state.pendingTowerEvent;
    const definition = getTowerEventDefinition(event && event.typeKey);
    const choice = getTowerEventChoice(definition, choiceId);

    if (!event || !definition || !choice) {
      return { ok: false, message: "Evento da torre nao encontrado." };
    }

    const availability = canChooseTowerEventOption(state, event, choiceId);
    if (!availability.ok) {
      return availability;
    }

    if (!spendChoiceCost(state, choice)) {
      return { ok: false, message: "Recursos insuficientes para essa escolha." };
    }

    const message = resolveEventEffect(state, event, choice);
    const shouldStartBattle = event.phase === "pre";

    recordTowerEventHistory(state, event, choice, message);
    state.pendingTowerEvent = null;

    return {
      ok: true,
      startBattle: shouldStartBattle,
      message,
    };
  }

  function planTowerEventForAttempt(state, context) {
    ensureTowerEventState(state);

    if (state.pendingTowerEvent || state.plannedTowerPostEvent) return null;
    if (Math.random() >= TOWER_EVENT_CHANCE) return null;

    const phase = context.isBoss || Math.random() < 0.42 ? "post" : "pre";
    const fallbackEventKeys = phase === "post" ? POST_EVENT_KEYS : PRE_EVENT_KEYS;
    const eventKeys = Echoes.getChapterEventKeys
      ? Echoes.getChapterEventKeys(context.floorNumber, phase, fallbackEventKeys)
      : fallbackEventKeys;
    const event = createTowerEvent(pickRandom(eventKeys), phase, context.floorNumber, context.floorData.title);
    const definition = getTowerEventDefinition(event.typeKey);

    if (phase === "post") {
      state.plannedTowerPostEvent = event;
      return { phase };
    }

    state.pendingTowerEvent = event;
    return {
      phase,
      message: `${definition.title} apareceu antes do combate do andar ${context.floorNumber}.`,
    };
  }

  function activatePlannedTowerPostEvent(state, floorNumber) {
    ensureTowerEventState(state);

    const event = state.plannedTowerPostEvent;
    if (!event || event.floor !== floorNumber) {
      state.plannedTowerPostEvent = null;
      return false;
    }

    state.pendingTowerEvent = event;
    state.plannedTowerPostEvent = null;
    return true;
  }

  function clearPlannedTowerPostEvent(state) {
    ensureTowerEventState(state);
    state.plannedTowerPostEvent = null;
  }

  function multiplyStat(unit, statKey, multiplier) {
    if (!multiplier || multiplier === 1) return;
    unit.stats[statKey] = Math.max(1, Math.round((unit.stats[statKey] || 1) * multiplier));
  }

  function applyEffectToTeam(effect, playerTeam, floorModifiers) {
    const modifiers = effect.modifiers || {};

    if (modifiers.healingDoneMultiplier) {
      floorModifiers.healingDoneMultiplier *= modifiers.healingDoneMultiplier;
    }

    if (modifiers.playerDamageTakenMultiplier) {
      floorModifiers.playerDamageTakenMultiplier *= modifiers.playerDamageTakenMultiplier;
    }

    playerTeam.forEach((unit) => {
      if (modifiers.maxHpMultiplier) {
        unit.maxHp = Math.max(1, Math.round(unit.maxHp * modifiers.maxHpMultiplier));
        unit.stats.hp = unit.maxHp;
        unit.hp = Math.min(unit.hp, unit.maxHp);
      }

      multiplyStat(unit, "atk", modifiers.atkMultiplier);
      multiplyStat(unit, "def", modifiers.defMultiplier);
      multiplyStat(unit, "spd", modifiers.spdMultiplier);
      multiplyStat(unit, "focus", modifiers.focusMultiplier);
      multiplyStat(unit, "luck", modifiers.luckMultiplier);

      if (modifiers.initialDamagePct) {
        const damage = Math.max(1, Math.round(unit.maxHp * modifiers.initialDamagePct));
        unit.hp = Math.max(1, unit.hp - damage);
      }

      if (modifiers.initialEnergyBonus) {
        const maxEnergy = Echoes.BATTLE_CONFIG ? Echoes.BATTLE_CONFIG.maxUnitEnergy : 125;
        unit.energy = Math.max(0, Math.min(maxEnergy, (unit.energy || 0) + modifiers.initialEnergyBonus));
      }
    });
  }

  function applyAndConsumeTowerBattleEffects(state, playerTeam, floorModifiers) {
    ensureTowerEventState(state);

    const effects = state.towerBattleEffects.filter((effect) => effect.scope === "nextBattle");
    if (effects.length === 0) return [];

    effects.forEach((effect) => applyEffectToTeam(effect, playerTeam, floorModifiers));
    state.towerBattleEffects = state.towerBattleEffects.filter((effect) => effect.scope !== "nextBattle");

    return effects.map((effect) => `Evento ativo: ${effect.label}. ${effect.description}`);
  }

  Echoes.TOWER_EVENT_CHANCE = TOWER_EVENT_CHANCE;
  Echoes.TOWER_EVENT_DEFINITIONS = TOWER_EVENT_DEFINITIONS;
  Echoes.getTowerEventDefinition = getTowerEventDefinition;
  Echoes.getTowerEventPhaseLabel = getTowerEventPhaseLabel;
  Echoes.canChooseTowerEventOption = canChooseTowerEventOption;
  Echoes.resolveTowerEventChoice = resolveTowerEventChoice;
  Echoes.planTowerEventForAttempt = planTowerEventForAttempt;
  Echoes.activatePlannedTowerPostEvent = activatePlannedTowerPostEvent;
  Echoes.clearPlannedTowerPostEvent = clearPlannedTowerPostEvent;
  Echoes.grantEquipment = grantEquipment;
  Echoes.applyAndConsumeTowerBattleEffects = applyAndConsumeTowerBattleEffects;
})(window);
