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

  function addRewardLogLines(reward, crystalDrop, equipmentDrop, log, battle, heroXpReward) {
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
      addRewardEvent(log, battle, "reward", "Marco vencido: andares finais da torre liberados.");
      return;
    }

    if (floorNumber === 30) {
      addRewardEvent(log, battle, "reward", "Torre de 30 andares concluida.");
      return;
    }

    if (floorNumber !== 10) return;

    state.baseRooms.workshop = Math.max(1, state.baseRooms.workshop || 0);
    addRewardEvent(log, battle, "reward", "Oficina desbloqueada na base.");
  }

  function grantTowerVictoryRewards(state, floorNumber, participatingHeroIds, log, battle, options) {
    const shouldAdvanceFloor = !options || options.advanceFloor !== false;
    const reward = Echoes.getFloorReward(floorNumber);
    const heroXpReward = Math.max(
      1,
      Math.round(reward.xp * (Echoes.getWeeklyEventModifier ? Echoes.getWeeklyEventModifier("heroXpMultiplier", 1) : 1))
    );
    const crystalDrop = Math.random() < reward.crystalChance ? reward.crystalAmount : 0;
    const shouldDropEquipment = reward.guaranteedEquipment || Math.random() < reward.equipmentChance;
    const equipmentDrop = shouldDropEquipment ? Echoes.addEquipmentToInventory(state, Echoes.generateEquipment(floorNumber)) : null;

    Echoes.addResource(state, "gold", reward.gold);
    Echoes.addResource(state, "crystals", crystalDrop);
    Echoes.addResource(state, "essence", reward.essence);
    Echoes.addResource(state, "fragments", reward.fragments);
    Echoes.addResource(state, "energy", reward.energyRefund);
    Echoes.addAccountXp(state, Math.ceil(reward.xp / 2));

    addRewardLogLines(reward, crystalDrop, equipmentDrop, log, battle, heroXpReward);
    grantHeroXpRewards(state, participatingHeroIds, heroXpReward, log, battle);

    if (shouldAdvanceFloor) {
      unlockFloorMilestones(state, floorNumber, log, battle);
      state.towerFloor = Math.max(state.towerFloor, Math.min(Echoes.CONFIG.towerMaxFloor + 1, floorNumber + 1));
    }
  }

  Echoes.grantTowerVictoryRewards = grantTowerVictoryRewards;
})(window);
