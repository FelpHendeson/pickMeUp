import { getHeroDefinitionById } from "../heroes/heroRoster";
import { getHeroPotentialReport } from "../potential";
import { getHeroProficiencySummary } from "../proficiencies";
import { getHeroPromotionPreview, getPromotionTierRequirement } from "../promotion";
import { STARTER_COMMON_SUMMON_COUNT } from "../summon/initialSummonState";
import { getHeroTrainingSummary } from "../training";
import type { GameState, Hero } from "../types";

export type EarlyObjectiveStatus = "locked" | "available" | "completed";

export type EarlyObjective = {
  key: string;
  title: string;
  description: string;
  status: EarlyObjectiveStatus;
  progressCurrent: number;
  progressTarget: number;
  actionLabel?: string;
  targetTab?: string;
  hint: string;
};

export type EarlyObjectiveTrack = {
  title: string;
  summary: string;
  completedCount: number;
  totalCount: number;
  objectives: EarlyObjective[];
  nextObjective: EarlyObjective | null;
};

// Definicao interna de cada passo. `completed` e derivado puramente do estado;
// `progress` alimenta a barra X/Y. A ordem do array define a "ordem minima".
type ObjectiveBlueprint = {
  key: string;
  title: string;
  description: string;
  hint: string;
  actionLabel?: string;
  targetTab?: string;
  progressCurrent: number;
  progressTarget: number;
  completed: boolean;
};

const TRACK_TITLE = "Rota da Primeira Ascensão";

function getOneStarHeroes(state: GameState): Hero[] {
  return state.heroes.filter((hero) => Math.floor(Number(hero.rarity) || 1) === 1);
}

function heroHasTraining(state: GameState, heroId: string): boolean {
  const summary = getHeroTrainingSummary(state, heroId);
  return Boolean(summary && summary.xp > 0);
}

function heroHasDiscoveredProficiency(state: GameState, heroId: string): boolean {
  const summary = getHeroProficiencySummary(state, heroId);
  return Boolean(summary && summary.discovered.length > 0);
}

function heroReachedPotentialLevel(state: GameState, heroId: string, minLevel: number): boolean {
  const report = getHeroPotentialReport(state, heroId);
  return Boolean(report && report.analysisLevel >= minLevel);
}

// Um heroi foi promovido quando sua raridade atual supera a raridade base da
// definicao no roster. Nao depende de historico persistido.
function hasPromotedHero(state: GameState): boolean {
  return state.heroes.some((hero) => {
    const definition = getHeroDefinitionById(hero.definitionId);
    if (!definition) return false;
    return Math.floor(Number(hero.rarity) || 1) > definition.initialRarity;
  });
}

function hasEligibleOneStarPromotion(state: GameState, oneStarHeroes: Hero[]): boolean {
  return oneStarHeroes.some((hero) => {
    const preview = getHeroPromotionPreview(state, hero.id);
    return Boolean(preview && preview.promotionAvailable && preview.eligible);
  });
}

function getPromotionCostTargets(): { gold: number; fragments: number } {
  const tier = getPromotionTierRequirement(2);
  const cost = tier?.cost ?? [];
  const gold = cost.find((entry) => entry.resourceKey === "gold")?.amount ?? 150;
  const fragments = cost.find((entry) => entry.resourceKey === "fragments")?.amount ?? 5;
  return { gold, fragments };
}

function buildBlueprints(state: GameState): ObjectiveBlueprint[] {
  const oneStarHeroes = getOneStarHeroes(state);
  const hasOneStar = oneStarHeroes.length > 0;
  const commonUsed = Math.max(0, STARTER_COMMON_SUMMON_COUNT - Math.max(0, Math.floor(Number(state.initialSummon.commonRemaining) || 0)));
  const formationCount = state.formation.filter((slot) => typeof slot === "string" && slot).length;
  const towerFloor = Math.max(1, Math.floor(Number(state.towerFloor) || 1));
  const gold = Math.max(0, Math.floor(Number(state.resources.gold) || 0));
  const fragments = Math.max(0, Math.floor(Number(state.resources.fragments) || 0));
  const cost = getPromotionCostTargets();

  const trainedOneStar = oneStarHeroes.some((hero) => heroHasTraining(state, hero.id));
  const proficientOneStar = oneStarHeroes.some((hero) => heroHasDiscoveredProficiency(state, hero.id));
  const analyzedOneStar = oneStarHeroes.some((hero) => heroReachedPotentialLevel(state, hero.id, 1));

  const resourceProgress = (gold >= cost.gold ? 1 : 0) + (fragments >= cost.fragments ? 1 : 0);

  return [
    {
      key: "use-tickets",
      title: "Usar os tickets iniciais",
      description: "Gaste os 5 tickets comuns para formar o núcleo do Lobby.",
      hint: "Use seus tickets iniciais na Invocação para formar o núcleo do Lobby.",
      actionLabel: "Abrir Invocação",
      targetTab: "summon",
      progressCurrent: Math.min(commonUsed, STARTER_COMMON_SUMMON_COUNT),
      progressTarget: STARTER_COMMON_SUMMON_COUNT,
      completed: Math.floor(Number(state.initialSummon.commonRemaining) || 0) <= 0,
    },
    {
      key: "choose-special",
      title: "Escolher o herói especial",
      description: "Reivindique a escolha especial para liderar os primeiros andares.",
      hint: "Escolha um herói especial para liderar os primeiros andares.",
      actionLabel: "Abrir Invocação",
      targetTab: "summon",
      progressCurrent: state.initialSummon.specialClaimed ? 1 : 0,
      progressTarget: 1,
      completed: Boolean(state.initialSummon.specialClaimed),
    },
    {
      key: "build-formation",
      title: "Montar a primeira formação",
      description: "Coloque ao menos um herói na formação antes de desafiar a Torre.",
      hint: "Monte uma formação antes de desafiar a Torre.",
      actionLabel: "Abrir Formação",
      targetTab: "formation",
      progressCurrent: Math.min(formationCount, 1),
      progressTarget: 1,
      completed: formationCount >= 1,
    },
    {
      key: "win-floor-1",
      title: "Vencer o primeiro andar",
      description: "Enfrente o andar 1 da Torre para iniciar a campanha.",
      hint: "Entre na Torre e vença o primeiro andar.",
      actionLabel: "Abrir Torre",
      targetTab: "tower",
      progressCurrent: towerFloor >= 2 ? 1 : 0,
      progressTarget: 1,
      completed: towerFloor >= 2,
    },
    {
      key: "reach-floor-5",
      title: "Superar o marco do andar 5",
      description: "Vença o andar 5 para abrir a primeira fonte de fragmentos.",
      hint: "Vença o andar 5 para abrir a primeira fonte de fragmentos.",
      actionLabel: "Abrir Torre",
      targetTab: "tower",
      progressCurrent: Math.min(Math.max(towerFloor - 1, 0), 5),
      progressTarget: 5,
      completed: towerFloor >= 6,
    },
    {
      key: "first-fragments",
      title: "Obter os primeiros fragmentos",
      description: "Recolha fragmentos nas recompensas dos andares iniciais.",
      hint: "Fragmentos aparecem nos andares 5, 7 e 10 da Torre.",
      actionLabel: "Abrir Torre",
      targetTab: "tower",
      progressCurrent: Math.min(fragments, 1),
      progressTarget: 1,
      completed: fragments >= 1,
    },
    {
      key: "train-one-star",
      title: "Treinar um herói 1★",
      description: "Desenvolva o progresso técnico de um herói comum no Campo de Treino.",
      hint: hasOneStar
        ? "Treine um herói 1★ para revelar sua primeira proficiência."
        : "Invoque ou recrute um herói 1★ para começar o desenvolvimento técnico.",
      actionLabel: "Abrir Heróis",
      targetTab: "heroes",
      progressCurrent: trainedOneStar ? 1 : 0,
      progressTarget: 1,
      completed: trainedOneStar,
    },
    {
      key: "reveal-proficiency",
      title: "Revelar uma proficiência",
      description: "O treino contínuo revela a identidade técnica do herói 1★.",
      hint: "Mantenha o treino do herói 1★ para revelar uma proficiência.",
      actionLabel: "Abrir Heróis",
      targetTab: "heroes",
      progressCurrent: proficientOneStar ? 1 : 0,
      progressTarget: 1,
      completed: proficientOneStar,
    },
    {
      key: "analyze-potential",
      title: "Analisar o potencial (nível 1)",
      description: "Aprofunde a análise de potencial de um herói 1★.",
      hint: "Analise o potencial do herói para preparar a ascensão.",
      actionLabel: "Abrir Heróis",
      targetTab: "heroes",
      progressCurrent: analyzedOneStar ? 1 : 0,
      progressTarget: 1,
      completed: analyzedOneStar,
    },
    {
      key: "gather-resources",
      title: "Reunir recursos para a ascensão",
      description: `Junte ${cost.gold} ouro e ${cost.fragments} fragmentos para a promoção 1★ → 2★.`,
      hint: `Quando reunir ${cost.gold} ouro e ${cost.fragments} fragmentos, poderá promover um herói 1★ elegível.`,
      actionLabel: "Abrir Torre",
      targetTab: "tower",
      progressCurrent: resourceProgress,
      progressTarget: 2,
      completed: gold >= cost.gold && fragments >= cost.fragments,
    },
    {
      key: "promote-one-star",
      title: "Promover um herói 1★ para 2★",
      description: "Conclua a primeira ascensão do jogo em um herói 1★ elegível.",
      hint: hasEligibleOneStarPromotion(state, oneStarHeroes)
        ? "Um herói 1★ está elegível: abra Heróis e confirme a promoção para 2★."
        : "Cumpra treino, proficiência, análise e custo para liberar a promoção 1★ → 2★.",
      actionLabel: "Abrir Heróis",
      targetTab: "heroes",
      progressCurrent: hasPromotedHero(state) ? 1 : 0,
      progressTarget: 1,
      completed: hasPromotedHero(state),
    },
  ];
}

function buildSummary(track: Omit<EarlyObjectiveTrack, "summary">): string {
  if (track.totalCount === 0) return "Trilha inicial indisponível.";
  if (track.completedCount >= track.totalCount) {
    return "Trilha inicial concluída: você dominou o caminho até a primeira ascensão.";
  }
  const next = track.nextObjective;
  const base = `${track.completedCount} de ${track.totalCount} objetivos concluídos.`;
  return next ? `${base} Próximo: ${next.title}.` : base;
}

// Funcao pura: le o GameState e retorna a trilha inicial. Nao altera estado.
export function getEarlyObjectiveTrack(state: GameState): EarlyObjectiveTrack {
  const blueprints = buildBlueprints(state);

  // A fronteira "available" e o primeiro objetivo nao concluido na ordem.
  let frontierAssigned = false;
  const objectives: EarlyObjective[] = blueprints.map((blueprint) => {
    let status: EarlyObjectiveStatus;
    if (blueprint.completed) {
      status = "completed";
    } else if (!frontierAssigned) {
      status = "available";
      frontierAssigned = true;
    } else {
      status = "locked";
    }

    return {
      key: blueprint.key,
      title: blueprint.title,
      description: blueprint.description,
      status,
      progressCurrent: blueprint.progressCurrent,
      progressTarget: blueprint.progressTarget,
      actionLabel: blueprint.actionLabel,
      targetTab: blueprint.targetTab,
      hint: blueprint.hint,
    };
  });

  const completedCount = objectives.filter((objective) => objective.status === "completed").length;
  const nextObjective = objectives.find((objective) => objective.status === "available") ?? null;

  const partial: Omit<EarlyObjectiveTrack, "summary"> = {
    title: TRACK_TITLE,
    completedCount,
    totalCount: objectives.length,
    objectives,
    nextObjective,
  };

  return { ...partial, summary: buildSummary(partial) };
}
