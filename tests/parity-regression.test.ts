import test from "node:test";
import assert from "node:assert/strict";

import { loadGameScript } from "./helpers/loadGameScript.js";
import {
  createEnemiesForFloor,
  createInitialState,
  describeReward,
  EXPEDITION_DEFINITIONS,
  GAME_CONFIG,
  getAdjustedSummonRarityTable,
  getExpeditionRewardMultiplier,
  getFloorData,
  getFloorModifierSummary,
  getFloorModifierValues,
  getFloorReward,
  getSummonCost,
  getTowerChapterByFloor,
  SUMMON_RARITY_TABLES,
  TOWER_CHAPTERS,
  TOWER_DIFFICULTY_MODES,
  TOWER_FLOORS,
} from "../src/game/index.ts";

type LegacyEngine = Record<string, any>;

function loadLegacyEngine(): LegacyEngine {
  const Echoes = loadGameScript("./game/src/state.js");
  loadGameScript("./game/src/difficulty.js");
  loadGameScript("./game/src/tower.js");
  loadGameScript("./game/src/expeditions.js");
  loadGameScript("./game/src/summon.js");
  return Echoes;
}

function pick<T extends Record<string, any>>(source: T, keys: string[]): Record<string, any> {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeFloor(floor: any): Record<string, any> | null {
  if (!floor) return null;

  return {
    floor: floor.floor,
    title: floor.title,
    recommendedLevel: floor.recommendedLevel,
    mechanic: floor.mechanic,
    enemyKeys: floor.enemyKeys,
    modifierKeys: floor.modifierKeys || [],
    modifier: floor.modifier || "",
    rewardHint: floor.rewardHint,
  };
}

function normalizeChapter(chapter: any): Record<string, any> {
  return {
    id: chapter.id,
    number: chapter.number,
    name: chapter.name,
    startFloor: chapter.startFloor,
    endFloor: chapter.endFloor,
    finalBoss: chapter.finalBoss,
    regionalModifier: chapter.regionalModifier,
    completionReward: chapter.completionReward,
  };
}

function normalizeEnemy(enemy: any): Record<string, any> {
  return {
    id: enemy.id,
    name: enemy.name,
    enemyKey: enemy.enemyKey,
    role: enemy.role,
    rarity: enemy.rarity,
    level: enemy.level,
    stats: enemy.stats,
    maxHp: enemy.maxHp,
    hp: enemy.hp,
    energy: enemy.energy,
    position: enemy.position,
  };
}

function normalizeExpedition(expedition: any): Record<string, any> {
  return {
    id: expedition.id,
    name: expedition.name,
    durationMs: expedition.durationMs,
    recommendedPower: expedition.recommendedPower,
    reward: expedition.reward,
  };
}

const rewardKeys = [
  "gold",
  "xp",
  "energyRefund",
  "crystalChance",
  "crystalAmount",
  "essence",
  "fragments",
  "echoFragmentChance",
  "echoFragmentAmount",
  "consumableChance",
  "equipmentChance",
  "guaranteedEquipment",
  "difficultyMode",
  "difficultyRewardMultiplier",
  "equipmentRarityBonusFloors",
];

test("configuracao e estado inicial mantem paridade com o legado", () => {
  const legacy = loadLegacyEngine();
  const legacyState = legacy.createInitialState();
  const coreState = createInitialState(legacyState.lastEnergyAt);

  assert.deepEqual(plain(GAME_CONFIG), plain(legacy.CONFIG));
  assert.deepEqual(plain(coreState.resources), plain(legacyState.resources));
  assert.equal(coreState.towerFloor, legacyState.towerFloor);
  assert.equal(coreState.formation.length, legacyState.formation.length);
  assert.equal(coreState.teamPresets.tower.length, legacyState.teamPresets.tower.length);
  assert.equal(coreState.teamPresets.expedition.length, legacyState.teamPresets.expedition.length);
});

test("capitulos, andares e chefes da torre continuam alinhados", () => {
  const legacy = loadLegacyEngine();
  const sampledFloors = [1, 5, 10, 11, 20, 21, 30, 31, 40];

  assert.equal(TOWER_FLOORS.length, legacy.TOWER_FLOORS.length);
  assert.equal(TOWER_FLOORS.length, GAME_CONFIG.towerMaxFloor);
  assert.deepEqual(plain(TOWER_CHAPTERS.map(normalizeChapter)), plain(legacy.TOWER_CHAPTERS.map(normalizeChapter)));

  sampledFloors.forEach((floorNumber) => {
    assert.deepEqual(plain(normalizeFloor(getFloorData(floorNumber))), plain(normalizeFloor(legacy.getFloorData(floorNumber))));
    assert.deepEqual(
      plain(normalizeChapter(getTowerChapterByFloor(floorNumber))),
      plain(normalizeChapter(legacy.getTowerChapterByFloor(floorNumber))),
    );
  });
});

test("modificadores, recompensas e descricoes da torre mantem paridade", () => {
  const legacy = loadLegacyEngine();
  const sampledFloors = [1, 10, 11, 19, 20, 30, 40];
  const difficultyModes = ["normal", "challenge", "hardcore"];

  assert.deepEqual(plain(TOWER_DIFFICULTY_MODES), plain(legacy.TOWER_DIFFICULTY_MODES));

  sampledFloors.forEach((floorNumber) => {
    const coreFloor = getFloorData(floorNumber);
    const legacyFloor = legacy.getFloorData(floorNumber);

    assert.deepEqual(plain(getFloorModifierValues(coreFloor)), plain(legacy.getFloorModifierValues(legacyFloor)));
    assert.equal(getFloorModifierSummary(coreFloor), legacy.getFloorModifierSummary(legacyFloor));

    difficultyModes.forEach((difficultyMode) => {
      assert.deepEqual(
        plain(pick(getFloorReward(floorNumber, { difficultyMode }), rewardKeys)),
        plain(pick(legacy.getFloorReward(floorNumber, difficultyMode), rewardKeys)),
      );
    });

    assert.equal(describeReward(floorNumber), legacy.describeReward(floorNumber));
  });
});

test("geracao de inimigos da torre mantem stats e energia de combate", () => {
  const legacy = loadLegacyEngine();
  const scenarios = [
    { floor: 1, difficultyMode: "normal" },
    { floor: 11, difficultyMode: "normal" },
    { floor: 20, difficultyMode: "challenge" },
    { floor: 30, difficultyMode: "hardcore" },
    { floor: 40, difficultyMode: "hardcore" },
  ];

  scenarios.forEach(({ floor, difficultyMode }) => {
    const coreEnemies = createEnemiesForFloor(floor, { difficultyMode }).map(normalizeEnemy);
    const legacyEnemies = legacy.createEnemiesForFloor(floor, difficultyMode).map(normalizeEnemy);
    assert.deepEqual(plain(coreEnemies), plain(legacyEnemies));
  });
});

test("expedicoes e multiplicadores de recompensa mantem paridade", () => {
  const legacy = loadLegacyEngine();
  const powerSamples = [
    { power: 90, recommended: 180 },
    { power: 180, recommended: 180 },
    { power: 300, recommended: 200 },
  ];

  assert.deepEqual(plain(EXPEDITION_DEFINITIONS.map(normalizeExpedition)), plain(legacy.EXPEDITION_DEFINITIONS.map(normalizeExpedition)));

  powerSamples.forEach(({ power, recommended }) => {
    assert.equal(
      getExpeditionRewardMultiplier(power, recommended),
      legacy.getExpeditionRewardMultiplier(power, recommended),
    );
  });
});

test("custos e tabelas de invocacao continuam equivalentes ao legado base", () => {
  const legacy = loadLegacyEngine();
  const legacyState = legacy.createInitialState();
  const coreState = createInitialState(legacyState.lastEnergyAt);
  const noSummonEventDate = "2026-01-01T00:00:00.000Z";

  assert.deepEqual(plain(SUMMON_RARITY_TABLES), plain(legacy.SUMMON_RARITY_TABLES));
  assert.deepEqual(plain(getAdjustedSummonRarityTable("common", noSummonEventDate)), plain(legacy.getAdjustedSummonRarityTable("common")));
  assert.deepEqual(plain(getAdjustedSummonRarityTable("superior", noSummonEventDate)), plain(legacy.getAdjustedSummonRarityTable("superior")));
  assert.deepEqual(plain(getSummonCost(coreState, "common", noSummonEventDate)), plain(legacy.getSummonCost("common", legacyState)));
  assert.deepEqual(plain(getSummonCost(coreState, "superior", noSummonEventDate)), plain(legacy.getSummonCost("superior", legacyState)));
});
