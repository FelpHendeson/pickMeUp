import { GAME_CONFIG } from "../config";
import { getHeroPowerWithEquipment } from "../equipment";
import { isHeroOnExpedition } from "../expeditions";
import { getFormationHeroes } from "../formation";
import type { GameState, Hero } from "../types";
import { getFloorData } from "./floors";
import { getTowerMilestoneInfo, type TowerMilestoneType } from "./milestones";

export type TowerReadinessLevel = "ready" | "caution" | "danger" | "critical";
export type TowerReadinessCheckStatus = "good" | "warning" | "bad";

export type TowerReadinessCheck = {
  key: string;
  label: string;
  status: TowerReadinessCheckStatus;
  description: string;
  impact: number;
  heroIds?: string[];
};

export type TowerReadinessMetrics = {
  formationSize: number;
  maxFormationSize: number;
  formationPower: number;
  recommendedPower: number;
  averageLevel: number;
  recommendedLevel: number;
  criticalHpCount: number;
  wornHpCount: number;
  injuredHeroCount: number;
  lowMoraleCount: number;
  busyHeroCount: number;
  energy: number;
  energyCost: number;
  milestoneType: TowerMilestoneType;
};

export type TowerReadinessReport = {
  floor: number;
  level: TowerReadinessLevel;
  score: number;
  label: string;
  summary: string;
  checks: TowerReadinessCheck[];
  recommendations: string[];
  metrics: TowerReadinessMetrics;
};

const READINESS_PRESENTATION: Record<TowerReadinessLevel, { label: string; summary: string }> = {
  ready: {
    label: "Preparo controlado",
    summary: "A equipe parece pronta para este andar.",
  },
  caution: {
    label: "Preparo em atenção",
    summary: "A equipe pode vencer, mas há sinais de desgaste ou lacunas de preparo.",
  },
  danger: {
    label: "Preparo perigoso",
    summary: "Este desafio pode causar ferimentos ou derrota sem ajustes na equipe.",
  },
  critical: {
    label: "Preparo crítico",
    summary: "A equipe está claramente abaixo das condições esperadas para a tentativa.",
  },
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getHeroCurrentHpRatio(hero: Hero): number {
  const maxHp = Math.max(1, Math.round(Number(hero.stats.hp) || 1));
  const currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  return Math.min(1, currentHp / maxHp);
}

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

function formatHeroNames(heroes: Hero[]): string {
  const names = heroes.slice(0, 3).map((hero) => hero.name).join(", ");
  return heroes.length > 3 ? `${names} e mais ${heroes.length - 3}` : names;
}

function cloneHeroForPower(hero: Hero): Hero {
  return {
    ...hero,
    equipment: { ...hero.equipment },
    injuries: hero.injuries.map((injury) => ({ ...injury })),
    statRolls: { ...hero.statRolls },
    stats: { ...hero.stats },
  };
}

function getPureFormationPower(state: GameState, heroes: Hero[]): number {
  return heroes.reduce((total, hero) => total + getHeroPowerWithEquipment(state, cloneHeroForPower(hero)), 0);
}

export function getRecommendedFormationPower(floorNumber: number): number {
  const floor = getFloorData(floorNumber);
  const recommendedLevel = floor?.recommendedLevel ?? 1;
  const milestone = getTowerMilestoneInfo(floorNumber);
  const milestoneMultiplier = milestone.type === "chapter-boss" ? 1.12 : milestone.type === "block-test" ? 1.06 : 1;
  return Math.round((1250 + recommendedLevel * 150) * milestoneMultiplier);
}

export function getTowerReadinessLevel(score: number): TowerReadinessLevel {
  const normalizedScore = clampScore(score);
  if (normalizedScore >= 85) return "ready";
  if (normalizedScore >= 65) return "caution";
  if (normalizedScore >= 35) return "danger";
  return "critical";
}

export function getTowerReadinessChecks(state: GameState, floorNumber: number): TowerReadinessCheck[] {
  const heroes = getFormationHeroes(state).filter((hero): hero is Hero => Boolean(hero));
  const floor = getFloorData(floorNumber);
  const milestone = getTowerMilestoneInfo(floorNumber);
  const recommendedLevel = floor?.recommendedLevel ?? 1;
  const averageLevel = heroes.length > 0 ? heroes.reduce((total, hero) => total + hero.level, 0) / heroes.length : 0;
  const formationPower = getPureFormationPower(state, heroes);
  const recommendedPower = getRecommendedFormationPower(floorNumber);
  const missingHeroes = Math.max(0, GAME_CONFIG.maxFormationSize - heroes.length);
  const levelGap = recommendedLevel - averageLevel;
  const powerRatio = recommendedPower > 0 ? formationPower / recommendedPower : 1;
  const criticalHpHeroes = heroes.filter((hero) => getHeroCurrentHpRatio(hero) <= 0.45);
  const wornHpHeroes = heroes.filter((hero) => {
    const ratio = getHeroCurrentHpRatio(hero);
    return ratio > 0.45 && ratio <= 0.7;
  });
  const injuredHeroes = heroes.filter(hasActiveInjury);
  const criticalMoraleHeroes = heroes.filter((hero) => Number(hero.morale) < 20);
  const lowMoraleHeroes = heroes.filter((hero) => Number(hero.morale) >= 20 && Number(hero.morale) < 40);
  const busyHeroes = heroes.filter((hero) => isHeroOnExpedition(state, hero.id));

  const formationCheck: TowerReadinessCheck =
    heroes.length === 0
      ? {
          key: "formation",
          label: "Formação",
          status: "bad",
          description: "Nenhum herói está escalado para a Torre.",
          impact: -100,
        }
      : missingHeroes > 0
        ? {
            key: "formation",
            label: "Formação",
            status: "warning",
            description: `${heroes.length}/${GAME_CONFIG.maxFormationSize} posições ocupadas; ${missingHeroes} ainda vazia(s).`,
            impact: -Math.min(32, missingHeroes * 8),
            heroIds: heroes.map((hero) => hero.id),
          }
        : {
            key: "formation",
            label: "Formação",
            status: "good",
            description: "A formação está completa.",
            impact: 0,
            heroIds: heroes.map((hero) => hero.id),
          };

  const powerCheck: TowerReadinessCheck =
    powerRatio >= 1
      ? {
          key: "power",
          label: "Poder da equipe",
          status: "good",
          description: `Poder ${formationPower}, acima da referência ${recommendedPower}.`,
          impact: 0,
        }
      : powerRatio >= 0.8
        ? {
            key: "power",
            label: "Poder da equipe",
            status: "warning",
            description: `Poder ${formationPower}; a referência deste andar é ${recommendedPower}.`,
            impact: -8,
          }
        : {
            key: "power",
            label: "Poder da equipe",
            status: "bad",
            description: `Poder ${formationPower}, muito abaixo da referência ${recommendedPower}.`,
            impact: powerRatio >= 0.6 ? -16 : -24,
          };

  const levelCheck: TowerReadinessCheck =
    heroes.length > 0 && levelGap <= 0
      ? {
          key: "level",
          label: "Nível médio",
          status: "good",
          description: `Nível médio ${averageLevel.toFixed(1)} para recomendação ${recommendedLevel}.`,
          impact: 0,
        }
      : levelGap <= 1
        ? {
            key: "level",
            label: "Nível médio",
            status: "warning",
            description: `Nível médio ${averageLevel.toFixed(1)} para recomendação ${recommendedLevel}.`,
            impact: -8,
          }
        : {
            key: "level",
            label: "Nível médio",
            status: "bad",
            description: `Nível médio ${averageLevel.toFixed(1)}, abaixo da recomendação ${recommendedLevel}.`,
            impact: levelGap <= 3 ? -16 : -24,
          };

  const hpImpact = -Math.min(30, criticalHpHeroes.length * 10 + wornHpHeroes.length * 4);
  const hpCheck: TowerReadinessCheck = {
    key: "health",
    label: "Condição física",
    status: criticalHpHeroes.length > 0 ? "bad" : wornHpHeroes.length > 0 ? "warning" : "good",
    description:
      criticalHpHeroes.length > 0
        ? `HP crítico: ${formatHeroNames(criticalHpHeroes)}.`
        : wornHpHeroes.length > 0
          ? `HP desgastado: ${formatHeroNames(wornHpHeroes)}.`
          : "Todos os heróis estão com HP estável.",
    impact: hpImpact,
    heroIds: [...criticalHpHeroes, ...wornHpHeroes].map((hero) => hero.id),
  };

  const injuryCheck: TowerReadinessCheck = {
    key: "injuries",
    label: "Ferimentos",
    status: injuredHeroes.length > 0 ? "bad" : "good",
    description: injuredHeroes.length > 0 ? `Feridos: ${formatHeroNames(injuredHeroes)}.` : "Nenhum ferimento ativo na formação.",
    impact: -Math.min(30, injuredHeroes.length * 10),
    heroIds: injuredHeroes.map((hero) => hero.id),
  };

  const moraleImpact = -Math.min(30, criticalMoraleHeroes.length * 12 + lowMoraleHeroes.length * 7);
  const moraleCheck: TowerReadinessCheck = {
    key: "morale",
    label: "Moral",
    status: criticalMoraleHeroes.length > 0 ? "bad" : lowMoraleHeroes.length > 0 ? "warning" : "good",
    description:
      criticalMoraleHeroes.length > 0
        ? `Moral em colapso: ${formatHeroNames(criticalMoraleHeroes)}.`
        : lowMoraleHeroes.length > 0
          ? `Moral baixa: ${formatHeroNames(lowMoraleHeroes)}.`
          : "A moral da formação está estável.",
    impact: moraleImpact,
    heroIds: [...criticalMoraleHeroes, ...lowMoraleHeroes].map((hero) => hero.id),
  };

  const expeditionCheck: TowerReadinessCheck = {
    key: "expedition",
    label: "Disponibilidade",
    status: busyHeroes.length > 0 ? "bad" : "good",
    description: busyHeroes.length > 0 ? `Em expedição: ${formatHeroNames(busyHeroes)}.` : "Todos os heróis escalados estão disponíveis.",
    impact: busyHeroes.length > 0 ? -100 : 0,
    heroIds: busyHeroes.map((hero) => hero.id),
  };

  const energy = Math.max(0, Math.round(Number(state.resources.energy) || 0));
  const energyCheck: TowerReadinessCheck = {
    key: "energy",
    label: "Energia",
    status: energy >= GAME_CONFIG.towerEnergyCost ? "good" : "bad",
    description:
      energy >= GAME_CONFIG.towerEnergyCost
        ? `${energy} de energia disponível; a tentativa custa ${GAME_CONFIG.towerEnergyCost}.`
        : `Energia insuficiente: ${energy}/${GAME_CONFIG.towerEnergyCost}.`,
    impact: energy >= GAME_CONFIG.towerEnergyCost ? 0 : -100,
  };

  const milestoneCheck: TowerReadinessCheck = {
    key: "milestone",
    label: "Exigência do andar",
    status: milestone.type === "chapter-boss" ? "bad" : milestone.type === "block-test" ? "warning" : "good",
    description:
      milestone.type === "chapter-boss"
        ? "Chefe de capítulo: exige a melhor condição disponível do Lobby."
        : milestone.type === "block-test"
          ? "Teste de bloco: o andar aplica um salto moderado de ameaça."
          : "Andar regular, sem salto adicional de marco.",
    impact: milestone.type === "chapter-boss" ? -12 : milestone.type === "block-test" ? -6 : 0,
  };

  return [formationCheck, powerCheck, levelCheck, hpCheck, injuryCheck, moraleCheck, expeditionCheck, energyCheck, milestoneCheck];
}

export function getTowerReadinessRecommendations(
  report: Pick<TowerReadinessReport, "checks" | "level">,
): string[] {
  const checks = new Map(report.checks.map((check) => [check.key, check]));
  const recommendations: string[] = [];

  if (checks.get("formation")?.status !== "good") recommendations.push("Complete a formação antes de avançar.");
  if (checks.get("health")?.status !== "good") recommendations.push("Cure ou substitua heróis com HP baixo.");
  if (checks.get("injuries")?.status !== "good") recommendations.push("Trate ferimentos antes de enfrentar a Torre.");
  if (checks.get("morale")?.status !== "good") recommendations.push("Recupere a moral dos heróis mais abalados.");
  if (checks.get("level")?.status !== "good") recommendations.push("Aumente o nível médio da equipe.");
  if (checks.get("power")?.status !== "good") recommendations.push("Revise equipamentos e poder da formação.");
  if (checks.get("expedition")?.status !== "good") recommendations.push("Substitua heróis que ainda estão em expedição.");
  if (checks.get("energy")?.status !== "good") recommendations.push("Aguarde energia suficiente para abrir o portal.");
  if (checks.get("milestone")?.status !== "good") recommendations.push("Revise equipamentos da linha de frente antes deste marco.");
  if (recommendations.length === 0) recommendations.push("Mantenha a formação atual e avance com atenção aos modificadores do andar.");

  return recommendations;
}

export function getTowerReadinessReport(state: GameState, floorNumber: number): TowerReadinessReport {
  const floor = Math.min(GAME_CONFIG.towerMaxFloor, Math.max(1, Math.floor(Number(floorNumber) || 1)));
  const checks = getTowerReadinessChecks(state, floor);
  const criticalOperationalFailure = checks.some(
    (check) => (check.key === "formation" || check.key === "expedition" || check.key === "energy") && check.status === "bad",
  );
  const rawScore = 100 + checks.reduce((total, check) => total + check.impact, 0);
  const score = criticalOperationalFailure ? 0 : clampScore(rawScore);
  const level = criticalOperationalFailure ? "critical" : getTowerReadinessLevel(score);
  const presentation = READINESS_PRESENTATION[level];
  const heroes = getFormationHeroes(state).filter((hero): hero is Hero => Boolean(hero));
  const floorData = getFloorData(floor);
  const milestone = getTowerMilestoneInfo(floor);
  const averageLevel = heroes.length > 0 ? heroes.reduce((total, hero) => total + hero.level, 0) / heroes.length : 0;
  const report: TowerReadinessReport = {
    floor,
    level,
    score,
    label: presentation.label,
    summary: presentation.summary,
    checks,
    recommendations: [],
    metrics: {
      formationSize: heroes.length,
      maxFormationSize: GAME_CONFIG.maxFormationSize,
      formationPower: getPureFormationPower(state, heroes),
      recommendedPower: getRecommendedFormationPower(floor),
      averageLevel: Math.round(averageLevel * 10) / 10,
      recommendedLevel: floorData?.recommendedLevel ?? 1,
      criticalHpCount: heroes.filter((hero) => getHeroCurrentHpRatio(hero) <= 0.45).length,
      wornHpCount: heroes.filter((hero) => {
        const ratio = getHeroCurrentHpRatio(hero);
        return ratio > 0.45 && ratio <= 0.7;
      }).length,
      injuredHeroCount: heroes.filter(hasActiveInjury).length,
      lowMoraleCount: heroes.filter((hero) => Number(hero.morale) < 40).length,
      busyHeroCount: heroes.filter((hero) => isHeroOnExpedition(state, hero.id)).length,
      energy: Math.max(0, Math.round(Number(state.resources.energy) || 0)),
      energyCost: GAME_CONFIG.towerEnergyCost,
      milestoneType: milestone.type,
    },
  };

  report.recommendations = getTowerReadinessRecommendations(report);
  return report;
}
