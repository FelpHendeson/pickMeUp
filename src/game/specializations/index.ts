import type { GameState, Hero, HeroClassKey, HeroSpecialization, Stats } from "../types";

export const SPECIALIZATION_LEVEL = 10;

export const CLASS_SPECIALIZATIONS: Record<HeroClassKey, HeroSpecialization[]> = {
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

const BEAST_ENEMY_KEYS = new Set(["duskBat", "emberHound", "stormHarpy"]);
const DARK_ENEMY_KEYS = new Set(["duskBat", "markedAcolyte", "graveWarden", "voidReaver", "shardOracle", "eclipseAvatar"]);

function isHeroClassKey(classKey: unknown): classKey is HeroClassKey {
  return typeof classKey === "string" && classKey in CLASS_SPECIALIZATIONS;
}

function hasUnitSpecialization(unit: { side?: string; specializationKey?: string | null } | null | undefined, specializationKey: string): boolean {
  return Boolean(unit && unit.side === "player" && unit.specializationKey === specializationKey);
}

export function getClassSpecializations(classKey: unknown): HeroSpecialization[] {
  return isHeroClassKey(classKey) ? CLASS_SPECIALIZATIONS[classKey] : [];
}

export function getSpecializationByKey(classKey: unknown, specializationKey: unknown): HeroSpecialization | null {
  if (typeof specializationKey !== "string") return null;
  return getClassSpecializations(classKey).find((specialization) => specialization.key === specializationKey) ?? null;
}

export function getHeroSpecialization(hero: Pick<Hero, "classKey" | "specializationKey"> | null | undefined): HeroSpecialization | null {
  return hero?.specializationKey ? getSpecializationByKey(hero.classKey, hero.specializationKey) : null;
}

export function normalizeHeroSpecialization(hero: Pick<Hero, "classKey" | "specializationKey">): string | null {
  if (!hero.specializationKey || !getSpecializationByKey(hero.classKey, hero.specializationKey)) {
    hero.specializationKey = null;
  }

  return hero.specializationKey;
}

export function canHeroSpecialize(hero: Pick<Hero, "classKey" | "level" | "specializationKey"> | null | undefined): boolean {
  return Boolean(hero && hero.level >= SPECIALIZATION_LEVEL && !hero.specializationKey && getClassSpecializations(hero.classKey).length > 0);
}

export function applySpecializationStatModifiers(stats: Stats, hero: Pick<Hero, "classKey" | "specializationKey">): Stats {
  const specialization = getHeroSpecialization(hero);
  if (!specialization) return stats;

  Object.entries(specialization.statMultipliers).forEach(([statKey, multiplier]) => {
    stats[statKey as keyof Stats] = Math.max(1, Math.round((stats[statKey as keyof Stats] || 1) * (multiplier || 1)));
  });

  return stats;
}

export function chooseHeroSpecialization(
  state: Pick<GameState, "heroes">,
  heroId: string,
  specializationKey: string,
): { ok: boolean; message: string } {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  if (!hero) return { ok: false, message: "Heroi nao encontrado." };
  if (hero.level < SPECIALIZATION_LEVEL) return { ok: false, message: `${hero.name} precisa chegar ao nivel ${SPECIALIZATION_LEVEL}.` };
  if (hero.specializationKey) return { ok: false, message: `${hero.name} ja possui uma especializacao.` };

  const specialization = getSpecializationByKey(hero.classKey, specializationKey);
  if (!specialization) return { ok: false, message: "Especializacao invalida para esta classe." };

  hero.specializationKey = specialization.key;
  return { ok: true, message: `${hero.name} escolheu a especializacao ${specialization.name}.` };
}

export function getSpecializationCritBonus(attacker: { side?: string; specializationKey?: string | null } | null | undefined): number {
  return hasUnitSpecialization(attacker, "marksman") ? 0.12 : 0;
}

export function getSpecializationDamageMultiplier(
  attacker: { side?: string; specializationKey?: string | null; hp?: number; maxHp?: number } | null | undefined,
  target: { enemyKey?: string; hp?: number; maxHp?: number } | null | undefined,
): number {
  if (!attacker || attacker.side !== "player") return 1;

  let multiplier = 1;
  if (hasUnitSpecialization(attacker, "berserker") && (attacker.hp || 0) / Math.max(1, attacker.maxHp || 1) <= 0.4) multiplier *= 1.18;
  if (hasUnitSpecialization(attacker, "hunter") && target?.enemyKey && BEAST_ENEMY_KEYS.has(target.enemyKey)) multiplier *= 1.12;
  if (hasUnitSpecialization(attacker, "exorcist") && target?.enemyKey && DARK_ENEMY_KEYS.has(target.enemyKey)) multiplier *= 1.14;
  if (hasUnitSpecialization(attacker, "assassin") && target && (target.hp || 0) / Math.max(1, target.maxHp || 1) <= 0.35) multiplier *= 1.16;

  return multiplier;
}

export function getSpecializationEnergyGainMultiplier(unit: { side?: string; specializationKey?: string | null } | null | undefined): number {
  return hasUnitSpecialization(unit, "arcanist") ? 1.2 : 1;
}

export function getSpecializationHealingMultiplier(unit: { side?: string; specializationKey?: string | null } | null | undefined): number {
  return hasUnitSpecialization(unit, "healer") ? 1.18 : 1;
}

export function getElementalistAreaMultiplier(unit: { side?: string; specializationKey?: string | null } | null | undefined): number {
  return hasUnitSpecialization(unit, "elementalist") ? 1.17 : 1;
}

export function shouldDuelistEvade(unit: { side?: string; specializationKey?: string | null } | null | undefined, random: () => number = Math.random): boolean {
  return hasUnitSpecialization(unit, "duelist") && random() < 0.08;
}

export function shouldResistNegativeStatus(unit: { side?: string; specializationKey?: string | null } | null | undefined, random: () => number = Math.random): boolean {
  return hasUnitSpecialization(unit, "colossus") && random() < 0.45;
}
