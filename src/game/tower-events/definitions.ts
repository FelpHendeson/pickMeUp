import type { TowerEventDefinition, TowerEventTypeKey } from "../types";

export const TOWER_EVENT_CHANCE = 0.3;
export const MAX_TOWER_EVENT_HISTORY_ITEMS = 8;
export const BATTLE_MAX_UNIT_ENERGY = 125;

export const TOWER_EVENT_RESOURCE_NAMES: Record<string, string> = {
  gold: "ouro",
  crystals: "cristais",
  essence: "essencia",
  fragments: "fragmentos",
  echoFragments: "fragmentos de eco",
  heroContracts: "contrato(s) de heroi",
  energy: "energia",
};

export const TOWER_EVENT_DEFINITIONS: Record<TowerEventTypeKey, TowerEventDefinition> = {
  healingFountain: {
    title: "Fonte de cura",
    tone: "support",
    description:
      "Uma fonte azul pulsa entre runas antigas. A agua pode restaurar a equipe, mas a torre raramente oferece algo sem custo.",
    choices: [
      {
        id: "carefulDrink",
        label: "Beber com cuidado",
        description: "Remove ferimentos de eventos e concede energia inicial na proxima luta.",
      },
      {
        id: "deepDrink",
        label: "Aceitar a corrente profunda",
        description: "Grande chance de bencao ofensiva, pequena chance de maldicao.",
      },
    ],
  },
  mysteryChest: {
    title: "Bau misterioso",
    tone: "reward",
    description: "Um bau lacrado repousa no corredor. O metal vibra como se algo vivo estivesse preso la dentro.",
    choices: [
      {
        id: "openCarefully",
        label: "Abrir com cuidado",
        description: "Pode render ouro, cristais ou equipamento. Baixa chance de armadilha.",
      },
      {
        id: "breakSeal",
        label: "Quebrar o selo",
        description: "Recompensa melhor, mas risco alto de dano antes da proxima luta.",
      },
    ],
  },
  lostMerchant: {
    title: "Mercador perdido",
    tone: "merchant",
    description: "Um vendedor coberto de poeira oferece suprimentos simples antes de desaparecer entre as escadas.",
    choices: [
      {
        id: "buyPotion",
        label: "Comprar pocao",
        description: "Custa 70 ouro. Remove ferimentos e melhora curas na proxima luta.",
        cost: { resource: "gold", amount: 70 },
      },
      {
        id: "buyEquipment",
        label: "Comprar equipamento comum",
        description: "Custa 140 ouro. Adiciona um equipamento ao inventario.",
        cost: { resource: "gold", amount: 140 },
      },
      {
        id: "buyTonic",
        label: "Comprar tonico de combate",
        description: "Custa 90 ouro. ATK e SPD aumentam na proxima luta.",
        cost: { resource: "gold", amount: 90 },
      },
      {
        id: "leaveMerchant",
        label: "Guardar ouro",
        description: "Nao compra nada e segue em frente.",
      },
    ],
  },
  darkAltar: {
    title: "Altar sombrio",
    tone: "danger",
    description: "Um altar negro pede um juramento. O poder oferecido e real, mas a penalidade tambem.",
    choices: [
      {
        id: "bloodPact",
        label: "Firmar pacto de sangue",
        description: "+20% ATK na proxima luta, mas -10% HP maximo temporario.",
      },
      {
        id: "consumeAshes",
        label: "Consumir as cinzas",
        description: "+25% ATK, mas a equipe entra ferida e recebe mais dano.",
      },
      {
        id: "rejectAltar",
        label: "Quebrar o circulo",
        description: "Evita o pacto e recolhe fragmentos instaveis.",
      },
    ],
  },
  prisoner: {
    title: "Prisioneiro",
    tone: "choice",
    description: "Uma cela improvisada prende alguem que jura ter sido capturado pelos monstros da torre.",
    choices: [
      {
        id: "freePrisoner",
        label: "Libertar",
        description: "Chance de recrutar um heroi comum ou incomum. Tambem pode ser uma emboscada.",
      },
      {
        id: "demandOath",
        label: "Exigir juramento",
        description: "Menor chance de sucesso, mas melhor chance de heroi incomum. Risco maior de emboscada.",
      },
    ],
  },
  trap: {
    title: "Armadilha",
    tone: "danger",
    description: "O piso cede e runas vermelhas acendem. A equipe precisa reagir antes do proximo confronto.",
    choices: [
      {
        id: "disarmTrap",
        label: "Tentar desarmar",
        description: "Boa chance de evitar o dano e ganhar fragmentos. Falha causa dano.",
      },
      {
        id: "rushThrough",
        label: "Atravessar correndo",
        description: "Sofre dano leve, mas ganha SPD na proxima luta.",
      },
      {
        id: "braceImpact",
        label: "Proteger a linha de frente",
        description: "Recebe menos dano e ganha DEF temporaria.",
      },
    ],
  },
};

export const PRE_TOWER_EVENT_KEYS: TowerEventTypeKey[] = [
  "healingFountain",
  "mysteryChest",
  "lostMerchant",
  "darkAltar",
  "prisoner",
  "trap",
];

export const POST_TOWER_EVENT_KEYS: TowerEventTypeKey[] = [
  "healingFountain",
  "mysteryChest",
  "lostMerchant",
  "darkAltar",
  "prisoner",
];
