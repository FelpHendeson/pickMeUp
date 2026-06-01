import type { StatKey } from "../types";

export type RelicBonusType = "statPercent" | "statFlat" | "summonCostReduction" | "expeditionDurationReduction";

export type RelicUnlockCondition =
  | { type: "floorReached"; floor: number; text: string }
  | { type: "expeditionsCollected"; amount: number; text: string };

export type RelicDefinition = {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  bonusType: RelicBonusType;
  stat?: StatKey;
  valuePerLevel: number;
  unlock: RelicUnlockCondition;
};

export const RELIC_DEFINITIONS: RelicDefinition[] = [
  {
    id: "tower_core",
    name: "Nucleo da Torre",
    description: "Um fragmento estavel do primeiro marco. Fortalece a vitalidade de todos os herois.",
    maxLevel: 5,
    baseCost: 6,
    costStep: 4,
    bonusType: "statPercent",
    stat: "hp",
    valuePerLevel: 0.025,
    unlock: { type: "floorReached", floor: 1, text: "Disponivel desde o inicio da escalada." },
  },
  {
    id: "commander_flame",
    name: "Chama do Comandante",
    description: "Uma chama fria que responde a ordens firmes. Aumenta o ataque global da equipe.",
    maxLevel: 5,
    baseCost: 8,
    costStep: 5,
    bonusType: "statPercent",
    stat: "atk",
    valuePerLevel: 0.018,
    unlock: { type: "floorReached", floor: 5, text: "Alcance o andar 5." },
  },
  {
    id: "survivor_shield",
    name: "Escudo dos Sobreviventes",
    description: "Placas gravadas com nomes antigos. Aumenta a defesa de todos os herois.",
    maxLevel: 5,
    baseCost: 9,
    costStep: 5,
    bonusType: "statPercent",
    stat: "def",
    valuePerLevel: 0.02,
    unlock: { type: "floorReached", floor: 10, text: "Conclua o primeiro capitulo." },
  },
  {
    id: "destiny_eye",
    name: "Olho do Destino",
    description: "Um olho mineral que antecipa brechas improvaveis. Aumenta LUCK global.",
    maxLevel: 5,
    baseCost: 10,
    costStep: 6,
    bonusType: "statFlat",
    stat: "luck",
    valuePerLevel: 1,
    unlock: { type: "floorReached", floor: 10, text: "Conclua o primeiro capitulo." },
  },
  {
    id: "portal_seal",
    name: "Selo do Portal",
    description: "Reduz o atrito do portal de invocacao e diminui levemente seus custos.",
    maxLevel: 5,
    baseCost: 12,
    costStep: 7,
    bonusType: "summonCostReduction",
    valuePerLevel: 0.02,
    unlock: { type: "floorReached", floor: 15, text: "Alcance o andar 15." },
  },
  {
    id: "arcane_hourglass",
    name: "Ampulheta Arcana",
    description: "Dobra pequenos intervalos de tempo e reduz a duracao das expedicoes.",
    maxLevel: 5,
    baseCost: 12,
    costStep: 7,
    bonusType: "expeditionDurationReduction",
    valuePerLevel: 0.03,
    unlock: { type: "expeditionsCollected", amount: 1, text: "Colete ao menos 1 expedicao." },
  },
];
