import { isHeroOnExpedition } from "../expeditions";
import { getHeroMoraleState } from "../hero-status";
import { getClassLabel } from "../potential";
import { getHeroPotentialReport } from "../potential";
import { getHeroProficiencySummary } from "../proficiencies";
import { getHeroPromotionPreview } from "../promotion";
import { getHeroTrainingSummary } from "../training";
import type { GameState, Hero } from "../types";
import {
  getLobbyRoutineReport,
  type HeroLobbyRoutine,
  type LobbyRoutineActivity,
  type LobbyRoutineLocation,
} from "./routines";

export type LobbyHeroCard = {
  heroId: string;
  heroName: string;
  classKey: string;
  classLabel: string;
  rarity: number;
  level: number;
  morale: number;
  moraleLabel: string;
  moraleTone: string;
  location: LobbyRoutineLocation;
  locationLabel: string;
  activity: LobbyRoutineActivity;
  activityLabel: string;
  hint: string;
  inFormation: boolean;
  injured: boolean;
  onExpedition: boolean;
  lowHp: boolean;
  noEquipment: boolean;
  hasTraining: boolean;
  hasProficiency: boolean;
  hasPotential: boolean;
  readyForPromotion: boolean;
  markers: string[];
};

export type LobbyGroup = {
  location: LobbyRoutineLocation;
  label: string;
  heroCount: number;
  heroes: LobbyHeroCard[];
};

export type LobbySummary = {
  total: number;
  training: number;
  injured: number;
  onExpedition: number;
  availableForTower: number;
  lowMorale: number;
  readyForPromotion: number;
};

export type LobbyAttentionTone = "danger" | "warning" | "gold" | "arcane";

export type LobbyAttentionEntry = {
  heroId: string;
  heroName: string;
  reason: string;
  tone: LobbyAttentionTone;
  targetTab: string;
};

export type LobbyLivingReport = {
  generatedAt: number;
  ambiance: string;
  summary: LobbySummary;
  groups: LobbyGroup[];
  attention: LobbyAttentionEntry[];
  note: string;
};

// Ordem estavel dos grupos de local. Determina o layout do painel.
const GROUP_ORDER: LobbyRoutineLocation[] = [
  "trainingGround",
  "expeditionGate",
  "infirmary",
  "workshop",
  "summonPortal",
  "missionBoard",
  "square",
  "restingQuarters",
  "barracks",
];

const AMBIANCE_LINES = [
  "O Lobby respira entre uma tentativa e outra da Torre.",
  "Os heróis se espalham pela base enquanto aguardam ordens do Mestre.",
  "Entre ecos e sombras, a guilda se reorganiza para a próxima subida.",
];

const LOBBY_NOTE =
  "A rotina não gera recursos automaticamente nesta versão; ela apenas revela o estado atual da guilda.";

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

function getCurrentHpRatio(hero: Hero): number {
  const maxHp = Math.max(1, Math.round(Number(hero.stats?.hp) || 1));
  const currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  return Math.min(1, currentHp / maxHp);
}

function hasNoEquipment(hero: Hero): boolean {
  return Object.values(hero.equipment || {}).filter((slot) => typeof slot === "string" && slot).length === 0;
}

function pickAmbiance(generatedAt: number): string {
  const index = Math.abs(Math.floor(generatedAt / (10 * 60 * 1000))) % AMBIANCE_LINES.length;
  return AMBIANCE_LINES[index] ?? AMBIANCE_LINES[0];
}

function buildHeroCard(state: GameState, hero: Hero, routine: HeroLobbyRoutine, locationLabel: string): LobbyHeroCard {
  const moraleState = getHeroMoraleState(hero);
  const trainingSummary = getHeroTrainingSummary(state, hero.id);
  const proficiencySummary = getHeroProficiencySummary(state, hero.id);
  const potentialReport = getHeroPotentialReport(state, hero.id);
  const promotionPreview = getHeroPromotionPreview(state, hero.id);

  const inFormation = state.formation.includes(hero.id);
  const injured = hasActiveInjury(hero);
  const onExpedition = isHeroOnExpedition(state, hero.id);
  const lowHp = !injured && getCurrentHpRatio(hero) <= 0.45;
  const hasTraining = Boolean(trainingSummary && trainingSummary.xp > 0);
  const hasProficiency = Boolean(proficiencySummary && proficiencySummary.discovered.length > 0);
  const hasPotential = Boolean(potentialReport && potentialReport.analysisLevel >= 1);
  const readyForPromotion = Boolean(promotionPreview && promotionPreview.promotionAvailable && promotionPreview.eligible);

  const markers: string[] = [];
  if (inFormation) markers.push("Formação");
  if (onExpedition) markers.push("Expedição");
  if (injured) markers.push("Ferido");
  if (lowHp) markers.push("HP baixo");
  if (readyForPromotion) markers.push("Pronto p/ 2★");
  if (hasProficiency) markers.push("Proficiência");
  if (hasPotential) markers.push("Potencial");

  return {
    heroId: hero.id,
    heroName: hero.name,
    classKey: hero.classKey,
    classLabel: getClassLabel(hero.classKey),
    rarity: Math.max(1, Math.floor(Number(hero.rarity) || 1)),
    level: Math.max(1, Math.floor(Number(hero.level) || 1)),
    morale: Math.max(0, Math.floor(Number(hero.morale) || 0)),
    moraleLabel: moraleState.label,
    moraleTone: moraleState.tone,
    location: routine.location,
    locationLabel,
    activity: routine.activity,
    activityLabel: routine.label,
    hint: routine.description,
    inFormation,
    injured,
    onExpedition,
    lowHp,
    noEquipment: hasNoEquipment(hero),
    hasTraining,
    hasProficiency,
    hasPotential,
    readyForPromotion,
    markers,
  };
}

function buildAttention(cards: LobbyHeroCard[], state: GameState): LobbyAttentionEntry[] {
  const attention: LobbyAttentionEntry[] = [];

  cards.forEach((card) => {
    if (card.readyForPromotion) {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "Pronto para promover a 2★", tone: "gold", targetTab: "heroes" });
      return;
    }
    if (card.injured) {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "Ferido: precisa de recuperação", tone: "danger", targetTab: "heroes" });
      return;
    }
    if (card.lowHp) {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "HP baixo antes da próxima subida", tone: "danger", targetTab: "heroes" });
      return;
    }
    if (card.moraleTone === "collapse" || card.moraleTone === "shaken") {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "Moral baixa", tone: "warning", targetTab: "heroes" });
      return;
    }
    if (card.noEquipment) {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "Sem equipamento", tone: "warning", targetTab: "inventory" });
      return;
    }
    const potentialReport = getHeroPotentialReport(state, card.heroId);
    if (
      potentialReport &&
      potentialReport.analysisLevel >= 1 &&
      potentialReport.xpForNextLevel !== null &&
      potentialReport.xpForNextLevel - potentialReport.analysisXp <= 2
    ) {
      attention.push({ heroId: card.heroId, heroName: card.heroName, reason: "Análise perto do próximo nível", tone: "arcane", targetTab: "heroes" });
    }
  });

  return attention;
}

// Funcao pura: enriquece o relatorio de rotina idle com dados dos herois,
// marcadores, resumo e bloco de atencao. Nao altera o estado.
export function getLobbyLivingReport(state: GameState, now = Date.now()): LobbyLivingReport {
  const routineReport = getLobbyRoutineReport(state, now);
  const heroesById = new Map(state.heroes.map((hero) => [hero.id, hero] as const));

  const cards: LobbyHeroCard[] = routineReport.routines
    .map((routine) => {
      const hero = heroesById.get(routine.heroId);
      if (!hero) return null;
      const locationLabel = routineReport.locations[routine.location]?.label ?? routine.location;
      return buildHeroCard(state, hero, routine, locationLabel);
    })
    .filter((card): card is LobbyHeroCard => Boolean(card));

  const cardsByLocation = new Map<LobbyRoutineLocation, LobbyHeroCard[]>();
  cards.forEach((card) => {
    const bucket = cardsByLocation.get(card.location) ?? [];
    bucket.push(card);
    cardsByLocation.set(card.location, bucket);
  });

  const groups: LobbyGroup[] = GROUP_ORDER.filter((location) => (cardsByLocation.get(location)?.length ?? 0) > 0).map((location) => {
    const heroes = cardsByLocation.get(location) ?? [];
    return {
      location,
      label: routineReport.locations[location]?.label ?? location,
      heroCount: heroes.length,
      heroes,
    };
  });

  const summary: LobbySummary = {
    total: cards.length,
    training: cards.filter((card) => card.activity === "training").length,
    injured: cards.filter((card) => card.injured).length,
    onExpedition: cards.filter((card) => card.onExpedition).length,
    availableForTower: cards.filter((card) => !card.onExpedition && !card.injured && !card.lowHp).length,
    lowMorale: cards.filter((card) => card.moraleTone === "collapse" || card.moraleTone === "shaken").length,
    readyForPromotion: cards.filter((card) => card.readyForPromotion).length,
  };

  return {
    generatedAt: routineReport.generatedAt,
    ambiance: pickAmbiance(routineReport.generatedAt),
    summary,
    groups,
    attention: buildAttention(cards, state),
    note: LOBBY_NOTE,
  };
}
