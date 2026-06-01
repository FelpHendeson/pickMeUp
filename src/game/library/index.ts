import type { GameState, Hero, LibraryBossRecord, LibraryEnemyRecord, LibraryEventRecord, LibraryState, Stats } from "../types";
import { RELIC_DEFINITIONS } from "../relics";
import { ENEMY_ARCHETYPES, getTowerChapterByFloor, type EnemyArchetype, type EnemyUnit } from "../tower";

export const ENEMY_DETAILS_UNLOCK_DEFEATS = 3;

export const TOWER_EVENT_LIBRARY_DEFINITIONS: Record<string, { title: string; description: string }> = {
  healingFountain: {
    title: "Fonte de Cura",
    description: "Uma fonte antiga capaz de restaurar a equipe ou cobrar um risco oculto.",
  },
  mysteryChest: {
    title: "Bau Misterioso",
    description: "Um bau deixado pela torre, alternando tesouro, equipamento e armadilha.",
  },
  lostMerchant: {
    title: "Mercador Perdido",
    description: "Um vendedor isolado que aceita ouro por suprimentos simples.",
  },
  darkAltar: {
    title: "Altar Sombrio",
    description: "Um pacto de poder imediato com custo temporario para a equipe.",
  },
  prisoner: {
    title: "Prisioneiro",
    description: "Um sobrevivente preso que pode se juntar ao grupo ou atrair emboscada.",
  },
  trap: {
    title: "Armadilha",
    description: "Um mecanismo hostil da torre que causa dano ou penalidade antes do combate.",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function finiteFloor(value: unknown): number | null {
  return Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : null;
}

function normalizeStringArray(value: unknown, limit = 8): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, limit) : [];
}

export function createLibraryState(): LibraryState {
  return {
    enemies: {},
    bosses: {},
    events: {},
    heroes: {
      classes: {},
      rarities: {},
      traits: {},
    },
  };
}

export function normalizeLibraryEnemyRecord(enemyKey: string, record: unknown): LibraryEnemyRecord {
  const raw = asRecord(record);

  return {
    key: enemyKey,
    encountered: nonNegativeInteger(raw.encountered),
    defeated: nonNegativeInteger(raw.defeated),
    firstFloor: finiteFloor(raw.firstFloor),
    lastFloor: finiteFloor(raw.lastFloor),
    region: typeof raw.region === "string" ? raw.region : "",
  };
}

export function normalizeLibraryBossRecord(bossKey: string, record: unknown): LibraryBossRecord {
  const raw = asRecord(record);
  const bestResult = raw.bestResult === "victory" || raw.bestResult === "defeat" ? raw.bestResult : "";

  return {
    key: bossKey,
    chapterId: typeof raw.chapterId === "string" ? raw.chapterId : "",
    chapterName: typeof raw.chapterName === "string" ? raw.chapterName : "",
    attempts: nonNegativeInteger(raw.attempts),
    defeated: Boolean(raw.defeated),
    bestResult,
    specialReward: typeof raw.specialReward === "string" ? raw.specialReward : "",
  };
}

export function normalizeLibraryEventRecord(eventKey: string, record: unknown): LibraryEventRecord {
  const raw = asRecord(record);

  return {
    key: eventKey,
    encountered: nonNegativeInteger(raw.encountered),
    results: normalizeStringArray(raw.results),
  };
}

export function normalizeLibraryState(state: Pick<GameState, "library" | "heroes">): LibraryState {
  const saved = asRecord(state.library);
  const savedHeroes = asRecord(saved.heroes);
  const library = createLibraryState();

  Object.entries(asRecord(saved.enemies)).forEach(([enemyKey, record]) => {
    library.enemies[enemyKey] = normalizeLibraryEnemyRecord(enemyKey, record);
  });

  Object.entries(asRecord(saved.bosses)).forEach(([bossKey, record]) => {
    library.bosses[bossKey] = normalizeLibraryBossRecord(bossKey, record);
  });

  Object.entries(asRecord(saved.events)).forEach(([eventKey, record]) => {
    library.events[eventKey] = normalizeLibraryEventRecord(eventKey, record);
  });

  ["classes", "rarities", "traits"].forEach((groupKey) => {
    Object.entries(asRecord(asRecord(savedHeroes)[groupKey])).forEach(([key, record]) => {
      const raw = asRecord(record);
      library.heroes[groupKey as keyof LibraryState["heroes"]][key] = {
        key,
        name: typeof raw.name === "string" ? raw.name : key,
        description: typeof raw.description === "string" ? raw.description : "",
        count: nonNegativeInteger(raw.count),
        discovered: Boolean(raw.discovered),
      };
    });
  });

  state.library = library;
  state.heroes.forEach((hero) => recordHeroDiscovery(state, hero));
  return state.library;
}

function getEnemyDescription(enemyKey: string, enemy?: EnemyArchetype): string {
  const descriptions: Record<string, string> = {
    stoneSlime: "Criatura rochosa lenta que desgasta a linha de frente.",
    duskBat: "Predador veloz que testa a retaguarda.",
    ridgeRaider: "Humano corrompido pela torre, focado em dano direto.",
    markedAcolyte: "Servo marcado que procura alvos feridos.",
    emberHound: "Fera agressiva das regioes bestiais.",
    graveWarden: "Guardiao de cripta com defesa elevada.",
    crystalSeer: "Conjurador que canaliza ecos cristalinos.",
    stormHarpy: "Inimigo rapido que pressiona por velocidade.",
    voidReaver: "Algoz espectral focado em dano pesado.",
    ashImp: "Demonio menor rapido e oportunista.",
    brimstoneBrute: "Tanque infernal que segura a frente.",
    cinderWitch: "Bruxa sombria com foco alto.",
    hellboundKnight: "Cavaleiro infernal de dano consistente.",
  };

  if (enemy?.role === "chefe") return "Chefe de capitulo com atributos elevados e presenca unica.";
  return descriptions[enemyKey] || "Habitante hostil da torre, ainda pouco compreendido.";
}

function getEnemyAbilities(enemyKey: string, enemy?: EnemyArchetype): string[] {
  if (enemy?.role === "chefe") return ["Pressao de chefe", "Atributos superiores"];
  if (enemyKey === "markedAcolyte") return ["Prioriza feridos"];
  if (enemy?.role === "veloz") return ["Alta velocidade"];
  if (enemy?.role === "tanque") return ["Alta resistencia"];
  if (enemy?.role === "suporte") return ["Foco elevado"];
  return ["Ataque direto"];
}

function getEnemyDrops(enemy?: EnemyArchetype): string[] {
  if (enemy?.role === "chefe") return ["Equipamento garantido", "Fragmentos de Eco", "Contrato de Heroi"];
  return ["Ouro", "XP", "Cristais", "Equipamento", "Consumivel raro"];
}

export function getLibraryEnemyView(state: Pick<GameState, "library" | "heroes">, enemyKey: string) {
  normalizeLibraryState(state);
  const enemy = ENEMY_ARCHETYPES[enemyKey];
  const record = state.library.enemies[enemyKey];
  const discovered = Boolean(record && record.encountered > 0);
  const detailsUnlocked = Boolean(record && record.defeated >= ENEMY_DETAILS_UNLOCK_DEFEATS);

  return {
    key: enemyKey,
    discovered,
    detailsUnlocked,
    name: discovered && enemy ? enemy.name : "Desconhecido",
    role: discovered && enemy ? enemy.role : "???",
    description: discovered ? getEnemyDescription(enemyKey, enemy) : "Ainda nao encontrado.",
    region: record?.region || "???",
    stats: detailsUnlocked && enemy ? enemy.stats : (null as Stats | null),
    abilities: detailsUnlocked ? getEnemyAbilities(enemyKey, enemy) : [],
    drops: detailsUnlocked ? getEnemyDrops(enemy) : [],
    encountered: record?.encountered ?? 0,
    defeated: record?.defeated ?? 0,
    firstFloor: record?.firstFloor ?? null,
    lastFloor: record?.lastFloor ?? null,
  };
}

export function recordHeroDiscovery(state: Pick<GameState, "library" | "heroes">, hero: Hero): void {
  if (!hero) return;
  if (!state.library) state.library = createLibraryState();

  if (hero.classKey) {
    state.library.heroes.classes[hero.classKey] = {
      key: hero.classKey,
      name: hero.className || hero.classKey,
      count: state.heroes.filter((candidate) => candidate.classKey === hero.classKey).length,
      discovered: true,
    };
  }

  if (hero.rarity) {
    const rarityKey = String(hero.rarity);
    state.library.heroes.rarities[rarityKey] = {
      key: rarityKey,
      name: `${hero.rarity} estrela(s)`,
      discovered: true,
    };
  }

  if (hero.traitKey) {
    state.library.heroes.traits[hero.traitKey] = {
      key: hero.traitKey,
      name: hero.traitName || hero.traitKey,
      description: hero.traitDescription || "",
      discovered: true,
    };
  }
}

export function recordEnemyEncounter(
  state: Pick<GameState, "library" | "heroes">,
  enemyTeam: Array<Pick<EnemyUnit, "enemyKey" | "role">>,
  floorNumber: number,
): void {
  normalizeLibraryState(state);
  const chapter = getTowerChapterByFloor(floorNumber);
  const region = chapter.name;

  enemyTeam.forEach((enemy) => {
    if (!enemy.enemyKey) return;
    const record = state.library.enemies[enemy.enemyKey] ?? {
      key: enemy.enemyKey,
      encountered: 0,
      defeated: 0,
      firstFloor: floorNumber,
      lastFloor: floorNumber,
      region,
    };

    record.encountered += 1;
    record.firstFloor = record.firstFloor || floorNumber;
    record.lastFloor = floorNumber;
    record.region = record.region || region;
    state.library.enemies[enemy.enemyKey] = record;

    if (enemy.role === "chefe") {
      const boss = state.library.bosses[enemy.enemyKey] ?? {
        key: enemy.enemyKey,
        chapterId: chapter.id,
        chapterName: chapter.name,
        attempts: 0,
        defeated: false,
        bestResult: "",
        specialReward: "",
      };
      boss.attempts += 1;
      boss.chapterId = boss.chapterId || chapter.id;
      boss.chapterName = boss.chapterName || chapter.name;
      state.library.bosses[enemy.enemyKey] = boss;
    }
  });
}

export function recordEnemyBattleResult(
  state: Pick<GameState, "library" | "heroes">,
  enemyTeam: Array<Pick<EnemyUnit, "enemyKey" | "role" | "hp">>,
  battleResult: "victory" | "defeat" | string,
  floorNumber: number,
): void {
  normalizeLibraryState(state);
  const chapter = getTowerChapterByFloor(floorNumber);

  enemyTeam.forEach((enemy) => {
    if (!enemy.enemyKey) return;
    const record = state.library.enemies[enemy.enemyKey];
    if (record && enemy.hp <= 0) record.defeated += 1;

    if (enemy.role === "chefe") {
      const boss = state.library.bosses[enemy.enemyKey] ?? normalizeLibraryBossRecord(enemy.enemyKey, {});
      boss.bestResult = battleResult === "victory" ? "victory" : boss.bestResult || "defeat";
      boss.defeated = boss.defeated || battleResult === "victory";
      if (boss.defeated) boss.specialReward = formatLibraryReward(chapter.completionReward);
      state.library.bosses[enemy.enemyKey] = boss;
    }
  });
}

export function formatLibraryReward(reward: Record<string, unknown>): string {
  return Object.keys(reward || {})
    .filter((key) => Number(reward[key]) > 0)
    .map((key) => `${reward[key]} ${key}`)
    .join(", ");
}

export function recordTowerEventDiscovery(
  state: Pick<GameState, "library" | "heroes">,
  event: { typeKey?: string } | null | undefined,
  choice?: { label?: string } | null,
  message?: string,
): void {
  normalizeLibraryState(state);
  if (!event?.typeKey) return;

  const record = state.library.events[event.typeKey] ?? {
    key: event.typeKey,
    encountered: 0,
    results: [],
  };
  record.encountered += 1;

  const result = choice?.label || message || "Resultado observado";
  if (result && !record.results.includes(result)) {
    record.results.push(result);
    record.results = record.results.slice(0, 8);
  }

  state.library.events[event.typeKey] = record;
}

export function getLibraryTotals(state: Pick<GameState, "library" | "heroes">) {
  normalizeLibraryState(state);

  return {
    enemies: Object.values(state.library.enemies).filter((record) => record.encountered > 0).length,
    bosses: Object.values(state.library.bosses).filter((record) => record.attempts > 0 || record.defeated).length,
    events: Object.values(state.library.events).filter((record) => record.encountered > 0).length,
    relics: RELIC_DEFINITIONS.length,
    heroClasses: Object.values(state.library.heroes.classes).filter((record) => record.discovered).length,
    heroTraits: Object.values(state.library.heroes.traits).filter((record) => record.discovered).length,
  };
}
