(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const BATTLE_CONFIG = {
    maxRounds: 45,
    frontTargetChance: 0.72,
    tauntTargetChance: 0.86,
    priestHealThreshold: 0.65,
    maxUnitEnergy: 125,
    skillEnergyCost: 100,
    frontSlotStartingEnergy: 15,
    attackEnergyGain: 25,
    damageEnergyGain: 10,
    killEnergyGain: 20,
  };

  const PLAYER_SKILLS = {
    warrior: { name: "Golpe Pesado", multiplier: 1.75, critBonus: 0.03 },
    archer: { name: "Flecha Precisa", multiplier: 1.35, critBonus: 0.3 },
    rogue: { name: "Ataque Sombrio", multiplier: 1.55, executeMultiplier: 2.05, critBonus: 0.14 },
  };

  function createPlayerBattleUnit(hero, slotIndex, state) {
    const isFrontSlot = slotIndex < Echoes.CONFIG.frontSlots;
    const effectiveStats = state && Echoes.getHeroEffectiveStats ? Echoes.getHeroEffectiveStats(state, hero) : hero.stats;

    const maxHp = effectiveStats.hp;
    const currentHp = Number.isFinite(hero.currentHp) ? Math.max(0, Math.min(maxHp, Math.round(hero.currentHp))) : maxHp;

    return {
      id: hero.id,
      sourceId: hero.id,
      name: hero.name,
      side: "player",
      classKey: hero.classKey,
      className: hero.className,
      specializationKey: hero.specializationKey || null,
      specializationName: Echoes.getHeroSpecialization ? Echoes.getHeroSpecialization(hero)?.name || "" : "",
      rarity: hero.rarity,
      level: hero.level,
      stats: Object.assign({}, effectiveStats),
      maxHp,
      hp: currentHp > 0 ? currentHp : 1,
      energy: isFrontSlot ? BATTLE_CONFIG.frontSlotStartingEnergy : 0,
      morale: Number.isFinite(hero.morale) ? hero.morale : 80,
      affinityLevels: {},
      statuses: {},
      position: isFrontSlot ? "front" : "back",
    };
  }

  function getLivingUnits(units) {
    return units.filter((unit) => unit.hp > 0);
  }

  function hasLivingUnits(units) {
    return getLivingUnits(units).length > 0;
  }

  function selectMostWoundedUnit(units) {
    return (
      getLivingUnits(units)
        .filter((unit) => unit.hp < unit.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null
    );
  }

  function selectLowestHpRatioUnit(units) {
    return getLivingUnits(units).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null;
  }

  function ensureBattlePerformance(battle, unit) {
    if (!battle || !unit || unit.side !== "player") return null;
    battle.performance = battle.performance || {};
    battle.performance[unit.id] = battle.performance[unit.id] || {
      id: unit.id,
      name: unit.name,
      className: unit.className || unit.classKey || "",
      damageDealt: 0,
      healingDone: 0,
      damageTaken: 0,
      kills: 0,
      skillUses: 0,
      moraleFailures: 0,
      affinityProtections: 0,
    };
    return battle.performance[unit.id];
  }

  function addPerformanceValue(battle, unit, key, amount) {
    const stats = ensureBattlePerformance(battle, unit);
    if (!stats) return;
    stats[key] = Math.max(0, (stats[key] || 0) + amount);
  }

  function selectAttackTarget(candidates, attacker, battle) {
    const living = getLivingUnits(candidates);
    if (living.length === 0) return null;

    const taunting = living.filter((unit) => unit.statuses && unit.statuses.taunt > 0);
    if (taunting.length > 0 && Math.random() < BATTLE_CONFIG.tauntTargetChance) {
      return taunting[Math.floor(Math.random() * taunting.length)];
    }

    const wounded = selectMostWoundedUnit(candidates);
    if (attacker.side === "enemy" && attacker.enemyKey === "markedAcolyte" && wounded) {
      return wounded;
    }

    const frontLine = living.filter((unit) => unit.position === "front");
    const targetPool = frontLine.length > 0 && Math.random() < BATTLE_CONFIG.frontTargetChance ? frontLine : living;
    const target = targetPool[Math.floor(Math.random() * targetPool.length)];

    const specializedTarget = Echoes.getSpecializationProtectionTarget
      ? Echoes.getSpecializationProtectionTarget(target, living)
      : target;

    if (specializedTarget !== target) return specializedTarget;

    const affinityTarget = Echoes.getAffinityProtectionTarget ? Echoes.getAffinityProtectionTarget(target, living, attacker) : target;
    if (affinityTarget !== target) {
      addPerformanceValue(battle, affinityTarget, "affinityProtections", 1);
    }

    return affinityTarget;
  }

  function createPlayerTeam(formationHeroes, state) {
    const playerTeam = formationHeroes
      .map((hero, slotIndex) => (hero ? createPlayerBattleUnit(hero, slotIndex, state) : null))
      .filter(Boolean);

    if (state && Echoes.getAffinitySummary) {
      playerTeam.forEach((unit) => {
        playerTeam.forEach((ally) => {
          if (unit.sourceId === ally.sourceId) return;
          unit.affinityLevels[ally.sourceId] = Echoes.getAffinitySummary(state, unit.sourceId, ally.sourceId).level;
        });
      });
    }

    return playerTeam;
  }

  function formatUnitHp(unit) {
    return `${Math.max(0, unit.hp)}/${unit.maxHp} HP`;
  }

  function addUnitEnergy(unit, amount) {
    const multiplier = Echoes.getSpecializationEnergyGainMultiplier ? Echoes.getSpecializationEnergyGainMultiplier(unit) : 1;
    unit.energy = Math.min(BATTLE_CONFIG.maxUnitEnergy, unit.energy + Math.round(amount * multiplier));
  }

  function snapshotStatuses(unit) {
    return Object.keys(unit.statuses || {}).reduce((statuses, key) => {
      if (unit.statuses[key] > 0) statuses[key] = unit.statuses[key];
      return statuses;
    }, {});
  }

  function serializeBattleUnit(unit) {
    return {
      id: unit.id,
      name: unit.name,
      side: unit.side,
      className: unit.className || unit.role || "Inimigo",
      role: unit.role || unit.classKey || unit.enemyKey || "",
      position: unit.position,
      hp: Math.max(0, unit.hp),
      maxHp: unit.maxHp,
      energy: Math.round(unit.energy || 0),
      maxEnergy: BATTLE_CONFIG.skillEnergyCost,
      alive: unit.hp > 0,
      statuses: snapshotStatuses(unit),
    };
  }

  function serializeBattleTeam(team) {
    return team.map(serializeBattleUnit);
  }

  function createBattleSnapshot(battle) {
    return {
      playerTeam: serializeBattleTeam(battle.playerTeam),
      enemyTeam: serializeBattleTeam(battle.enemyTeam),
    };
  }

  function addBattleEvent(battle, type, message, details) {
    const snapshot = createBattleSnapshot(battle);
    const event = Object.assign(
      {
        type,
        message,
        round: battle.round || 0,
        playerTeam: snapshot.playerTeam,
        enemyTeam: snapshot.enemyTeam,
      },
      details || {}
    );

    battle.log.push(message);
    battle.events.push(event);
    return event;
  }

  function createBattleContext(playerTeam, enemyTeam, introLines, modifiers) {
    const battle = {
      playerTeam,
      enemyTeam,
      log: [],
      events: [],
      round: 0,
      modifiers: modifiers || {},
      performance: {},
    };

    playerTeam.forEach((unit) => ensureBattlePerformance(battle, unit));
    introLines.forEach((line) => addBattleEvent(battle, "info", line));
    return battle;
  }

  function getEffectiveDefense(unit) {
    const guardMultiplier = unit.statuses && unit.statuses.guard > 0 ? 1.6 : 1;
    return (unit.stats.def || 0) * guardMultiplier;
  }

  function calculateDamage(attacker, target, multiplier, critBonus, battle) {
    const specializationCritBonus = Echoes.getSpecializationCritBonus ? Echoes.getSpecializationCritBonus(attacker, target, battle) : 0;
    const critChance = Math.min(0.65, (attacker.stats.luck || 0) / 100 + (critBonus || 0) + specializationCritBonus);
    const critical = Math.random() < critChance;
    const variance = 0.9 + Math.random() * 0.2;
    const markedMultiplier = target.statuses && target.statuses.mark ? 1.2 : 1;
    const specializationMultiplier = Echoes.getSpecializationDamageMultiplier
      ? Echoes.getSpecializationDamageMultiplier(attacker, target, battle)
      : 1;
    const rawDamage = attacker.stats.atk * multiplier * variance * (critical ? 1.75 : 1) * markedMultiplier * specializationMultiplier;
    const mitigation = getEffectiveDefense(target) * 0.48;
    const playerDamageTakenMultiplier =
      target.side === "player" && battle && battle.modifiers ? battle.modifiers.playerDamageTakenMultiplier || 1 : 1;

    return {
      amount: Math.max(1, Math.round((rawDamage - mitigation) * playerDamageTakenMultiplier)),
      critical,
    };
  }

  function applyDamage(attacker, target, multiplier, battle, label, critBonus) {
    if (target.side === "player" && Echoes.shouldDuelistEvade && Echoes.shouldDuelistEvade(target)) {
      addBattleEvent(battle, "specialization", `${target.name} esquivou de ${attacker.name} e contra-atacou como Duelista.`, {
        actorId: target.id,
        targetId: attacker.id,
        skillName: "Passo de Duelo",
      });

      if (attacker.hp > 0) {
        const counterDamage = calculateDamage(target, attacker, 0.55, 0.04, battle);
        attacker.hp = Math.max(0, attacker.hp - counterDamage.amount);
        addPerformanceValue(battle, target, "damageDealt", counterDamage.amount);
        addPerformanceValue(battle, attacker, "damageTaken", counterDamage.amount);
        addBattleEvent(
          battle,
          counterDamage.critical ? "critical" : "damage",
          `${target.name} contra-atacou ${attacker.name} causando ${counterDamage.amount} de dano. (${formatUnitHp(attacker)})`,
          { actorId: target.id, targetId: attacker.id, amount: counterDamage.amount, critical: counterDamage.critical }
        );

        if (attacker.hp <= 0) {
          addPerformanceValue(battle, target, "kills", 1);
          addBattleEvent(battle, "death", `${attacker.name} caiu.`, { actorId: target.id, targetId: attacker.id });
        }
      }

      return 0;
    }

    const damage = calculateDamage(attacker, target, multiplier, critBonus, battle);

    target.hp = Math.max(0, target.hp - damage.amount);
    addPerformanceValue(battle, attacker, "damageDealt", damage.amount);
    addPerformanceValue(battle, target, "damageTaken", damage.amount);
    addUnitEnergy(attacker, BATTLE_CONFIG.attackEnergyGain);
    addUnitEnergy(target, BATTLE_CONFIG.damageEnergyGain);

    const critText = damage.critical ? " CRITICO!" : "";
    const eventType = damage.critical ? "critical" : "damage";
    addBattleEvent(
      battle,
      eventType,
      `${attacker.name} ${label} ${target.name} causando ${damage.amount} de dano.${critText} (${formatUnitHp(target)})`,
      { actorId: attacker.id, targetId: target.id, amount: damage.amount, critical: damage.critical }
    );

    if (target.hp <= 0) {
      addUnitEnergy(attacker, BATTLE_CONFIG.killEnergyGain);
      addPerformanceValue(battle, attacker, "kills", 1);
      addBattleEvent(battle, "death", `${target.name} caiu.`, { actorId: attacker.id, targetId: target.id });
    }

    return damage.amount;
  }

  function healUnit(healer, target, multiplier, battle, label, isSpecial) {
    const healingMultiplier =
      healer.side === "player" && battle && battle.modifiers ? battle.modifiers.healingDoneMultiplier || 1 : 1;
    const specializationHealingMultiplier = Echoes.getSpecializationHealingMultiplier
      ? Echoes.getSpecializationHealingMultiplier(healer)
      : 1;
    const amount = Math.max(
      8,
      Math.round(
        (healer.stats.atk * multiplier + healer.stats.focus * 2) *
          (0.9 + Math.random() * 0.2) *
          healingMultiplier *
          specializationHealingMultiplier
      )
    );

    target.hp = Math.min(target.maxHp, target.hp + amount);
    addPerformanceValue(battle, healer, "healingDone", amount);
    addUnitEnergy(healer, BATTLE_CONFIG.attackEnergyGain);
    addBattleEvent(
      battle,
      isSpecial ? "skill-heal" : "heal",
      `${healer.name} ${label} ${target.name} em ${amount} HP. (${formatUnitHp(target)})`,
      { actorId: healer.id, targetId: target.id, amount }
    );
  }

  function useWarriorSkill(unit, enemies, battle) {
    const target = selectAttackTarget(enemies, unit, battle);
    if (!target) return;

    addBattleEvent(battle, "skill", `${unit.name} usou Golpe Pesado em ${target.name}.`, {
      actorId: unit.id,
      targetId: target.id,
      skillName: "Golpe Pesado",
    });
    applyDamage(unit, target, PLAYER_SKILLS.warrior.multiplier, battle, "esmagou", PLAYER_SKILLS.warrior.critBonus);
  }

  function useArcherSkill(unit, enemies, battle) {
    const target = selectAttackTarget(enemies, unit, battle);
    if (!target) return;

    addBattleEvent(battle, "skill", `${unit.name} usou Flecha Precisa em ${target.name}.`, {
      actorId: unit.id,
      targetId: target.id,
      skillName: "Flecha Precisa",
    });
    applyDamage(unit, target, PLAYER_SKILLS.archer.multiplier, battle, "perfurou", PLAYER_SKILLS.archer.critBonus);
  }

  function useMageSkill(unit, enemies, battle) {
    addBattleEvent(battle, "skill", `${unit.name} usou Explosão Arcana contra todos os inimigos.`, {
      actorId: unit.id,
      skillName: "Explosão Arcana",
    });

    const areaMultiplier = Echoes.getElementalistAreaMultiplier ? Echoes.getElementalistAreaMultiplier(unit) : 1;
    getLivingUnits(enemies).forEach((target) => applyDamage(unit, target, 0.92 * areaMultiplier, battle, "atingiu", 0.02));
  }

  function usePriestSkill(unit, allies, battle) {
    const target = selectLowestHpRatioUnit(allies) || unit;

    addBattleEvent(battle, "skill", `${unit.name} usou Cura Divina em ${target.name}, o aliado com menor HP.`, {
      actorId: unit.id,
      targetId: target.id,
      skillName: "Cura Divina",
    });
    healUnit(unit, target, 1.8, battle, "curou", true);
  }

  function useRogueSkill(unit, enemies, battle) {
    const target = selectLowestHpRatioUnit(enemies);
    if (!target) return;

    const isExecuteTarget = target.hp / target.maxHp <= 0.4;
    const multiplier = isExecuteTarget ? PLAYER_SKILLS.rogue.executeMultiplier : PLAYER_SKILLS.rogue.multiplier;
    const reason = isExecuteTarget ? "alvo enfraquecido" : "alvo vulneravel";

    addBattleEvent(battle, "skill", `${unit.name} usou Ataque Sombrio em ${target.name} (${reason}).`, {
      actorId: unit.id,
      targetId: target.id,
      skillName: "Ataque Sombrio",
    });
    applyDamage(unit, target, multiplier, battle, "golpeou das sombras", PLAYER_SKILLS.rogue.critBonus);
  }

  function useGuardianSkill(unit, battle) {
    unit.statuses.taunt = 2;
    unit.statuses.guard = 2;
    addBattleEvent(battle, "skill-buff", `${unit.name} usou Provocar, atraiu ataques e ganhou defesa temporaria.`, {
      actorId: unit.id,
      skillName: "Provocar",
    });
  }

  function usePlayerSpecialSkill(unit, allies, enemies, battle) {
    addPerformanceValue(battle, unit, "skillUses", 1);

    if (unit.classKey === "warrior") return useWarriorSkill(unit, enemies, battle);
    if (unit.classKey === "archer") return useArcherSkill(unit, enemies, battle);
    if (unit.classKey === "mage") return useMageSkill(unit, enemies, battle);
    if (unit.classKey === "priest") return usePriestSkill(unit, allies, battle);
    if (unit.classKey === "rogue") return useRogueSkill(unit, enemies, battle);
    if (unit.classKey === "guardian") return useGuardianSkill(unit, battle);

    const target = selectAttackTarget(enemies, unit, battle);
    if (!target) return;

    addBattleEvent(battle, "skill", `${unit.name} usou uma habilidade especial em ${target.name}.`, {
      actorId: unit.id,
      targetId: target.id,
      skillName: "Habilidade Especial",
    });
    applyDamage(unit, target, 1.4, battle, "atingiu", 0.05);
  }

  function useEnemySpecialSkill(unit, enemies, battle) {
    if (unit.enemyKey === "markedAcolyte") {
      const target = selectAttackTarget(enemies, unit, battle);
      if (!target) return;

      if (Echoes.shouldResistNegativeStatus && Echoes.shouldResistNegativeStatus(target)) {
        addBattleEvent(battle, "specialization", `${target.name} resistiu a Marca Instavel como Colosso.`, {
          actorId: target.id,
          targetId: unit.id,
          skillName: "Corpo Inabalavel",
        });
      } else {
        target.statuses.mark = 2;
        addBattleEvent(battle, "skill", `${unit.name} conjurou Marca Instavel em ${target.name}.`, {
          actorId: unit.id,
          targetId: target.id,
          skillName: "Marca Instavel",
        });
      }
      applyDamage(unit, target, 1.05, battle, "marcou e golpeou", 0.02);
      return;
    }

    if (unit.enemyKey === "crystalSeer") {
      const woundedAlly = selectMostWoundedUnit(battle.enemyTeam);
      if (woundedAlly) {
        healUnit(unit, woundedAlly, 1.15, battle, "restaurou", true);
        return;
      }
    }

    if (unit.enemyKey === "ironGolem") {
      const targets = getLivingUnits(enemies).slice(0, 2);
      addBattleEvent(battle, "skill", `${unit.name} esmagou o chao com peso antigo.`, {
        actorId: unit.id,
        skillName: "Esmagamento",
      });
      targets.forEach((target) => applyDamage(unit, target, 1.15, battle, "atingiu", 0));
      return;
    }

    if (unit.enemyKey === "shardOracle") {
      const targets = getLivingUnits(enemies)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
        .slice(0, 2);

      addBattleEvent(battle, "skill", `${unit.name} abriu o Selo Prismal e marcou alvos vulneraveis.`, {
        actorId: unit.id,
        skillName: "Selo Prismal",
      });
      targets.forEach((target) => {
        if (Echoes.shouldResistNegativeStatus && Echoes.shouldResistNegativeStatus(target)) {
          addBattleEvent(battle, "specialization", `${target.name} resistiu ao Selo Prismal como Colosso.`, {
            actorId: target.id,
            targetId: unit.id,
            skillName: "Corpo Inabalavel",
          });
        } else {
          target.statuses.mark = 2;
        }
        applyDamage(unit, target, 0.9, battle, "estilhacou", 0.03);
      });
      return;
    }

    if (unit.enemyKey === "eclipseAvatar") {
      const targets = getLivingUnits(enemies);
      addBattleEvent(battle, "skill", `${unit.name} liberou Eclipse Total e drenou energia da equipe.`, {
        actorId: unit.id,
        skillName: "Eclipse Total",
      });
      targets.forEach((target) => {
        target.energy = Math.max(0, (target.energy || 0) - 25);
        applyDamage(unit, target, 0.78, battle, "consumiu", 0.04);
      });
      return;
    }

    if (unit.enemyKey === "abyssalSerpent") {
      const targets = getLivingUnits(enemies);
      addBattleEvent(battle, "skill", `${unit.name} cuspiu Veneno Abissal sobre a equipe.`, {
        actorId: unit.id,
        skillName: "Veneno Abissal",
      });
      targets.forEach((target) => {
        target.energy = Math.max(0, (target.energy || 0) - 12);
        applyDamage(unit, target, 0.86, battle, "envenenou", 0.05);
      });
      return;
    }

    const target = selectAttackTarget(enemies, unit, battle);
    if (target) {
      addBattleEvent(battle, "skill", `${unit.name} usou golpe feroz em ${target.name}.`, {
        actorId: unit.id,
        targetId: target.id,
        skillName: "Golpe Feroz",
      });
      applyDamage(unit, target, 1.35, battle, "atingiu", 0.04);
    }
  }

  function decrementStatuses(unit) {
    if (!unit.statuses) return;

    Object.keys(unit.statuses).forEach((statusKey) => {
      unit.statuses[statusKey] -= 1;
      if (unit.statuses[statusKey] <= 0) {
        delete unit.statuses[statusKey];
      }
    });
  }

  function tryPriestHeal(unit, allies, battle) {
    if (unit.classKey !== "priest") return false;

    const woundedAlly = selectMostWoundedUnit(allies);
    if (!woundedAlly || woundedAlly.hp / woundedAlly.maxHp > BATTLE_CONFIG.priestHealThreshold) {
      return false;
    }

    if (unit.energy >= BATTLE_CONFIG.skillEnergyCost) {
      unit.energy = 0;
      usePriestSkill(unit, allies, battle);
    } else {
      healUnit(unit, woundedAlly, 1.05, battle, "curou", false);
    }

    return true;
  }

  function executeBasicAttack(unit, enemies, battle) {
    const target = selectAttackTarget(enemies, unit, battle);
    if (target) {
      applyDamage(unit, target, 1, battle, "atacou", 0);
    }
  }

  function executeSpecialSkill(unit, allies, enemies, battle) {
    unit.energy = 0;

    if (unit.side === "player") {
      usePlayerSpecialSkill(unit, allies, enemies, battle);
    } else {
      useEnemySpecialSkill(unit, enemies, battle);
    }
  }

  function executeUnitTurn(unit, battle) {
    const allies = unit.side === "player" ? battle.playerTeam : battle.enemyTeam;
    const enemies = unit.side === "player" ? battle.enemyTeam : battle.playerTeam;

    if (unit.hp <= 0) return;

    decrementStatuses(unit);

    if (Echoes.shouldUnitFailMoraleAction && Echoes.shouldUnitFailMoraleAction(unit)) {
      addPerformanceValue(battle, unit, "moraleFailures", 1);
      addBattleEvent(battle, "morale", `${unit.name} hesitou por causa da moral baixa e perdeu a acao.`, {
        actorId: unit.id,
      });
      return;
    }

    if (tryPriestHeal(unit, allies, battle)) {
      return;
    }

    if (unit.energy >= BATTLE_CONFIG.skillEnergyCost) {
      executeSpecialSkill(unit, allies, enemies, battle);
    } else {
      executeBasicAttack(unit, enemies, battle);
    }
  }

  function createTurnOrder(playerTeam, enemyTeam) {
    return playerTeam
      .concat(enemyTeam)
      .filter((unit) => unit.hp > 0)
      .sort((a, b) => b.stats.spd - a.stats.spd || Math.random() - 0.5);
  }

  function resolveRound(battle) {
    const turnOrder = createTurnOrder(battle.playerTeam, battle.enemyTeam);

    for (const unit of turnOrder) {
      if (unit.hp <= 0) continue;

      executeUnitTurn(unit, battle);

      if (!hasLivingUnits(battle.playerTeam) || !hasLivingUnits(battle.enemyTeam)) {
        break;
      }
    }
  }

  function resolveBattleResult(battle) {
    let result = hasLivingUnits(battle.playerTeam) && !hasLivingUnits(battle.enemyTeam) ? "victory" : "defeat";

    // The cap prevents rare low-damage matchups from producing an endless combat log.
    if (battle.round >= BATTLE_CONFIG.maxRounds && hasLivingUnits(battle.playerTeam) && hasLivingUnits(battle.enemyTeam)) {
      const playerHp = getLivingUnits(battle.playerTeam).reduce((sum, unit) => sum + unit.hp, 0);
      const enemyHp = getLivingUnits(battle.enemyTeam).reduce((sum, unit) => sum + unit.hp, 0);

      result = playerHp >= enemyHp ? "victory" : "defeat";
      addBattleEvent(battle, "info", "O combate atingiu o limite de turnos. O lado com mais folego venceu a disputa.");
    }

    return result;
  }

  function createBattleResult(result, floorNumber, round, playerTeam, enemyTeam, log, events, performance) {
    return {
      ok: true,
      id: `battle_${floorNumber}_${Date.now()}`,
      result,
      floor: floorNumber,
      rounds: round,
      playerTeam: serializeBattleTeam(playerTeam),
      enemyTeam: serializeBattleTeam(enemyTeam),
      log,
      events: events || [],
      performance: performance || {},
    };
  }

  function runAutoBattle(playerTeam, enemyTeam, introLines, modifiers) {
    const battle = createBattleContext(playerTeam, enemyTeam, introLines, modifiers);

    while (hasLivingUnits(playerTeam) && hasLivingUnits(enemyTeam) && battle.round < BATTLE_CONFIG.maxRounds) {
      battle.round += 1;
      addBattleEvent(battle, "round", `-- Turno ${battle.round} --`);
      resolveRound(battle);
    }

    const result = resolveBattleResult(battle);

    return {
      result,
      rounds: battle.round,
      playerTeam,
      enemyTeam,
      log: battle.log,
      events: battle.events,
      performance: battle.performance,
    };
  }

  Echoes.BATTLE_CONFIG = BATTLE_CONFIG;
  Echoes.addBattleEvent = addBattleEvent;
  Echoes.createPlayerTeam = createPlayerTeam;
  Echoes.createBattleResult = createBattleResult;
  Echoes.runAutoBattle = runAutoBattle;
})(window);
