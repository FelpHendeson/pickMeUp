import test from "node:test";
import assert from "node:assert/strict";

import {
  addConsumable,
  addEquipmentToInventory,
  addHeroToFormation,
  analyzeEquipmentForHero,
  applyExpeditionPresetToExpeditionSelection,
  applyTowerPresetToFormation,
  claimDailyMissionReward,
  collectExpedition,
  createInitialState,
  ensureStateShape,
  equipItem,
  generateHero,
  generateEquipment,
  getExpeditionDefinition,
  importGameStateFromText,
  initializeNarrativeForSession,
  migrateSaveData,
  markNarrativeSceneSeen,
  queueNarrativeScene,
  runTowerBattle,
  saveTowerPresetFromFormation,
  serializeGameStateForExport,
  setTeamPresetHero,
  startExpedition,
  summonHero,
  useConsumable,
  validateImportedSaveData,
} from "../src/game/index.ts";
import type { EquipmentItem, GameState, Hero } from "../src/game/index.ts";

function createFixedHero(id: string, classKey = "warrior", rarity = 3): Hero {
  const hero = generateHero({
    id,
    name: `Heroi ${id}`,
    classKey: classKey as Hero["classKey"],
    rarity,
    random: () => 0.5,
  });

  return hero;
}

function addHeroes(state: GameState, count: number): Hero[] {
  const classKeys: Hero["classKey"][] = ["warrior", "archer", "mage", "priest", "rogue"];
  const heroes = Array.from({ length: count }, (_, index) => createFixedHero(`hero_${index + 1}`, classKeys[index] || "guardian", 4));
  state.heroes.push(...heroes);
  return heroes;
}

function empowerHero(hero: Hero): void {
  hero.rarity = 5;
  hero.level = 10;
  hero.maxLevel = 50;
  hero.stats = {
    hp: 1200,
    atk: 240,
    def: 130,
    spd: 80,
    focus: 60,
    luck: 25,
  };
  hero.currentHp = hero.stats.hp;
}

test("ensureStateShape normaliza save parcial e remove referencias invalidas", () => {
  const rawState = {
    resources: {
      gold: -10,
      crystals: 42,
      energy: 999,
      maxEnergy: 30,
    },
    heroes: [
      {
        id: "hero_valid",
        name: "Valida",
        rarity: 2,
        classKey: "mage",
      },
    ],
    formation: ["hero_valid", "missing", "hero_valid", null, "missing_2", "extra"],
    teamPresets: {
      tower: [{ name: "Time Sujo", heroIds: ["hero_valid", "missing", "hero_valid"] }],
      expedition: [{ name: "Envio Sujo", heroIds: ["hero_valid", "missing", "hero_valid"] }],
    },
    narrative: {
      seenSceneIds: ["intro", "cena_inexistente", "intro"],
      pendingScenes: ["intro", "firstSevereInjury", "cena_inexistente"],
    },
  };

  const state = ensureStateShape(rawState);

  assert.equal(state.resources.gold, 0);
  assert.equal(state.resources.crystals, 42);
  assert.equal(state.resources.energy, 30);
  assert.equal(state.formation.length, 5);
  assert.deepEqual(state.formation, ["hero_valid", null, "hero_valid", null, null]);
  assert.deepEqual(state.teamPresets.tower[0].heroIds, ["hero_valid", null, null, null, null]);
  assert.deepEqual(state.teamPresets.expedition[0].heroIds, ["hero_valid", null, null]);
  assert.deepEqual(state.narrative.seenSceneIds, ["intro"]);
  assert.deepEqual(state.narrative.pendingScenes, ["firstSevereInjury"]);
});

test("migration v0 normaliza save legado parcial e adiciona defaults atuais", () => {
  const hero = createFixedHero("hero_legacy", "mage", 3);
  const migrated = migrateSaveData({
    saveVersion: 1,
    resources: { gold: -50, crystals: 77, energy: 999 },
    heroes: [hero],
    formation: [hero.id, "hero_inexistente"],
    towerFloor: 8,
  });

  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.saveVersion, 1);

  const imported = validateImportedSaveData(migrated);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;

  assert.equal(imported.state.resources.gold, 0);
  assert.equal(imported.state.resources.crystals, 77);
  assert.equal(imported.state.resources.energy, imported.state.resources.maxEnergy);
  assert.deepEqual(imported.state.formation, [hero.id, null, null, null, null]);
  assert.deepEqual(imported.state.inventory, []);
  assert.deepEqual(imported.state.activeExpeditions, []);
  assert.ok(imported.state.dailyMissions);
  assert.ok(imported.state.achievements);
  assert.ok(imported.state.teamPresets);
});

test("migration preserva sistemas existentes e permite round-trip de importacao", () => {
  const heroA = createFixedHero("legacya", "warrior", 4);
  const heroB = createFixedHero("legacyb", "priest", 4);
  const legacySave = {
    saveVersion: 1,
    resources: { gold: 321, crystals: 45, essence: 6, fragments: 7, energy: 12, maxEnergy: 30 },
    heroes: [heroA, heroB],
    formation: [heroA.id, heroB.id],
    towerFloor: 12,
    relics: { tower_core: { level: 2, unlockedAt: "2026-01-01T00:00:00.000Z" } },
    affinities: { legacya_legacyb: { heroAId: heroA.id, heroBId: heroB.id, xp: 9 } },
    library: {
      enemies: { stoneSlime: { key: "stoneSlime", encountered: 4, defeated: 3, firstFloor: 1, lastFloor: 4, region: "Ecos" } },
      bosses: {},
      events: {},
      heroes: { classes: {}, rarities: {}, traits: {} },
    },
    towerDifficultyStats: { victories: { normal: 3, challenge: 2, hardcore: 1 }, hardcoreDeaths: 1 },
    pendingTowerDifficultyMode: "challenge",
    lastBattle: {
      id: "legacy_battle",
      result: "victory",
      floor: 11,
      rounds: 4,
      playerTeam: [],
      enemyTeam: [],
      log: ["Vitoria preservada"],
      events: [],
      performance: {},
      rewards: { gold: 90 },
    },
  };

  const imported = importGameStateFromText(JSON.stringify(legacySave), 1_000);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;

  assert.equal(imported.state.lastBattle?.id, "legacy_battle");
  assert.equal(imported.state.lastBattle?.rewards?.gold, 90);
  assert.equal(imported.state.relics.tower_core.level, 2);
  assert.equal(imported.state.library.enemies.stoneSlime.defeated, 3);
  assert.equal(imported.state.affinities.legacya_legacyb.xp, 9);
  assert.equal(imported.state.towerDifficultyStats?.victories.challenge, 2);
  assert.equal(imported.state.pendingTowerDifficultyMode, "challenge");

  const roundTrip = importGameStateFromText(serializeGameStateForExport(imported.state), 2_000);
  assert.equal(roundTrip.ok, true);
  if (!roundTrip.ok) return;
  assert.equal(roundTrip.state.schemaVersion, 1);
  assert.equal(roundTrip.state.saveVersion, 1);
  assert.equal(roundTrip.state.lastBattle?.id, "legacy_battle");
  assert.equal(roundTrip.state.affinities.legacya_legacyb.xp, 9);
});

test("migration rejeita schemas e versoes futuras", () => {
  assert.equal(validateImportedSaveData({ schemaVersion: 2, saveVersion: 1 }).ok, false);
  assert.equal(validateImportedSaveData({ schemaVersion: 1, saveVersion: 2 }).ok, false);
});

test("summonHero consome recurso, adiciona heroi e registra historico", () => {
  const state = createInitialState();
  const startingGold = state.resources.gold;

  const result = summonHero(state, "common", {
    random: () => 0,
    dateInput: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(state.heroes.length, 1);
  assert.equal(state.resources.gold, startingGold - result.cost.amount);
  assert.equal(result.hero.rarity, 1);
  assert.equal(state.summonHistory[0].id, result.hero.id);
});

test("presets de torre e expedicao preservam selecoes validas", () => {
  const state = createInitialState();
  const heroes = addHeroes(state, 5);

  heroes.forEach((hero) => {
    assert.equal(addHeroToFormation(state, hero.id).ok, true);
  });

  assert.equal(saveTowerPresetFromFormation(state, 0).ok, true);
  state.formation = [null, null, null, null, null];

  const appliedTower = applyTowerPresetToFormation(state, 0);
  assert.equal(appliedTower.ok, true);
  assert.deepEqual(state.formation, heroes.map((hero) => hero.id));

  heroes.slice(0, 3).forEach((hero, index) => {
    assert.equal(setTeamPresetHero(state, "expedition", 0, index, hero.id).ok, true);
  });

  const expeditionPreset = applyExpeditionPresetToExpeditionSelection(state, 0);
  assert.equal(expeditionPreset.ok, true);
  if (!expeditionPreset.ok) return;
  assert.deepEqual(expeditionPreset.heroIds, heroes.slice(0, 3).map((hero) => hero.id));
});

test("analise de equipamento separa compatibilidade flexivel de bloqueio real", () => {
  const warrior = createFixedHero("warrior_target", "warrior", 3);
  const currentWeapon: EquipmentItem = {
    id: "weapon_atk",
    name: "Lamina de Teste",
    type: "weapon",
    rarity: 1,
    bonusStat: "atk",
    bonusValue: 4,
  };
  const oddWeapon: EquipmentItem = {
    id: "weapon_luck",
    name: "Punhal de Sorte",
    type: "weapon",
    rarity: 1,
    bonusStat: "luck",
    bonusValue: 7,
  };
  const wrongSlot: EquipmentItem = {
    id: "armor_def",
    name: "Couraca de Teste",
    type: "armor",
    rarity: 1,
    bonusStat: "def",
    bonusValue: 5,
  };

  warrior.equipment.weapon = currentWeapon.id;

  const lowCompatibility = analyzeEquipmentForHero({ currentItem: currentWeapon, hero: warrior, item: oddWeapon, slot: "weapon" });
  assert.equal(lowCompatibility.canEquip, true);
  assert.equal(lowCompatibility.compatibility.level, "low");
  assert.equal(lowCompatibility.actionLabel, "Equipar mesmo assim");
  assert.equal(lowCompatibility.powerDelta, -9);

  const blocked = analyzeEquipmentForHero({ currentItem: currentWeapon, hero: warrior, item: wrongSlot, slot: "weapon" });
  assert.equal(blocked.canEquip, false);
  assert.match(blocked.blockedReason || "", /Slot diferente/);
});

test("expedicao usa timestamp salvo e concede recompensa ao coletar", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const [heroA, heroB, heroC] = addHeroes(state, 3);
  const startingXp = heroA.xp;
  const definition = getExpeditionDefinition("training_field");

  assert.ok(definition);

  const started = startExpedition(state, "training_field", [heroA.id, heroB.id, heroC.id], now, 0.01);
  assert.equal(started.ok, true);
  assert.equal(state.activeExpeditions.length, 1);
  if (!started.ok) return;

  const reloadedState = ensureStateShape(state, now + 5_000);
  assert.equal(reloadedState.activeExpeditions.length, 1);

  const collected = collectExpedition(reloadedState, "training_field", started.expedition.endsAt + 1);
  assert.equal(collected.ok, true);
  assert.equal(reloadedState.activeExpeditions.length, 0);
  assert.ok(reloadedState.heroes.find((hero) => hero.id === heroA.id)!.xp > startingXp);
});

test("runTowerBattle vence andar inicial, aplica recompensa e avanca progresso", () => {
  const state = createInitialState();
  const heroes = addHeroes(state, 5);
  heroes.forEach(empowerHero);
  heroes.forEach((hero) => {
    assert.equal(addHeroToFormation(state, hero.id).ok, true);
  });

  const startingGold = state.resources.gold;
  const result = runTowerBattle(state, { skipEventRoll: true });

  assert.equal(result.ok, true);
  assert.equal("battle" in result, true);
  if (!result.ok || !("battle" in result)) return;
  assert.equal(result.battle.result, "victory");
  assert.equal(state.towerFloor, 2);
  assert.ok(state.resources.gold > startingGold);
  assert.ok(state.lastBattle);
  assert.ok((state.lastBattle.rewards?.gold || 0) > 0);
  assert.ok((ensureStateShape(state).lastBattle?.rewards?.gold || 0) > 0);
});

test("narrativa inicial entra na fila uma unica vez e cenas vistas nao retornam", () => {
  const state = createInitialState();

  initializeNarrativeForSession(state);
  initializeNarrativeForSession(state);

  assert.deepEqual(state.narrative.pendingScenes, ["intro", "chapter_awakening_ruins_start"]);

  markNarrativeSceneSeen(state, "intro");
  const queuedAgain = queueNarrativeScene(state, "intro");

  assert.equal(queuedAgain, false);
  assert.deepEqual(state.narrative.seenSceneIds, ["intro"]);
  assert.deepEqual(state.narrative.pendingScenes, ["chapter_awakening_ruins_start"]);
});

test("fluxo alpha registra missoes, aplica acoes principais e preserva export/import", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const heroes = addHeroes(state, 5);
  heroes.forEach(empowerHero);
  heroes.forEach((hero) => {
    assert.equal(addHeroToFormation(state, hero.id).ok, true);
  });

  const summoned = summonHero(state, "common", { random: () => 0, dateInput: "2026-06-01T00:00:00.000Z" });
  assert.equal(summoned.ok, true);
  assert.equal(claimDailyMissionReward(state, "summon_1").ok, true);

  const weapon = addEquipmentToInventory(
    state,
    generateEquipment({
      id: "alpha_weapon",
      name: "Lamina de Smoke",
      type: "weapon",
      rarity: 2,
      bonusStat: "atk",
      floorNumber: 4,
      random: () => 0.5,
    }),
  );
  assert.equal(equipItem(state, heroes[0].id, weapon.id).ok, true);
  assert.equal(claimDailyMissionReward(state, "equip_item_1").ok, true);

  heroes[0].currentHp = Math.floor(heroes[0].stats.hp / 2);
  addConsumable(state, "small_healing_potion", 1);
  assert.equal(useConsumable(state, "small_healing_potion", heroes[0].id).ok, true);
  assert.ok((heroes[0].currentHp || 0) > Math.floor(heroes[0].stats.hp / 2));

  const started = startExpedition(state, "training_field", heroes.slice(0, 3).map((hero) => hero.id), now, 0.01);
  assert.equal(started.ok, true);
  assert.equal(claimDailyMissionReward(state, "start_expedition_1").ok, true);
  if (!started.ok) return;
  assert.equal(collectExpedition(state, "training_field", started.expedition.endsAt + 1).ok, true);
  assert.equal(claimDailyMissionReward(state, "collect_expedition_1").ok, true);

  const battle = runTowerBattle(state, { skipEventRoll: true, difficultyMode: "normal" });
  assert.equal(battle.ok, true);
  assert.ok(state.lastBattle);

  const exported = serializeGameStateForExport(state);
  const imported = importGameStateFromText(exported, now + 10_000);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.equal(imported.state.heroes.length, state.heroes.length);
  assert.equal(imported.state.inventory[0]?.id, weapon.id);
  assert.equal(imported.state.dailyMissions.claimed.summon_1, true);
  assert.ok((imported.state.lastBattle?.rewards?.gold || 0) > 0);
  assert.ok((imported.state.lastBattle?.progression?.heroXp.length || 0) > 0);
});
