(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  function addRewardEvent(log, battle, type, message) {
    if (battle && Echoes.addBattleEvent) {
      Echoes.addBattleEvent(battle, type, message);
      return;
    }

    log.push(message);
  }

  function addRewardLogLines(reward, crystalDrop, echoFragmentDrop, equipmentDrop, log, battle, heroXpReward) {
    const displayedHeroXp = heroXpReward || reward.xp;

    addRewardEvent(
      log,
      battle,
      "reward",
      `Recompensa: +${reward.gold} ouro, +${reward.energyRefund} energia e +${displayedHeroXp} XP para cada heroi da formacao.`
    );

    if (crystalDrop > 0) addRewardEvent(log, battle, "reward", `Cristais encontrados: +${crystalDrop}.`);
    if (reward.essence > 0) addRewardEvent(log, battle, "reward", `Essencia recuperada: +${reward.essence}.`);
    if (reward.fragments > 0) addRewardEvent(log, battle, "reward", `Fragmentos recolhidos: +${reward.fragments}.`);
    if (echoFragmentDrop > 0) addRewardEvent(log, battle, "reward", `Fragmentos de Eco ressoaram: +${echoFragmentDrop}.`);
    if (equipmentDrop) {
      addRewardEvent(
        log,
        battle,
        "reward",
        `Equipamento obtido: ${equipmentDrop.name} (${Echoes.getEquipmentTypeName(equipmentDrop.type)}, ${Echoes.getEquipmentBonusLabel(equipmentDrop)}).`
      );
    }
  }

  function grantHeroXpRewards(state, heroIds, xpAmount, log, battle) {
    heroIds.forEach((heroId) => {
      const hero = Echoes.findHero(state, heroId);
      if (!hero) return;

      const xpResult = Echoes.addHeroXp(hero, xpAmount);
      if (xpResult.levelUps.length > 0) {
        addRewardEvent(log, battle, "reward", `${hero.name} subiu para o nivel ${hero.level}.`);
      }
    });
  }

  function unlockFloorMilestones(state, floorNumber, log, battle) {
    if (floorNumber === 20) {
      addRewardEvent(log, battle, "reward", "Marco vencido: proximo capitulo liberado.");
      return;
    }

    if (floorNumber === 30) {
      addRewardEvent(log, battle, "reward", "Marco vencido: o Abismo Infernal foi liberado.");
      return;
    }

    if (floorNumber === 40) {
      addRewardEvent(log, battle, "reward", "Campanha atual concluida: todos os capitulos foram vencidos.");
      return;
    }

    if (floorNumber !== 10) return;

    state.baseRooms.workshop = Math.max(1, state.baseRooms.workshop || 0);
    addRewardEvent(log, battle, "reward", "Oficina desbloqueada na base.");
  }

  function getResourceRewardText(reward) {
    return Object.keys(reward)
      .filter((resourceKey) => reward[resourceKey] > 0)
      .map((resourceKey) => {
        if (resourceKey === "gold") return `+${reward[resourceKey]} ouro`;
        if (resourceKey === "crystals") return `+${reward[resourceKey]} cristais`;
        if (resourceKey === "essence") return `+${reward[resourceKey]} essencia`;
        if (resourceKey === "echoFragments") return `+${reward[resourceKey]} fragmentos de eco`;
        return `+${reward[resourceKey]} fragmentos`;
      })
      .join(", ");
  }

  function grantChapterCompletionReward(state, floorNumber, log, battle) {
    if (!Echoes.isChapterFinalFloor || !Echoes.isChapterFinalFloor(floorNumber)) return;

    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;
    if (!chapter) return;

    state.completedTowerChapters = Array.isArray(state.completedTowerChapters) ? state.completedTowerChapters : [];
    if (state.completedTowerChapters.includes(chapter.id)) return;

    const reward = chapter.completionReward || {};
    Object.keys(reward).forEach((resourceKey) => {
      Echoes.addResource(state, resourceKey, reward[resourceKey]);
    });

    state.completedTowerChapters.push(chapter.id);
    state.lastChapterCompletion = {
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterName: chapter.name,
      nextChapterName: Echoes.TOWER_CHAPTERS[chapter.number] ? Echoes.TOWER_CHAPTERS[chapter.number].name : "",
      reward,
      completedAt: new Date().toISOString(),
    };

    addRewardEvent(
      log,
      battle,
      "reward",
      `Capitulo concluido: ${chapter.name}. Recompensa especial: ${getResourceRewardText(reward)}.`
    );
  }

  function grantTowerVictoryRewards(state, floorNumber, participatingHeroIds, log, battle, options) {
    const shouldAdvanceFloor = !options || options.advanceFloor !== false;
    const reward = Echoes.getFloorReward(floorNumber);
    const heroXpReward = Math.max(
      1,
      Math.round(reward.xp * (Echoes.getWeeklyEventModifier ? Echoes.getWeeklyEventModifier("heroXpMultiplier", 1) : 1))
    );
    const crystalDrop = Math.random() < reward.crystalChance ? reward.crystalAmount : 0;
    const echoFragmentDrop = Math.random() < reward.echoFragmentChance ? reward.echoFragmentAmount : 0;
    const shouldDropEquipment = reward.guaranteedEquipment || Math.random() < reward.equipmentChance;
    const equipmentDrop = shouldDropEquipment ? Echoes.addEquipmentToInventory(state, Echoes.generateEquipment(floorNumber)) : null;

    Echoes.addResource(state, "gold", reward.gold);
    Echoes.addResource(state, "crystals", crystalDrop);
    Echoes.addResource(state, "essence", reward.essence);
    Echoes.addResource(state, "fragments", reward.fragments);
    Echoes.addResource(state, "echoFragments", echoFragmentDrop);
    Echoes.addResource(state, "energy", reward.energyRefund);
    Echoes.addAccountXp(state, Math.ceil(reward.xp / 2));

    addRewardLogLines(reward, crystalDrop, echoFragmentDrop, equipmentDrop, log, battle, heroXpReward);
    grantHeroXpRewards(state, participatingHeroIds, heroXpReward, log, battle);

    if (shouldAdvanceFloor) {
      unlockFloorMilestones(state, floorNumber, log, battle);
      grantChapterCompletionReward(state, floorNumber, log, battle);
      state.towerFloor = Math.max(state.towerFloor, Math.min(Echoes.CONFIG.towerMaxFloor + 1, floorNumber + 1));

      if (Echoes.queueBossAfterNarrative) {
        Echoes.queueBossAfterNarrative(state, floorNumber);
      }
      if (Echoes.queueChapterStartNarrative) {
        Echoes.queueChapterStartNarrative(state, state.towerFloor);
      }
    }
  }

  Echoes.grantTowerVictoryRewards = grantTowerVictoryRewards;
})(window);
