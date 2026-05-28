import test from 'node:test';
import assert from 'node:assert/strict';

import { loadGameScript } from './helpers/loadGameScript.js';

function loadEngine() {
  const Echoes = loadGameScript('./game/src/equipment.js');
  loadGameScript('./game/src/expeditions.js');
  loadGameScript('./game/src/tower-events.js');
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
