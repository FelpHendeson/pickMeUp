import type { EquipmentSlots, Hero, HeroClassKey, StatKey, Stats } from "../types";
import { EPITHETS, GIVEN_NAMES, HERO_CLASSES, STAT_KEYS, TRAITS } from "./definitions";

export type RandomSource = () => number;

export type GenerateHeroOptions = {
  rarity?: number;
  classKey?: HeroClassKey;
  traitKey?: string;
  name?: string;
  recruitmentTag?: string;
  id?: string;
  morale?: number;
  random?: RandomSource;
};

export type AddHeroXpResult = {
  gainedXp: number;
  levelUps: number[];
};

function pickRandom<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function randomBetween(min: number, max: number, random: RandomSource): number {
  return min + random() * (max - min);
}

function createHeroId(): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `hero_${globalThis.crypto.randomUUID()}`;
  }

  return `hero_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMorale(value: unknown): number {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 80;
}

export function getMaxLevelForRarity(rarity: number): number {
  return rarity * 10;
}

export function getHeroXpForNextLevel(level: number): number {
  return Math.floor(100 * level * 1.15);
}

export function getRarityMultiplier(rarity: number): number {
  return 0.88 + rarity * 0.16;
}

export function createStatRolls(random: RandomSource = Math.random): Record<StatKey, number> {
  return STAT_KEYS.reduce(
    (rolls, key) => {
      rolls[key] = Number(randomBetween(0.92, 1.08, random).toFixed(3));
      return rolls;
    },
    {} as Record<StatKey, number>,
  );
}

export function normalizeEquipmentSlots(equipment?: Partial<EquipmentSlots> | null): EquipmentSlots {
  return {
    weapon: typeof equipment?.weapon === "string" ? equipment.weapon : null,
    armor: typeof equipment?.armor === "string" ? equipment.armor : null,
    accessory: typeof equipment?.accessory === "string" ? equipment.accessory : null,
  };
}

function normalizeClassKey(classKey: unknown): HeroClassKey {
  return typeof classKey === "string" && classKey in HERO_CLASSES ? (classKey as HeroClassKey) : "warrior";
}

function normalizeTraitKey(traitKey: unknown): string {
  return typeof traitKey === "string" && TRAITS[traitKey] ? traitKey : "brave";
}

export function recalculateHeroStats(hero: Hero): Hero {
  const classKey = normalizeClassKey(hero.classKey);
  const traitKey = normalizeTraitKey(hero.traitKey);
  const heroClass = HERO_CLASSES[classKey];
  const trait = TRAITS[traitKey] ?? TRAITS.brave;
  const statRolls = { ...createStatRolls(() => 0.5), ...hero.statRolls };
  const rarityMultiplier = getRarityMultiplier(hero.rarity);
  const level = Math.max(1, hero.level || 1);

  hero.classKey = classKey;
  hero.className = heroClass.name;
  hero.traitKey = traitKey;
  hero.traitName = trait.name;
  hero.traitDescription = trait.description;
  hero.statRolls = statRolls;
  hero.stats = STAT_KEYS.reduce((stats, statKey) => {
    const baseValue = heroClass.base[statKey] + heroClass.growth[statKey] * (level - 1);
    const traitMultiplier = trait.multipliers[statKey] || 1;
    stats[statKey] = Math.max(1, Math.round(baseValue * rarityMultiplier * (statRolls[statKey] || 1) * traitMultiplier));
    return stats;
  }, {} as Stats);
  hero.maxLevel = getMaxLevelForRarity(hero.rarity);

  return hero;
}

export function generateHero(options: GenerateHeroOptions = {}): Hero {
  const random = options.random ?? Math.random;
  const rarity = Math.max(1, Math.floor(options.rarity || 1));
  const classKey = options.classKey ?? pickRandom(Object.keys(HERO_CLASSES) as HeroClassKey[], random);
  const traitKey = options.traitKey ?? pickRandom(Object.keys(TRAITS), random);
  const name = options.name ?? `${pickRandom(GIVEN_NAMES, random)} ${pickRandom(EPITHETS, random)}`;

  const hero: Hero = {
    id: options.id ?? createHeroId(),
    name,
    rarity,
    classKey,
    className: HERO_CLASSES[classKey].name,
    level: 1,
    xp: 0,
    maxLevel: getMaxLevelForRarity(rarity),
    statRolls: createStatRolls(random),
    stats: {} as Stats,
    traitKey,
    traitName: TRAITS[traitKey]?.name ?? TRAITS.brave.name,
    traitDescription: TRAITS[traitKey]?.description ?? TRAITS.brave.description,
    injuries: [],
    currentHp: null,
    morale: normalizeMorale(options.morale),
    battlesSinceLastUsed: 0,
    lastUsedAt: null,
    specializationKey: null,
    recruitmentTag: options.recruitmentTag ?? "",
    equipment: normalizeEquipmentSlots(),
  };

  recalculateHeroStats(hero);
  hero.currentHp = hero.stats.hp;
  return hero;
}

export function normalizeHero(input: unknown): Hero {
  const raw = input && typeof input === "object" ? (input as Partial<Hero>) : {};
  const rarity = Math.max(1, Math.floor(Number(raw.rarity) || 1));
  const hero: Hero = {
    id: typeof raw.id === "string" && raw.id ? raw.id : createHeroId(),
    name: typeof raw.name === "string" && raw.name ? raw.name : "Heroi sem nome",
    rarity,
    classKey: normalizeClassKey(raw.classKey),
    className: "",
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    xp: Math.max(0, Math.floor(Number(raw.xp) || 0)),
    maxLevel: getMaxLevelForRarity(rarity),
    statRolls: raw.statRolls && typeof raw.statRolls === "object" ? raw.statRolls : createStatRolls(),
    stats: {} as Stats,
    traitKey: normalizeTraitKey(raw.traitKey),
    traitName: "",
    traitDescription: "",
    injuries: Array.isArray(raw.injuries) ? raw.injuries : [],
    currentHp: Number.isFinite(raw.currentHp) ? Math.round(Number(raw.currentHp)) : null,
    morale: normalizeMorale(raw.morale),
    battlesSinceLastUsed: Math.max(0, Math.floor(Number(raw.battlesSinceLastUsed) || 0)),
    lastUsedAt: Number.isFinite(raw.lastUsedAt) ? Number(raw.lastUsedAt) : null,
    specializationKey: typeof raw.specializationKey === "string" ? raw.specializationKey : null,
    recruitmentTag: typeof raw.recruitmentTag === "string" ? raw.recruitmentTag : "",
    equipment: normalizeEquipmentSlots(raw.equipment),
  };

  recalculateHeroStats(hero);
  hero.currentHp = Number.isFinite(hero.currentHp)
    ? Math.max(0, Math.min(hero.stats.hp, Math.round(Number(hero.currentHp))))
    : hero.stats.hp;

  return hero;
}

export function addHeroXp(hero: Hero, xpAmount: number): AddHeroXpResult {
  const trait = TRAITS[hero.traitKey] ?? TRAITS.brave;
  const gainedXp = Math.max(0, Math.floor(xpAmount * trait.xpMultiplier));
  const levelUps: number[] = [];

  hero.xp += gainedXp;

  while (hero.level < hero.maxLevel && hero.xp >= getHeroXpForNextLevel(hero.level)) {
    hero.xp -= getHeroXpForNextLevel(hero.level);
    hero.level += 1;
    recalculateHeroStats(hero);
    levelUps.push(hero.level);
  }

  if (hero.level >= hero.maxLevel) {
    hero.xp = Math.min(hero.xp, getHeroXpForNextLevel(hero.level) - 1);
  }

  return { gainedXp, levelUps };
}

export function getHeroPower(hero: Hero): number {
  const stats = hero.stats || ({} as Stats);
  return Math.round(stats.hp * 0.3 + stats.atk * 4 + stats.def * 3 + stats.spd * 5 + stats.focus * 2 + stats.luck);
}

export function getRarityStars(rarity: number): string {
  return "★".repeat(rarity) + "☆".repeat(Math.max(0, 5 - rarity));
}
