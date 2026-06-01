import type { HeroClassKey, StatKey, Stats } from "../types";

export const STAT_KEYS = ["hp", "atk", "def", "spd", "focus", "luck"] as const satisfies readonly StatKey[];

export type HeroClassDefinition = {
  name: string;
  role: "frente" | "tras";
  base: Stats;
  growth: Stats;
};

export type HeroTraitDefinition = {
  name: string;
  description: string;
  multipliers: Partial<Record<StatKey, number>>;
  xpMultiplier: number;
};

export const HERO_CLASSES: Record<HeroClassKey, HeroClassDefinition> = {
  warrior: {
    name: "Guerreiro",
    role: "frente",
    base: { hp: 118, atk: 20, def: 10, spd: 8, focus: 7, luck: 5 },
    growth: { hp: 14, atk: 3, def: 2, spd: 0.45, focus: 0.5, luck: 0.35 },
  },
  archer: {
    name: "Arqueiro",
    role: "tras",
    base: { hp: 86, atk: 24, def: 6, spd: 11, focus: 8, luck: 8 },
    growth: { hp: 9, atk: 3.4, def: 1.1, spd: 0.7, focus: 0.65, luck: 0.6 },
  },
  mage: {
    name: "Mago",
    role: "tras",
    base: { hp: 78, atk: 28, def: 5, spd: 8, focus: 12, luck: 6 },
    growth: { hp: 8, atk: 4, def: 0.9, spd: 0.45, focus: 0.9, luck: 0.45 },
  },
  priest: {
    name: "Sacerdote",
    role: "tras",
    base: { hp: 92, atk: 16, def: 7, spd: 9, focus: 13, luck: 7 },
    growth: { hp: 10, atk: 2.4, def: 1.2, spd: 0.5, focus: 1, luck: 0.5 },
  },
  rogue: {
    name: "Ladino",
    role: "tras",
    base: { hp: 82, atk: 23, def: 6, spd: 13, focus: 8, luck: 12 },
    growth: { hp: 8.5, atk: 3.3, def: 1, spd: 0.9, focus: 0.6, luck: 0.9 },
  },
  guardian: {
    name: "Guardiao",
    role: "frente",
    base: { hp: 132, atk: 16, def: 14, spd: 6, focus: 6, luck: 4 },
    growth: { hp: 16, atk: 2.2, def: 2.7, spd: 0.3, focus: 0.4, luck: 0.25 },
  },
};

export const TRAITS: Record<string, HeroTraitDefinition> = {
  brave: {
    name: "Corajoso",
    description: "+8% ATK",
    multipliers: { atk: 1.08 },
    xpMultiplier: 1,
  },
  cautious: {
    name: "Cauteloso",
    description: "+8% DEF",
    multipliers: { def: 1.08 },
    xpMultiplier: 1,
  },
  ambitious: {
    name: "Ambicioso",
    description: "+15% XP ganho",
    multipliers: {},
    xpMultiplier: 1.15,
  },
  loyal: {
    name: "Leal",
    description: "+6% HP",
    multipliers: { hp: 1.06 },
    xpMultiplier: 1,
  },
  unstable: {
    name: "Instavel",
    description: "+12% ATK, -8% DEF",
    multipliers: { atk: 1.12, def: 0.92 },
    xpMultiplier: 1,
  },
};

export const GIVEN_NAMES = [
  "Arel",
  "Bryn",
  "Ciro",
  "Dara",
  "Elian",
  "Fayne",
  "Galen",
  "Hedra",
  "Iria",
  "Joren",
  "Luma",
  "Marek",
  "Nara",
  "Orin",
  "Pavel",
  "Runa",
  "Soren",
  "Talia",
  "Varek",
  "Ysol",
] as const;

export const EPITHETS = [
  "do Eco",
  "da Brasa",
  "da Vigilia",
  "do Vau",
  "da Lua Fria",
  "do Juramento",
  "da Cinza",
  "do Vale",
  "da Lamina",
  "do Farol",
] as const;
