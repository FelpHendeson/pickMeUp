(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const SPECIALIZATION_LEVEL = 10;

  const CLASS_SPECIALIZATIONS = {
    warrior: [
      {
        key: "berserker",
        name: "Berserker",
        passiveName: "Furia de Sangue",
        description: "Causa mais dano quando esta com HP baixo.",
        statMultipliers: { atk: 1.08, hp: 1.03 },
      },
      {
        key: "knight",
        name: "Cavaleiro",
        passiveName: "Linha de Ferro",
        description: "Ganha DEF e pode proteger aliados da retaguarda.",
        statMultipliers: { def: 1.12, hp: 1.05 },
      },
    ],
    archer: [
      {
        key: "marksman",
        name: "Atirador",
        passiveName: "Mira Letal",
        description: "Tem mais chance critica contra alvos unicos.",
        statMultipliers: { atk: 1.06, luck: 1.08 },
      },
      {
        key: "hunter",
        name: "Cacador",
        passiveName: "Rastro Selvagem",
        description: "Causa dano extra contra monstros bestiais e selvagens.",
        statMultipliers: { atk: 1.05, spd: 1.04 },
      },
    ],
    mage: [
      {
        key: "elementalist",
        name: "Elementalista",
        passiveName: "Ressonancia Elemental",
        description: "Melhora o dano em area da Explosao Arcana.",
        statMultipliers: { atk: 1.05, focus: 1.06 },
      },
      {
        key: "arcanist",
        name: "Arcanista",
        passiveName: "Fluxo Arcano",
        description: "Ganha energia mais rapido durante o combate.",
        statMultipliers: { focus: 1.08, spd: 1.03 },
      },
    ],
    priest: [
      {
        key: "healer",
        name: "Curandeiro",
        passiveName: "Maos Santas",
        description: "Curas ficam mais fortes.",
        statMultipliers: { focus: 1.1, hp: 1.04 },
      },
      {
        key: "exorcist",
        name: "Exorcista",
        passiveName: "Luz Punitiva",
        description: "Causa dano extra contra inimigos sombrios.",
        statMultipliers: { atk: 1.08, focus: 1.05 },
      },
    ],
    rogue: [
      {
        key: "assassin",
        name: "Assassino",
        passiveName: "Execucao Precisa",
        description: "Executa melhor inimigos com pouca vida.",
        statMultipliers: { atk: 1.07, luck: 1.07 },
      },
      {
        key: "duelist",
        name: "Duelista",
        passiveName: "Passo de Duelo",
        description: "Tem pequena chance de esquivar e contra-atacar.",
        statMultipliers: { spd: 1.08, def: 1.04 },
      },
    ],
    guardian: [
      {
        key: "sentinel",
        name: "Sentinela",
        passiveName: "Vigilia da Retaguarda",
        description: "Protege aliados da linha traseira com mais frequencia.",
        statMultipliers: { def: 1.09, hp: 1.07 },
      },
      {
        key: "colossus",
        name: "Colosso",
        passiveName: "Corpo Inabalavel",
        description: "Ganha HP e tem chance de resistir a status negativos.",
        statMultipliers: { hp: 1.14, def: 1.05 },
      },
    ],
  };

  const BEAST_ENEMY_KEYS = ["duskBat", "emberHound", "stormHarpy"];
  const DARK_ENEMY_KEYS = ["duskBat", "markedAcolyte", "graveWarden", "voidReaver", "shardOracle", "eclipseAvatar"];

  function getClassSpecializations(classKey) {
    return CLASS_SPECIALIZATIONS[classKey] || [];
  }

  function getSpecializationByKey(classKey, specializationKey) {
    return getClassSpecializations(classKey).find((specialization) => specialization.key === specializationKey) || null;
  }

  function getHeroSpecialization(hero) {
    return hero && hero.specializationKey ? getSpecializationByKey(hero.classKey, hero.specializationKey) : null;
  }

  function normalizeHeroSpecialization(hero) {
    if (!hero || !hero.specializationKey) {
      hero.specializationKey = null;
      return null;
    }

    if (!getSpecializationByKey(hero.classKey, hero.specializationKey)) {
      hero.specializationKey = null;
    }

    return hero.specializationKey;
  }

  function canHeroSpecialize(hero) {
    return Boolean(hero && hero.level >= SPECIALIZATION_LEVEL && !hero.specializationKey && getClassSpecializations(hero.classKey).length > 0);
  }

  function applySpecializationStatModifiers(stats, hero) {
    const specialization = getHeroSpecialization(hero);
    if (!specialization) return stats;

    Object.entries(specialization.statMultipliers || {}).forEach(([statKey, multiplier]) => {
      stats[statKey] = Math.max(1, Math.round((stats[statKey] || 1) * multiplier));
    });

    return stats;
  }

  function chooseHeroSpecialization(state, heroId, specializationKey) {
    const hero = Echoes.findHero ? Echoes.findHero(state, heroId) : null;
    if (!hero) return { ok: false, message: "Heroi nao encontrado." };
    if (hero.level < SPECIALIZATION_LEVEL) return { ok: false, message: `${hero.name} precisa chegar ao nivel ${SPECIALIZATION_LEVEL}.` };
    if (hero.specializationKey) return { ok: false, message: `${hero.name} ja possui uma especializacao.` };

    const specialization = getSpecializationByKey(hero.classKey, specializationKey);
    if (!specialization) return { ok: false, message: "Especializacao invalida para esta classe." };

    hero.specializationKey = specialization.key;
    return { ok: true, message: `${hero.name} escolheu a especializacao ${specialization.name}.` };
  }

  function hasUnitSpecialization(unit, specializationKey) {
    return unit && unit.side === "player" && unit.specializationKey === specializationKey;
  }

  function getSpecializationCritBonus(attacker) {
    if (hasUnitSpecialization(attacker, "marksman")) return 0.12;
    return 0;
  }

  function isBeastEnemy(target) {
    return target && BEAST_ENEMY_KEYS.includes(target.enemyKey);
  }

  function isDarkEnemy(target) {
    return target && DARK_ENEMY_KEYS.includes(target.enemyKey);
  }

  function getSpecializationDamageMultiplier(attacker, target) {
    if (!attacker || attacker.side !== "player") return 1;

    let multiplier = 1;

    if (hasUnitSpecialization(attacker, "berserker") && attacker.hp / attacker.maxHp <= 0.4) multiplier *= 1.18;
    if (hasUnitSpecialization(attacker, "hunter") && isBeastEnemy(target)) multiplier *= 1.12;
    if (hasUnitSpecialization(attacker, "exorcist") && isDarkEnemy(target)) multiplier *= 1.14;
    if (hasUnitSpecialization(attacker, "assassin") && target && target.hp / target.maxHp <= 0.35) multiplier *= 1.16;

    return multiplier;
  }

  function getSpecializationEnergyGainMultiplier(unit) {
    return hasUnitSpecialization(unit, "arcanist") ? 1.2 : 1;
  }

  function getSpecializationHealingMultiplier(unit) {
    return hasUnitSpecialization(unit, "healer") ? 1.18 : 1;
  }

  function getElementalistAreaMultiplier(unit) {
    return hasUnitSpecialization(unit, "elementalist") ? 1.17 : 1;
  }

  function getSpecializationProtectionTarget(target, candidates) {
    if (!target || target.side !== "player" || target.position !== "back") return target;

    const protectors = candidates.filter((unit) => {
      return (
        unit.hp > 0 &&
        unit.side === "player" &&
        unit.position === "front" &&
        (hasUnitSpecialization(unit, "knight") || hasUnitSpecialization(unit, "sentinel"))
      );
    });

    if (protectors.length === 0) return target;

    const sentinel = protectors.find((unit) => hasUnitSpecialization(unit, "sentinel"));
    const chance = sentinel ? 0.38 : 0.26;
    if (Math.random() >= chance) return target;

    return sentinel || protectors[0];
  }

  function shouldDuelistEvade(unit) {
    return hasUnitSpecialization(unit, "duelist") && Math.random() < 0.08;
  }

  function shouldResistNegativeStatus(unit) {
    return hasUnitSpecialization(unit, "colossus") && Math.random() < 0.45;
  }

  Echoes.SPECIALIZATION_LEVEL = SPECIALIZATION_LEVEL;
  Echoes.CLASS_SPECIALIZATIONS = CLASS_SPECIALIZATIONS;
  Echoes.getClassSpecializations = getClassSpecializations;
  Echoes.getSpecializationByKey = getSpecializationByKey;
  Echoes.getHeroSpecialization = getHeroSpecialization;
  Echoes.normalizeHeroSpecialization = normalizeHeroSpecialization;
  Echoes.canHeroSpecialize = canHeroSpecialize;
  Echoes.applySpecializationStatModifiers = applySpecializationStatModifiers;
  Echoes.chooseHeroSpecialization = chooseHeroSpecialization;
  Echoes.getSpecializationCritBonus = getSpecializationCritBonus;
  Echoes.getSpecializationDamageMultiplier = getSpecializationDamageMultiplier;
  Echoes.getSpecializationEnergyGainMultiplier = getSpecializationEnergyGainMultiplier;
  Echoes.getSpecializationHealingMultiplier = getSpecializationHealingMultiplier;
  Echoes.getElementalistAreaMultiplier = getElementalistAreaMultiplier;
  Echoes.getSpecializationProtectionTarget = getSpecializationProtectionTarget;
  Echoes.shouldDuelistEvade = shouldDuelistEvade;
  Echoes.shouldResistNegativeStatus = shouldResistNegativeStatus;
})(window);
