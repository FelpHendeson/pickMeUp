import type { ExpeditionRewardType } from "../types";

export type ExpeditionDefinition = {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  recommendedPower: number;
  reward: {
    type: ExpeditionRewardType;
    amount: number;
  };
};

export const EXPEDITION_DEFINITIONS: ExpeditionDefinition[] = [
  {
    id: "training_field",
    name: "Campo de Treino",
    description: "Treino supervisionado para ganhar experiencia fora da torre.",
    durationMs: 2 * 60 * 1000,
    recommendedPower: 180,
    reward: { type: "xp", amount: 80 },
  },
  {
    id: "old_mine",
    name: "Mina Antiga",
    description: "Exploracao segura de veios abandonados em busca de ouro.",
    durationMs: 3 * 60 * 1000,
    recommendedPower: 220,
    reward: { type: "gold", amount: 180 },
  },
  {
    id: "crystal_ruins",
    name: "Ruinas Cristalinas",
    description: "Varredura em ruinas instaveis para recuperar cristais.",
    durationMs: 5 * 60 * 1000,
    recommendedPower: 260,
    reward: { type: "crystals", amount: 35 },
  },
];
