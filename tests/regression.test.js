import test from 'node:test';
import assert from 'node:assert/strict';

import { loadGameScript } from './helpers/loadGameScript.js';

function loadEngine() {
  const Echoes = loadGameScript('./game/src/equipment.js');
  loadGameScript('./game/src/expeditions.js');
  loadGameScript('./game/src/tower-events.js');
  return Echoes;
}

function loadRecruitmentEngine() {
  let id = 0;
  const Echoes = loadGameScript('./game/src/state.js', {
    crypto: {
      randomUUID: () => `test-uuid-${id++}`,
    },
  });
  loadGameScript('./game/src/heroes.js');
  loadGameScript('./game/src/recruitment.js');
  return Echoes;
}

function loadConsumableEngine() {
  let id = 0;
  const Echoes = loadGameScript('./game/src/state.js', {
    crypto: {
      randomUUID: () => `test-uuid-${id++}`,
    },
  });
  loadGameScript('./game/src/heroes.js');
  loadGameScript('./game/src/injuries.js');
  loadGameScript('./game/src/formation.js');
  loadGameScript('./game/src/consumables.js');
  return Echoes;
}

function loadAffinityEngine() {
  let id = 0;
  const Echoes = loadGameScript('./game/src/state.js', {
    crypto: {
      randomUUID: () => `test-affinity-${id++}`,
    },
  });
  loadGameScript('./game/src/heroes.js');
  loadGameScript('./game/src/formation.js');
  loadGameScript('./game/src/affinity.js');
  loadGameScript('./game/src/battle.js');
  return Echoes;
}

function loadLibraryEngine() {
  let id = 0;
  const Echoes = loadGameScript('./game/src/state.js', {
    crypto: {
      randomUUID: () => `test-library-${id++}`,
    },
  });
  loadGameScript('./game/src/heroes.js');
  loadGameScript('./game/src/formation.js');
  loadGameScript('./game/src/equipment.js');
  loadGameScript('./game/src/expeditions.js');
  loadGameScript('./game/src/tower.js');
  loadGameScript('./game/src/tower-events.js');
  loadGameScript('./game/src/library.js');
  return Echoes;
}

function loadDifficultyEngine() {
  let id = 0;
  const Echoes = loadGameScript('./game/src/state.js', {
    crypto: {
      randomUUID: () => `test-difficulty-${id++}`,
    },
  });
  loadGameScript('./game/src/heroes.js');
  loadGameScript('./game/src/formation.js');
  loadGameScript('./game/src/difficulty.js');
  loadGameScript('./game/src/tower.js');
  return Echoes;
}

test('grantEquipment recalcula bonusValue quando a raridade e alterada', () => {
  const Echoes = loadEngine();
  const state = { inventory: [], heroes: [] };

  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    Echoes.grantEquipment(state, 10, 1);

    assert.equal(state.inventory.length, 1);
    assert.equal(state.inventory[0].rarity, 1);
    assert.equal(state.inventory[0].bonusValue, 10);
  } finally {
    Math.random = originalRandom;
  }
});

test('getExpeditionRewardMultiplier permite recompensas acima do recomendado', () => {
  const Echoes = loadEngine();

  assert.equal(Echoes.getExpeditionRewardMultiplier(300, 200), 1.5);
});

test('contrato de heroi abre tres escolhas e recruta apenas uma', () => {
  const Echoes = loadRecruitmentEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());

  Echoes.addResource(state, 'heroContracts', 1);

  const opened = Echoes.startContractRecruitment(state);
  assert.equal(opened.ok, true);
  assert.equal(state.heroContracts, 0);
  assert.equal(state.pendingRecruitmentChoice.options.length, 3);

  const selected = state.pendingRecruitmentChoice.options[1];
  const result = Echoes.chooseRecruitmentHero(state, selected.id);

  assert.equal(result.ok, true);
  assert.equal(state.heroes.length, 1);
  assert.equal(state.heroes[0].id, selected.id);
  assert.equal(state.pendingRecruitmentChoice, null);
});

test('consumiveis curam, recuperam moral e reduzem ferimentos sem quantidade negativa', () => {
  const Echoes = loadConsumableEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());
  const hero = Echoes.generateHero({ rarity: 2, classKey: 'warrior' });
  state.heroes.push(hero);

  hero.currentHp = hero.stats.hp - 20;
  hero.morale = 60;
  Echoes.addHeroInjury(hero, 'injuredArm');
  hero.injuries[0].remainingBattles = 1;
  Echoes.addConsumable(state, 'small_healing_potion', 1);
  Echoes.addConsumable(state, 'vigor_potion', 1);
  Echoes.addConsumable(state, 'medical_kit', 1);

  const healed = Echoes.useConsumable(state, 'small_healing_potion', hero.id);
  assert.equal(healed.ok, true);
  assert.equal(state.consumables.small_healing_potion, 0);
  assert.ok(hero.currentHp > hero.stats.hp - 20);

  const morale = Echoes.useConsumable(state, 'vigor_potion', hero.id);
  assert.equal(morale.ok, true);
  assert.equal(hero.morale, 78);

  const kit = Echoes.useConsumable(state, 'medical_kit', hero.id);
  assert.equal(kit.ok, true);
  assert.equal(Echoes.getHeroActiveInjuries(hero).length, 0);

  const missing = Echoes.useConsumable(state, 'medical_kit', hero.id);
  assert.equal(missing.ok, false);
  assert.equal(state.consumables.medical_kit, 0);
});

test('consumiveis de proxima batalha e pedra de retorno aplicam estado esperado', () => {
  const Echoes = loadConsumableEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());

  Echoes.addConsumable(state, 'focus_scroll', 1);
  Echoes.addConsumable(state, 'protection_amulet', 1);
  Echoes.addConsumable(state, 'return_stone', 1);

  assert.equal(Echoes.useConsumable(state, 'focus_scroll').ok, true);
  assert.equal(Echoes.useConsumable(state, 'protection_amulet').ok, true);
  assert.equal(state.towerBattleEffects.length, 2);

  state.pendingTowerEvent = { id: 'event_1', typeKey: 'trap' };
  const returned = Echoes.useConsumable(state, 'return_stone');
  assert.equal(returned.ok, true);
  assert.equal(state.pendingTowerEvent, null);
});

test('afinidade acumula por atividades em dupla e aplica bonus leves', () => {
  const Echoes = loadAffinityEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());
  const heroA = Echoes.generateHero({ rarity: 2, classKey: 'warrior' });
  const heroB = Echoes.generateHero({ rarity: 2, classKey: 'priest' });
  state.heroes.push(heroA, heroB);

  Echoes.recordExpeditionAffinity(state, [heroA.id, heroB.id]);
  Echoes.recordBattleAffinity(
    state,
    [
      { sourceId: heroA.id, hp: 10 },
      { sourceId: heroB.id, hp: 10 },
    ],
    'victory',
    true
  );

  const summary = Echoes.getAffinitySummary(state, heroA.id, heroB.id);
  assert.equal(summary.xp, 5);
  assert.equal(summary.level, 1);

  const team = Echoes.createPlayerTeam([heroA, heroB], state);
  const beforeEnergy = team[0].energy;
  const lines = Echoes.applyAffinityBattleStartBonuses(state, team);
  assert.ok(lines.length > 0);
  assert.ok(team[0].energy > beforeEnergy);
  assert.ok(Echoes.getAffinityXpMultiplier(state, heroA.id, [heroA.id, heroB.id]) > 1);
});

test('biblioteca registra inimigos, eventos e herois descobertos', () => {
  const Echoes = loadLibraryEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());
  const floor = Echoes.getFloorData(1);
  const enemies = Echoes.createEnemiesForFloor(1);

  Echoes.recordEnemyEncounter(state, enemies, 1, floor);
  enemies.forEach((enemy) => {
    enemy.hp = 0;
  });
  Echoes.recordEnemyBattleResult(state, enemies, 'victory', 1);
  Echoes.recordEnemyBattleResult(state, enemies, 'victory', 1);
  Echoes.recordEnemyBattleResult(state, enemies, 'victory', 1);

  const enemyView = Echoes.getLibraryEnemyView(state, enemies[0].enemyKey);
  assert.equal(enemyView.discovered, true);
  assert.equal(enemyView.detailsUnlocked, true);
  assert.ok(enemyView.defeated >= 3);

  Echoes.recordTowerEventDiscovery(state, { typeKey: 'trap' }, { label: 'Tentar desarmar' }, '');
  assert.equal(state.library.events.trap.encountered, 1);

  const hero = Echoes.generateHero({ rarity: 3, classKey: 'mage' });
  state.heroes.push(hero);
  Echoes.recordHeroDiscovery(state, hero);
  assert.equal(state.library.heroes.classes.mage.discovered, true);
  assert.equal(state.library.heroes.rarities['3'].discovered, true);
});

test('dificuldades da torre modificam risco, recompensa e estatisticas', () => {
  const Echoes = loadDifficultyEngine();
  const state = Echoes.ensureStateShape(Echoes.createInitialState());
  const hero = Echoes.generateHero({ rarity: 2, classKey: 'warrior' });
  state.heroes.push(hero);
  state.formation[0] = hero.id;

  const normalReward = Echoes.getFloorReward(5, 'normal');
  const challengeReward = Echoes.getFloorReward(5, 'challenge');
  assert.ok(challengeReward.gold > normalReward.gold);
  assert.ok(challengeReward.equipmentChance > normalReward.equipmentChance);

  const normalEnemy = Echoes.createEnemiesForFloor(5, 'normal')[0];
  const hardcoreEnemy = Echoes.createEnemiesForFloor(5, 'hardcore')[0];
  assert.ok(hardcoreEnemy.stats.hp > normalEnemy.stats.hp);
  assert.ok(hardcoreEnemy.stats.atk > normalEnemy.stats.atk);

  Echoes.recordTowerDifficultyVictory(state, 'challenge');
  assert.equal(state.towerDifficultyStats.victories.challenge, 1);

  Echoes.resolveHardcoreDeaths(
    state,
    [{ side: 'player', sourceId: hero.id, hp: 0 }],
    null,
    { permanentDeathChance: 0 }
  );
  assert.equal(state.heroes.length, 1);

  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    Echoes.resolveHardcoreDeaths(
      state,
      [{ side: 'player', sourceId: hero.id, hp: 0 }],
      null,
      { permanentDeathChance: 1 }
    );
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(state.heroes.length, 0);
  assert.equal(state.formation[0], null);
  assert.equal(state.deadHeroes.length, 1);
  assert.equal(state.towerDifficultyStats.hardcoreDeaths, 1);
});
