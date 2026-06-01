import { applyDifficultyToFloorReward } from "../difficulty";
import { createEnemyUnit, type CreateEnemyUnitOptions, type EnemyUnit } from "./enemies";
import { getTowerChapterByFloor } from "./chapters";

export type TowerFloor = {
  floor: number;
  title: string;
  recommendedLevel: number;
  mechanic: string;
  enemyKeys: string[];
  modifierKeys?: string[];
  modifier?: string;
  rewardHint: string;
};

export type TowerReward = {
  gold: number;
  xp: number;
  energyRefund: number;
  crystalChance: number;
  crystalAmount: number;
  essence: number;
  fragments: number;
  echoFragmentChance: number;
  echoFragmentAmount: number;
  consumableChance: number;
  equipmentChance: number;
  guaranteedEquipment: boolean;
  difficultyMode?: string;
  difficultyRewardMultiplier?: number;
  equipmentRarityBonusFloors?: number;
};

export type TowerRewardOptions = {
  difficultyMode?: unknown;
  towerGoldMultiplier?: number;
  equipmentDropMultiplier?: number;
  consumableDropMultiplier?: number;
  heroXpMultiplier?: number;
};

export const TOWER_FLOORS: TowerFloor[] = [
  { floor: 1, title: "Ecos no Atrio", recommendedLevel: 1, mechanic: "Tutorial", enemyKeys: ["stoneSlime", "stoneSlime"], rewardHint: "Ouro" },
  { floor: 2, title: "Asas na Penumbra", recommendedLevel: 1, mechanic: "Velocidade", enemyKeys: ["stoneSlime", "duskBat", "duskBat"], rewardHint: "Ouro + XP" },
  { floor: 3, title: "Ponte dos Saqueadores", recommendedLevel: 2, mechanic: "Dano fisico", enemyKeys: ["ridgeRaider", "ridgeRaider"], rewardHint: "Cristais" },
  { floor: 4, title: "Ninho Escuro", recommendedLevel: 2, mechanic: "Alvos frageis", enemyKeys: ["duskBat", "duskBat", "duskBat", "duskBat"], rewardHint: "XP" },
  { floor: 5, title: "Capitao da Serra", recommendedLevel: 3, mechanic: "Mini-chefe", enemyKeys: ["ridgeRaider", "ridgeRaider", "stoneSlime"], rewardHint: "Chance de equipamento" },
  { floor: 6, title: "Circulo da Marca", recommendedLevel: 3, mechanic: "Marca", enemyKeys: ["markedAcolyte", "markedAcolyte", "stoneSlime"], modifier: "Maldicao leve: inimigos focam alvos feridos.", rewardHint: "Essencia" },
  { floor: 7, title: "Muralha Viva", recommendedLevel: 4, mechanic: "Defesa alta", enemyKeys: ["stoneSlime", "stoneSlime", "stoneSlime"], modifier: "Terreno estreito: frente recebe mais ataques.", rewardHint: "Fragmentos" },
  { floor: 8, title: "Camara Mista", recommendedLevel: 4, mechanic: "Formacao", enemyKeys: ["stoneSlime", "duskBat", "ridgeRaider", "markedAcolyte"], modifier: "Nevoa: turnos mais imprevisiveis.", rewardHint: "Cristais" },
  { floor: 9, title: "Pressao Rubra", recommendedLevel: 5, mechanic: "Pressao", enemyKeys: ["markedAcolyte", "ridgeRaider", "ridgeRaider", "duskBat"], modifier: "Mana instavel: habilidades aparecem mais cedo.", rewardHint: "Chance de equipamento incomum" },
  { floor: 10, title: "Nucleo do Golem", recommendedLevel: 5, mechanic: "Chefe: esmagamento em area", enemyKeys: ["ironGolem", "markedAcolyte"], modifier: "Chefe de marco: o Golem atinge ate 2 alvos com sua habilidade.", rewardHint: "Ouro, cristais e Oficina" },
  { floor: 11, title: "Enfermaria Quebrada", recommendedLevel: 6, mechanic: "Cura reduzida", enemyKeys: ["emberHound", "stoneSlime", "markedAcolyte"], modifierKeys: ["reducedHealing"], rewardHint: "Ouro e XP" },
  { floor: 12, title: "Galeria dos Uivos", recommendedLevel: 6, mechanic: "Velocidade inimiga", enemyKeys: ["emberHound", "emberHound", "duskBat"], modifierKeys: ["fastEnemies"], rewardHint: "Cristais" },
  { floor: 13, title: "Passagem Tumular", recommendedLevel: 7, mechanic: "Defesa inimiga", enemyKeys: ["graveWarden", "ridgeRaider", "markedAcolyte"], modifierKeys: ["exposedTeam"], rewardHint: "Essencia" },
  { floor: 14, title: "Escadaria Sem Folego", recommendedLevel: 7, mechanic: "Energia inicial baixa", enemyKeys: ["graveWarden", "duskBat", "emberHound"], modifierKeys: ["drainedStart"], rewardHint: "Fragmentos" },
  { floor: 15, title: "Forja Fraturada", recommendedLevel: 8, mechanic: "Dano constante", enemyKeys: ["emberHound", "graveWarden", "ridgeRaider"], modifierKeys: ["exposedTeam"], rewardHint: "Equipamento garantido" },
  { floor: 16, title: "Sala dos Prismas", recommendedLevel: 8, mechanic: "Suporte inimigo", enemyKeys: ["crystalSeer", "stoneSlime", "emberHound"], modifierKeys: ["reducedHealing"], rewardHint: "Cristais" },
  { floor: 17, title: "Corrente de Vidro", recommendedLevel: 9, mechanic: "Rapidez e foco", enemyKeys: ["crystalSeer", "duskBat", "stormHarpy"], modifierKeys: ["fastEnemies"], rewardHint: "XP alto" },
  { floor: 18, title: "Patio dos Vigias", recommendedLevel: 9, mechanic: "Tanques", enemyKeys: ["graveWarden", "graveWarden", "crystalSeer"], modifierKeys: ["drainedStart"], rewardHint: "Ouro alto" },
  { floor: 19, title: "Antesala Estilhada", recommendedLevel: 10, mechanic: "Preparacao de chefe", enemyKeys: ["stormHarpy", "voidReaver", "crystalSeer"], modifierKeys: ["reducedHealing", "fastEnemies"], rewardHint: "Chance alta de equipamento" },
  { floor: 20, title: "Trono do Oraculo", recommendedLevel: 10, mechanic: "Chefe: marcas multiplas", enemyKeys: ["shardOracle", "crystalSeer"], modifierKeys: ["reducedHealing"], modifier: "Chefe de marco: o Oraculo marca dois alvos vulneraveis.", rewardHint: "Equipamento garantido e cristais" },
  { floor: 21, title: "Ponte Tempestuosa", recommendedLevel: 11, mechanic: "Velocidade alta", enemyKeys: ["stormHarpy", "stormHarpy", "emberHound"], modifierKeys: ["fastEnemies", "exposedTeam"], rewardHint: "Ouro e XP" },
  { floor: 22, title: "Cripta Veloz", recommendedLevel: 11, mechanic: "Pressao na retaguarda", enemyKeys: ["stormHarpy", "voidReaver", "duskBat"], modifierKeys: ["fastEnemies"], rewardHint: "Cristais" },
  { floor: 23, title: "Camara Sem Pulso", recommendedLevel: 12, mechanic: "Cura limitada", enemyKeys: ["voidReaver", "graveWarden", "markedAcolyte"], modifierKeys: ["reducedHealing", "drainedStart"], rewardHint: "Essencia" },
  { floor: 24, title: "Muralha dos Ceifadores", recommendedLevel: 12, mechanic: "Dano pesado", enemyKeys: ["voidReaver", "voidReaver", "graveWarden"], modifierKeys: ["exposedTeam"], rewardHint: "Fragmentos" },
  { floor: 25, title: "Forja do Eclipse", recommendedLevel: 13, mechanic: "Elite", enemyKeys: ["voidReaver", "crystalSeer", "graveWarden", "emberHound"], modifierKeys: ["exposedTeam", "drainedStart"], rewardHint: "Equipamento garantido" },
  { floor: 26, title: "Galeria Invertida", recommendedLevel: 13, mechanic: "Turnos rapidos", enemyKeys: ["stormHarpy", "stormHarpy", "crystalSeer", "duskBat"], modifierKeys: ["fastEnemies", "reducedHealing"], rewardHint: "Cristais" },
  { floor: 27, title: "Fenda Abissal", recommendedLevel: 14, mechanic: "Dano e marca", enemyKeys: ["voidReaver", "markedAcolyte", "voidReaver"], modifierKeys: ["exposedTeam", "reducedHealing"], rewardHint: "XP alto" },
  { floor: 28, title: "Guarda do Eclipse", recommendedLevel: 14, mechanic: "Tanque e suporte", enemyKeys: ["graveWarden", "graveWarden", "crystalSeer", "voidReaver"], modifierKeys: ["drainedStart", "fastEnemies"], rewardHint: "Ouro alto" },
  { floor: 29, title: "Limiar Escurecido", recommendedLevel: 15, mechanic: "Teste final", enemyKeys: ["stormHarpy", "voidReaver", "crystalSeer", "emberHound"], modifierKeys: ["reducedHealing", "fastEnemies", "exposedTeam"], rewardHint: "Chance muito alta de equipamento" },
  { floor: 30, title: "Coroa do Eclipse", recommendedLevel: 15, mechanic: "Chefe: dreno de energia", enemyKeys: ["eclipseAvatar", "voidReaver", "crystalSeer"], modifierKeys: ["drainedStart", "exposedTeam"], modifier: "Chefe final: o Avatar drena energia da equipe e causa dano em area.", rewardHint: "Grande recompensa final" },
  { floor: 31, title: "Portao de Enxofre", recommendedLevel: 16, mechanic: "Pressao inicial", enemyKeys: ["ashImp", "ashImp", "brimstoneBrute"], modifierKeys: ["fastEnemies"], rewardHint: "Ouro e XP" },
  { floor: 32, title: "Pontes de Correntes", recommendedLevel: 16, mechanic: "Dano focado", enemyKeys: ["hellboundKnight", "ashImp", "ashImp"], modifierKeys: ["exposedTeam"], rewardHint: "Cristais" },
  { floor: 33, title: "Caldeirao das Cinzas", recommendedLevel: 17, mechanic: "Suporte infernal", enemyKeys: ["cinderWitch", "brimstoneBrute", "ashImp"], modifierKeys: ["reducedHealing"], rewardHint: "Essencia" },
  { floor: 34, title: "Muralha de Ossos Quentes", recommendedLevel: 17, mechanic: "Defesa alta", enemyKeys: ["brimstoneBrute", "brimstoneBrute", "cinderWitch"], modifierKeys: ["drainedStart"], rewardHint: "Fragmentos" },
  { floor: 35, title: "Arena dos Acorrentados", recommendedLevel: 18, mechanic: "Elite", enemyKeys: ["hellboundKnight", "hellboundKnight", "brimstoneBrute"], modifierKeys: ["exposedTeam", "fastEnemies"], rewardHint: "Equipamento garantido" },
  { floor: 36, title: "Forno Sem Ceu", recommendedLevel: 18, mechanic: "Cura pressionada", enemyKeys: ["cinderWitch", "ashImp", "hellboundKnight", "ashImp"], modifierKeys: ["reducedHealing", "fastEnemies"], rewardHint: "Cristais" },
  { floor: 37, title: "Desfiladeiro Rubro", recommendedLevel: 19, mechanic: "Ataques pesados", enemyKeys: ["hellboundKnight", "brimstoneBrute", "hellboundKnight"], modifierKeys: ["exposedTeam"], rewardHint: "XP alto" },
  { floor: 38, title: "Capela da Brasa Negra", recommendedLevel: 19, mechanic: "Marca e suporte", enemyKeys: ["cinderWitch", "markedAcolyte", "brimstoneBrute", "ashImp"], modifierKeys: ["reducedHealing", "drainedStart"], rewardHint: "Ouro alto" },
  { floor: 39, title: "Limiar do Abismo", recommendedLevel: 20, mechanic: "Teste final", enemyKeys: ["ashImp", "hellboundKnight", "cinderWitch", "brimstoneBrute"], modifierKeys: ["fastEnemies", "exposedTeam", "reducedHealing"], rewardHint: "Chance muito alta de equipamento" },
  { floor: 40, title: "Garganta da Serpente", recommendedLevel: 20, mechanic: "Chefe: veneno abissal", enemyKeys: ["abyssalSerpent", "cinderWitch", "hellboundKnight"], modifierKeys: ["drainedStart", "exposedTeam", "reducedHealing"], modifier: "Chefe final do Abismo: a Serpente pressiona toda a equipe com ataques brutais.", rewardHint: "Grande recompensa final do capitulo" },
];

function isMilestoneFloor(floorNumber: number): boolean {
  return [5, 9, 15, 19, 25, 29, 35, 39].includes(floorNumber);
}

export function getFloorData(floorNumber: number): TowerFloor | null {
  return TOWER_FLOORS.find((floor) => floor.floor === floorNumber) ?? null;
}

export function isBossFloor(floorNumber: number): boolean {
  const chapter = getTowerChapterByFloor(floorNumber);
  return chapter.endFloor === floorNumber;
}

export function createEnemiesForFloor(floorNumber: number, options: CreateEnemyUnitOptions = {}): EnemyUnit[] {
  const floorData = getFloorData(floorNumber);
  if (!floorData) return [];
  return floorData.enemyKeys.map((enemyKey, index) => createEnemyUnit(enemyKey, floorNumber, index, floorData, options));
}

export function getFloorReward(floorNumber: number, options: TowerRewardOptions = {}): TowerReward {
  const bossFloor = isBossFloor(floorNumber);
  const reward: TowerReward = {
    gold: 45 + floorNumber * 18 + Math.floor(Math.max(0, floorNumber - 10) * 9),
    xp: 28 + floorNumber * 11 + Math.floor(Math.max(0, floorNumber - 10) * 5),
    energyRefund: bossFloor ? 5 : floorNumber >= 11 ? 4 : 3,
    crystalChance: Math.min(0.1 + floorNumber * 0.012, 0.42),
    crystalAmount: 8 + floorNumber * 2 + Math.floor(floorNumber / 10) * 8,
    essence: floorNumber === 6 ? 15 : floorNumber === 10 ? 20 : floorNumber >= 13 && floorNumber % 5 === 3 ? 18 + floorNumber : 0,
    fragments: floorNumber === 7 ? 15 : floorNumber === 10 ? 20 : floorNumber >= 14 && floorNumber % 5 === 4 ? 18 + floorNumber : 0,
    echoFragmentChance: bossFloor ? 0.65 : Math.min(0.03 + floorNumber * 0.003, 0.16),
    echoFragmentAmount: bossFloor ? 2 + Math.floor(floorNumber / 10) * 2 : 1,
    consumableChance: bossFloor ? 0.38 : Math.min(0.08 + floorNumber * 0.004, 0.24),
    equipmentChance: Math.min(8 + floorNumber * 0.9, 48) / 100,
    guaranteedEquipment: bossFloor || isMilestoneFloor(floorNumber),
  };

  reward.gold = Math.max(1, Math.round(reward.gold * (options.towerGoldMultiplier || 1)));
  reward.equipmentChance = Math.min(0.9, reward.equipmentChance * (options.equipmentDropMultiplier || 1));
  reward.consumableChance = Math.min(0.9, reward.consumableChance * (options.consumableDropMultiplier || 1));

  return applyDifficultyToFloorReward(reward, options.difficultyMode);
}

export function describeReward(floorNumber: number, options: TowerRewardOptions = {}): string {
  const reward = getFloorReward(floorNumber, options);
  const displayedXp = Math.max(1, Math.round(reward.xp * (options.heroXpMultiplier || 1)));
  const parts = [`${reward.gold} ouro`, `${displayedXp} XP por heroi`, `${reward.energyRefund} energia recuperada`];

  if (reward.essence > 0) parts.push(`${reward.essence} essencia`);
  if (reward.fragments > 0) parts.push(`${reward.fragments} fragmentos`);
  parts.push(`${Math.round(reward.echoFragmentChance * 100)}% de fragmentos de eco`);
  parts.push(`${Math.round(reward.consumableChance * 100)}% de consumivel`);
  parts.push(`${Math.round(reward.crystalChance * 100)}% de cristais`);
  parts.push(reward.guaranteedEquipment ? "equipamento garantido" : `${Math.round(reward.equipmentChance * 100)}% de equipamento`);

  return parts.join(" | ");
}
