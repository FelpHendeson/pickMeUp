import type { GameState, MissionReward } from "../types";

export type MissionStatKey =
  | "towerVictories"
  | "summons"
  | "expeditionsStarted"
  | "expeditionsCollected"
  | "itemsEquipped"
  | "bossNoCasualtyWins";

export type DailyMissionDefinition = {
  id: string;
  title: string;
  description: string;
  statKey: MissionStatKey;
  target: number;
  reward: MissionReward;
};

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  target: number;
  statKey?: MissionStatKey;
  getProgress?: (state: GameState) => number;
  reward: MissionReward;
};

export const TRACKED_MISSION_STATS: MissionStatKey[] = [
  "towerVictories",
  "summons",
  "expeditionsStarted",
  "expeditionsCollected",
  "itemsEquipped",
  "bossNoCasualtyWins",
];

export const DAILY_MISSION_DEFINITIONS: DailyMissionDefinition[] = [
  {
    id: "tower_wins_3",
    title: "Limpar a trilha",
    description: "Venca 3 combates na torre.",
    statKey: "towerVictories",
    target: 3,
    reward: { gold: 180, crystals: 20, consumables: { small_healing_potion: 1 } },
  },
  {
    id: "summon_1",
    title: "Chamado do portal",
    description: "Faca 1 invocacao.",
    statKey: "summons",
    target: 1,
    reward: { gold: 80, essence: 8 },
  },
  {
    id: "start_expedition_1",
    title: "Ordens de campo",
    description: "Envie 1 expedicao.",
    statKey: "expeditionsStarted",
    target: 1,
    reward: { gold: 120, fragments: 8 },
  },
  {
    id: "equip_item_1",
    title: "Preparacao de combate",
    description: "Equipe 1 item em qualquer heroi.",
    statKey: "itemsEquipped",
    target: 1,
    reward: { gold: 100, crystals: 10 },
  },
  {
    id: "collect_expedition_1",
    title: "Relatorio de retorno",
    description: "Colete recompensa de 1 expedicao.",
    statKey: "expeditionsCollected",
    target: 1,
    reward: { crystals: 15, essence: 10, consumables: { vigor_potion: 1 } },
  },
];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "floor_10",
    title: "Primeiro marco",
    description: "Chegue ao andar 10.",
    target: 10,
    getProgress: (state) => Math.min(40, Math.max(1, Number(state.towerFloor) || 1)),
    reward: { gold: 500, crystals: 60, essence: 20, echoFragments: 6, heroContracts: 1, consumables: { medical_kit: 1 } },
  },
  {
    id: "floor_20",
    title: "Ressonancia profunda",
    description: "Chegue ao andar 20.",
    target: 20,
    getProgress: (state) => Math.min(40, Math.max(1, Number(state.towerFloor) || 1)),
    reward: { gold: 900, crystals: 110, fragments: 35, echoFragments: 10, heroContracts: 1 },
  },
  {
    id: "summon_10",
    title: "Companhia crescente",
    description: "Invoque 10 herois.",
    target: 10,
    getProgress: (state) => Math.max(Number(state.missionStats.summons) || 0, state.heroes.length),
    reward: { gold: 350, crystals: 80 },
  },
  {
    id: "rarity_4_hero",
    title: "Eco raro",
    description: "Tenha um heroi 4 estrelas ou superior.",
    target: 1,
    getProgress: (state) => (state.heroes.some((hero) => hero.rarity >= 4) ? 1 : 0),
    reward: { crystals: 120, essence: 35, echoFragments: 6 },
  },
  {
    id: "boss_no_fallen",
    title: "Vitoria impecavel",
    description: "Venca um chefe sem perder herois.",
    target: 1,
    statKey: "bossNoCasualtyWins",
    reward: { gold: 600, crystals: 90, essence: 25, echoFragments: 8, heroContracts: 1, consumables: { protection_amulet: 1 } },
  },
  {
    id: "equip_5",
    title: "Arsenal desperto",
    description: "Equipe 5 itens.",
    target: 5,
    statKey: "itemsEquipped",
    reward: { gold: 300, fragments: 45 },
  },
  {
    id: "expeditions_10",
    title: "Rede de exploradores",
    description: "Complete 10 expedicoes.",
    target: 10,
    statKey: "expeditionsCollected",
    reward: { gold: 450, crystals: 70, fragments: 30, echoFragments: 8 },
  },
];
