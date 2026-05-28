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
