import { getMaxLevelForRarity } from "../heroes/heroFactory";
import { getHeroPotentialReport } from "../potential";
import { getHeroProficiencySummary } from "../proficiencies";
import { canSpendResource, spendResource } from "../state/resources";
import type { GameState, Hero } from "../types";
import {
  PROMOTION_MAX_RARITY,
  formatPromotionCost,
  getProficiencyRankIndex,
  getProficiencyRankLabel,
  getPromotionTierRequirement,
  type PromotionReadiness,
  type PromotionRequirement,
  type PromotionRequirementStatus,
  type PromotionResourceCost,
} from "./definitions";

export const PROMOTION_UNAVAILABLE_ABOVE_TARGET =
  "Promoção real acima de 2★ ainda não está disponível nesta versão.";

export type HeroPromotionPreview = {
  heroId: string;
  heroName: string;
  currentRarity: number;
  targetRarity: number | null;
  eligible: boolean;
  promotionAvailable: boolean;
  readiness: PromotionReadiness;
  title: string;
  summary: string;
  requirements: PromotionRequirement[];
  cost: PromotionResourceCost[];
  costLabel: string;
  projectedBenefits: string[];
  risks: string[];
  recommendations: string[];
  systemNotice: string;
};

function findHero(state: GameState, heroId: string): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

function hasActiveInjury(hero: Hero): boolean {
  return Array.isArray(hero.injuries) && hero.injuries.some((injury) => Number(injury.remainingBattles) > 0);
}

function buildRequirement(
  key: PromotionRequirement["key"],
  label: string,
  description: string,
  met: boolean,
  currentValue?: string | number,
  requiredValue?: string | number,
  asWarning = false,
): PromotionRequirement {
  const status: PromotionRequirementStatus = asWarning ? "warning" : met ? "met" : "missing";
  return { key, label, description, status, currentValue, requiredValue };
}

export function getPromotionTargetRarity(hero: Pick<Hero, "rarity">): number | null {
  const current = Math.max(1, Math.min(PROMOTION_MAX_RARITY, Math.floor(Number(hero.rarity) || 1)));
  return current >= PROMOTION_MAX_RARITY ? null : current + 1;
}

export function getPromotionRequirementsForHero(state: GameState, heroId: string): PromotionRequirement[] {
  const hero = findHero(state, heroId);
  if (!hero) return [];

  const targetRarity = getPromotionTargetRarity(hero);
  if (targetRarity === null) {
    return [
      buildRequirement(
        "rarity",
        "Raridade máxima",
        "Este herói já está no limite de ascensão disponível nesta versão.",
        true,
        PROMOTION_MAX_RARITY,
        PROMOTION_MAX_RARITY,
      ),
    ];
  }

  const tier = getPromotionTierRequirement(targetRarity);
  if (!tier) return [];

  const potentialReport = getHeroPotentialReport(state, heroId);
  const proficiencySummary = getHeroProficiencySummary(state, heroId);
  const analysisLevel = potentialReport?.analysisLevel ?? 0;
  const discoveredCount = proficiencySummary?.discovered.length ?? 0;
  const bestRankIndex = (proficiencySummary?.discovered ?? []).reduce(
    (best, entry) => Math.max(best, getProficiencyRankIndex(entry.rank)),
    0,
  );
  const techniqueCount = proficiencySummary?.unlockedTechniques.length ?? 0;
  const towerFloor = Math.max(1, Math.floor(Number(state.towerFloor) || 1));
  const morale = Math.max(0, Math.floor(Number(hero.morale) || 0));
  const injured = hasActiveInjury(hero);

  const requirements: PromotionRequirement[] = [
    buildRequirement(
      "rarity",
      "Ascensão alvo",
      `Preparar evolução de ${hero.rarity}★ para ${targetRarity}★.`,
      true,
      `${hero.rarity}★`,
      `${targetRarity}★`,
    ),
    buildRequirement(
      "level",
      "Nível de combate",
      `O herói precisa atingir nível ${tier.minLevel} antes da ascensão.`,
      hero.level >= tier.minLevel,
      hero.level,
      tier.minLevel,
    ),
    buildRequirement(
      "potential",
      "Análise de potencial",
      `A análise deve alcançar pelo menos o nível ${tier.minPotentialLevel}.`,
      analysisLevel >= tier.minPotentialLevel,
      analysisLevel,
      tier.minPotentialLevel,
    ),
    buildRequirement(
      "proficiency",
      "Proficiências",
      `Requer ${tier.minDiscoveredProficiencies} proficiência(s) descoberta(s) com rank mínimo ${getProficiencyRankLabel(tier.minProficiencyRank)}.`,
      discoveredCount >= tier.minDiscoveredProficiencies &&
        bestRankIndex >= getProficiencyRankIndex(tier.minProficiencyRank),
      `${discoveredCount} desc., rank ${bestRankIndex}`,
      `${tier.minDiscoveredProficiencies}, ${getProficiencyRankLabel(tier.minProficiencyRank)}`,
    ),
  ];

  if (tier.requireTechnique) {
    requirements.push(
      buildRequirement(
        "technique",
        "Técnica leve",
        "Pelo menos uma técnica leve desbloqueada demonstra maturidade técnica.",
        techniqueCount >= 1,
        techniqueCount,
        1,
      ),
    );
  }

  requirements.push(
    buildRequirement(
      "tower",
      "Progresso na Torre",
      `A guilda deve avançar até o andar ${tier.minTowerFloor} da Torre.`,
      towerFloor >= tier.minTowerFloor,
      towerFloor,
      tier.minTowerFloor,
    ),
    buildRequirement(
      "morale",
      "Moral",
      `Moral mínima de ${tier.minMorale} para uma ascensão estável.`,
      morale >= tier.minMorale,
      morale,
      tier.minMorale,
    ),
  );

  if (tier.requireNoInjury) {
    requirements.push(
      buildRequirement(
        "injury",
        "Recuperação",
        "Ferimentos ativos impedem a preparação para ascensão.",
        !injured,
        injured ? "Ferido" : "Saudável",
        "Saudável",
      ),
    );
  }

  if (tier.cost.length > 0) {
    const affordable = tier.cost.every((entry) => canSpendResource(state, entry.resourceKey, entry.amount));
    requirements.push(
      buildRequirement(
        "cost",
        "Custo de ascensão",
        `Consome ${formatPromotionCost(tier.cost)} ao promover. Recursos só são gastos se a promoção acontecer.`,
        affordable,
        formatPromotionCost(tier.cost),
        formatPromotionCost(tier.cost),
      ),
    );
  }

  if (tier.futureMaterialLabel) {
    requirements.push(
      buildRequirement(
        "material",
        tier.futureMaterialLabel,
        "Requisito futuro: material raro ainda não consumido nesta versão.",
        false,
        "Indisponível",
        tier.futureMaterialLabel,
        true,
      ),
    );
  }

  return requirements;
}

export function getPromotionReadiness(preview: Pick<HeroPromotionPreview, "targetRarity" | "requirements">): PromotionReadiness {
  if (preview.targetRarity === null) return "blocked";

  const hardRequirements = preview.requirements.filter((req) => req.status !== "warning");
  const missing = hardRequirements.filter((req) => req.status === "missing");
  const warnings = preview.requirements.filter((req) => req.status === "warning");

  const blockedByCondition = missing.some((req) => req.key === "injury" || req.key === "morale");
  if (blockedByCondition) return "blocked";

  if (missing.length === 0 && warnings.length === 0) return "ready";
  if (missing.length === 0 && warnings.length > 0) return "almost";
  if (missing.length === 1) return "almost";
  return "not-ready";
}

function buildProjectedBenefits(targetRarity: number): string[] {
  const futureMaxLevel = getMaxLevelForRarity(targetRarity);
  const benefits = [
    `Aumento futuro do limite de nível (até ${futureMaxLevel}).`,
    "Desbloqueio futuro de novo marco de potencial e proficiências.",
  ];
  if (targetRarity >= 3) {
    benefits.push("Acesso futuro a especializações e técnicas mais fortes.");
  }
  if (targetRarity >= 4) {
    benefits.push("Maior peso narrativo e presença em desafios avançados da Torre.");
  }
  if (targetRarity >= 5) {
    benefits.push("Compatibilidade futura ampliada com técnicas e preparo de elite.");
  }
  return benefits;
}

function buildRisks(hero: Hero, requirements: PromotionRequirement[]): string[] {
  const risks: string[] = [];
  if (requirements.some((req) => req.key === "injury" && req.status === "missing")) {
    risks.push("Ferimentos ativos distorcem a avaliação e impedem a preparação.");
  }
  if (requirements.some((req) => req.key === "morale" && req.status === "missing")) {
    risks.push("Moral baixa pode comprometer a estabilidade da ascensão.");
  }
  if (Number(hero.morale) < 55 && !risks.some((risk) => risk.includes("Moral"))) {
    risks.push("Moral instável pode exigir cuidado extra antes da evolução real.");
  }
  return risks;
}

export function getPromotionRecommendations(
  preview: Pick<HeroPromotionPreview, "currentRarity" | "targetRarity" | "requirements" | "readiness">,
): string[] {
  const recommendations: string[] = [];
  const isLowRarity = preview.currentRarity <= 2;

  if (isLowRarity) {
    recommendations.push(
      "Baixa raridade não significa descarte. Este herói ainda precisa de treino, análise e proficiências para revelar uma rota de ascensão.",
    );
  }

  const missingPotential = preview.requirements.find((req) => req.key === "potential" && req.status === "missing");
  if (missingPotential) {
    recommendations.push("Aprofunde a análise de potencial antes de considerar a ascensão.");
  }

  const missingProficiency = preview.requirements.find((req) => req.key === "proficiency" && req.status === "missing");
  if (missingProficiency) {
    recommendations.push("Mantenha o treino técnico para revelar e fortalecer proficiências.");
  }

  const missingTechnique = preview.requirements.find((req) => req.key === "technique" && req.status === "missing");
  if (missingTechnique) {
    recommendations.push("Avance o rank das proficiências para desbloquear técnicas leves.");
  }

  const missingTower = preview.requirements.find((req) => req.key === "tower" && req.status === "missing");
  if (missingTower) {
    recommendations.push("Avance na Torre para validar o herói em conteúdo mais exigente.");
  }

  const missingLevel = preview.requirements.find((req) => req.key === "level" && req.status === "missing");
  if (missingLevel) {
    recommendations.push("Ganhe experiência em combate e expedições para subir o nível.");
  }

  const missingCost = preview.requirements.find((req) => req.key === "cost" && req.status === "missing");
  if (missingCost) {
    recommendations.push("Acumule os recursos necessários antes de confirmar a ascensão.");
  }

  const isPromotableTier = preview.currentRarity === 1 && preview.targetRarity === 2;
  if (isPromotableTier) {
    if (preview.readiness === "ready") {
      recommendations.push("Promoção para 2★ disponível: confirme para ascender o herói.");
    } else if (preview.readiness === "almost") {
      recommendations.push("Quase pronto para 2★: complete o requisito restante e garanta o custo.");
    }
  } else if (preview.readiness === "ready" || preview.readiness === "almost") {
    recommendations.push("A promoção real acima de 2★ ainda não está disponível; use esta prévia para planejar o investimento.");
  }

  if (recommendations.length === 0 && preview.targetRarity !== null) {
    recommendations.push("Continue desenvolvendo o herói; a ascensão real será liberada em etapa futura.");
  }

  return recommendations;
}

function buildTitle(readiness: PromotionReadiness, targetRarity: number | null): string {
  if (targetRarity === null) return "Limite de ascensão";
  switch (readiness) {
    case "ready":
      return `Pronto para ${targetRarity}★ (prévia)`;
    case "almost":
      return `Quase pronto para ${targetRarity}★`;
    case "blocked":
      return `Ascensão bloqueada (${targetRarity}★)`;
    default:
      return `Preparando ${targetRarity}★`;
  }
}

function buildSummary(
  hero: Hero,
  targetRarity: number | null,
  readiness: PromotionReadiness,
  isLowRarity: boolean,
): string {
  if (targetRarity === null) {
    return `${hero.name} já está no teto de ascensão (${PROMOTION_MAX_RARITY}★) disponível nesta versão.`;
  }
  if (isLowRarity) {
    return `Herói comum (${hero.rarity}★): potencial inicial pouco evidente, mas com rota de ascensão para ${targetRarity}★ se houver investimento em treino, análise e proficiências.`;
  }
  if (readiness === "ready" || readiness === "almost") {
    return `${hero.name} demonstra sinais claros de preparação para ${targetRarity}★. Parte do potencial já é visível pela raridade, mas a ascensão real ainda não foi liberada.`;
  }
  return `${hero.name} pode evoluir para ${targetRarity}★ com desenvolvimento contínuo. Esta prévia mostra o que falta antes da promoção real.`;
}

export function getHeroPromotionPreview(state: GameState, heroId: string): HeroPromotionPreview | null {
  const hero = findHero(state, heroId);
  if (!hero) return null;

  const currentRarity = Math.max(1, Math.min(PROMOTION_MAX_RARITY, Math.floor(Number(hero.rarity) || 1)));
  const targetRarity = getPromotionTargetRarity(hero);
  const isLowRarity = currentRarity <= 2;
  const requirements = getPromotionRequirementsForHero(state, heroId);
  const readiness = getPromotionReadiness({ targetRarity, requirements });
  const hardRequirements = requirements.filter((req) => req.status !== "warning");
  const eligible = targetRarity !== null && hardRequirements.every((req) => req.status === "met");

  const tier = targetRarity !== null ? getPromotionTierRequirement(targetRarity) : null;
  const cost = tier?.cost ?? [];
  const promotionAvailable = currentRarity === 1 && targetRarity === 2 && Boolean(tier?.promotionAvailable);

  const systemNotice = promotionAvailable
    ? "Promoção 1★ → 2★ disponível nesta versão. Promoções superiores ainda estão em preparação."
    : "Sistema em preparação: esta tela mostra elegibilidade e projeção. A promoção real será liberada em uma etapa futura.";

  return {
    heroId,
    heroName: hero.name,
    currentRarity,
    targetRarity,
    eligible,
    promotionAvailable,
    readiness,
    title: buildTitle(readiness, targetRarity),
    summary: buildSummary(hero, targetRarity, readiness, isLowRarity),
    requirements,
    cost,
    costLabel: formatPromotionCost(cost),
    projectedBenefits: targetRarity ? buildProjectedBenefits(targetRarity) : [],
    risks: buildRisks(hero, requirements),
    recommendations: getPromotionRecommendations({ currentRarity, targetRarity, requirements, readiness }),
    systemNotice,
  };
}

// Promocao real limitada a 1★ -> 2★. Acima disso permanece bloqueada nesta versao.
// Recursos so sao consumidos quando a promocao realmente acontece.
export function promoteHero(
  state: GameState,
  heroId: string,
): { ok: boolean; message: string } {
  const hero = findHero(state, heroId);
  if (!hero) {
    return { ok: false, message: "Herói não encontrado para promoção." };
  }

  const targetRarity = getPromotionTargetRarity(hero);
  if (targetRarity === null) {
    return { ok: false, message: `${hero.name} já está no limite de ascensão disponível nesta versão.` };
  }

  // Apenas 1★ -> 2★ e executavel por enquanto.
  if (hero.rarity !== 1 || targetRarity !== 2) {
    return { ok: false, message: PROMOTION_UNAVAILABLE_ABOVE_TARGET };
  }

  const preview = getHeroPromotionPreview(state, heroId);
  if (!preview) {
    return { ok: false, message: "Não foi possível avaliar a ascensão deste herói." };
  }
  if (!preview.eligible) {
    return { ok: false, message: `${hero.name} ainda não cumpre os requisitos para ascender a 2★.` };
  }

  // Revalida o custo antes de consumir. Falha nao gasta nada.
  const affordable = preview.cost.every((entry) => canSpendResource(state, entry.resourceKey, entry.amount));
  if (!affordable) {
    return { ok: false, message: `Recursos insuficientes para promover ${hero.name} (${preview.costLabel}).` };
  }
  preview.cost.forEach((entry) => spendResource(state, entry.resourceKey, entry.amount));

  // Efeitos reais: apenas raridade e limite de nivel. Nada mais e recalculado.
  hero.rarity = 2;
  hero.maxLevel = getMaxLevelForRarity(2);

  return {
    ok: true,
    message: `${hero.name} ascendeu para 2★. A promoção aumentou o limite de nível, mas não alterou atributos brutos nesta etapa.`,
  };
}
