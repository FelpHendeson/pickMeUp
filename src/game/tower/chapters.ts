import type { GameState, TowerEventPhase } from "../types";

export type TowerModifierValues = {
  keys: string[];
  labels: string[];
  descriptions: string[];
  healingDoneMultiplier: number;
  enemySpeedMultiplier: number;
  playerDamageTakenMultiplier: number;
  playerInitialEnergyPenalty: number;
  enemyAtkMultiplier: number;
  enemyDefMultiplier: number;
  enemyHpMultiplier: number;
  enemyFocusMultiplier: number;
};

export type TowerRegionalModifier = Partial<Omit<TowerModifierValues, "keys" | "labels" | "descriptions">> & {
  label: string;
  description: string;
};

export type TowerChapterReward = {
  gold: number;
  crystals: number;
  essence: number;
  fragments: number;
  echoFragments: number;
  heroContracts: number;
};

export type TowerChapter = {
  id: string;
  number: number;
  name: string;
  description: string;
  theme: string;
  tone: string;
  startFloor: number;
  endFloor: number;
  predominantEnemies: string[];
  specificEvents: string[];
  eventKeys: Record<TowerEventPhase, string[]>;
  finalBoss: string;
  regionalModifier: TowerRegionalModifier;
  completionReward: TowerChapterReward;
};

export type TowerFloorLike = {
  floor: number;
  modifierKeys?: string[];
};

export const TOWER_CHAPTERS: TowerChapter[] = [
  {
    id: "awakening_ruins",
    number: 1,
    name: "Ruinas do Despertar",
    description: "Pedras antigas, ecos fracos e os primeiros sinais da torre consciente.",
    theme: "Runas antigas e corredores quebrados",
    tone: "ruins",
    startFloor: 1,
    endFloor: 10,
    predominantEnemies: ["Slimes de pedra", "Morcegos sombrios", "Saqueadores", "Acolitos marcados"],
    specificEvents: ["Fonte de cura", "Bau misterioso", "Prisioneiro"],
    eventKeys: {
      pre: ["healingFountain", "mysteryChest", "prisoner", "trap"],
      post: ["healingFountain", "mysteryChest", "prisoner"],
    },
    finalBoss: "Golem Antigo",
    regionalModifier: {
      label: "Pedra desperta",
      description: "DEF inimiga +4%",
      enemyDefMultiplier: 1.04,
    },
    completionReward: { gold: 420, crystals: 60, essence: 25, fragments: 25, echoFragments: 10, heroContracts: 1 },
  },
  {
    id: "bestial_forest",
    number: 2,
    name: "Floresta Bestial",
    description: "Raizes invadem a torre e criaturas famintas perseguem qualquer ruido.",
    theme: "Vegetacao escura, feras e emboscadas",
    tone: "forest",
    startFloor: 11,
    endFloor: 20,
    predominantEnemies: ["Sabuesos de brasa", "Harpias", "Vigias tumulares", "Videntes cristalinos"],
    specificEvents: ["Armadilha", "Prisioneiro", "Mercador perdido"],
    eventKeys: {
      pre: ["trap", "prisoner", "lostMerchant", "mysteryChest"],
      post: ["prisoner", "lostMerchant", "mysteryChest"],
    },
    finalBoss: "Oraculo Estilhacado",
    regionalModifier: {
      label: "Cacada viva",
      description: "SPD inimiga +6%",
      enemySpeedMultiplier: 1.06,
    },
    completionReward: { gold: 760, crystals: 90, essence: 45, fragments: 45, echoFragments: 16, heroContracts: 1 },
  },
  {
    id: "spectral_crypt",
    number: 3,
    name: "Cripta Espectral",
    description: "A torre mergulha em corredores frios, marcas e ecos de mortos inquietos.",
    theme: "Criptas, espectros e marcas sombrias",
    tone: "crypt",
    startFloor: 21,
    endFloor: 30,
    predominantEnemies: ["Ceifadores do vazio", "Vigias tumulares", "Harpias", "Oraculos"],
    specificEvents: ["Altar sombrio", "Fonte de cura", "Bau misterioso"],
    eventKeys: {
      pre: ["darkAltar", "healingFountain", "mysteryChest", "trap"],
      post: ["darkAltar", "healingFountain", "mysteryChest"],
    },
    finalBoss: "Avatar do Eclipse",
    regionalModifier: {
      label: "Assombro persistente",
      description: "equipe recebe +7% dano",
      playerDamageTakenMultiplier: 1.07,
    },
    completionReward: { gold: 1150, crystals: 130, essence: 70, fragments: 70, echoFragments: 24, heroContracts: 1 },
  },
  {
    id: "infernal_abyss",
    number: 4,
    name: "Abismo Infernal",
    description: "A torre abre uma fenda ardente onde correntes, cinzas e demonios testam a equipe.",
    theme: "Fogo negro, correntes e abismos vivos",
    tone: "abyss",
    startFloor: 31,
    endFloor: 40,
    predominantEnemies: ["Diabretes", "Brutamontes de enxofre", "Bruxas da cinza", "Cavaleiros acorrentados"],
    specificEvents: ["Altar sombrio", "Armadilha", "Mercador perdido"],
    eventKeys: {
      pre: ["darkAltar", "trap", "lostMerchant", "mysteryChest"],
      post: ["darkAltar", "trap", "lostMerchant"],
    },
    finalBoss: "Serpente Abissal",
    regionalModifier: {
      label: "Calor infernal",
      description: "ATK inimigo +8% e curas da equipe -8%",
      enemyAtkMultiplier: 1.08,
      healingDoneMultiplier: 0.92,
    },
    completionReward: { gold: 1600, crystals: 180, essence: 100, fragments: 100, echoFragments: 34, heroContracts: 1 },
  },
];

export const FLOOR_MODIFIERS: Record<string, TowerRegionalModifier> = {
  reducedHealing: {
    label: "Cura reduzida",
    description: "curas da equipe -25%",
    healingDoneMultiplier: 0.75,
  },
  fastEnemies: {
    label: "Inimigos mais rapidos",
    description: "SPD inimiga +14%",
    enemySpeedMultiplier: 1.14,
  },
  exposedTeam: {
    label: "Dano recebido aumentado",
    description: "equipe recebe +12% dano",
    playerDamageTakenMultiplier: 1.12,
  },
  drainedStart: {
    label: "Energia inicial reduzida",
    description: "herois com -15 energia inicial",
    playerInitialEnergyPenalty: 15,
  },
};

function createEmptyModifierValues(): TowerModifierValues {
  return {
    keys: [],
    labels: [],
    descriptions: [],
    healingDoneMultiplier: 1,
    enemySpeedMultiplier: 1,
    playerDamageTakenMultiplier: 1,
    playerInitialEnergyPenalty: 0,
    enemyAtkMultiplier: 1,
    enemyDefMultiplier: 1,
    enemyHpMultiplier: 1,
    enemyFocusMultiplier: 1,
  };
}

function applyModifierValues(modifiers: TowerModifierValues, key: string, rule: TowerRegionalModifier): TowerModifierValues {
  modifiers.keys.push(key);
  modifiers.labels.push(rule.label);
  modifiers.descriptions.push(rule.description);
  modifiers.healingDoneMultiplier *= rule.healingDoneMultiplier || 1;
  modifiers.enemySpeedMultiplier *= rule.enemySpeedMultiplier || 1;
  modifiers.playerDamageTakenMultiplier *= rule.playerDamageTakenMultiplier || 1;
  modifiers.playerInitialEnergyPenalty += rule.playerInitialEnergyPenalty || 0;
  modifiers.enemyAtkMultiplier *= rule.enemyAtkMultiplier || 1;
  modifiers.enemyDefMultiplier *= rule.enemyDefMultiplier || 1;
  modifiers.enemyHpMultiplier *= rule.enemyHpMultiplier || 1;
  modifiers.enemyFocusMultiplier *= rule.enemyFocusMultiplier || 1;
  return modifiers;
}

export function getTowerChapterByFloor(floorNumber: number): TowerChapter {
  return TOWER_CHAPTERS.find((chapter) => floorNumber >= chapter.startFloor && floorNumber <= chapter.endFloor) ?? TOWER_CHAPTERS[TOWER_CHAPTERS.length - 1];
}

export function getTowerChapterById(chapterId: unknown): TowerChapter | null {
  return typeof chapterId === "string" ? TOWER_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? null : null;
}

export function getCompletedTowerChapterIds(state: Pick<GameState, "completedTowerChapters" | "towerFloor">): string[] {
  const completed = new Set(Array.isArray(state.completedTowerChapters) ? state.completedTowerChapters : []);
  const currentFloor = Number(state.towerFloor) || 1;

  TOWER_CHAPTERS.forEach((chapter) => {
    if (currentFloor > chapter.endFloor) {
      completed.add(chapter.id);
    }
  });

  return Array.from(completed).filter((chapterId) => Boolean(getTowerChapterById(chapterId)));
}

export function isTowerChapterCompleted(state: Pick<GameState, "completedTowerChapters" | "towerFloor">, chapterId: string): boolean {
  return getCompletedTowerChapterIds(state).includes(chapterId);
}

export function getChapterEventKeys(floorNumber: number, phase: TowerEventPhase, fallbackKeys: string[] = []): string[] {
  const keys = getTowerChapterByFloor(floorNumber).eventKeys[phase];
  return Array.isArray(keys) && keys.length > 0 ? keys : fallbackKeys;
}

export function getFloorModifierValues(floorData: TowerFloorLike | null): TowerModifierValues {
  const modifiers = createEmptyModifierValues();
  const modifierKeys = floorData?.modifierKeys || [];

  modifierKeys.forEach((modifierKey) => {
    const rule = FLOOR_MODIFIERS[modifierKey];
    if (rule) applyModifierValues(modifiers, modifierKey, rule);
  });

  if (floorData) {
    const chapter = getTowerChapterByFloor(floorData.floor);
    applyModifierValues(modifiers, `chapter_${chapter.id}`, chapter.regionalModifier);
  }

  return modifiers;
}

export function getFloorModifierSummary(floorData: TowerFloorLike | null): string {
  const modifiers = getFloorModifierValues(floorData);
  return modifiers.descriptions.length > 0 ? modifiers.descriptions.join(" | ") : "";
}
