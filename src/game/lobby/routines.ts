import { getHeroExpedition, isHeroOnExpedition } from "../expeditions";
import { getHeroTrainingFocus, getTrainingFocusDefinition } from "../training";
import type { GameState, Hero } from "../types";

export type LobbyRoutineLocation =
  | "trainingGround"
  | "infirmary"
  | "workshop"
  | "barracks"
  | "summonPortal"
  | "missionBoard"
  | "expeditionGate"
  | "square"
  | "restingQuarters";

export type LobbyRoutineActivity =
  | "training"
  | "resting"
  | "recovering"
  | "preparingEquipment"
  | "studyingRelics"
  | "guarding"
  | "socializing"
  | "waitingOrders"
  | "onExpedition"
  | "readyForTower";

export type HeroLobbyRoutine = {
  heroId: string;
  heroName: string;
  location: LobbyRoutineLocation;
  activity: LobbyRoutineActivity;
  label: string;
  description: string;
  priority: number;
  since: number;
};

export type LobbyRoutineLocationReport = {
  label: string;
  heroCount: number;
  heroIds: string[];
};

export type LobbyRoutineReport = {
  generatedAt: number;
  routines: HeroLobbyRoutine[];
  locations: Record<LobbyRoutineLocation, LobbyRoutineLocationReport>;
  summary: string;
};

export const LOBBY_ROUTINE_BLOCK_MS = 10 * 60 * 1000;

const LOCATION_LABELS: Record<LobbyRoutineLocation, string> = {
  trainingGround: "Campo de Treino",
  infirmary: "Enfermaria",
  workshop: "Oficina",
  barracks: "Alojamentos",
  summonPortal: "Portal de Invocação",
  missionBoard: "Quadro de Missões",
  expeditionGate: "Portão de Expedições",
  square: "Praça do Lobby",
  restingQuarters: "Aposentos de Descanso",
};

const COMBAT_CLASSES = new Set(["warrior", "guardian", "archer", "rogue"]);
const ARCANE_CLASSES = new Set(["mage", "priest"]);

function normalizeNow(now: number): number {
  return Number.isFinite(now) ? Math.max(0, Math.floor(now)) : 0;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getTimeBlock(now: number): number {
  return Math.floor(normalizeNow(now) / LOBBY_ROUTINE_BLOCK_MS);
}

function getVariantIndex(heroId: string, timeBlock: number, variantCount: number): number {
  return (hashString(heroId) + timeBlock) % Math.max(1, variantCount);
}

function selectVariant(heroId: string, timeBlock: number, variants: string[]): string {
  return variants[getVariantIndex(heroId, timeBlock, variants.length)] ?? variants[0] ?? "";
}

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

function getCurrentHpRatio(hero: Hero): number {
  const maxHp = Math.max(1, Math.round(Number(hero.stats.hp) || 1));
  const currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  return Math.min(1, currentHp / maxHp);
}

function needsEquipmentAttention(state: Pick<GameState, "inventory">, hero: Hero): boolean {
  const equippedItems = Object.values(hero.equipment || {})
    .filter((equipmentId): equipmentId is string => typeof equipmentId === "string")
    .map((equipmentId) => state.inventory.find((item) => item.id === equipmentId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (equippedItems.length < 2) return true;
  return equippedItems.some((item) => item.rarity + 1 < hero.rarity);
}

function createRoutine(
  hero: Hero,
  timeBlock: number,
  routine: Omit<HeroLobbyRoutine, "heroId" | "heroName" | "since">,
): HeroLobbyRoutine {
  return {
    heroId: hero.id,
    heroName: hero.name,
    since: timeBlock * LOBBY_ROUTINE_BLOCK_MS,
    ...routine,
  };
}

export function getHeroLobbyRoutine(state: GameState, hero: Hero, now = Date.now()): HeroLobbyRoutine {
  const normalizedNow = normalizeNow(now);
  const timeBlock = getTimeBlock(normalizedNow);

  if (isHeroOnExpedition(state, hero.id)) {
    const expedition = getHeroExpedition(state, hero.id);
    return createRoutine(hero, timeBlock, {
      location: "expeditionGate",
      activity: "onExpedition",
      label: "Em expedição",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} atravessou o Portão de Expedições rumo a ${expedition?.name ?? "uma rota externa"}.`,
        `${hero.name} permanece fora do Lobby cumprindo a missão ${expedition?.name ?? "designada"}.`,
        `O registro de ${hero.name} indica atividade além dos muros do Lobby.`,
      ]),
      priority: 100,
    });
  }

  if (hasActiveInjury(hero)) {
    return createRoutine(hero, timeBlock, {
      location: "infirmary",
      activity: "recovering",
      label: "Em recuperação",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} recebe cuidados na Enfermaria após os ferimentos da última missão.`,
        `${hero.name} repousa sob observação enquanto os ferimentos são avaliados.`,
        `${hero.name} troca os curativos e evita esforço antes da próxima ordem.`,
      ]),
      priority: 90,
    });
  }

  if (getCurrentHpRatio(hero) <= 0.45) {
    return createRoutine(hero, timeBlock, {
      location: "infirmary",
      activity: "resting",
      label: "Recuperando forças",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} descansa na Enfermaria com o corpo ainda exausto.`,
        `${hero.name} permanece deitado para recuperar o fôlego antes de outra subida.`,
        `${hero.name} evita o pátio e conserva energia sob os cuidados da Enfermaria.`,
      ]),
      priority: 80,
    });
  }

  if (Number(hero.morale) < 40) {
    const socializing = getVariantIndex(hero.id, timeBlock, 2) === 1;
    return createRoutine(hero, timeBlock, {
      location: socializing ? "square" : "restingQuarters",
      activity: socializing ? "socializing" : "resting",
      label: socializing ? "Buscando companhia" : "Recolhido",
      description: socializing
        ? selectVariant(hero.id, timeBlock, [
            `${hero.name} conversa em voz baixa na Praça do Lobby para recuperar a confiança.`,
            `${hero.name} observa os outros heróis e tenta afastar os ecos da última batalha.`,
          ])
        : selectVariant(hero.id, timeBlock, [
            `${hero.name} permanece nos Aposentos de Descanso, longe do ruído da Torre.`,
            `${hero.name} procura silêncio para reorganizar os pensamentos.`,
          ]),
      priority: 70,
    });
  }

  if (state.formation.includes(hero.id)) {
    return createRoutine(hero, timeBlock, {
      location: "trainingGround",
      activity: "readyForTower",
      label: "Pronto para a Torre",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} repassa a formação no Campo de Treino antes da próxima subida.`,
        `${hero.name} mantém o equipamento à mão e aguarda a ordem de marcha.`,
        `${hero.name} treina movimentos curtos com a equipe escalada para a Torre.`,
      ]),
      priority: 60,
    });
  }

  if (needsEquipmentAttention(state, hero)) {
    return createRoutine(hero, timeBlock, {
      location: "workshop",
      activity: "preparingEquipment",
      label: "Revisando equipamento",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} compara peças e correias na Oficina improvisada.`,
        `${hero.name} procura uma melhoria entre as armas disponíveis do Lobby.`,
        `${hero.name} ajusta o próprio equipamento antes de aceitar outra missão.`,
      ]),
      priority: 50,
    });
  }

  if (ARCANE_CLASSES.has(hero.classKey)) {
    return createRoutine(hero, timeBlock, {
      location: "summonPortal",
      activity: "studyingRelics",
      label: "Estudando ecos",
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} observa as runas do Portal de Invocação em silêncio.`,
        `${hero.name} registra oscilações arcanas ao redor do Portal.`,
        `${hero.name} compara fragmentos de conhecimento diante das luzes do Portal.`,
      ]),
      priority: 40,
    });
  }

  if (COMBAT_CLASSES.has(hero.classKey)) {
    // Herois impedidos ja retornaram em ramos anteriores (expedicao, ferimento,
    // HP critico, moral baixa), entao aqui o treino reflete um foco tecnico ativo.
    const focusDefinition = getTrainingFocusDefinition(getHeroTrainingFocus(state, hero.id));
    const focusLabel = focusDefinition?.label ?? "Treino Técnico";
    return createRoutine(hero, timeBlock, {
      location: "trainingGround",
      activity: "training",
      label: `Treino: ${focusLabel}`,
      description: selectVariant(hero.id, timeBlock, [
        `${hero.name} aprofunda o foco de ${focusLabel} no Campo de Treino.`,
        `${hero.name} repete exercícios de ${focusLabel} contra um boneco de palha.`,
        `${hero.name} mantém a rotina de ${focusLabel} enquanto aguarda novas ordens.`,
      ]),
      priority: 30,
    });
  }

  const socializing = getVariantIndex(hero.id, timeBlock, 2) === 1;
  return createRoutine(hero, timeBlock, {
    location: socializing ? "square" : "missionBoard",
    activity: socializing ? "socializing" : "waitingOrders",
    label: socializing ? "Circulando pelo Lobby" : "Aguardando ordens",
    description: socializing
      ? `${hero.name} troca histórias breves com outros heróis na Praça do Lobby.`
      : `${hero.name} examina o Quadro de Missões em busca de uma nova tarefa.`,
    priority: 10,
  });
}

function createEmptyLocationReport(): Record<LobbyRoutineLocation, LobbyRoutineLocationReport> {
  const createLocation = (location: LobbyRoutineLocation): LobbyRoutineLocationReport => ({
    label: LOCATION_LABELS[location],
    heroCount: 0,
    heroIds: [],
  });

  return {
    trainingGround: createLocation("trainingGround"),
    infirmary: createLocation("infirmary"),
    workshop: createLocation("workshop"),
    barracks: createLocation("barracks"),
    summonPortal: createLocation("summonPortal"),
    missionBoard: createLocation("missionBoard"),
    expeditionGate: createLocation("expeditionGate"),
    square: createLocation("square"),
    restingQuarters: createLocation("restingQuarters"),
  };
}

export function getLobbyRoutineReport(state: GameState, now = Date.now()): LobbyRoutineReport {
  const generatedAt = normalizeNow(now);
  const routines = state.heroes
    .map((hero) => getHeroLobbyRoutine(state, hero, generatedAt))
    .sort((left, right) => right.priority - left.priority || left.heroName.localeCompare(right.heroName));
  const locations = createEmptyLocationReport();

  routines.forEach((routine) => {
    const location = locations[routine.location];
    location.heroIds.push(routine.heroId);
    location.heroCount = location.heroIds.length;
  });

  if (routines.length === 0) {
    return {
      generatedAt,
      routines,
      locations,
      summary: "O Lobby está silencioso. Nenhum herói foi recrutado para ocupar suas áreas.",
    };
  }

  const occupiedLocations = Object.values(locations).filter((location) => location.heroCount > 0).length;
  const recoveringCount = routines.filter((routine) => routine.activity === "recovering" || routine.activity === "resting").length;
  const expeditionCount = routines.filter((routine) => routine.activity === "onExpedition").length;
  const readyCount = routines.filter((routine) => routine.activity === "readyForTower").length;
  const highlights = [
    readyCount > 0 ? `${readyCount} preparado(s) para a Torre` : "",
    recoveringCount > 0 ? `${recoveringCount} em descanso ou recuperação` : "",
    expeditionCount > 0 ? `${expeditionCount} fora em expedição` : "",
  ].filter(Boolean);

  return {
    generatedAt,
    routines,
    locations,
    summary: `${routines.length} herói(s) movimentam ${occupiedLocations} área(s) do Lobby${highlights.length > 0 ? `: ${highlights.join(", ")}.` : "."}`,
  };
}
