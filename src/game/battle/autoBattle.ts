import { getAffinityProtectionTarget, getAffinitySummary } from "../affinity";
import { GAME_CONFIG } from "../config";
import { getHeroEffectiveStats } from "../equipment";
import { shouldUnitFailMoraleAction } from "../hero-status";
import {
  getElementalistAreaMultiplier,
  getHeroSpecialization,
  getSpecializationCritBonus,
  getSpecializationDamageMultiplier,
  getSpecializationEnergyGainMultiplier,
  getSpecializationHealingMultiplier,
  getSpecializationProtectionTarget,
  shouldDuelistEvade,
  shouldResistNegativeStatus,
} from "../specializations";
import type {
  AutoBattleResult,
  BattleEvent,
  BattleModifiers,
  BattlePerformanceEntry,
  BattleResult,
  BattleResultOutcome,
  BattleUnit,
  GameState,
  Hero,
  SerializedBattleUnit,
} from "../types";
import { BATTLE_CONFIG, PLAYER_SKILLS } from "./config";

type BattleContext = {
  playerTeam: BattleUnit[];
  enemyTeam: BattleUnit[];
  log: string[];
  events: BattleEvent[];
  round: number;
  modifiers: BattleModifiers;
  performance: Record<string, BattlePerformanceEntry>;
};

type PerformanceKey = keyof Omit<BattlePerformanceEntry, "id" | "name" | "className">;
type NormalizedBattleRewards = NonNullable<AutoBattleResult["rewards"]>;
type NormalizedBattleProgression = NonNullable<AutoBattleResult["progression"]>;

export { BATTLE_CONFIG, PLAYER_SKILLS } from "./config";

function createPlayerBattleUnit(hero: Hero, slotIndex: number, state: GameState | null): BattleUnit {
  const isFrontSlot = slotIndex < GAME_CONFIG.frontSlots;
  const effectiveStats = state ? getHeroEffectiveStats(state, hero) : { ...hero.stats };
  const maxHp = effectiveStats.hp;
  const currentHp = Number.isFinite(Number(hero.currentHp))
    ? Math.max(0, Math.min(maxHp, Math.round(Number(hero.currentHp))))
    : maxHp;

  return {
    id: hero.id,
    sourceId: hero.id,
    name: hero.name,
    side: "player",
    classKey: hero.classKey,
    className: hero.className,
    specializationKey: hero.specializationKey || null,
    specializationName: getHeroSpecialization(hero)?.name || "",
    rarity: hero.rarity,
    level: hero.level,
    stats: { ...effectiveStats },
    maxHp,
    hp: currentHp > 0 ? currentHp : 1,
    energy: isFrontSlot ? BATTLE_CONFIG.frontSlotStartingEnergy : 0,
    morale: Number.isFinite(hero.morale) ? hero.morale : 80,
    affinityLevels: {},
    statuses: {},
    position: isFrontSlot ? "front" : "back",
  };
}

function getLivingUnits(units: BattleUnit[]): BattleUnit[] {
  return units.filter((unit) => unit.hp > 0);
}

function hasLivingUnits(units: BattleUnit[]): boolean {
  return getLivingUnits(units).length > 0;
}

function selectMostWoundedUnit(units: BattleUnit[]): BattleUnit | null {
  return (
    getLivingUnits(units)
      .filter((unit) => unit.hp < unit.maxHp)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? null
  );
}

function selectLowestHpRatioUnit(units: BattleUnit[]): BattleUnit | null {
  return getLivingUnits(units).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? null;
}

function ensureBattlePerformance(battle: BattleContext, unit: BattleUnit): BattlePerformanceEntry | null {
  if (unit.side !== "player") return null;

  battle.performance[unit.id] = battle.performance[unit.id] ?? {
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

function addPerformanceValue(battle: BattleContext, unit: BattleUnit, key: PerformanceKey, amount: number): void {
  const stats = ensureBattlePerformance(battle, unit);
  if (!stats) return;
  stats[key] = Math.max(0, (stats[key] || 0) + amount);
}

function selectAttackTarget(candidates: BattleUnit[], attacker: BattleUnit, battle: BattleContext): BattleUnit | null {
  const living = getLivingUnits(candidates);
  if (living.length === 0) return null;

  const taunting = living.filter((unit) => unit.statuses.taunt && unit.statuses.taunt > 0);
  if (taunting.length > 0 && Math.random() < BATTLE_CONFIG.tauntTargetChance) {
    return taunting[Math.floor(Math.random() * taunting.length)] ?? null;
  }

  const wounded = selectMostWoundedUnit(candidates);
  if (attacker.side === "enemy" && attacker.enemyKey === "markedAcolyte" && wounded) {
    return wounded;
  }

  const frontLine = living.filter((unit) => unit.position === "front");
  const targetPool = frontLine.length > 0 && Math.random() < BATTLE_CONFIG.frontTargetChance ? frontLine : living;
  const target = targetPool[Math.floor(Math.random() * targetPool.length)] ?? null;
  if (!target) return null;

  const specializedTarget = getSpecializationProtectionTarget(target, living) ?? target;
  if (specializedTarget !== target) return specializedTarget;

  const affinityTarget = getAffinityProtectionTarget(target, living, attacker) ?? target;
  if (affinityTarget !== target) {
    addPerformanceValue(battle, affinityTarget, "affinityProtections", 1);
  }

  return affinityTarget;
}

export function createPlayerTeam(formationHeroes: Array<Hero | null | undefined>, state: GameState | null): BattleUnit[] {
  const playerTeam = formationHeroes
    .map((hero, slotIndex) => (hero ? createPlayerBattleUnit(hero, slotIndex, state) : null))
    .filter((unit): unit is BattleUnit => Boolean(unit));

  if (state) {
    playerTeam.forEach((unit) => {
      playerTeam.forEach((ally) => {
        if (!unit.sourceId || !ally.sourceId || unit.sourceId === ally.sourceId) return;
        unit.affinityLevels = unit.affinityLevels ?? {};
        unit.affinityLevels[ally.sourceId] = getAffinitySummary(state, unit.sourceId, ally.sourceId).level;
      });
    });
  }

  return playerTeam;
}

function formatUnitHp(unit: BattleUnit): string {
  return `${Math.max(0, unit.hp)}/${unit.maxHp} HP`;
}

function addUnitEnergy(unit: BattleUnit, amount: number): void {
  const multiplier = getSpecializationEnergyGainMultiplier(unit);
  unit.energy = Math.min(BATTLE_CONFIG.maxUnitEnergy, unit.energy + Math.round(amount * multiplier));
}

function snapshotStatuses(unit: BattleUnit): Record<string, number> {
  return Object.keys(unit.statuses || {}).reduce<Record<string, number>>((statuses, key) => {
    if ((unit.statuses[key] || 0) > 0) statuses[key] = unit.statuses[key];
    return statuses;
  }, {});
}

function serializeBattleUnit(unit: BattleUnit): SerializedBattleUnit {
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

function serializeBattleTeam(team: BattleUnit[]): SerializedBattleUnit[] {
  return team.map(serializeBattleUnit);
}

function createBattleSnapshot(battle: BattleContext) {
  return {
    playerTeam: serializeBattleTeam(battle.playerTeam),
    enemyTeam: serializeBattleTeam(battle.enemyTeam),
  };
}

export function addBattleEvent(
  battle: BattleContext,
  type: string,
  message: string,
  details?: Partial<BattleEvent>,
): BattleEvent {
  const snapshot = createBattleSnapshot(battle);
  const event: BattleEvent = {
    type,
    message,
    round: battle.round || 0,
    playerTeam: snapshot.playerTeam,
    enemyTeam: snapshot.enemyTeam,
    ...(details || {}),
  };

  battle.log.push(message);
  battle.events.push(event);
  return event;
}

function createBattleContext(
  playerTeam: BattleUnit[],
  enemyTeam: BattleUnit[],
  introLines: string[],
  modifiers: BattleModifiers = {},
): BattleContext {
  const battle: BattleContext = {
    playerTeam,
    enemyTeam,
    log: [],
    events: [],
    round: 0,
    modifiers,
    performance: {},
  };

  playerTeam.forEach((unit) => ensureBattlePerformance(battle, unit));
  introLines.forEach((line) => addBattleEvent(battle, "info", line));
  return battle;
}

function getEffectiveDefense(unit: BattleUnit): number {
  const guardMultiplier = unit.statuses.guard && unit.statuses.guard > 0 ? 1.6 : 1;
  return (unit.stats.def || 0) * guardMultiplier;
}

function calculateDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  multiplier: number,
  critBonus: number,
  battle: BattleContext,
): { amount: number; critical: boolean } {
  const specializationCritBonus = getSpecializationCritBonus(attacker);
  const critChance = Math.min(0.65, (attacker.stats.luck || 0) / 100 + (critBonus || 0) + specializationCritBonus);
  const critical = Math.random() < critChance;
  const variance = 0.9 + Math.random() * 0.2;
  const markedMultiplier = target.statuses.mark && target.statuses.mark > 0 ? 1.2 : 1;
  const specializationMultiplier = getSpecializationDamageMultiplier(attacker, target);
  const rawDamage = attacker.stats.atk * multiplier * variance * (critical ? 1.75 : 1) * markedMultiplier * specializationMultiplier;
  const mitigation = getEffectiveDefense(target) * 0.48;
  const playerDamageTakenMultiplier = target.side === "player" ? battle.modifiers.playerDamageTakenMultiplier || 1 : 1;

  return {
    amount: Math.max(1, Math.round((rawDamage - mitigation) * playerDamageTakenMultiplier)),
    critical,
  };
}

function applyDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  multiplier: number,
  battle: BattleContext,
  label: string,
  critBonus = 0,
): number {
  if (target.side === "player" && shouldDuelistEvade(target)) {
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
        { actorId: target.id, targetId: attacker.id, amount: counterDamage.amount, critical: counterDamage.critical },
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
  addBattleEvent(
    battle,
    damage.critical ? "critical" : "damage",
    `${attacker.name} ${label} ${target.name} causando ${damage.amount} de dano.${critText} (${formatUnitHp(target)})`,
    { actorId: attacker.id, targetId: target.id, amount: damage.amount, critical: damage.critical },
  );

  if (target.hp <= 0) {
    addUnitEnergy(attacker, BATTLE_CONFIG.killEnergyGain);
    addPerformanceValue(battle, attacker, "kills", 1);
    addBattleEvent(battle, "death", `${target.name} caiu.`, { actorId: attacker.id, targetId: target.id });
  }

  return damage.amount;
}

function healUnit(
  healer: BattleUnit,
  target: BattleUnit,
  multiplier: number,
  battle: BattleContext,
  label: string,
  isSpecial: boolean,
): void {
  const healingMultiplier = healer.side === "player" ? battle.modifiers.healingDoneMultiplier || 1 : 1;
  const specializationHealingMultiplier = getSpecializationHealingMultiplier(healer);
  const amount = Math.max(
    8,
    Math.round(
      (healer.stats.atk * multiplier + healer.stats.focus * 2) * (0.9 + Math.random() * 0.2) * healingMultiplier * specializationHealingMultiplier,
    ),
  );

  target.hp = Math.min(target.maxHp, target.hp + amount);
  addPerformanceValue(battle, healer, "healingDone", amount);
  addUnitEnergy(healer, BATTLE_CONFIG.attackEnergyGain);
  addBattleEvent(
    battle,
    isSpecial ? "skill-heal" : "heal",
    `${healer.name} ${label} ${target.name} em ${amount} HP. (${formatUnitHp(target)})`,
    { actorId: healer.id, targetId: target.id, amount },
  );
}

function useWarriorSkill(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
  const target = selectAttackTarget(enemies, unit, battle);
  if (!target) return;

  addBattleEvent(battle, "skill", `${unit.name} usou Golpe Pesado em ${target.name}.`, {
    actorId: unit.id,
    targetId: target.id,
    skillName: "Golpe Pesado",
  });
  applyDamage(unit, target, PLAYER_SKILLS.warrior.multiplier, battle, "esmagou", PLAYER_SKILLS.warrior.critBonus);
}

function useArcherSkill(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
  const target = selectAttackTarget(enemies, unit, battle);
  if (!target) return;

  addBattleEvent(battle, "skill", `${unit.name} usou Flecha Precisa em ${target.name}.`, {
    actorId: unit.id,
    targetId: target.id,
    skillName: "Flecha Precisa",
  });
  applyDamage(unit, target, PLAYER_SKILLS.archer.multiplier, battle, "perfurou", PLAYER_SKILLS.archer.critBonus);
}

function useMageSkill(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
  addBattleEvent(battle, "skill", `${unit.name} usou Explosao Arcana contra todos os inimigos.`, {
    actorId: unit.id,
    skillName: "Explosao Arcana",
  });

  const areaMultiplier = getElementalistAreaMultiplier(unit);
  getLivingUnits(enemies).forEach((target) => applyDamage(unit, target, 0.92 * areaMultiplier, battle, "atingiu", 0.02));
}

function usePriestSkill(unit: BattleUnit, allies: BattleUnit[], battle: BattleContext): void {
  const target = selectLowestHpRatioUnit(allies) || unit;

  addBattleEvent(battle, "skill", `${unit.name} usou Cura Divina em ${target.name}, o aliado com menor HP.`, {
    actorId: unit.id,
    targetId: target.id,
    skillName: "Cura Divina",
  });
  healUnit(unit, target, 1.8, battle, "curou", true);
}

function useRogueSkill(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
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

function useGuardianSkill(unit: BattleUnit, battle: BattleContext): void {
  unit.statuses.taunt = 2;
  unit.statuses.guard = 2;
  addBattleEvent(battle, "skill-buff", `${unit.name} usou Provocar, atraiu ataques e ganhou defesa temporaria.`, {
    actorId: unit.id,
    skillName: "Provocar",
  });
}

function usePlayerSpecialSkill(unit: BattleUnit, allies: BattleUnit[], enemies: BattleUnit[], battle: BattleContext): void {
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

function useEnemySpecialSkill(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
  if (unit.enemyKey === "markedAcolyte") {
    const target = selectAttackTarget(enemies, unit, battle);
    if (!target) return;

    if (shouldResistNegativeStatus(target)) {
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
      if (shouldResistNegativeStatus(target)) {
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

function decrementStatuses(unit: BattleUnit): void {
  Object.keys(unit.statuses).forEach((statusKey) => {
    unit.statuses[statusKey] -= 1;
    if (unit.statuses[statusKey] <= 0) {
      delete unit.statuses[statusKey];
    }
  });
}

function tryPriestHeal(unit: BattleUnit, allies: BattleUnit[], battle: BattleContext): boolean {
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

function executeBasicAttack(unit: BattleUnit, enemies: BattleUnit[], battle: BattleContext): void {
  const target = selectAttackTarget(enemies, unit, battle);
  if (target) {
    applyDamage(unit, target, 1, battle, "atacou", 0);
  }
}

function executeSpecialSkill(unit: BattleUnit, allies: BattleUnit[], enemies: BattleUnit[], battle: BattleContext): void {
  unit.energy = 0;

  if (unit.side === "player") {
    usePlayerSpecialSkill(unit, allies, enemies, battle);
  } else {
    useEnemySpecialSkill(unit, enemies, battle);
  }
}

function executeUnitTurn(unit: BattleUnit, battle: BattleContext): void {
  const allies = unit.side === "player" ? battle.playerTeam : battle.enemyTeam;
  const enemies = unit.side === "player" ? battle.enemyTeam : battle.playerTeam;

  if (unit.hp <= 0) return;

  decrementStatuses(unit);

  if (shouldUnitFailMoraleAction(unit)) {
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

function createTurnOrder(playerTeam: BattleUnit[], enemyTeam: BattleUnit[]): BattleUnit[] {
  return playerTeam
    .concat(enemyTeam)
    .filter((unit) => unit.hp > 0)
    .sort((a, b) => b.stats.spd - a.stats.spd || Math.random() - 0.5);
}

function resolveRound(battle: BattleContext): void {
  const turnOrder = createTurnOrder(battle.playerTeam, battle.enemyTeam);

  for (const unit of turnOrder) {
    if (unit.hp <= 0) continue;

    executeUnitTurn(unit, battle);

    if (!hasLivingUnits(battle.playerTeam) || !hasLivingUnits(battle.enemyTeam)) {
      break;
    }
  }
}

function resolveBattleResult(battle: BattleContext): BattleResultOutcome {
  let result: BattleResultOutcome = hasLivingUnits(battle.playerTeam) && !hasLivingUnits(battle.enemyTeam) ? "victory" : "defeat";

  if (battle.round >= BATTLE_CONFIG.maxRounds && hasLivingUnits(battle.playerTeam) && hasLivingUnits(battle.enemyTeam)) {
    const playerHp = getLivingUnits(battle.playerTeam).reduce((sum, unit) => sum + unit.hp, 0);
    const enemyHp = getLivingUnits(battle.enemyTeam).reduce((sum, unit) => sum + unit.hp, 0);

    result = playerHp >= enemyHp ? "victory" : "defeat";
    addBattleEvent(battle, "info", "O combate atingiu o limite de turnos. O lado com mais folego venceu a disputa.");
  }

  return result;
}

export function createBattleResult(
  result: BattleResultOutcome,
  floorNumber: number,
  round: number,
  playerTeam: BattleUnit[],
  enemyTeam: BattleUnit[],
  log: string[],
  events: BattleEvent[],
  performance: Record<string, BattlePerformanceEntry>,
): BattleResult {
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

export function runAutoBattle(
  playerTeam: BattleUnit[],
  enemyTeam: BattleUnit[],
  introLines: string[] = [],
  modifiers: BattleModifiers = {},
): AutoBattleResult {
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
    round: battle.round,
    playerTeam,
    enemyTeam,
    log: battle.log,
    events: battle.events,
    performance: battle.performance,
  };
}

export function inferBattleEventType(message: string): string {
  if (/CRITICO/i.test(message)) return "critical";
  if (/curou|cura/i.test(message)) return "heal";
  if (/caiu/i.test(message)) return "death";
  if (/venceu/i.test(message)) return "victory";
  if (/derrotada|perdido/i.test(message)) return "defeat";
  if (/Recompensa|Cristais|Essencia|Fragmentos|Oficina/i.test(message)) return "reward";
  if (/usou|liberou|conjurou/i.test(message)) return "skill";
  if (/Turno/i.test(message)) return "round";
  return "damage";
}

export function getBattleEvents(battle: Pick<BattleResult, "events" | "log" | "playerTeam" | "enemyTeam">): BattleEvent[] {
  if (Array.isArray(battle.events) && battle.events.length > 0) {
    return battle.events;
  }

  return (battle.log || []).map((message) => ({
    type: inferBattleEventType(message),
    message,
    round: 0,
    playerTeam: battle.playerTeam || [],
    enemyTeam: battle.enemyTeam || [],
  }));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function normalizeBattleRewards(value: unknown): NormalizedBattleRewards {
  const raw = asRecord(value);
  return {
    gold: nonNegativeInteger(raw.gold),
    crystals: nonNegativeInteger(raw.crystals),
    essence: nonNegativeInteger(raw.essence),
    fragments: nonNegativeInteger(raw.fragments),
    echoFragments: nonNegativeInteger(raw.echoFragments),
    energyRefund: nonNegativeInteger(raw.energyRefund),
    heroContracts: nonNegativeInteger(raw.heroContracts),
    equipment: Array.isArray(raw.equipment) ? (raw.equipment as NormalizedBattleRewards["equipment"]) : [],
    consumables: Array.isArray(raw.consumables) ? (raw.consumables as NormalizedBattleRewards["consumables"]) : [],
  };
}

function normalizeBattleSummary(value: unknown): BattleResult["summary"] {
  const raw = asRecord(value);
  if (!raw.chapterId && !raw.chapterName) return undefined;

  return {
    chapterId: typeof raw.chapterId === "string" ? raw.chapterId : "",
    chapterName: typeof raw.chapterName === "string" ? raw.chapterName : "",
    chapterNumber: nonNegativeInteger(raw.chapterNumber),
    difficultyId: typeof raw.difficultyId === "string" ? raw.difficultyId : "normal",
    difficultyName: typeof raw.difficultyName === "string" ? raw.difficultyName : "Normal",
    enemyNames: Array.isArray(raw.enemyNames) ? raw.enemyNames.filter((name): name is string => typeof name === "string") : [],
    modifiers: Array.isArray(raw.modifiers) ? raw.modifiers.filter((modifier): modifier is string => typeof modifier === "string") : [],
    weeklyEvent: typeof raw.weeklyEvent === "string" ? raw.weeklyEvent : "",
    isBoss: Boolean(raw.isBoss),
  };
}

function normalizeBattleProgression(value: unknown): NormalizedBattleProgression | undefined {
  const raw = asRecord(value);
  if (!raw.heroXp && !raw.levelUps && !raw.specializationsAvailable && !raw.missionUpdates && !raw.achievementsAvailable && !raw.libraryUpdates) {
    return undefined;
  }

  return {
    heroXp: Array.isArray(raw.heroXp) ? (raw.heroXp as NormalizedBattleProgression["heroXp"]) : [],
    levelUps: Array.isArray(raw.levelUps) ? (raw.levelUps as NormalizedBattleProgression["levelUps"]) : [],
    specializationsAvailable: Array.isArray(raw.specializationsAvailable)
      ? (raw.specializationsAvailable as NormalizedBattleProgression["specializationsAvailable"])
      : [],
    missionUpdates: Array.isArray(raw.missionUpdates) ? raw.missionUpdates : [],
    achievementsAvailable: Array.isArray(raw.achievementsAvailable) ? raw.achievementsAvailable : [],
    libraryUpdates: Array.isArray(raw.libraryUpdates) ? raw.libraryUpdates : [],
  };
}

export function normalizeBattleResult(value: unknown): BattleResult | null {
  const raw = asRecord(value);
  if (!raw.result || (raw.result !== "victory" && raw.result !== "defeat")) return null;

  const performanceRaw = asRecord(raw.performance);
  const performance = Object.fromEntries(
    Object.entries(performanceRaw).map(([key, entry]) => {
      const stats = asRecord(entry);
      return [
        key,
        {
          id: typeof stats.id === "string" ? stats.id : key,
          name: typeof stats.name === "string" ? stats.name : "",
          className: typeof stats.className === "string" ? stats.className : "",
          damageDealt: nonNegativeInteger(stats.damageDealt),
          healingDone: nonNegativeInteger(stats.healingDone),
          damageTaken: nonNegativeInteger(stats.damageTaken),
          kills: nonNegativeInteger(stats.kills),
          skillUses: nonNegativeInteger(stats.skillUses),
          moraleFailures: nonNegativeInteger(stats.moraleFailures),
          affinityProtections: nonNegativeInteger(stats.affinityProtections),
        },
      ];
    }),
  );

  return {
    ok: true,
    id: typeof raw.id === "string" && raw.id ? raw.id : `battle_${Date.now()}`,
    result: raw.result,
    floor: Math.max(1, Math.floor(Number(raw.floor) || 1)),
    rounds: nonNegativeInteger(raw.rounds),
    playerTeam: Array.isArray(raw.playerTeam) ? (raw.playerTeam as SerializedBattleUnit[]) : [],
    enemyTeam: Array.isArray(raw.enemyTeam) ? (raw.enemyTeam as SerializedBattleUnit[]) : [],
    log: Array.isArray(raw.log) ? raw.log.filter((line): line is string => typeof line === "string") : [],
    events: Array.isArray(raw.events) ? (raw.events as BattleEvent[]) : [],
    performance,
    summary: normalizeBattleSummary(raw.summary),
    rewards: normalizeBattleRewards(raw.rewards),
    progression: normalizeBattleProgression(raw.progression),
  };
}
