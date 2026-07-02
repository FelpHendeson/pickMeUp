import type { ProficiencyRank } from "../proficiencies/definitions";

export type PromotionRequirementStatus = "met" | "missing" | "warning";

export type PromotionRequirementKey =
  | "rarity"
  | "level"
  | "potential"
  | "proficiency"
  | "technique"
  | "tower"
  | "material"
  | "morale"
  | "injury"
  | "cost";

export type PromotionResourceKey = "gold" | "crystals" | "essence" | "fragments";

export type PromotionResourceCost = {
  resourceKey: PromotionResourceKey;
  amount: number;
};

export type PromotionReadiness = "blocked" | "not-ready" | "almost" | "ready";

export type PromotionRequirement = {
  key: PromotionRequirementKey;
  label: string;
  description: string;
  status: PromotionRequirementStatus;
  currentValue?: string | number;
  requiredValue?: string | number;
};

export type PromotionTierRequirement = {
  targetRarity: number;
  minLevel: number;
  minPotentialLevel: number;
  minProficiencyRank: ProficiencyRank;
  minDiscoveredProficiencies: number;
  requireTechnique: boolean;
  minTowerFloor: number;
  minMorale: number;
  requireNoInjury: boolean;
  futureMaterialLabel: string | null;
  // Custo real de recursos. Vazio quando a promocao ainda nao e executavel.
  cost: PromotionResourceCost[];
  // Marca a unica faixa com promocao real liberada nesta versao (1★ -> 2★).
  promotionAvailable: boolean;
};

export const PROMOTION_MAX_RARITY = 5;

const RESOURCE_LABELS: Record<PromotionResourceKey, string> = {
  gold: "ouro",
  crystals: "cristais",
  essence: "essência",
  fragments: "fragmentos",
};

export function getPromotionResourceLabel(resourceKey: PromotionResourceKey): string {
  return RESOURCE_LABELS[resourceKey] ?? resourceKey;
}

export function formatPromotionCost(cost: readonly PromotionResourceCost[]): string {
  if (!cost || cost.length === 0) return "Sem custo de recursos.";
  return cost.map((entry) => `${entry.amount} ${getPromotionResourceLabel(entry.resourceKey)}`).join(", ");
}

// Requisitos por estrela-alvo. Ajustaveis sem migration: o preview e derivado do estado.
export const PROMOTION_TIER_REQUIREMENTS: readonly PromotionTierRequirement[] = [
  {
    targetRarity: 2,
    minLevel: 5,
    minPotentialLevel: 1,
    minProficiencyRank: "unknown",
    minDiscoveredProficiencies: 1,
    requireTechnique: false,
    minTowerFloor: 1,
    minMorale: 40,
    requireNoInjury: true,
    futureMaterialLabel: null,
    cost: [
      { resourceKey: "gold", amount: 150 },
      { resourceKey: "fragments", amount: 5 },
    ],
    promotionAvailable: true,
  },
  {
    targetRarity: 3,
    minLevel: 10,
    minPotentialLevel: 2,
    minProficiencyRank: "novice",
    minDiscoveredProficiencies: 1,
    requireTechnique: true,
    minTowerFloor: 5,
    minMorale: 45,
    requireNoInjury: true,
    futureMaterialLabel: null,
    cost: [],
    promotionAvailable: false,
  },
  {
    targetRarity: 4,
    minLevel: 20,
    minPotentialLevel: 3,
    minProficiencyRank: "practiced",
    minDiscoveredProficiencies: 2,
    requireTechnique: true,
    minTowerFloor: 15,
    minMorale: 50,
    requireNoInjury: true,
    futureMaterialLabel: null,
    cost: [],
    promotionAvailable: false,
  },
  {
    targetRarity: 5,
    minLevel: 30,
    minPotentialLevel: 4,
    minProficiencyRank: "competent",
    minDiscoveredProficiencies: 2,
    requireTechnique: true,
    minTowerFloor: 25,
    minMorale: 55,
    requireNoInjury: true,
    futureMaterialLabel: "Material de Eco",
    cost: [],
    promotionAvailable: false,
  },
];

const RANK_ORDER: readonly ProficiencyRank[] = ["unknown", "novice", "practiced", "competent", "refined"];

export function getProficiencyRankIndex(rank: ProficiencyRank): number {
  const index = RANK_ORDER.indexOf(rank);
  return index < 0 ? 0 : index;
}

export function getPromotionTierRequirement(targetRarity: number): PromotionTierRequirement | null {
  return PROMOTION_TIER_REQUIREMENTS.find((tier) => tier.targetRarity === targetRarity) ?? null;
}

export function getProficiencyRankLabel(rank: ProficiencyRank): string {
  switch (rank) {
    case "novice":
      return "Novato";
    case "practiced":
      return "Praticado";
    case "competent":
      return "Competente";
    case "refined":
      return "Refinado";
    default:
      return "Qualquer (descoberta)";
  }
}
