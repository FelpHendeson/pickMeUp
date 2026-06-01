import { addHeroXp } from "../heroes";
import { getAffinityXpMultiplier } from "../affinity";
import { addConsumable, getConsumableDefinition, getRandomConsumableId } from "../consumables";
import { GAME_CONFIG } from "../config";
import { addEquipmentToInventory, generateEquipment, getEquipmentBonusLabel, getEquipmentTypeName } from "../equipment";
import { addAccountXp } from "../state/account";
import { addResource } from "../state/resources";
import { getFloorReward, isBossFloor, type TowerReward } from "../tower/floors";
import { getTowerChapterByFloor, isChapterFinalFloor, TOWER_CHAPTERS } from "../tower/chapters";
import { queueBossAfterNarrative, queueChapterStartNarrative } from "../narrative";
import { startVeteranRecruitment } from "../recruitment";
import { getWeeklyEventModifier } from "../weekly-events";
import type { AutoBattleResult, EquipmentItem, GameState } from "../types";
import type { RandomSource } from "../heroes/heroFactory";

export type BattleRewardTotals = {
  gold: number;
  crystals: number;
  essence: number;
  fragments: number;
  echoFragments: number;
  energyRefund: number;
  heroContracts: number;
  equipment: EquipmentItem[];
  consumables: Array<{ id: string; name: string; amount: number }>;
};

export type BattleProgressionSnapshot = {
  heroXp: Array<{ heroId: string; heroName: string; xp: number }>;
  levelUps: Array<{ heroId: string; heroName: string; level: number; levels: number[] }>;
  specializationsAvailable: Array<{ heroId: string; heroName: string }>;
  missionUpdates: unknown[];
  achievementsAvailable: unknown[];
  libraryUpdates: unknown[];
};

function ensureBattleRewards(battle: AutoBattleResult | null | undefined): BattleRewardTotals | null {
  if (!battle) return null;
  battle.rewards = battle.rewards ?? {
    gold: 0,
    crystals: 0,
    essence: 0,
    fragments: 0,
    echoFragments: 0,
    energyRefund: 0,
    heroContracts: 0,
    equipment: [],
    consumables: [],
  };
  return battle.rewards;
}

function ensureBattleProgression(battle: AutoBattleResult | null | undefined): BattleProgressionSnapshot | null {
  if (!battle) return null;
  battle.progression = battle.progression ?? {
    heroXp: [],
    levelUps: [],
    specializationsAvailable: [],
    missionUpdates: [],
    achievementsAvailable: [],
    libraryUpdates: [],
  };
  return battle.progression;
}

function addRewardEvent(log: string[], battle: AutoBattleResult | null | undefined, message: string, onEvent?: (type: string, message: string) => void): void {
  if (onEvent) {
    onEvent("reward", message);
    return;
  }
  log.push(message);
}

function getResourceRewardText(reward: Record<string, number>): string {
  return Object.keys(reward)
    .filter((resourceKey) => Number(reward[resourceKey]) > 0)
    .map((resourceKey) => {
      if (resourceKey === "gold") return `+${reward[resourceKey]} ouro`;
      if (resourceKey === "crystals") return `+${reward[resourceKey]} cristais`;
      if (resourceKey === "essence") return `+${reward[resourceKey]} essencia`;
      if (resourceKey === "echoFragments") return `+${reward[resourceKey]} fragmentos de eco`;
      if (resourceKey === "heroContracts") return `+${reward[resourceKey]} contrato(s) de heroi`;
      return `+${reward[resourceKey]} fragmentos`;
    })
    .join(", ");
}

function grantHeroXpRewards(
  state: GameState,
  heroIds: string[],
  xpAmount: number,
  log: string[],
  battle: AutoBattleResult | null | undefined,
  onEvent?: (type: string, message: string) => void,
): void {
  heroIds.forEach((heroId) => {
    const hero = state.heroes.find((candidate) => candidate.id === heroId);
    if (!hero) return;

    const affinityMultiplier = getAffinityXpMultiplier(state, heroId, heroIds);
    const adjustedXp = Math.max(1, Math.round(xpAmount * affinityMultiplier));
    const xpResult = addHeroXp(hero, adjustedXp);
    const progression = ensureBattleProgression(battle);
    progression?.heroXp.push({ heroId: hero.id, heroName: hero.name, xp: adjustedXp });

    if (xpResult.levelUps.length > 0) {
      progression?.levelUps.push({ heroId: hero.id, heroName: hero.name, level: hero.level, levels: xpResult.levelUps.slice() });
      addRewardEvent(log, battle, `${hero.name} subiu para o nivel ${hero.level}.`, onEvent);
    }

    if (hero.level >= 10 && !hero.specializationKey) {
      progression?.specializationsAvailable.push({ heroId: hero.id, heroName: hero.name });
    }
  });
}

function unlockFloorMilestones(state: GameState, floorNumber: number, log: string[], battle: AutoBattleResult | null | undefined, onEvent?: (type: string, message: string) => void): void {
  if (floorNumber === 20) {
    addRewardEvent(log, battle, "Marco vencido: proximo capitulo liberado.", onEvent);
    return;
  }

  if (floorNumber === 30) {
    addRewardEvent(log, battle, "Marco vencido: o Abismo Infernal foi liberado.", onEvent);
    return;
  }

  if (floorNumber === 40) {
    addRewardEvent(log, battle, "Campanha atual concluida: todos os capitulos foram vencidos.", onEvent);
    return;
  }

  if (floorNumber !== 10) return;

  state.baseRooms.workshop = Math.max(1, state.baseRooms.workshop || 0);
  addRewardEvent(log, battle, "Oficina desbloqueada na base.", onEvent);
}

function addRewardLogLines(
  reward: TowerReward,
  crystalDrop: number,
  echoFragmentDrop: number,
  consumableDropId: string | null,
  equipmentDrop: EquipmentItem | null,
  log: string[],
  battle: AutoBattleResult | null | undefined,
  heroXpReward: number,
  onEvent?: (type: string, message: string) => void,
): void {
  addRewardEvent(
    log,
    battle,
    `Recompensa: +${reward.gold} ouro, +${reward.energyRefund} energia e +${heroXpReward} XP para cada heroi da formacao.`,
    onEvent,
  );

  if (crystalDrop > 0) addRewardEvent(log, battle, `Cristais encontrados: +${crystalDrop}.`, onEvent);
  if (reward.essence > 0) addRewardEvent(log, battle, `Essencia recuperada: +${reward.essence}.`, onEvent);
  if (reward.fragments > 0) addRewardEvent(log, battle, `Fragmentos recolhidos: +${reward.fragments}.`, onEvent);
  if (echoFragmentDrop > 0) addRewardEvent(log, battle, `Fragmentos de Eco ressoaram: +${echoFragmentDrop}.`, onEvent);
  if (consumableDropId) {
    addRewardEvent(log, battle, `Consumivel encontrado: ${getConsumableDefinition(consumableDropId)?.name || consumableDropId}.`, onEvent);
  }
  if (equipmentDrop) {
    addRewardEvent(
      log,
      battle,
      `Equipamento obtido: ${equipmentDrop.name} (${getEquipmentTypeName(equipmentDrop.type)}, ${getEquipmentBonusLabel(equipmentDrop)}).`,
      onEvent,
    );
  }
}

function grantChapterCompletionReward(
  state: GameState,
  floorNumber: number,
  log: string[],
  battle: AutoBattleResult | null | undefined,
  onEvent?: (type: string, message: string) => void,
  random: RandomSource = Math.random,
): void {
  if (!isChapterFinalFloor(floorNumber)) return;

  const chapter = getTowerChapterByFloor(floorNumber);
  if (state.completedTowerChapters.includes(chapter.id)) return;

  const reward = chapter.completionReward;
  Object.entries(reward).forEach(([resourceKey, amount]) => {
    const value = Number(amount);
    if (value <= 0) return;
    addResource(state, resourceKey as "gold", value);
  });

  const battleRewards = ensureBattleRewards(battle);
  if (battleRewards) {
    battleRewards.heroContracts += Number(reward.heroContracts || 0);
    battleRewards.gold += Number(reward.gold || 0);
    battleRewards.crystals += Number(reward.crystals || 0);
    battleRewards.essence += Number(reward.essence || 0);
    battleRewards.fragments += Number(reward.fragments || 0);
    battleRewards.echoFragments += Number(reward.echoFragments || 0);
  }

  state.completedTowerChapters.push(chapter.id);
  const veteranRoll = random() < 0.35 ? startVeteranRecruitment(state, chapter) : null;
  state.lastChapterCompletion = {
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    chapterName: chapter.name,
    nextChapterName: TOWER_CHAPTERS[chapter.number]?.name || "",
    reward,
    completedAt: new Date().toISOString(),
  };

  addRewardEvent(log, battle, `Capitulo concluido: ${chapter.name}. Recompensa especial: ${getResourceRewardText(reward as Record<string, number>)}.`, onEvent);
  if (veteranRoll?.ok) addRewardEvent(log, battle, veteranRoll.message, onEvent);
  else if (veteranRoll?.message) addRewardEvent(log, battle, veteranRoll.message, onEvent);
}

export function grantTowerVictoryRewards(
  state: GameState,
  floorNumber: number,
  participatingHeroIds: string[],
  log: string[],
  battle: AutoBattleResult | null | undefined,
  options: { advanceFloor?: boolean; difficultyMode?: string } = {},
  onEvent?: (type: string, message: string) => void,
  random: RandomSource = Math.random,
): void {
  const shouldAdvanceFloor = options.advanceFloor !== false;
  const difficultyMode = options.difficultyMode || "normal";
  const reward = getFloorReward(floorNumber, { difficultyMode, heroXpMultiplier: getWeeklyEventModifier("heroXpMultiplier", 1) });
  const heroXpReward = Math.max(1, Math.round(reward.xp * getWeeklyEventModifier("heroXpMultiplier", 1)));
  const crystalDrop = random() < reward.crystalChance ? reward.crystalAmount : 0;
  const echoFragmentDrop = random() < reward.echoFragmentChance ? reward.echoFragmentAmount : 0;
  const consumableDropId = random() < reward.consumableChance ? getRandomConsumableId(random) : null;
  const shouldDropEquipment = reward.guaranteedEquipment || random() < reward.equipmentChance;
  const equipmentFloor = Math.max(1, floorNumber + (reward.equipmentRarityBonusFloors || 0));
  const equipmentDrop = shouldDropEquipment ? addEquipmentToInventory(state, generateEquipment({ floorNumber: equipmentFloor, random })) : null;
  const battleRewards = ensureBattleRewards(battle);

  addResource(state, "gold", reward.gold);
  addResource(state, "crystals", crystalDrop);
  addResource(state, "essence", reward.essence);
  addResource(state, "fragments", reward.fragments);
  addResource(state, "echoFragments", echoFragmentDrop);
  if (consumableDropId) addConsumable(state, consumableDropId, 1);
  addResource(state, "energy", reward.energyRefund);
  addAccountXp(state, Math.ceil(reward.xp / 2));

  if (battleRewards) {
    battleRewards.gold += reward.gold;
    battleRewards.crystals += crystalDrop;
    battleRewards.essence += reward.essence;
    battleRewards.fragments += reward.fragments;
    battleRewards.echoFragments += echoFragmentDrop;
    battleRewards.energyRefund += reward.energyRefund;
    if (equipmentDrop) battleRewards.equipment.push(equipmentDrop);
    if (consumableDropId) {
      battleRewards.consumables.push({
        id: consumableDropId,
        name: getConsumableDefinition(consumableDropId)?.name || consumableDropId,
        amount: 1,
      });
    }
  }

  addRewardLogLines(reward, crystalDrop, echoFragmentDrop, consumableDropId, equipmentDrop, log, battle, heroXpReward, onEvent);
  grantHeroXpRewards(state, participatingHeroIds, heroXpReward, log, battle, onEvent);

  if (shouldAdvanceFloor) {
    unlockFloorMilestones(state, floorNumber, log, battle, onEvent);
    grantChapterCompletionReward(state, floorNumber, log, battle, onEvent, random);
    state.towerFloor = Math.max(state.towerFloor, Math.min(GAME_CONFIG.towerMaxFloor + 1, floorNumber + 1));
    queueBossAfterNarrative(state, floorNumber);
    queueChapterStartNarrative(state, state.towerFloor);
  }
}
