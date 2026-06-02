import test from "node:test";
import assert from "node:assert/strict";

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
  SUMMON_RARITY_TABLES,
  TOWER_CHAPTERS,
  TOWER_DIFFICULTY_MODES,
  TOWER_FLOORS,
} from "../src/game/index.ts";

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function pickReward(floor: number, difficultyMode: "normal" | "challenge" | "hardcore") {
  const reward = getFloorReward(floor, { difficultyMode });
  return {
    gold: reward.gold,
    xp: reward.xp,
    crystalChance: reward.crystalChance,
    crystalAmount: reward.crystalAmount,
    equipmentChance: reward.equipmentChance,
    guaranteedEquipment: reward.guaranteedEquipment,
    difficultyMode: reward.difficultyMode,
    difficultyRewardMultiplier: reward.difficultyRewardMultiplier,
  };
}

test("configuracao base e estrutura da torre permanecem estaveis", () => {
  assert.deepEqual(plain(GAME_CONFIG), {
    saveKey: "ascensao-dos-ecos-save-v1",
    saveVersion: 1,
    gameVersion: "0.10.0",
    commonSummonCost: 100,
    superiorSummonCost: 100,
    towerEnergyCost: 5,
    maxEnergy: 30,
    energyRegenMs: 300000,
    maxFormationSize: 5,
    frontSlots: 2,
    maxTowerTeamPresets: 3,
    maxExpeditionTeamPresets: 3,
    towerMaxFloor: 40,
    maxExpeditionHeroes: 3,
  });

  assert.equal(TOWER_FLOORS.length, 40);
  assert.equal(TOWER_FLOORS.length, GAME_CONFIG.towerMaxFloor);
  assert.deepEqual(
    TOWER_CHAPTERS.map(({ id, startFloor, endFloor, finalBoss }) => ({ id, startFloor, endFloor, finalBoss })),
    [
      { id: "awakening_ruins", startFloor: 1, endFloor: 10, finalBoss: "Golem Antigo" },
      { id: "bestial_forest", startFloor: 11, endFloor: 20, finalBoss: "Oraculo Estilhacado" },
      { id: "spectral_crypt", startFloor: 21, endFloor: 30, finalBoss: "Avatar do Eclipse" },
      { id: "infernal_abyss", startFloor: 31, endFloor: 40, finalBoss: "Serpente Abissal" },
    ],
  );
});

test("andares, modificadores e descricoes de recompensa seguem os contratos atuais", () => {
  const floorFixtures = [
    {
      floor: 1,
      title: "Ecos no Atrio",
      recommendedLevel: 1,
      mechanic: "Tutorial",
      modifierSummary: "DEF inimiga +4%",
      rewardDescription: "63 ouro | 39 XP por heroi | 3 energia recuperada | 3% de fragmentos de eco | 8% de consumivel | 11% de cristais | 9% de equipamento",
    },
    {
      floor: 20,
      title: "Trono do Oraculo",
      recommendedLevel: 10,
      mechanic: "Chefe: marcas multiplas",
      modifierSummary: "curas da equipe -25% | SPD inimiga +6%",
      rewardDescription: "495 ouro | 298 XP por heroi | 5 energia recuperada | 65% de fragmentos de eco | 38% de consumivel | 34% de cristais | equipamento garantido",
    },
    {
      floor: 40,
      title: "Garganta da Serpente",
      recommendedLevel: 20,
      mechanic: "Chefe: veneno abissal",
      modifierSummary:
        "herois com -15 energia inicial | equipe recebe +12% dano | curas da equipe -25% | ATK inimigo +8% e curas da equipe -8%",
      rewardDescription: "1035 ouro | 618 XP por heroi | 5 energia recuperada | 65% de fragmentos de eco | 38% de consumivel | 42% de cristais | equipamento garantido",
    },
  ];

  floorFixtures.forEach((fixture) => {
    const floor = getFloorData(fixture.floor);
    assert.equal(floor.title, fixture.title);
    assert.equal(floor.recommendedLevel, fixture.recommendedLevel);
    assert.equal(floor.mechanic, fixture.mechanic);
    assert.equal(getFloorModifierSummary(floor), fixture.modifierSummary);
    assert.equal(describeReward(fixture.floor), fixture.rewardDescription);
  });

  assert.deepEqual(getFloorModifierValues(getFloorData(40)), {
    keys: ["drainedStart", "exposedTeam", "reducedHealing", "chapter_infernal_abyss"],
    labels: ["Energia inicial reduzida", "Dano recebido aumentado", "Cura reduzida", "Calor infernal"],
    descriptions: [
      "herois com -15 energia inicial",
      "equipe recebe +12% dano",
      "curas da equipe -25%",
      "ATK inimigo +8% e curas da equipe -8%",
    ],
    healingDoneMultiplier: 0.6900000000000001,
    enemySpeedMultiplier: 1,
    playerDamageTakenMultiplier: 1.12,
    playerInitialEnergyPenalty: 15,
    enemyAtkMultiplier: 1.08,
    enemyDefMultiplier: 1,
    enemyHpMultiplier: 1,
    enemyFocusMultiplier: 1,
  });
});

test("modos de dificuldade e recompensas principais permanecem congelados", () => {
  assert.deepEqual(
    Object.values(TOWER_DIFFICULTY_MODES).map(({ id, rewardMultiplier, enemyPowerMultiplier, permanentDeathChance }) => ({
      id,
      rewardMultiplier,
      enemyPowerMultiplier,
      permanentDeathChance,
    })),
    [
      { id: "normal", rewardMultiplier: 1, enemyPowerMultiplier: 1, permanentDeathChance: 0 },
      { id: "challenge", rewardMultiplier: 1.5, enemyPowerMultiplier: 1.25, permanentDeathChance: 0 },
      { id: "hardcore", rewardMultiplier: 2.2, enemyPowerMultiplier: 1.5, permanentDeathChance: 0.25 },
    ],
  );

  assert.deepEqual(pickReward(10, "normal"), {
    gold: 225,
    xp: 138,
    crystalChance: 0.22,
    crystalAmount: 36,
    equipmentChance: 0.17,
    guaranteedEquipment: true,
    difficultyMode: "normal",
    difficultyRewardMultiplier: 1,
  });
  assert.deepEqual(pickReward(20, "challenge"), {
    gold: 743,
    xp: 447,
    crystalChance: 0.4164132562731402,
    crystalAmount: 96,
    equipmentChance: 0.377,
    guaranteedEquipment: true,
    difficultyMode: "challenge",
    difficultyRewardMultiplier: 1.5,
  });
  assert.deepEqual(pickReward(40, "hardcore"), {
    gold: 2277,
    xp: 1360,
    crystalChance: 0.6229606729160357,
    crystalAmount: 264,
    equipmentChance: 0.836,
    guaranteedEquipment: true,
    difficultyMode: "hardcore",
    difficultyRewardMultiplier: 2.2,
  });
});

test("inimigos de andares-chave preservam nomes, energia e atributos", () => {
  const floorOne = createEnemiesForFloor(1).map(({ name, enemyKey, level, stats, energy, position }) => ({
    name,
    enemyKey,
    level,
    stats,
    energy,
    position,
  }));
  const floorThirtyHardcore = createEnemiesForFloor(30, { difficultyMode: "hardcore" }).map(({ name, enemyKey, level, stats, energy }) => ({
    name,
    enemyKey,
    level,
    stats,
    energy,
  }));

  assert.deepEqual(floorOne, [
    {
      name: "Slime de Pedra",
      enemyKey: "stoneSlime",
      level: 1,
      stats: { hp: 52, atk: 9, def: 6, spd: 4, focus: 3, luck: 2 },
      energy: 0,
      position: "front",
    },
    {
      name: "Slime de Pedra 2",
      enemyKey: "stoneSlime",
      level: 1,
      stats: { hp: 52, atk: 9, def: 6, spd: 4, focus: 3, luck: 2 },
      energy: 0,
      position: "front",
    },
  ]);
  assert.deepEqual(floorThirtyHardcore, [
    {
      name: "Avatar do Eclipse",
      enemyKey: "eclipseAvatar",
      level: 15,
      stats: { hp: 2888, atk: 242, def: 135, spd: 68, focus: 135, luck: 45 },
      energy: 45,
    },
    {
      name: "Ceifador do Vazio 2",
      enemyKey: "voidReaver",
      level: 15,
      stats: { hp: 492, atk: 140, def: 45, spd: 56, focus: 51, luck: 34 },
      energy: 30,
    },
    {
      name: "Vidente Cristalino 3",
      enemyKey: "crystalSeer",
      level: 15,
      stats: { hp: 381, atk: 95, def: 39, spd: 51, focus: 84, luck: 30 },
      energy: 30,
    },
  ]);
});

test("expedicoes e invocacao mantem contratos de economia", () => {
  assert.deepEqual(
    EXPEDITION_DEFINITIONS.map(({ id, durationMs, recommendedPower, reward }) => ({ id, durationMs, recommendedPower, reward })),
    [
      { id: "training_field", durationMs: 120000, recommendedPower: 180, reward: { type: "xp", amount: 80 } },
      { id: "old_mine", durationMs: 180000, recommendedPower: 220, reward: { type: "gold", amount: 180 } },
      { id: "crystal_ruins", durationMs: 300000, recommendedPower: 260, reward: { type: "crystals", amount: 35 } },
    ],
  );
  assert.equal(getExpeditionRewardMultiplier(90, 180), 0.5);
  assert.equal(getExpeditionRewardMultiplier(180, 180), 1);
  assert.equal(getExpeditionRewardMultiplier(300, 200), 1.5);

  const noSummonEventDate = "2026-01-01T00:00:00.000Z";
  const state = createInitialState(noSummonEventDate);
  assert.deepEqual(plain(SUMMON_RARITY_TABLES.common), [
    { rarity: 1, chance: 60 },
    { rarity: 2, chance: 28 },
    { rarity: 3, chance: 10 },
    { rarity: 4, chance: 2 },
  ]);
  assert.deepEqual(plain(SUMMON_RARITY_TABLES.superior), [
    { rarity: 2, chance: 50 },
    { rarity: 3, chance: 35 },
    { rarity: 4, chance: 12 },
    { rarity: 5, chance: 3 },
  ]);
  assert.deepEqual(plain(getAdjustedSummonRarityTable("common", noSummonEventDate)), plain(SUMMON_RARITY_TABLES.common));
  assert.deepEqual(plain(getAdjustedSummonRarityTable("superior", noSummonEventDate)), plain(SUMMON_RARITY_TABLES.superior));
  assert.deepEqual(getSummonCost(state, "common", noSummonEventDate), { resource: "gold", amount: 100 });
  assert.deepEqual(getSummonCost(state, "superior", noSummonEventDate), { resource: "crystals", amount: 100 });
});
