import test from "node:test";
import assert from "node:assert/strict";

import {
  addConsumable,
  addEquipmentToInventory,
  addHeroToFormation,
  analyzeEquipmentForHero,
  applyExpeditionPresetToExpeditionSelection,
  applyTowerPresetToFormation,
  canUsePaidSummon,
  claimDailyMissionReward,
  claimInitialSpecialSummonOption,
  collectExpedition,
  CURRENT_SAVE_SCHEMA_VERSION,
  createHeroFromDefinition,
  createInitialState,
  ensureStateShape,
  equipItem,
  getEarlyObjectiveTrack,
  generateHero,
  generateEquipment,
  getFloorReward,
  getMaxLevelForRarity,
  GAME_CONFIG,
  getExpeditionDefinition,
  getAvailableHeroDefinitions,
  getHeroDefinitionById,
  getHeroLobbyRoutine,
  getLobbyRoutineReport,
  getOwnedHeroDefinitionIds,
  getRecommendedFormationPower,
  getTowerReadinessLevel,
  getTowerReadinessReport,
  assignHeroTrainingFocus,
  getHeroTrainingFocus,
  getHeroTrainingProgress,
  getHeroTrainingSummary,
  getLobbyTrainingReport,
  getRecommendedTrainingFocusForHero,
  getTrainingEligibility,
  getTrainingFocusDefinitions,
  getTrainingReadinessBonus,
  progressHeroTraining,
  progressTrainingForElapsedTime,
  TRAINING_CONFIG,
  getHeroLightTechniques,
  getHeroProficiencyProgress,
  getHeroProficiencySummary,
  getProficiencyDefinitions,
  getProficiencyReadinessBonus,
  getRankForXp,
  getRecommendedProficienciesForHero,
  progressHeroProficienciesFromTraining,
  progressHeroProficiency,
  progressProficienciesForTrainingResult,
  PROFICIENCY_CONFIG,
  analyzeHeroPotential,
  getHeroPotentialProgress,
  getHeroPotentialReport,
  getPotentialInsightsForHero,
  getPotentialLevelForXp,
  progressHeroPotentialAnalysis,
  progressPotentialFromProficiencyOutcomes,
  POTENTIAL_CONFIG,
  getHeroPromotionPreview,
  getPromotionReadiness,
  getPromotionRequirementsForHero,
  getPromotionTargetRarity,
  promoteHero,
  PROMOTION_MAX_RARITY,
  LOBBY_ROUTINE_BLOCK_MS,
  generateInitialSpecialSummonOptions,
  HERO_ROSTER,
  importGameStateFromText,
  initializeNarrativeForSession,
  isInitialSummonComplete,
  isHeroFromRoster,
  isLegacyHero,
  migrateSaveData,
  markNarrativeSceneSeen,
  queueNarrativeScene,
  runTowerBattle,
  saveTowerPresetFromFormation,
  serializeGameStateForExport,
  setTeamPresetHero,
  startExpedition,
  summonHero,
  useStarterCommonSummon,
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

function completeInitialSummonForTest(state: GameState): void {
  state.initialSummon.commonRemaining = 0;
  state.initialSummon.specialAvailable = false;
  state.initialSummon.specialClaimed = true;
  state.initialSummon.specialOptions = [];
}

function createPreparedTowerState(): { state: GameState; heroes: Hero[] } {
  const state = createInitialState();
  const heroes = addHeroes(state, 5);
  heroes.forEach((hero, index) => {
    empowerHero(hero);
    hero.morale = 80;
    hero.injuries = [];
    hero.currentHp = hero.stats.hp;
    state.formation[index] = hero.id;
  });
  return { state, heroes };
}

function equipHeroForLobbyRoutine(state: GameState, hero: Hero): void {
  const equipment: EquipmentItem[] = [
    {
      id: `${hero.id}_routine_weapon`,
      name: "Arma de Rotina",
      type: "weapon",
      rarity: hero.rarity,
      bonusStat: "atk",
      bonusValue: 5,
    },
    {
      id: `${hero.id}_routine_armor`,
      name: "Armadura de Rotina",
      type: "armor",
      rarity: hero.rarity,
      bonusStat: "def",
      bonusValue: 5,
    },
  ];
  state.inventory.push(...equipment);
  hero.equipment.weapon = equipment[0].id;
  hero.equipment.armor = equipment[1].id;
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

test("roster de herois possui definicoes completas e ids unicos", () => {
  const definitionIds = HERO_ROSTER.map((definition) => definition.definitionId);

  assert.ok(HERO_ROSTER.length >= 10 && HERO_ROSTER.length <= 15);
  assert.equal(new Set(definitionIds).size, definitionIds.length);
  HERO_ROSTER.forEach((definition) => {
    assert.equal(getHeroDefinitionById(definition.definitionId)?.name, definition.name);
    assert.ok(definition.name);
    assert.ok(definition.initialRarity >= 1);
    assert.ok(definition.classKey);
    assert.ok(definition.traitKey);
    assert.ok(definition.origin);
    assert.ok(definition.background);
    assert.ok(definition.personality);
    assert.ok(definition.potentialTags.length > 0);
    assert.ok(definition.roleTags.length > 0);
    assert.ok(definition.hiddenAptitudeTags.length > 0);
  });
});

test("heroi criado por definicao preserva identidade e continua valido apos normalizacao", () => {
  const definition = HERO_ROSTER[0];
  const hero = createHeroFromDefinition(definition, { id: "roster_hero", random: () => 0.5 });

  assert.equal(hero.definitionId, definition.definitionId);
  assert.equal(hero.name, definition.name);
  assert.equal(hero.rarity, definition.initialRarity);
  assert.equal(hero.classKey, definition.classKey);
  assert.equal(hero.traitKey, definition.traitKey);
  assert.ok(hero.stats.hp > 0);
  assert.equal(isHeroFromRoster(hero), true);
  assert.equal(isLegacyHero(hero), false);

  const normalized = ensureStateShape({ heroes: [hero], formation: [hero.id] });
  assert.equal(normalized.heroes[0]?.definitionId, definition.definitionId);
  assert.equal(isHeroFromRoster(normalized.heroes[0]), true);
});

test("consultas do roster removem apenas definicoes ja obtidas", () => {
  const state = createInitialState();
  const ownedDefinition = HERO_ROSTER[1];
  const rosterHero = createHeroFromDefinition(ownedDefinition, { id: "owned_roster", random: () => 0.5 });
  const legacyHero = createFixedHero("legacy_procedural");
  state.heroes.push(rosterHero, legacyHero);

  assert.deepEqual([...getOwnedHeroDefinitionIds(state)], [ownedDefinition.definitionId]);
  assert.equal(getAvailableHeroDefinitions(state).length, HERO_ROSTER.length - 1);
  assert.equal(getAvailableHeroDefinitions(state).some((definition) => definition.definitionId === ownedDefinition.definitionId), false);
  assert.equal(isLegacyHero(legacyHero), true);
  assert.equal(isHeroFromRoster(legacyHero), false);
});

test("save antigo sem definitionId preserva heroi procedural como legacy", () => {
  const imported = importGameStateFromText(JSON.stringify({
    saveVersion: 1,
    resources: { gold: 500 },
    heroes: [{ id: "old_hero", name: "Veterano sem registro", rarity: 2, classKey: "warrior", traitKey: "brave" }],
    formation: ["old_hero"],
    towerFloor: 3,
  }));

  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.equal(imported.state.heroes[0]?.definitionId, undefined);
  assert.equal(isLegacyHero(imported.state.heroes[0]), true);
  assert.deepEqual(imported.state.formation, ["old_hero", null, null, null, null]);
  assert.deepEqual(imported.state.initialSummon, {
    commonRemaining: 5,
    specialAvailable: true,
    specialClaimed: false,
    specialOptions: [],
  });

  const startingGold = imported.state.resources.gold;
  const summoned = summonHero(imported.state, "common", { random: () => 0 });
  assert.equal(summoned.ok, false);
  assert.equal(imported.state.resources.gold, startingGold);
  assert.equal(canUsePaidSummon(imported.state), false);
  assert.equal(imported.state.heroes.some((hero) => hero.id === "old_hero"), true);
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

  assert.equal(migrated.schemaVersion, 5);
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
  assert.equal(roundTrip.state.schemaVersion, 5);
  assert.equal(roundTrip.state.saveVersion, 1);
  assert.equal(roundTrip.state.lastBattle?.id, "legacy_battle");
  assert.equal(roundTrip.state.affinities.legacya_legacyb.xp, 9);
});

test("migration rejeita schemas e versoes futuras", () => {
  assert.equal(validateImportedSaveData({ schemaVersion: 6, saveVersion: 1 }).ok, false);
  assert.equal(validateImportedSaveData({ schemaVersion: 5, saveVersion: 2 }).ok, false);
});

test("nova jornada recebe cinco tickets comuns e uma especial", () => {
  const state = createInitialState();

  assert.equal(state.schemaVersion, 5);
  assert.deepEqual(state.initialSummon, {
    commonRemaining: 5,
    specialAvailable: true,
    specialClaimed: false,
    specialOptions: [],
  });
  assert.equal(isInitialSummonComplete(state), false);
  assert.equal(canUsePaidSummon(state), false);
});

test("rituais pagos ficam bloqueados sem consumir recursos durante onboarding", () => {
  const state = createInitialState();
  const startingGold = state.resources.gold;
  const startingCrystals = state.resources.crystals;
  const startingHeroes = state.heroes.length;

  const common = summonHero(state, "common", { random: () => 0 });
  const superior = summonHero(state, "superior", { random: () => 0 });

  assert.equal(common.ok, false);
  assert.equal(superior.ok, false);
  assert.match(common.message, /Conclua os cinco tickets iniciais/);
  assert.match(superior.message, /Conclua os cinco tickets iniciais/);
  assert.equal(state.resources.gold, startingGold);
  assert.equal(state.resources.crystals, startingCrystals);
  assert.equal(state.heroes.length, startingHeroes);
});

test("cinco tickets iniciais invocam sem duplicatas e registram sistemas", () => {
  const state = createInitialState();
  const startingGold = state.resources.gold;
  const summonedDefinitionIds: string[] = [];

  for (let index = 0; index < 5; index += 1) {
    const result = useStarterCommonSummon(state, { random: () => 0 });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    summonedDefinitionIds.push(result.hero.definitionId!);
  }

  assert.equal(new Set(summonedDefinitionIds).size, 5);
  assert.equal(state.initialSummon.commonRemaining, 0);
  assert.equal(state.resources.gold, startingGold);
  assert.equal(state.summonHistory.length, 5);
  assert.equal(state.dailyMissions.progress.summons, 5);
  assert.ok(state.missionStats.summons >= 5);
  state.heroes.forEach((hero) => {
    assert.equal(state.library.heroes.classes[hero.classKey].discovered, true);
  });

  const failed = useStarterCommonSummon(state, { random: () => 0 });
  assert.equal(failed.ok, false);
  assert.equal(state.initialSummon.commonRemaining, 0);
  assert.equal(state.resources.gold, startingGold);
});

test("especial persiste tres opcoes raras e reserva definicoes ate a escolha", () => {
  const state = createInitialState();
  const generated = generateInitialSpecialSummonOptions(state, { random: () => 0 });

  assert.equal(generated.ok, true);
  if (!generated.ok) return;
  assert.equal(generated.options.length, 3);
  assert.equal(generated.options.every((definition) => definition.initialRarity >= 3), true);
  assert.deepEqual(state.initialSummon.specialOptions, generated.options.map((definition) => definition.definitionId));

  const persisted = generateInitialSpecialSummonOptions(state, { random: () => 0.999 });
  assert.equal(persisted.ok, true);
  if (!persisted.ok) return;
  assert.deepEqual(persisted.options.map((definition) => definition.definitionId), state.initialSummon.specialOptions);

  const starterCommon = useStarterCommonSummon(state, { random: () => 0.999 });
  assert.equal(starterCommon.ok, true);
  if (!starterCommon.ok) return;
  assert.equal(state.initialSummon.specialOptions.includes(starterCommon.hero.definitionId!), false);
});

test("escolha especial adiciona heroi correto uma unica vez", () => {
  const state = createInitialState();
  const generated = generateInitialSpecialSummonOptions(state, { random: () => 0 });
  assert.equal(generated.ok, true);
  if (!generated.ok) return;
  const selected = generated.options[1];
  const startingCrystals = state.resources.crystals;

  const claimed = claimInitialSpecialSummonOption(state, selected.definitionId, { random: () => 0.5 });
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  assert.equal(claimed.hero.definitionId, selected.definitionId);
  assert.equal(state.heroes.filter((hero) => hero.definitionId === selected.definitionId).length, 1);
  assert.equal(state.initialSummon.specialClaimed, true);
  assert.equal(state.initialSummon.specialAvailable, false);
  assert.deepEqual(state.initialSummon.specialOptions, []);
  assert.equal(state.resources.crystals, startingCrystals);
  assert.equal(state.summonHistory[0].id, claimed.hero.id);
  assert.equal(state.dailyMissions.progress.summons, 1);
  assert.equal(state.library.heroes.classes[claimed.hero.classKey].discovered, true);

  const repeated = claimInitialSpecialSummonOption(state, selected.definitionId);
  assert.equal(repeated.ok, false);
  assert.equal(state.heroes.filter((hero) => hero.definitionId === selected.definitionId).length, 1);
});

test("rituais pagos sao liberados depois dos cinco tickets e da escolha especial", () => {
  const state = createInitialState();
  const generated = generateInitialSpecialSummonOptions(state, { random: () => 0 });
  assert.equal(generated.ok, true);
  if (!generated.ok) return;

  for (let index = 0; index < 5; index += 1) {
    assert.equal(useStarterCommonSummon(state, { random: () => 0 }).ok, true);
  }
  assert.equal(canUsePaidSummon(state), false);

  const claimed = claimInitialSpecialSummonOption(state, generated.options[0].definitionId, { random: () => 0.5 });
  assert.equal(claimed.ok, true);
  assert.equal(isInitialSummonComplete(state), true);
  assert.equal(canUsePaidSummon(state), true);

  const common = summonHero(state, "common", { random: () => 0 });
  const superior = summonHero(state, "superior", { random: () => 0 });
  assert.equal(common.ok, true);
  assert.equal(superior.ok, true);
});

test("estado inicial de summon sobrevive a exportacao e importacao", () => {
  const state = createInitialState();
  assert.equal(useStarterCommonSummon(state, { random: () => 0 }).ok, true);
  assert.equal(generateInitialSpecialSummonOptions(state, { random: () => 0 }).ok, true);
  const expected = JSON.parse(JSON.stringify(state.initialSummon));

  const imported = importGameStateFromText(serializeGameStateForExport(state));
  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.deepEqual(imported.state.initialSummon, expected);
  assert.equal(canUsePaidSummon(imported.state), false);
});

test("pool limitado adapta especial e falhas nao consomem direitos ou recursos", () => {
  const state = createInitialState();
  const remainingDefinition = HERO_ROSTER[HERO_ROSTER.length - 1];
  state.heroes.push(
    ...HERO_ROSTER
      .filter((definition) => definition.definitionId !== remainingDefinition.definitionId)
      .map((definition, index) => createHeroFromDefinition(definition, { id: `limited_${index}`, random: () => 0.5 })),
  );

  const generated = generateInitialSpecialSummonOptions(state, { random: () => 0 });
  assert.equal(generated.ok, true);
  if (!generated.ok) return;
  assert.deepEqual(generated.options.map((definition) => definition.definitionId), [remainingDefinition.definitionId]);

  const startingGold = state.resources.gold;
  const startingTickets = state.initialSummon.commonRemaining;
  const failedCommon = useStarterCommonSummon(state, { random: () => 0 });
  assert.equal(failedCommon.ok, false);
  assert.equal(state.resources.gold, startingGold);
  assert.equal(state.initialSummon.commonRemaining, startingTickets);

  const claimed = claimInitialSpecialSummonOption(state, remainingDefinition.definitionId);
  assert.equal(claimed.ok, true);
  const exhausted = createInitialState();
  exhausted.heroes.push(...HERO_ROSTER.map((definition, index) => createHeroFromDefinition(definition, { id: `all_${index}` })));
  const startingSpecial = JSON.parse(JSON.stringify(exhausted.initialSummon));
  assert.equal(generateInitialSpecialSummonOptions(exhausted).ok, false);
  assert.deepEqual(exhausted.initialSummon, startingSpecial);
});

test("summonHero consome recurso, adiciona heroi e registra historico", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
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
  assert.ok(result.hero.definitionId);
  assert.equal(result.hero.name, getHeroDefinitionById(result.hero.definitionId)?.name);
  assert.equal(state.summonHistory[0].id, result.hero.id);
  assert.equal(state.summonHistory[0].name, result.hero.name);
  assert.ok(state.missionStats.summons >= 1);
  assert.equal(state.dailyMissions.progress.summons, 1);
  assert.equal(state.library.heroes.classes[result.hero.classKey].discovered, true);
});

test("invocacao superior usa raridade disponivel mais proxima e preserva definicao", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  const startingCrystals = state.resources.crystals;
  const result = summonHero(state, "superior", { random: () => 0.999 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const definition = getHeroDefinitionById(result.hero.definitionId);
  assert.ok(definition);
  assert.equal(result.hero.rarity, definition?.initialRarity);
  assert.equal(result.hero.classKey, definition?.classKey);
  assert.equal(result.hero.traitKey, definition?.traitKey);
  assert.equal(state.resources.crystals, startingCrystals - result.cost.amount);
});

test("invocacoes repetidas nao duplicam definitionId", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  const first = summonHero(state, "common", { random: () => 0 });
  const second = summonHero(state, "common", { random: () => 0 });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.notEqual(first.hero.definitionId, second.hero.definitionId);
  assert.equal(new Set(state.heroes.map((hero) => hero.definitionId)).size, 2);
});

test("heroi legacy nao bloqueia roster e definicao obtida nao pode repetir", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  const legacyHero = createFixedHero("legacy_before_roster");
  const ownedDefinition = HERO_ROSTER.find((definition) => definition.initialRarity === 1)!;
  const ownedRosterHero = createHeroFromDefinition(ownedDefinition, { id: "owned_before_summon", random: () => 0.5 });
  state.heroes.push(legacyHero, ownedRosterHero);

  const result = summonHero(state, "common", { random: () => 0 });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.hero.definitionId);
  assert.notEqual(result.hero.definitionId, ownedDefinition.definitionId);
  assert.equal(state.heroes.includes(legacyHero), true);
  assert.equal(isLegacyHero(legacyHero), true);
});

test("pool esgotado falha sem consumir recursos ou registrar progresso", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  state.heroes.push(
    ...HERO_ROSTER.map((definition, index) =>
      createHeroFromDefinition(definition, { id: `owned_${index}`, random: () => 0.5 }),
    ),
  );
  const startingGold = state.resources.gold;
  const startingHistoryLength = state.summonHistory.length;
  const startingSummons = state.missionStats.summons ?? 0;

  const result = summonHero(state, "common", { random: () => 0 });

  assert.equal(result.ok, false);
  assert.match(result.message, /Nao ha novos herois disponiveis/);
  assert.equal(state.resources.gold, startingGold);
  assert.equal(state.summonHistory.length, startingHistoryLength);
  assert.equal(state.missionStats.summons ?? 0, startingSummons);
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

test("relatorio idle do Lobby funciona sem herois", () => {
  const state = createInitialState();
  const report = getLobbyRoutineReport(state, 0);

  assert.equal(report.generatedAt, 0);
  assert.deepEqual(report.routines, []);
  assert.match(report.summary, /Nenhum herói/i);
  assert.equal(Object.keys(report.locations).length, 9);
  assert.ok(Object.values(report.locations).every((location) => location.heroCount === 0 && location.heroIds.length === 0));
});

test("rotina idle prioriza expedicao, ferimento, HP e moral", () => {
  const expeditionState = createInitialState();
  const [expeditionHero] = addHeroes(expeditionState, 1);
  assert.equal(startExpedition(expeditionState, "training_field", [expeditionHero.id], 1_000).ok, true);
  const expeditionRoutine = getHeroLobbyRoutine(expeditionState, expeditionHero, 1_000);
  assert.equal(expeditionRoutine.activity, "onExpedition");
  assert.equal(expeditionRoutine.location, "expeditionGate");

  const injuryState = createInitialState();
  const [injuredHero] = addHeroes(injuryState, 1);
  injuredHero.injuries = [
    { id: "injury_lobby", typeKey: "injuredArm", remainingBattles: 2, createdAt: "2026-01-01T00:00:00.000Z" },
  ];
  injuredHero.currentHp = 1;
  injuredHero.morale = 10;
  const injuryRoutine = getHeroLobbyRoutine(injuryState, injuredHero, 1_000);
  assert.equal(injuryRoutine.activity, "recovering");
  assert.equal(injuryRoutine.location, "infirmary");

  const hpState = createInitialState();
  const [woundedHero] = addHeroes(hpState, 1);
  woundedHero.currentHp = Math.floor(woundedHero.stats.hp * 0.3);
  const hpRoutine = getHeroLobbyRoutine(hpState, woundedHero, 1_000);
  assert.equal(hpRoutine.activity, "resting");
  assert.equal(hpRoutine.location, "infirmary");

  const moraleState = createInitialState();
  const [shakenHero] = addHeroes(moraleState, 1);
  shakenHero.morale = 25;
  const moraleRoutine = getHeroLobbyRoutine(moraleState, shakenHero, 1_000);
  assert.ok(["resting", "socializing"].includes(moraleRoutine.activity));
  assert.ok(["restingQuarters", "square"].includes(moraleRoutine.location));
});

test("rotina idle representa formacao, equipamento, vocacao arcana e treino", () => {
  const formationState = createInitialState();
  const [formationHero] = addHeroes(formationState, 1);
  formationState.formation[0] = formationHero.id;
  const formationRoutine = getHeroLobbyRoutine(formationState, formationHero, 0);
  assert.equal(formationRoutine.activity, "readyForTower");
  assert.equal(formationRoutine.location, "trainingGround");

  const equipmentState = createInitialState();
  const [unequippedHero] = addHeroes(equipmentState, 1);
  const equipmentRoutine = getHeroLobbyRoutine(equipmentState, unequippedHero, 0);
  assert.equal(equipmentRoutine.activity, "preparingEquipment");
  assert.equal(equipmentRoutine.location, "workshop");

  const combatState = createInitialState();
  const combatHero = createFixedHero("routine_warrior", "warrior", 3);
  combatState.heroes.push(combatHero);
  equipHeroForLobbyRoutine(combatState, combatHero);
  const combatRoutine = getHeroLobbyRoutine(combatState, combatHero, 0);
  assert.equal(combatRoutine.activity, "training");
  assert.equal(combatRoutine.location, "trainingGround");

  const arcaneState = createInitialState();
  const arcaneHero = createFixedHero("routine_mage", "mage", 3);
  arcaneState.heroes.push(arcaneHero);
  equipHeroForLobbyRoutine(arcaneState, arcaneHero);
  const arcaneRoutine = getHeroLobbyRoutine(arcaneState, arcaneHero, 0);
  assert.equal(arcaneRoutine.activity, "studyingRelics");
  assert.equal(arcaneRoutine.location, "summonPortal");
});

test("rotina idle e deterministica, varia por bloco e nao modifica o save", () => {
  const state = createInitialState();
  const hero = createFixedHero("routine_deterministic", "guardian", 3);
  state.heroes.push(hero);
  equipHeroForLobbyRoutine(state, hero);
  const stateBefore = JSON.stringify(state);
  const equipmentReference = hero.equipment;
  const injuriesReference = hero.injuries;

  const first = getHeroLobbyRoutine(state, hero, 0);
  const repeated = getHeroLobbyRoutine(state, hero, 0);
  const nextBlock = getHeroLobbyRoutine(state, hero, LOBBY_ROUTINE_BLOCK_MS);

  assert.deepEqual(first, repeated);
  assert.notEqual(first.description, nextBlock.description);
  assert.equal(first.activity, nextBlock.activity);
  assert.equal(JSON.stringify(state), stateBefore);
  assert.equal(hero.equipment, equipmentReference);
  assert.equal(hero.injuries, injuriesReference);
  assert.equal(state.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
});

test("relatorio idle agrupa areas e entrega contrato pronto para a UI", () => {
  const state = createInitialState();
  const [towerHero, recoveringHero, arcaneHero] = addHeroes(state, 3);
  state.formation[0] = towerHero.id;
  recoveringHero.injuries = [
    { id: "injury_group", typeKey: "brokenRib", remainingBattles: 1, createdAt: "2026-01-01T00:00:00.000Z" },
  ];
  arcaneHero.classKey = "mage";
  equipHeroForLobbyRoutine(state, arcaneHero);

  const report = getLobbyRoutineReport(state, 0);

  assert.equal(report.routines.length, 3);
  assert.equal(report.locations.trainingGround.heroCount, 1);
  assert.deepEqual(report.locations.trainingGround.heroIds, [towerHero.id]);
  assert.equal(report.locations.infirmary.heroCount, 1);
  assert.deepEqual(report.locations.infirmary.heroIds, [recoveringHero.id]);
  assert.equal(report.locations.summonPortal.heroCount, 1);
  assert.deepEqual(report.locations.summonPortal.heroIds, [arcaneHero.id]);
  assert.match(report.summary, /3 herói\(s\).*3 área\(s\)/);
  report.routines.forEach((routine) => {
    assert.ok(routine.heroId);
    assert.ok(routine.heroName);
    assert.ok(routine.label);
    assert.ok(routine.description);
    assert.ok(routine.priority > 0);
  });
});

test("readiness classifica formacao vazia e falhas operacionais como criticas", () => {
  const emptyState = createInitialState();
  const emptyReport = getTowerReadinessReport(emptyState, 1);
  assert.equal(emptyReport.level, "critical");
  assert.equal(emptyReport.score, 0);
  assert.equal(emptyReport.checks.find((check) => check.key === "formation")?.status, "bad");

  const busySetup = createPreparedTowerState();
  const expedition = startExpedition(busySetup.state, "training_field", [busySetup.heroes[0].id], 1_000);
  assert.equal(expedition.ok, true);
  const busyReport = getTowerReadinessReport(busySetup.state, 4);
  assert.equal(busyReport.level, "critical");
  assert.equal(busyReport.score, 0);
  assert.equal(busyReport.checks.find((check) => check.key === "expedition")?.status, "bad");

  const energySetup = createPreparedTowerState();
  energySetup.state.resources.energy = 0;
  const energyReport = getTowerReadinessReport(energySetup.state, 4);
  assert.equal(energyReport.level, "critical");
  assert.equal(energyReport.score, 0);
  assert.match(energyReport.recommendations.join(" "), /energia/i);
});

test("readiness reconhece equipe completa no nivel esperado e aumenta risco por desgaste", () => {
  const { state, heroes } = createPreparedTowerState();
  const readyReport = getTowerReadinessReport(state, 20);
  assert.equal(readyReport.level, "ready");
  assert.ok(readyReport.score >= 85);
  assert.equal(readyReport.metrics.formationSize, 5);
  assert.equal(readyReport.checks.find((check) => check.key === "formation")?.status, "good");

  heroes.forEach((hero) => {
    hero.level = 1;
  });
  const underleveledReport = getTowerReadinessReport(state, 20);
  assert.ok(underleveledReport.score < readyReport.score);
  assert.equal(underleveledReport.checks.find((check) => check.key === "level")?.status, "bad");

  const healthySetup = createPreparedTowerState();
  const healthyReport = getTowerReadinessReport(healthySetup.state, 4);
  healthySetup.heroes[0].currentHp = Math.floor(healthySetup.heroes[0].stats.hp * 0.3);
  const lowHpReport = getTowerReadinessReport(healthySetup.state, 4);
  assert.ok(lowHpReport.score < healthyReport.score);
  assert.equal(lowHpReport.checks.find((check) => check.key === "health")?.status, "bad");

  const injurySetup = createPreparedTowerState();
  const injuryBaseline = getTowerReadinessReport(injurySetup.state, 4);
  injurySetup.heroes[0].injuries = [
    { id: "injury_test", typeKey: "injuredArm", remainingBattles: 2, createdAt: "2026-01-01T00:00:00.000Z" },
  ];
  const injuryReport = getTowerReadinessReport(injurySetup.state, 4);
  assert.ok(injuryReport.score < injuryBaseline.score);
  assert.equal(injuryReport.checks.find((check) => check.key === "injuries")?.status, "bad");

  const moraleSetup = createPreparedTowerState();
  const moraleBaseline = getTowerReadinessReport(moraleSetup.state, 4);
  moraleSetup.heroes[0].morale = 15;
  const moraleReport = getTowerReadinessReport(moraleSetup.state, 4);
  assert.ok(moraleReport.score < moraleBaseline.score);
  assert.equal(moraleReport.checks.find((check) => check.key === "morale")?.status, "bad");
});

test("readiness diferencia andares normais, testes de bloco e chefes", () => {
  const { state } = createPreparedTowerState();
  const regular = getTowerReadinessReport(state, 4);
  const blockTest = getTowerReadinessReport(state, 5);
  const chapterBoss = getTowerReadinessReport(state, 10);
  const regularMilestone = regular.checks.find((check) => check.key === "milestone");
  const blockMilestone = blockTest.checks.find((check) => check.key === "milestone");
  const bossMilestone = chapterBoss.checks.find((check) => check.key === "milestone");

  assert.equal(regular.metrics.milestoneType, "normal");
  assert.equal(blockTest.metrics.milestoneType, "block-test");
  assert.equal(chapterBoss.metrics.milestoneType, "chapter-boss");
  assert.equal(regularMilestone?.impact, 0);
  assert.equal(blockMilestone?.impact, -6);
  assert.equal(bossMilestone?.impact, -12);
  assert.ok(getRecommendedFormationPower(5) > getRecommendedFormationPower(4));
  assert.ok(getRecommendedFormationPower(10) > getRecommendedFormationPower(5));
  assert.ok(chapterBoss.score < blockTest.score);
  assert.equal(getTowerReadinessLevel(100), "ready");
  assert.equal(getTowerReadinessLevel(70), "caution");
  assert.equal(getTowerReadinessLevel(50), "danger");
  assert.equal(getTowerReadinessLevel(20), "critical");
});

test("relatorio de readiness e puro e entrega contrato consumivel pela UI", () => {
  const { state, heroes } = createPreparedTowerState();
  heroes[0].currentHp = Math.floor(heroes[0].stats.hp * 0.4);
  heroes[1].morale = 30;
  heroes[2].injuries = [
    { id: "injury_ui", typeKey: "brokenRib", remainingBattles: 1, createdAt: "2026-01-01T00:00:00.000Z" },
  ];
  const stateBefore = JSON.stringify(state);
  const injuriesReference = heroes[2].injuries;
  const equipmentReference = heroes[2].equipment;

  const report = getTowerReadinessReport(state, 10);

  assert.equal(JSON.stringify(state), stateBefore);
  assert.equal(heroes[2].injuries, injuriesReference);
  assert.equal(heroes[2].equipment, equipmentReference);
  assert.equal(report.floor, 10);
  assert.ok(report.label.length > 0);
  assert.ok(report.summary.length > 0);
  assert.ok(report.recommendations.length >= 3);
  assert.match(report.recommendations.join(" "), /HP|ferimento|moral/i);
  assert.deepEqual(
    report.checks.map((check) => check.key),
    ["formation", "power", "level", "health", "injuries", "morale", "expedition", "energy", "milestone"],
  );
  assert.equal(report.metrics.recommendedLevel, 5);
  assert.ok(report.metrics.formationPower > 0);
  assert.ok(report.metrics.recommendedPower > 0);
});

test("readiness critico nao adiciona bloqueio ao contrato de combate", () => {
  const { state, heroes } = createPreparedTowerState();
  heroes.forEach((hero, index) => {
    hero.currentHp = Math.floor(hero.stats.hp * 0.4);
    hero.morale = 30;
    hero.injuries = [
      { id: `injury_readiness_${index}`, typeKey: "injuredArm", remainingBattles: 2, createdAt: "2026-01-01T00:00:00.000Z" },
    ];
  });

  assert.equal(getTowerReadinessReport(state, 1).level, "critical");
  const result = runTowerBattle(state, { skipEventRoll: true });
  assert.equal(result.ok, true);
  assert.equal("battle" in result, true);
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
  completeInitialSummonForTest(state);
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

function makeTrainableHero(state: GameState, id: string, classKey: Hero["classKey"] = "warrior"): Hero {
  const hero = createFixedHero(id, classKey, 4);
  hero.morale = 80;
  hero.injuries = [];
  hero.currentHp = hero.stats.hp;
  state.heroes.push(hero);
  return hero;
}

test("save antigo recebe estrutura de treino com defaults corretos", () => {
  const imported = importGameStateFromText(JSON.stringify({
    saveVersion: 1,
    resources: { gold: 500 },
    heroes: [{ id: "legacy_train", name: "Veterano", rarity: 2, classKey: "warrior", traitKey: "brave" }],
    formation: ["legacy_train"],
    towerFloor: 3,
  }), 5_000);

  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.ok(imported.state.training);
  assert.deepEqual(imported.state.training.currentFocusByHeroId, {});
  assert.deepEqual(imported.state.training.heroProgress, {});
  assert.equal(typeof imported.state.training.lastTrainingAt, "number");
  assert.ok((imported.state.training.lastTrainingAt ?? 0) > 0);
});

test("migration v2 adiciona campo de treino persistido e chega ao schema atual", () => {
  const migrated = migrateSaveData({
    schemaVersion: 2,
    saveVersion: 1,
    resources: { gold: 100 },
    heroes: [],
    formation: [],
    towerFloor: 1,
  });

  assert.equal(migrated.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
  assert.ok(migrated.training);
  assert.deepEqual((migrated.training as { heroProgress: unknown }).heroProgress, {});

  const normalized = ensureStateShape(migrated, 1_000);
  assert.equal(normalized.training.lastTrainingAt, 1_000);
});

test("heroi sem foco definido usa o foco recomendado pela classe", () => {
  const state = createInitialState();
  const warrior = makeTrainableHero(state, "focus_warrior", "warrior");
  const mage = makeTrainableHero(state, "focus_mage", "mage");
  const priest = makeTrainableHero(state, "focus_priest", "priest");
  const rogue = makeTrainableHero(state, "focus_rogue", "rogue");

  assert.equal(getRecommendedTrainingFocusForHero(warrior), "frontline");
  assert.equal(getRecommendedTrainingFocusForHero(mage), "arcane");
  assert.equal(getRecommendedTrainingFocusForHero(priest), "support");
  assert.equal(getRecommendedTrainingFocusForHero(rogue), "mobility");
  assert.equal(getHeroTrainingFocus(state, warrior.id), "frontline");
  assert.equal(getHeroTrainingFocus(state, mage.id), "arcane");
});

test("jogador pode alterar o foco de treino do heroi", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "assign_hero", "warrior");

  assert.equal(getHeroTrainingFocus(state, hero.id), "frontline");
  const assigned = assignHeroTrainingFocus(state, hero.id, "defense", 1_000);
  assert.equal(assigned.ok, true);
  assert.equal(getHeroTrainingFocus(state, hero.id), "defense");
  assert.equal(state.training.currentFocusByHeroId[hero.id], "defense");

  const invalid = assignHeroTrainingFocus(state, hero.id, "invalido" as never);
  assert.equal(invalid.ok, false);
  assert.equal(getHeroTrainingFocus(state, hero.id), "defense");
});

test("progresso de treino aumenta XP sem alterar stats brutos nem nivel de combate", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "xp_hero", "warrior");
  const statsBefore = JSON.stringify(hero.stats);
  const levelBefore = hero.level;
  const xpBefore = hero.xp;
  const rarityBefore = hero.rarity;

  const progress = progressHeroTraining(state, hero.id, 14, 2_000);
  assert.ok(progress);
  assert.equal(progress?.xp, 14);
  assert.equal(progress?.focus, "frontline");
  assert.equal(getHeroTrainingProgress(state, hero.id, "frontline").xp, 14);

  assert.equal(JSON.stringify(hero.stats), statsBefore);
  assert.equal(hero.level, levelBefore);
  assert.equal(hero.xp, xpBefore);
  assert.equal(hero.rarity, rarityBefore);
});

test("progresso por tempo respeita impedimentos de expedicao, ferimento, HP e moral", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const healthy = makeTrainableHero(state, "apt_hero", "warrior");
  const expeditionHero = makeTrainableHero(state, "busy_hero", "guardian");
  const injuredHero = makeTrainableHero(state, "hurt_hero", "archer");
  const criticalHero = makeTrainableHero(state, "faint_hero", "rogue");
  const lowMoraleHero = makeTrainableHero(state, "sad_hero", "mage");

  assert.equal(startExpedition(state, "training_field", [expeditionHero.id], now).ok, true);
  injuredHero.injuries = [{ id: "inj", typeKey: "injuredArm", remainingBattles: 2, createdAt: "2026-01-01T00:00:00.000Z" }];
  criticalHero.currentHp = Math.floor(criticalHero.stats.hp * 0.3);
  lowMoraleHero.morale = 15;

  assert.equal(getTrainingEligibility(state, expeditionHero).reasonCode, "expedition");
  assert.equal(getTrainingEligibility(state, injuredHero).reasonCode, "injury");
  assert.equal(getTrainingEligibility(state, criticalHero).reasonCode, "criticalHp");
  assert.equal(getTrainingEligibility(state, lowMoraleHero).reasonCode, "lowMorale");
  assert.equal(getTrainingEligibility(state, healthy).canTrain, true);

  state.training.lastTrainingAt = now;
  const result = progressTrainingForElapsedTime(state, now + TRAINING_CONFIG.blockMs * 3);
  assert.equal(result.appliedBlocks, 3);
  assert.equal(result.xpPerHero, 3);
  assert.deepEqual(result.trainedHeroIds, [healthy.id]);
  assert.equal(result.skippedHeroIds.length, 4);
  assert.equal(getHeroTrainingProgress(state, healthy.id, getHeroTrainingFocus(state, healthy.id)).xp, 3);
  assert.equal(getHeroTrainingProgress(state, expeditionHero.id, getHeroTrainingFocus(state, expeditionHero.id)).xp, 0);
});

test("limite por chamada impede farm e progresso e deterministico para o mesmo elapsed", () => {
  const now = 1_780_000_000_000;
  const bigGap = TRAINING_CONFIG.blockMs * 100;

  const stateA = createInitialState(now);
  const heroA = makeTrainableHero(stateA, "cap_a", "warrior");
  stateA.training.lastTrainingAt = now;
  const resultA = progressTrainingForElapsedTime(stateA, now + bigGap);

  const stateB = createInitialState(now);
  const heroB = makeTrainableHero(stateB, "cap_b", "warrior");
  stateB.training.lastTrainingAt = now;
  const resultB = progressTrainingForElapsedTime(stateB, now + bigGap);

  assert.equal(resultA.appliedBlocks, TRAINING_CONFIG.maxBlocksPerCall);
  assert.equal(resultA.xpPerHero, TRAINING_CONFIG.maxBlocksPerCall * TRAINING_CONFIG.xpPerBlock);
  assert.equal(resultA.appliedBlocks, resultB.appliedBlocks);
  assert.equal(resultA.xpPerHero, resultB.xpPerHero);
  assert.equal(resultA.generatedAt, resultB.generatedAt);
  assert.equal(
    getHeroTrainingProgress(stateA, heroA.id, "frontline").xp,
    getHeroTrainingProgress(stateB, heroB.id, "frontline").xp,
  );

  // Chamada seguinte sem novo tempo decorrido nao concede XP extra.
  const repeated = progressTrainingForElapsedTime(stateA, now + bigGap);
  assert.equal(repeated.appliedBlocks, 0);
  assert.equal(getHeroTrainingProgress(stateA, heroA.id, "frontline").xp, TRAINING_CONFIG.maxBlocksPerCall);
});

test("resumo de treino entrega dados consumiveis pela UI e bonus de readiness leve", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "summary_hero", "guardian");
  assert.equal(assignHeroTrainingFocus(state, hero.id, "defense", 0).ok, true);
  progressHeroTraining(state, hero.id, 44, 0);

  const summary = getHeroTrainingSummary(state, hero.id);
  assert.ok(summary);
  if (!summary) return;
  assert.equal(summary.focus, "defense");
  assert.equal(summary.focusDefinition.label, "Defesa");
  assert.equal(summary.level, 2);
  assert.equal(summary.xpIntoLevel, 14);
  assert.equal(summary.xpForNextLevel, 30);
  assert.equal(summary.progressLabel, "nível 2, 14/30 XP");
  assert.equal(summary.eligibility.canTrain, true);
  assert.ok(summary.statusLabel.length > 0);
  assert.ok(summary.readinessBonus > 0 && summary.readinessBonus <= TRAINING_CONFIG.readinessBonusCap);
  assert.ok(getTrainingFocusDefinitions().length === 8);

  const readinessBonus = getTrainingReadinessBonus(state, hero.id);
  assert.ok(readinessBonus <= TRAINING_CONFIG.readinessBonusCap);
});

test("import/export preserva progresso de treino e foco escolhido", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const hero = makeTrainableHero(state, "roundtrip_hero", "mage");
  assert.equal(assignHeroTrainingFocus(state, hero.id, "arcane", now).ok, true);
  progressHeroTraining(state, hero.id, 35, now);

  const exported = serializeGameStateForExport(state);
  const imported = importGameStateFromText(exported, now + 1_000);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.equal(imported.state.training.currentFocusByHeroId[hero.id], "arcane");
  const restored = getHeroTrainingProgress(imported.state, hero.id, "arcane");
  assert.equal(restored.xp, 35);
  assert.equal(restored.level, 2);
});

test("rotina idle reflete o foco de treino de herois aptos", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "routine_focus_hero", "warrior");
  equipHeroForLobbyRoutine(state, hero);
  assert.equal(assignHeroTrainingFocus(state, hero.id, "defense", 0).ok, true);

  const routine = getHeroLobbyRoutine(state, hero, 0);
  assert.equal(routine.activity, "training");
  assert.equal(routine.location, "trainingGround");
  assert.match(routine.label, /Defesa/);
  assert.match(routine.description, /Defesa/);

  const report = getLobbyTrainingReport(state, 0);
  assert.equal(report.entries.length, 1);
  assert.equal(report.trainingCount, 1);
  assert.equal(report.entries[0].focus, "defense");
});

test("progresso de treino nao altera combate, summon nem expedicao", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  completeInitialSummonForTest(state);
  const hero = makeTrainableHero(state, "isolation_hero", "warrior");
  const floorBefore = state.towerFloor;
  const goldBefore = state.resources.gold;
  const heroesBefore = state.heroes.length;
  const historyBefore = state.summonHistory.length;
  const expeditionsBefore = state.activeExpeditions.length;
  const heroSnapshot = JSON.stringify({ stats: hero.stats, level: hero.level, xp: hero.xp, rarity: hero.rarity });

  state.training.lastTrainingAt = now;
  progressTrainingForElapsedTime(state, now + TRAINING_CONFIG.blockMs * 6);

  assert.equal(state.towerFloor, floorBefore);
  assert.equal(state.resources.gold, goldBefore);
  assert.equal(state.heroes.length, heroesBefore);
  assert.equal(state.summonHistory.length, historyBefore);
  assert.equal(state.activeExpeditions.length, expeditionsBefore);
  assert.equal(JSON.stringify({ stats: hero.stats, level: hero.level, xp: hero.xp, rarity: hero.rarity }), heroSnapshot);
});

test("save antigo recebe estrutura de proficiencias com defaults corretos", () => {
  const imported = importGameStateFromText(JSON.stringify({
    saveVersion: 1,
    resources: { gold: 500 },
    heroes: [{ id: "legacy_prof", name: "Veterano", rarity: 2, classKey: "warrior", traitKey: "brave" }],
    formation: ["legacy_prof"],
    towerFloor: 3,
  }));

  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.ok(imported.state.proficiencies);
  assert.deepEqual(imported.state.proficiencies.heroProgress, {});
});

test("migration v3 adiciona proficiencias persistidas e chega ao schema atual", () => {
  const migrated = migrateSaveData({
    schemaVersion: 3,
    saveVersion: 1,
    resources: { gold: 100 },
    heroes: [],
    formation: [],
    towerFloor: 1,
  });

  assert.equal(migrated.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
  assert.ok(migrated.proficiencies);
  assert.deepEqual((migrated.proficiencies as { heroProgress: unknown }).heroProgress, {});
});

test("normalizacao remove progresso de proficiencia de herois inexistentes", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "prof_valid", "warrior");
  progressHeroProficiency(state, hero.id, "shieldwork", 25, 1_000);

  const normalized = ensureStateShape({
    ...state,
    proficiencies: {
      heroProgress: {
        [hero.id]: state.proficiencies.heroProgress[hero.id],
        ghost_hero: { swordplay: { heroId: "ghost_hero", key: "swordplay", xp: 40, rank: "practiced", discovered: true, updatedAt: 0 } },
      },
    },
  });

  assert.ok(normalized.proficiencies.heroProgress[hero.id]);
  assert.equal(normalized.proficiencies.heroProgress.ghost_hero, undefined);
  assert.equal(normalized.proficiencies.heroProgress[hero.id]?.shieldwork?.xp, 25);
});

test("proficiencias recomendadas por classe sao coerentes", () => {
  const state = createInitialState();
  const warrior = makeTrainableHero(state, "rec_warrior", "warrior");
  const guardian = makeTrainableHero(state, "rec_guardian", "guardian");
  const archer = makeTrainableHero(state, "rec_archer", "archer");
  const mage = makeTrainableHero(state, "rec_mage", "mage");
  const priest = makeTrainableHero(state, "rec_priest", "priest");
  const rogue = makeTrainableHero(state, "rec_rogue", "rogue");

  assert.ok(getRecommendedProficienciesForHero(warrior).includes("swordplay"));
  assert.ok(getRecommendedProficienciesForHero(warrior).includes("shieldwork"));
  assert.ok(getRecommendedProficienciesForHero(guardian).includes("shieldwork"));
  assert.ok(getRecommendedProficienciesForHero(archer).includes("archery"));
  assert.ok(getRecommendedProficienciesForHero(archer).includes("fieldcraft"));
  assert.ok(getRecommendedProficienciesForHero(mage).includes("arcaneControl"));
  assert.ok(getRecommendedProficienciesForHero(priest).includes("healingArts"));
  assert.ok(getRecommendedProficienciesForHero(rogue).includes("daggerwork"));
  assert.equal(getProficiencyDefinitions().length, 12);
});

test("treino alimenta proficiencia principal e secundaria com valor menor", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "feed_hero", "warrior");
  assert.equal(assignHeroTrainingFocus(state, hero.id, "frontline", 0).ok, true);

  progressProficienciesForTrainingResult(state, { trainedHeroIds: [hero.id], xpPerHero: 6 }, 1_000);

  // frontline -> principal shieldwork (ceil 6/2 = 3), secundaria discipline (floor 6/6 = 1)
  const shieldwork = getHeroProficiencyProgress(state, hero.id, "shieldwork");
  const discipline = getHeroProficiencyProgress(state, hero.id, "discipline");
  assert.equal(shieldwork.xp, 3);
  assert.equal(discipline.xp, 1);
  assert.ok(shieldwork.xp > discipline.xp);
  assert.equal(shieldwork.discovered, true);
  assert.equal(discipline.discovered, true);
});

test("foco damage usa a proficiencia de arma da classe do heroi", () => {
  const state = createInitialState();
  const archer = makeTrainableHero(state, "dmg_archer", "archer");
  assert.equal(assignHeroTrainingFocus(state, archer.id, "damage", 0).ok, true);

  const result = progressHeroProficienciesFromTraining(state, archer.id, "damage", 6, 1_000);
  assert.equal(result.primary?.key, "archery");
  assert.equal(result.secondary?.key, "tactics");
  assert.equal(getHeroProficiencyProgress(state, archer.id, "archery").xp, 3);
});

test("rank de proficiencia muda conforme XP acumulado", () => {
  assert.equal(getRankForXp(0), "unknown");
  assert.equal(getRankForXp(1), "novice");
  assert.equal(getRankForXp(19), "novice");
  assert.equal(getRankForXp(20), "practiced");
  assert.equal(getRankForXp(59), "practiced");
  assert.equal(getRankForXp(60), "competent");
  assert.equal(getRankForXp(119), "competent");
  assert.equal(getRankForXp(120), "refined");
});

test("progresso de proficiencia nao altera stats, level ou combate/summon/expedicao", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  completeInitialSummonForTest(state);
  const hero = makeTrainableHero(state, "prof_isolation", "warrior");
  const statsBefore = JSON.stringify(hero.stats);
  const levelBefore = hero.level;
  const xpBefore = hero.xp;
  const rarityBefore = hero.rarity;
  const floorBefore = state.towerFloor;
  const goldBefore = state.resources.gold;
  const heroesBefore = state.heroes.length;
  const historyBefore = state.summonHistory.length;
  const expeditionsBefore = state.activeExpeditions.length;

  progressHeroProficiency(state, hero.id, "shieldwork", 40, now);

  assert.equal(JSON.stringify(hero.stats), statsBefore);
  assert.equal(hero.level, levelBefore);
  assert.equal(hero.xp, xpBefore);
  assert.equal(hero.rarity, rarityBefore);
  assert.equal(state.towerFloor, floorBefore);
  assert.equal(state.resources.gold, goldBefore);
  assert.equal(state.heroes.length, heroesBefore);
  assert.equal(state.summonHistory.length, historyBefore);
  assert.equal(state.activeExpeditions.length, expeditionsBefore);
});

test("tecnicas leves desbloqueiam por rank de proficiencia", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "tech_hero", "guardian");

  progressHeroProficiency(state, hero.id, "shieldwork", 19, 1_000);
  let techniques = getHeroLightTechniques(state, hero.id);
  const steadyGuardLocked = techniques.find((technique) => technique.key === "steady_guard");
  assert.equal(steadyGuardLocked?.unlocked, false);

  progressHeroProficiency(state, hero.id, "shieldwork", 1, 2_000);
  techniques = getHeroLightTechniques(state, hero.id);
  const steadyGuardUnlocked = techniques.find((technique) => technique.key === "steady_guard");
  const lineStanceStillLocked = techniques.find((technique) => technique.key === "line_stance");
  assert.equal(steadyGuardUnlocked?.unlocked, true);
  assert.equal(steadyGuardUnlocked?.name, "Guarda Estável");
  assert.equal(lineStanceStillLocked?.unlocked, false);
});

test("resumo de proficiencia entrega dados consumiveis pela UI", () => {
  const state = createInitialState();
  const definition = HERO_ROSTER.find((entry) => entry.classKey === "guardian")!;
  const hero = createHeroFromDefinition(definition, { id: "summary_prof_hero", random: () => 0.5 });
  state.heroes.push(hero);
  progressHeroProficiency(state, hero.id, "shieldwork", 24, 1_000);

  const summary = getHeroProficiencySummary(state, hero.id);
  assert.ok(summary);
  if (!summary) return;
  const shieldwork = summary.discovered.find((entry) => entry.key === "shieldwork");
  assert.ok(shieldwork);
  assert.equal(shieldwork?.rank, "practiced");
  assert.equal(shieldwork?.rankLabel, "Praticado");
  assert.equal(shieldwork?.discovered, true);
  assert.ok(summary.unlockedTechniques.some((technique) => technique.key === "steady_guard"));
  assert.ok(summary.recommended.includes("shieldwork"));
  assert.equal(summary.hasHiddenPotential, true);
  assert.ok(summary.potentialHint && summary.potentialHint.length > 0);
});

test("import/export preserva progresso de proficiencia", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const hero = makeTrainableHero(state, "roundtrip_prof", "mage");
  progressHeroProficiency(state, hero.id, "arcaneControl", 35, now);

  const exported = serializeGameStateForExport(state);
  const imported = importGameStateFromText(exported, now + 1_000);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  const restored = getHeroProficiencyProgress(imported.state, hero.id, "arcaneControl");
  assert.equal(restored.xp, 35);
  assert.equal(restored.rank, "practiced");
  assert.equal(restored.discovered, true);
});

test("rotina idle cita tecnica leve quando disponivel", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "routine_prof_hero", "guardian");
  equipHeroForLobbyRoutine(state, hero);
  assert.equal(assignHeroTrainingFocus(state, hero.id, "defense", 0).ok, true);
  progressHeroProficiency(state, hero.id, "shieldwork", 25, 0);

  const routine = getHeroLobbyRoutine(state, hero, 0);
  assert.equal(routine.activity, "training");
  assert.match(routine.description, /Guarda Estável/);
});

test("bonus de proficiencia para readiness e pequeno, limitado e isolado", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "readiness_prof", "guardian");
  assert.equal(getProficiencyReadinessBonus(state, hero.id), 0);

  progressHeroProficiency(state, hero.id, "shieldwork", 120, 1_000);
  progressHeroProficiency(state, hero.id, "discipline", 120, 1_000);
  progressHeroProficiency(state, hero.id, "survival", 120, 1_000);

  const bonus = getProficiencyReadinessBonus(state, hero.id);
  assert.ok(bonus > 0);
  assert.ok(bonus <= PROFICIENCY_CONFIG.readinessBonusPerHeroCap);

  // Readiness da Torre nao foi integrado nesta etapa: continua estavel.
  const prepared = createPreparedTowerState();
  const baseline = getTowerReadinessReport(prepared.state, 20);
  progressHeroProficiency(prepared.state, prepared.heroes[0].id, "shieldwork", 120, 1_000);
  const afterProficiency = getTowerReadinessReport(prepared.state, 20);
  assert.equal(afterProficiency.score, baseline.score);
});

function makeRosterHeroForTest(state: GameState, id: string, definitionId: string): Hero {
  const definition = HERO_ROSTER.find((entry) => entry.definitionId === definitionId)!;
  const hero = createHeroFromDefinition(definition, { id, random: () => 0.5 });
  hero.morale = 80;
  hero.injuries = [];
  hero.currentHp = hero.stats.hp;
  state.heroes.push(hero);
  return hero;
}

test("save antigo recebe estrutura de potencial com defaults corretos", () => {
  const imported = importGameStateFromText(JSON.stringify({
    saveVersion: 1,
    resources: { gold: 500 },
    heroes: [{ id: "legacy_pot", name: "Veterano", rarity: 2, classKey: "warrior", traitKey: "brave" }],
    formation: ["legacy_pot"],
    towerFloor: 3,
  }));

  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  assert.ok(imported.state.potential);
  assert.deepEqual(imported.state.potential.heroAnalysis, {});
});

test("migration v4 adiciona potencial persistido e chega ao schema atual", () => {
  const migrated = migrateSaveData({
    schemaVersion: 4,
    saveVersion: 1,
    resources: { gold: 100 },
    heroes: [],
    formation: [],
    towerFloor: 1,
  });

  assert.equal(migrated.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
  assert.ok(migrated.potential);
  assert.deepEqual((migrated.potential as { heroAnalysis: unknown }).heroAnalysis, {});
});

test("normalizacao remove analise de potencial de herois inexistentes", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "pot_valid", "warrior");
  progressHeroPotentialAnalysis(state, hero.id, 10, "manual", 1_000);

  const normalized = ensureStateShape({
    ...state,
    potential: {
      heroAnalysis: {
        [hero.id]: state.potential.heroAnalysis[hero.id],
        ghost_hero: { heroId: "ghost_hero", xp: 20, level: 3, revealedInsightKeys: ["background"], updatedAt: 0 },
      },
    },
  });

  assert.ok(normalized.potential.heroAnalysis[hero.id]);
  assert.equal(normalized.potential.heroAnalysis.ghost_hero, undefined);
  assert.equal(normalized.potential.heroAnalysis[hero.id]?.xp, 10);
});

test("relatorio de potencial funciona para heroi sem analise", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_report_empty", "darian_cinder_oath");

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  assert.equal(report.analysisLevel, 0);
  assert.equal(report.analysisXp, 0);
  assert.ok(report.summary.length > 0);
  assert.equal(report.revealedInsights.length, 0);
  assert.ok(report.lockedInsights.length > 0);
  assert.ok(report.recommendations.length > 0);
});

test("XP de analise aumenta o nivel de forma progressiva", () => {
  assert.equal(getPotentialLevelForXp(0), 0);
  assert.equal(getPotentialLevelForXp(3), 1);
  assert.equal(getPotentialLevelForXp(8), 2);
  assert.equal(getPotentialLevelForXp(16), 3);
  assert.equal(getPotentialLevelForXp(28), 4);
  assert.equal(getPotentialLevelForXp(44), 5);

  const state = createInitialState();
  const hero = makeTrainableHero(state, "pot_level", "warrior");
  progressHeroPotentialAnalysis(state, hero.id, 3, "manual", 1_000);
  assert.equal(getHeroPotentialProgress(state, hero.id).level, 1);
  progressHeroPotentialAnalysis(state, hero.id, 5, "manual", 2_000);
  assert.equal(getHeroPotentialProgress(state, hero.id).level, 2);
});

test("treino e proficiencia alimentam a analise de forma leve", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "pot_feed", "warrior");
  assert.equal(assignHeroTrainingFocus(state, hero.id, "frontline", 0).ok, true);

  const outcomes = progressProficienciesForTrainingResult(state, { trainedHeroIds: [hero.id], xpPerHero: 6 }, 1_000);
  progressPotentialFromProficiencyOutcomes(state, outcomes, 1_000);

  const progress = getHeroPotentialProgress(state, hero.id);
  // Uma leva de treino descobre principal (shieldwork) e secundaria (discipline):
  // +1 por progresso e +2 por rank-up de cada descoberta (unknown -> novice).
  assert.equal(progress.xp, POTENTIAL_CONFIG.xpPerProficiencyProgress + 2 * POTENTIAL_CONFIG.xpPerProficiencyRankUp);
  // Continua leve: uma leva nao ultrapassa o nivel 2.
  assert.ok(progress.xp > 0 && progress.level <= 2);
});

test("mudanca de rank de proficiencia gera XP extra de analise", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "pot_rankup", "warrior");

  progressPotentialFromProficiencyOutcomes(state, [{ heroId: hero.id, progressed: true, rankUps: 0 }], 1_000);
  assert.equal(getHeroPotentialProgress(state, hero.id).xp, 1);

  progressPotentialFromProficiencyOutcomes(state, [{ heroId: hero.id, progressed: true, rankUps: 1 }], 2_000);
  // +1 (progresso) +2 (rank-up) sobre o 1 anterior.
  assert.equal(getHeroPotentialProgress(state, hero.id).xp, 1 + 1 + POTENTIAL_CONFIG.xpPerProficiencyRankUp);
});

test("insights respeitam o nivel de analise", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_insight_level", "darian_cinder_oath");

  const atZero = getPotentialInsightsForHero(state, hero.id);
  const backgroundAtZero = atZero.find((insight) => insight.key === "background");
  assert.ok(backgroundAtZero);
  assert.equal(backgroundAtZero?.revealed, false);

  progressHeroPotentialAnalysis(state, hero.id, 8, "manual", 1_000);
  const atLevelTwo = getPotentialInsightsForHero(state, hero.id);
  const backgroundAtTwo = atLevelTwo.find((insight) => insight.key === "background");
  assert.equal(backgroundAtTwo?.revealed, true);
  const hiddenAtTwo = atLevelTwo.find((insight) => insight.key === "hiddenAptitude");
  assert.equal(hiddenAtTwo?.revealed, false);
});

test("hiddenAptitudeTags nao sao expostos diretamente na analise", () => {
  const state = createInitialState();
  const definition = HERO_ROSTER.find((entry) => entry.definitionId === "selka_broken_rune")!;
  const hero = makeRosterHeroForTest(state, "pot_hidden", "selka_broken_rune");
  progressHeroPotentialAnalysis(state, hero.id, POTENTIAL_CONFIG.maxXp, "manual", 1_000);

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  const joined = [report.summary, ...report.insights.map((insight) => insight.description), ...report.recommendations].join(" ");
  definition.hiddenAptitudeTags.forEach((tag) => {
    assert.equal(joined.includes(tag), false);
  });
  assert.equal(report.hiddenPotentialSignal, true);
});

test("heroi de baixa raridade recebe leitura de potencial a descobrir", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_low", "orven_ash_eye");

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  assert.equal(report.isLowRarity, true);
  const text = [report.summary, ...report.recommendations].join(" ").toLowerCase();
  assert.ok(text.includes("inesperado") || text.includes("comum"));
});

test("heroi raro recebe leitura mais confiante, mas nao total", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_rare", "darian_cinder_oath");

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  assert.equal(report.isLowRarity, false);
  assert.ok(report.rarity >= 3);
  // Mesmo raro, ainda ha insights bloqueados no inicio.
  assert.ok(report.lockedInsights.length > 0);
});

test("moral baixa gera insight de risco na analise", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_risk", "darian_cinder_oath");
  hero.morale = 20;
  progressHeroPotentialAnalysis(state, hero.id, 5, "manual", 1_000);

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  const risk = report.insights.find((insight) => insight.type === "risk");
  assert.ok(risk);
  assert.equal(risk?.revealed, true);
});

test("relatorio de potencial entrega dados consumiveis pela UI", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "pot_ui", "darian_cinder_oath");
  progressHeroPotentialAnalysis(state, hero.id, 16, "manual", 1_000);

  const report = getHeroPotentialReport(state, hero.id);
  assert.ok(report);
  if (!report) return;
  assert.equal(typeof report.analysisLevelLabel, "string");
  assert.equal(report.revealedInsights.length + report.lockedInsights.length, report.insights.length);
  assert.ok(report.recommendations.every((entry) => typeof entry === "string" && entry.length > 0));
  report.insights.forEach((insight) => {
    assert.ok(typeof insight.label === "string");
    assert.ok(["low", "medium", "high"].includes(insight.confidence));
  });
});

test("import/export preserva analise de potencial", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  const hero = makeTrainableHero(state, "pot_roundtrip", "warrior");
  progressHeroPotentialAnalysis(state, hero.id, 16, "manual", now);

  const exported = serializeGameStateForExport(state);
  const imported = importGameStateFromText(exported, now + 1_000);
  assert.equal(imported.ok, true);
  if (!imported.ok) return;
  const restored = getHeroPotentialProgress(imported.state, hero.id);
  assert.equal(restored.xp, 16);
  assert.equal(restored.level, 3);
  assert.ok(restored.revealedInsightKeys.includes("background"));
});

test("acao manual de analise consome ouro e progride, respeitando saldo", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "pot_manual", "warrior");
  state.resources.gold = POTENTIAL_CONFIG.manualAnalysisGoldCost;

  const first = analyzeHeroPotential(state, hero.id, 1_000);
  assert.equal(first.ok, true);
  assert.equal(state.resources.gold, 0);
  assert.equal(getHeroPotentialProgress(state, hero.id).xp, POTENTIAL_CONFIG.manualAnalysisXp);

  const second = analyzeHeroPotential(state, hero.id, 2_000);
  assert.equal(second.ok, false);
});

test("analise de potencial nao altera stats, level, raridade, combate, summon ou expedicao", () => {
  const now = 1_780_000_000_000;
  const state = createInitialState(now);
  completeInitialSummonForTest(state);
  const hero = makeTrainableHero(state, "pot_isolation", "warrior");
  const statsBefore = JSON.stringify(hero.stats);
  const levelBefore = hero.level;
  const xpBefore = hero.xp;
  const rarityBefore = hero.rarity;
  const floorBefore = state.towerFloor;
  const heroesBefore = state.heroes.length;
  const historyBefore = state.summonHistory.length;
  const expeditionsBefore = state.activeExpeditions.length;

  progressHeroPotentialAnalysis(state, hero.id, POTENTIAL_CONFIG.maxXp, "manual", now);

  assert.equal(JSON.stringify(hero.stats), statsBefore);
  assert.equal(hero.level, levelBefore);
  assert.equal(hero.xp, xpBefore);
  assert.equal(hero.rarity, rarityBefore);
  assert.equal(state.towerFloor, floorBefore);
  assert.equal(state.heroes.length, heroesBefore);
  assert.equal(state.summonHistory.length, historyBefore);
  assert.equal(state.activeExpeditions.length, expeditionsBefore);
});

function preparePromotionCandidate(
  state: GameState,
  hero: Hero,
  options: {
    level?: number;
    potentialXp?: number;
    proficiencyXp?: number;
    proficiencyKey?: "shieldwork" | "swordplay" | "archery";
    towerFloor?: number;
    gold?: number;
    fragments?: number;
  } = {},
): void {
  if (options.level !== undefined) hero.level = options.level;
  if (options.potentialXp !== undefined) progressHeroPotentialAnalysis(state, hero.id, options.potentialXp, "manual", 1_000);
  if (options.proficiencyXp !== undefined) {
    progressHeroProficiency(state, hero.id, options.proficiencyKey ?? "shieldwork", options.proficiencyXp, 1_000);
  }
  if (options.towerFloor !== undefined) state.towerFloor = options.towerFloor;
  if (options.gold !== undefined) state.resources.gold = options.gold;
  if (options.fragments !== undefined) state.resources.fragments = options.fragments;
}

// Deixa um heroi 1★ totalmente elegivel para 2★, incluindo recursos do custo.
function makeEligibleOneStar(state: GameState, id: string): Hero {
  const hero = makeRosterHeroForTest(state, id, "orven_ash_eye");
  preparePromotionCandidate(state, hero, {
    level: 8,
    potentialXp: 10,
    proficiencyXp: 10,
    proficiencyKey: "archery",
    towerFloor: 3,
    gold: 500,
    fragments: 10,
  });
  return hero;
}

test("heroi 5 estrelas nao possui alvo de promocao", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "promo_max", "warrior");
  hero.rarity = PROMOTION_MAX_RARITY;

  assert.equal(getPromotionTargetRarity(hero), null);
  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.targetRarity, null);
  assert.equal(preview.readiness, "blocked");
  assert.equal(preview.eligible, false);
});

test("heroi 1 estrela tem alvo 2 estrelas e heroi 2 estrelas tem alvo 3", () => {
  const state = createInitialState();
  const oneStar = makeRosterHeroForTest(state, "promo_1", "orven_ash_eye");
  const twoStar = makeRosterHeroForTest(state, "promo_2", "elira_stone_vigil");

  assert.equal(oneStar.rarity, 1);
  assert.equal(getPromotionTargetRarity(oneStar), 2);
  assert.equal(twoStar.rarity, 2);
  assert.equal(getPromotionTargetRarity(twoStar), 3);
});

test("heroi sem analise de potencial fica nao pronto ou bloqueado", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_no_pot", "orven_ash_eye");
  progressHeroProficiency(state, hero.id, "archery", 5, 1_000);

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(getHeroPotentialProgress(state, hero.id).level, 0);
  assert.ok(["not-ready", "blocked"].includes(preview.readiness));
  const potentialReq = preview.requirements.find((req) => req.key === "potential");
  assert.ok(potentialReq);
  assert.equal(potentialReq?.status, "missing");
});

test("heroi com analise suficiente melhora readiness", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_pot_ok", "orven_ash_eye");
  preparePromotionCandidate(state, hero, { level: 6, potentialXp: 8, proficiencyXp: 5, towerFloor: 3 });

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  const potentialReq = preview.requirements.find((req) => req.key === "potential");
  assert.equal(potentialReq?.status, "met");
  assert.ok(["almost", "ready"].includes(preview.readiness));
});

test("heroi sem proficiencia descoberta recebe requisito pendente", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_no_prof", "orven_ash_eye");
  progressHeroPotentialAnalysis(state, hero.id, 5, "manual", 1_000);

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  const profReq = preview.requirements.find((req) => req.key === "proficiency");
  assert.ok(profReq);
  assert.equal(profReq?.status, "missing");
});

test("heroi com proficiencia e tecnica adequadas melhora readiness", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_prof_ok", "elira_stone_vigil");
  preparePromotionCandidate(state, hero, { level: 12, potentialXp: 16, proficiencyXp: 25, towerFloor: 6 });

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.targetRarity, 3);
  const profReq = preview.requirements.find((req) => req.key === "proficiency");
  const techReq = preview.requirements.find((req) => req.key === "technique");
  assert.equal(profReq?.status, "met");
  assert.equal(techReq?.status, "met");
  assert.ok(["almost", "ready", "not-ready"].includes(preview.readiness));
  assert.notEqual(preview.readiness, "blocked");
});

test("ferimento ativo bloqueia promocao", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_injury", "orven_ash_eye");
  preparePromotionCandidate(state, hero, { level: 8, potentialXp: 10, proficiencyXp: 10, towerFloor: 5 });
  hero.injuries = [{ key: "bruise", remainingBattles: 2, severity: 1 }];

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.readiness, "blocked");
  const injuryReq = preview.requirements.find((req) => req.key === "injury");
  assert.equal(injuryReq?.status, "missing");
});

test("moral colapsada bloqueia promocao", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_morale", "orven_ash_eye");
  preparePromotionCandidate(state, hero, { level: 8, potentialXp: 10, proficiencyXp: 10, towerFloor: 5 });
  hero.morale = 15;

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.readiness, "blocked");
  const moraleReq = preview.requirements.find((req) => req.key === "morale");
  assert.equal(moraleReq?.status, "missing");
});

test("progresso da Torre e considerado como requisito", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_tower", "elira_stone_vigil");
  preparePromotionCandidate(state, hero, { level: 12, potentialXp: 16, proficiencyXp: 25, towerFloor: 2 });

  const previewLow = getHeroPromotionPreview(state, hero.id);
  assert.ok(previewLow);
  if (!previewLow) return;
  const towerReqLow = previewLow.requirements.find((req) => req.key === "tower");
  assert.equal(towerReqLow?.status, "missing");

  state.towerFloor = 10;
  const previewHigh = getHeroPromotionPreview(state, hero.id);
  assert.ok(previewHigh);
  if (!previewHigh) return;
  const towerReqHigh = previewHigh.requirements.find((req) => req.key === "tower");
  assert.equal(towerReqHigh?.status, "met");
});

test("baixa raridade recebe recomendacao de investimento, nao descarte", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_low_rec", "orven_ash_eye");
  const preview = getHeroPromotionPreview(state, hero.id);

  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.currentRarity, 1);
  const joined = [preview.summary, ...preview.recommendations].join(" ").toLowerCase();
  assert.ok(joined.includes("descarte") || joined.includes("inesperado") || joined.includes("investimento"));
});

test("preview retorna beneficios projetados sem aplicar nada ao heroi", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_benefits", "orven_ash_eye");
  const maxLevelBefore = hero.maxLevel;
  const rarityBefore = hero.rarity;
  const statsBefore = JSON.stringify(hero.stats);

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.ok(preview.projectedBenefits.length > 0);
  assert.ok(preview.projectedBenefits.some((benefit) => benefit.includes("futuro") || benefit.includes("futura")));

  assert.equal(hero.rarity, rarityBefore);
  assert.equal(hero.maxLevel, maxLevelBefore);
  assert.equal(JSON.stringify(hero.stats), statsBefore);
});

test("chamar preview nao altera estado do jogo", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_pure", "darian_cinder_oath");
  const snapshot = JSON.stringify(state);

  getHeroPromotionPreview(state, hero.id);
  getPromotionRequirementsForHero(state, hero.id);

  assert.equal(JSON.stringify(state), snapshot);
});

test("promocao real 1 para 2 estrelas altera raridade e maxLevel preservando o resto", () => {
  const state = createInitialState();
  const hero = makeEligibleOneStar(state, "promo_real");
  hero.level = 8;
  hero.xp = 42;
  const statsBefore = JSON.stringify(hero.stats);
  const levelBefore = hero.level;
  const xpBefore = hero.xp;
  const hpBefore = hero.currentHp;
  const equipmentBefore = JSON.stringify(hero.equipment);
  const definitionBefore = hero.definitionId;
  const classBefore = hero.classKey;
  const traitBefore = hero.traitKey;
  const proficiencyBefore = JSON.stringify(state.proficiencies.heroProgress[hero.id]);
  const potentialBefore = JSON.stringify(state.potential.heroAnalysis[hero.id]);
  state.formation[0] = hero.id;
  const goldBefore = state.resources.gold;
  const fragmentsBefore = state.resources.fragments;

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.equal(preview?.eligible, true);
  assert.equal(preview?.promotionAvailable, true);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, true);
  assert.ok(result.message.includes("2★"));

  assert.equal(hero.rarity, 2);
  assert.equal(hero.maxLevel, getMaxLevelForRarity(2));
  assert.equal(hero.level, levelBefore);
  assert.equal(hero.xp, xpBefore);
  assert.equal(JSON.stringify(hero.stats), statsBefore);
  assert.equal(hero.currentHp, hpBefore);
  assert.equal(JSON.stringify(hero.equipment), equipmentBefore);
  assert.equal(hero.definitionId, definitionBefore);
  assert.equal(hero.classKey, classBefore);
  assert.equal(hero.traitKey, traitBefore);
  assert.equal(JSON.stringify(state.proficiencies.heroProgress[hero.id]), proficiencyBefore);
  assert.equal(JSON.stringify(state.potential.heroAnalysis[hero.id]), potentialBefore);
  assert.equal(state.formation[0], hero.id);
  assert.equal(state.resources.gold, goldBefore - 150);
  assert.equal(state.resources.fragments, fragmentsBefore - 5);
});

test("falha de promocao por recurso insuficiente nao consome nada", () => {
  const state = createInitialState();
  const hero = makeEligibleOneStar(state, "promo_no_gold");
  state.resources.fragments = 2;
  const snapshot = JSON.stringify(state);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.ok(result.message.toLowerCase().includes("insuficient") || result.message.includes("requisitos"));
  assert.equal(hero.rarity, 1);
  assert.equal(JSON.stringify(state), snapshot);
});

test("falha de promocao por requisito faltante nao consome recursos", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_missing_req", "orven_ash_eye");
  state.resources.gold = 500;
  state.resources.fragments = 10;
  const snapshot = JSON.stringify(state);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.equal(hero.rarity, 1);
  assert.equal(state.resources.gold, 500);
  assert.equal(state.resources.fragments, 10);
  assert.equal(JSON.stringify(state), snapshot);
});

test("heroi ferido nao promove", () => {
  const state = createInitialState();
  const hero = makeEligibleOneStar(state, "promo_hurt");
  hero.injuries = [{ key: "bruise", remainingBattles: 2, severity: 1 }];

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.equal(hero.rarity, 1);
});

test("heroi com moral baixa nao promove", () => {
  const state = createInitialState();
  const hero = makeEligibleOneStar(state, "promo_sad");
  hero.morale = 15;

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.equal(hero.rarity, 1);
});

test("heroi 2 estrelas nao promove para 3 nesta etapa", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_two_block", "elira_stone_vigil");
  preparePromotionCandidate(state, hero, {
    level: 20,
    potentialXp: 20,
    proficiencyXp: 30,
    towerFloor: 10,
    gold: 999,
    fragments: 99,
  });
  const snapshot = JSON.stringify(state);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.ok(result.message.includes("acima de 2★"));
  assert.equal(hero.rarity, 2);
  assert.equal(JSON.stringify(state), snapshot);
});

test("heroi 5 estrelas continua sem promocao", () => {
  const state = createInitialState();
  const hero = makeTrainableHero(state, "promo_five_block", "warrior");
  hero.rarity = PROMOTION_MAX_RARITY;
  const snapshot = JSON.stringify(state);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, false);
  assert.equal(hero.rarity, PROMOTION_MAX_RARITY);
  assert.equal(JSON.stringify(state), snapshot);
});

test("preview reflete custo e disponibilidade da promocao 1 para 2", () => {
  const state = createInitialState();
  const hero = makeEligibleOneStar(state, "promo_preview_cost");

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  assert.equal(preview.promotionAvailable, true);
  assert.equal(preview.eligible, true);
  assert.equal(preview.readiness, "ready");
  assert.ok(preview.systemNotice.includes("1★ → 2★ disponível"));
  const costReq = preview.requirements.find((req) => req.key === "cost");
  assert.ok(costReq);
  assert.equal(costReq?.status, "met");
  assert.equal(preview.cost.length, 2);
  assert.ok(preview.costLabel.includes("150 ouro"));
  assert.ok(preview.costLabel.includes("5 fragmentos"));
});

test("preview marca custo como faltante quando nao ha recursos", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_preview_poor", "orven_ash_eye");
  preparePromotionCandidate(state, hero, {
    level: 8,
    potentialXp: 10,
    proficiencyXp: 10,
    proficiencyKey: "archery",
    towerFloor: 3,
    gold: 10,
    fragments: 0,
  });

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.ok(preview);
  if (!preview) return;
  const costReq = preview.requirements.find((req) => req.key === "cost");
  assert.equal(costReq?.status, "missing");
  assert.equal(preview.eligible, false);
});

test("promocao nao adiciona campo persistido nem altera schemaVersion", () => {
  const state = createInitialState();
  assert.equal(state.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
  assert.equal("promotion" in state, false);
});

test("preview de promocao entrega contrato consumivel pela UI", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_ui", "elira_stone_vigil");
  const preview = getHeroPromotionPreview(state, hero.id);

  assert.ok(preview);
  if (!preview) return;
  assert.equal(typeof preview.title, "string");
  assert.equal(typeof preview.summary, "string");
  assert.ok(preview.systemNotice.includes("preparação") || preview.systemNotice.includes("preparacao"));
  assert.ok(["blocked", "not-ready", "almost", "ready"].includes(preview.readiness));
  preview.requirements.forEach((req) => {
    assert.ok(["met", "missing", "warning"].includes(req.status));
    assert.ok(typeof req.label === "string" && typeof req.description === "string");
  });
  assert.equal(getPromotionReadiness(preview), preview.readiness);
});

// --- Balanceamento inicial ---

test("recursos iniciais ficam coerentes com o novo balanceamento", () => {
  const state = createInitialState();
  assert.equal(state.resources.gold, 250);
  assert.equal(state.resources.crystals, 100);
  assert.equal(state.resources.energy, GAME_CONFIG.maxEnergy);
  assert.equal(state.resources.maxEnergy, GAME_CONFIG.maxEnergy);
  assert.equal(state.resources.fragments, 0);
  // Onboarding intacto: 5 tickets comuns + 1 escolha especial, rituais pagos bloqueados.
  assert.equal(state.initialSummon.commonRemaining, 5);
  assert.equal(isInitialSummonComplete(state), false);
  assert.equal(canUsePaidSummon(state), false);
});

test("ouro inicial nao permite esgotar o roster unico logo de inicio", () => {
  const state = createInitialState();
  const commonSummons = Math.floor(state.resources.gold / GAME_CONFIG.commonSummonCost);
  // Com 250 de ouro sao no maximo 2 invocacoes comuns pagas, bem abaixo do roster.
  assert.ok(commonSummons <= 2);
  assert.ok(commonSummons < HERO_ROSTER.length);
});

test("primeiros andares abrem fonte pequena e controlada de fragmentos", () => {
  // Andares 1-4 nao entregam fragmentos: a fonte comeca no marco do andar 5.
  for (let floor = 1; floor <= 4; floor += 1) {
    assert.equal(getFloorReward(floor).fragments, 0);
  }
  assert.equal(getFloorReward(5).fragments, 3);
  assert.equal(getFloorReward(7).fragments, 6);
  assert.equal(getFloorReward(10).fragments, 10);

  // Ate o andar 10 o total de fragmentos garantidos cobre poucas promocoes,
  // sem trivializar (cada promocao 1★->2★ custa 5 fragmentos).
  const earlyFragments = getFloorReward(5).fragments + getFloorReward(7).fragments + getFloorReward(10).fragments;
  assert.equal(earlyFragments, 19);
  assert.ok(earlyFragments >= 5);
  assert.ok(earlyFragments < 25);
});

test("andares 5 e 10 seguem como marcos com recompensa marcante", () => {
  assert.equal(getFloorReward(5).guaranteedEquipment, true);
  assert.equal(getFloorReward(10).guaranteedEquipment, true);
  assert.ok(getFloorReward(5).gold > getFloorReward(4).gold);
  assert.ok(getFloorReward(10).gold > getFloorReward(9).gold);
});

test("energia inicial permite algumas tentativas mas nao progressao infinita", () => {
  const state = createInitialState();
  const freshAttempts = Math.floor(state.resources.energy / GAME_CONFIG.towerEnergyCost);
  assert.equal(freshAttempts, 6);
  assert.ok(freshAttempts >= 4 && freshAttempts <= 8);
  assert.ok(GAME_CONFIG.energyRegenMs > 0);
});

test("promocao 1 para 2 e alcancavel com fragmentos dos primeiros andares", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "promo_balance", "orven_ash_eye");
  // Fragmentos exatamente equivalentes aos marcos 5 + 7 (fonte cedo).
  const earnedFragments = getFloorReward(5).fragments + getFloorReward(7).fragments;
  preparePromotionCandidate(state, hero, {
    level: 8,
    potentialXp: 10,
    proficiencyXp: 10,
    proficiencyKey: "archery",
    towerFloor: 7,
    gold: 300,
    fragments: earnedFragments,
  });

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.equal(preview?.eligible, true);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, true);
  assert.equal(hero.rarity, 2);
  // Custo consumido; ainda sobra fragmento como buffer controlado.
  assert.equal(state.resources.gold, 150);
  assert.equal(state.resources.fragments, earnedFragments - 5);
  assert.ok(state.resources.fragments >= 0);
});

test("ritmos de treino, proficiencia e potencial seguem lentos e controlados", () => {
  assert.equal(TRAINING_CONFIG.xpPerBlock, 1);
  assert.ok(TRAINING_CONFIG.blockMs >= 10 * 60 * 1000);
  assert.ok(TRAINING_CONFIG.maxBlocksPerCall <= 6);
  // Proficiencia primaria recebe apenas fracao do XP de treino.
  assert.ok(PROFICIENCY_CONFIG.primaryDivisor >= 2);
  // Nivel 1 de potencial ainda exige acumulo (nao instantaneo).
  assert.equal(getPotentialLevelForXp(0), 0);
  assert.equal(getPotentialLevelForXp(POTENTIAL_CONFIG.manualAnalysisXp), 1);
});

// --- Trilha inicial de objetivos (early-game) ---

function findObjective(track: ReturnType<typeof getEarlyObjectiveTrack>, key: string) {
  return track.objectives.find((objective) => objective.key === key)!;
}

test("trilha inicial existe e retorna objetivos derivados do estado", () => {
  const state = createInitialState();
  const track = getEarlyObjectiveTrack(state);
  assert.equal(track.title, "Rota da Primeira Ascensão");
  assert.ok(track.objectives.length >= 9);
  assert.equal(track.totalCount, track.objectives.length);
  assert.ok(track.completedCount >= 0 && track.completedCount <= track.totalCount);
});

test("save novo mostra tickets comuns como proximo objetivo", () => {
  const state = createInitialState();
  const track = getEarlyObjectiveTrack(state);
  assert.ok(track.nextObjective);
  assert.equal(track.nextObjective?.key, "use-tickets");
  assert.equal(findObjective(track, "use-tickets").status, "available");
});

test("gastar tickets comuns atualiza progresso do objetivo inicial", () => {
  const state = createInitialState();
  state.initialSummon.commonRemaining = 2;
  const partial = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(partial, "use-tickets").progressCurrent, 3);
  assert.equal(findObjective(partial, "use-tickets").status, "available");

  state.initialSummon.commonRemaining = 0;
  const done = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(done, "use-tickets").status, "completed");
});

test("escolher especial marca objetivo como concluido", () => {
  const state = createInitialState();
  state.initialSummon.commonRemaining = 0;
  state.initialSummon.specialClaimed = true;
  const track = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(track, "choose-special").status, "completed");
});

test("montar formacao atualiza o objetivo de formacao", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "track_formation", "orven_ash_eye");
  assert.notEqual(findObjective(getEarlyObjectiveTrack(state), "build-formation").status, "completed");
  state.formation[0] = hero.id;
  const track = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(track, "build-formation").status, "completed");
  assert.equal(findObjective(track, "build-formation").progressCurrent, 1);
});

test("towerFloor 2 marca o andar 1 como vencido", () => {
  const state = createInitialState();
  state.towerFloor = 2;
  assert.equal(findObjective(getEarlyObjectiveTrack(state), "win-floor-1").status, "completed");
});

test("towerFloor 6 marca o marco do andar 5 como vencido", () => {
  const state = createInitialState();
  state.towerFloor = 6;
  const track = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(track, "reach-floor-5").status, "completed");
  assert.equal(findObjective(track, "reach-floor-5").progressCurrent, 5);
});

test("fragmentos e ouro suficientes concluem o objetivo de recursos", () => {
  const state = createInitialState();
  state.resources.gold = 300;
  state.resources.fragments = 5;
  const objective = findObjective(getEarlyObjectiveTrack(state), "gather-resources");
  assert.equal(objective.progressCurrent, 2);
  assert.equal(objective.progressTarget, 2);
  assert.equal(objective.status, "completed");
});

test("treino de heroi 1 estrela conclui o objetivo de treino", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "track_train", "orven_ash_eye");
  assert.equal(findObjective(getEarlyObjectiveTrack(state), "train-one-star").status !== "completed", true);
  progressHeroTraining(state, hero.id, 5, 1_000);
  assert.equal(findObjective(getEarlyObjectiveTrack(state), "train-one-star").status, "completed");
});

test("proficiencia descoberta em heroi 1 estrela conclui objetivo", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "track_prof", "orven_ash_eye");
  progressHeroProficiency(state, hero.id, "archery", 5, 1_000);
  assert.equal(findObjective(getEarlyObjectiveTrack(state), "reveal-proficiency").status, "completed");
});

test("potencial nivel 1 em heroi 1 estrela conclui objetivo de analise", () => {
  const state = createInitialState();
  const hero = makeRosterHeroForTest(state, "track_pot", "orven_ash_eye");
  progressHeroPotentialAnalysis(state, hero.id, 3, "manual", 1_000);
  assert.equal(findObjective(getEarlyObjectiveTrack(state), "analyze-potential").status, "completed");
});

test("preview elegivel de promocao libera o objetivo final da trilha", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  const hero = makeRosterHeroForTest(state, "track_final", "orven_ash_eye");
  state.formation[0] = hero.id;
  state.towerFloor = 7;
  preparePromotionCandidate(state, hero, {
    level: 8,
    potentialXp: 10,
    proficiencyXp: 10,
    proficiencyKey: "archery",
    towerFloor: 7,
    gold: 300,
    fragments: 9,
  });
  progressHeroTraining(state, hero.id, 5, 1_000);
  state.resources.fragments = 9;

  const preview = getHeroPromotionPreview(state, hero.id);
  assert.equal(preview?.eligible, true);

  const track = getEarlyObjectiveTrack(state);
  const finalObjective = findObjective(track, "promote-one-star");
  assert.equal(finalObjective.status, "available");
  assert.ok(finalObjective.hint.includes("elegível"));
});

test("heroi promovido para 2 estrelas conclui a trilha final", () => {
  const state = createInitialState();
  completeInitialSummonForTest(state);
  const hero = makeRosterHeroForTest(state, "track_promoted", "orven_ash_eye");
  state.formation[0] = hero.id;
  preparePromotionCandidate(state, hero, {
    level: 8,
    potentialXp: 10,
    proficiencyXp: 10,
    proficiencyKey: "archery",
    towerFloor: 7,
    gold: 300,
    fragments: 9,
  });
  progressHeroTraining(state, hero.id, 5, 1_000);

  const result = promoteHero(state, hero.id);
  assert.equal(result.ok, true);
  assert.equal(hero.rarity, 2);

  const track = getEarlyObjectiveTrack(state);
  assert.equal(findObjective(track, "promote-one-star").status, "completed");
});

test("objetivos locked/available/completed respeitam a ordem minima", () => {
  const state = createInitialState();
  const track = getEarlyObjectiveTrack(state);
  const availableCount = track.objectives.filter((objective) => objective.status === "available").length;
  assert.equal(availableCount, 1);
  const firstAvailableIndex = track.objectives.findIndex((objective) => objective.status === "available");
  track.objectives.forEach((objective, index) => {
    if (index > firstAvailableIndex && objective.status !== "completed") {
      assert.equal(objective.status, "locked");
    }
  });
});

test("getEarlyObjectiveTrack e puro e nao altera o estado", () => {
  const state = createInitialState();
  makeRosterHeroForTest(state, "track_pure", "orven_ash_eye");
  const snapshot = JSON.stringify(state);
  getEarlyObjectiveTrack(state);
  assert.equal(JSON.stringify(state), snapshot);
});

test("trilha inicial nao cria campo persistido nem migration nova", () => {
  const state = createInitialState();
  assert.equal(state.schemaVersion, CURRENT_SAVE_SCHEMA_VERSION);
  assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 5);
  assert.equal("earlyObjectives" in state, false);
  assert.equal("objectives" in state, false);
});

test("contrato da trilha e consumivel pela UI sem logica duplicada", () => {
  const state = createInitialState();
  const track = getEarlyObjectiveTrack(state);
  assert.equal(typeof track.title, "string");
  assert.equal(typeof track.summary, "string");
  track.objectives.forEach((objective) => {
    assert.equal(typeof objective.key, "string");
    assert.equal(typeof objective.title, "string");
    assert.equal(typeof objective.description, "string");
    assert.equal(typeof objective.hint, "string");
    assert.ok(["locked", "available", "completed"].includes(objective.status));
    assert.ok(objective.progressTarget >= 1);
    assert.ok(objective.progressCurrent >= 0 && objective.progressCurrent <= objective.progressTarget);
  });
  // nextObjective, quando existe, e exatamente o objetivo disponivel.
  if (track.nextObjective) {
    assert.equal(track.nextObjective.status, "available");
  }
});
