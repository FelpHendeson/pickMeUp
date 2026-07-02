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
  createHeroFromDefinition,
  createInitialState,
  ensureStateShape,
  equipItem,
  generateHero,
  generateEquipment,
  getExpeditionDefinition,
  getAvailableHeroDefinitions,
  getHeroDefinitionById,
  getOwnedHeroDefinitionIds,
  getRecommendedFormationPower,
  getTowerReadinessLevel,
  getTowerReadinessReport,
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

  assert.equal(migrated.schemaVersion, 2);
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
  assert.equal(roundTrip.state.schemaVersion, 2);
  assert.equal(roundTrip.state.saveVersion, 1);
  assert.equal(roundTrip.state.lastBattle?.id, "legacy_battle");
  assert.equal(roundTrip.state.affinities.legacya_legacyb.xp, 9);
});

test("migration rejeita schemas e versoes futuras", () => {
  assert.equal(validateImportedSaveData({ schemaVersion: 3, saveVersion: 1 }).ok, false);
  assert.equal(validateImportedSaveData({ schemaVersion: 2, saveVersion: 2 }).ok, false);
});

test("nova jornada recebe cinco tickets comuns e uma especial", () => {
  const state = createInitialState();

  assert.equal(state.schemaVersion, 2);
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
