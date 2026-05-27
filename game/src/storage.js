(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  function loadGameState() {
    const rawSave = localStorage.getItem(Echoes.CONFIG.saveKey);

    if (!rawSave) {
      return Echoes.createInitialState();
    }

    try {
      const parsed = JSON.parse(rawSave);
      const safeState = Echoes.ensureStateShape(parsed);
      safeState.heroes = safeState.heroes.map((hero) => Echoes.normalizeHero(hero));
      Echoes.normalizeInventory(safeState);
      Echoes.normalizeExpeditions(safeState);
      Echoes.regenerateEnergy(safeState);
      return safeState;
    } catch (error) {
      console.warn("Falha ao carregar save local. Um novo save sera criado.", error);
      return Echoes.createInitialState();
    }
  }

  function saveGameState(state) {
    const safeState = Echoes.ensureStateShape(state);
    safeState.heroes = safeState.heroes.map((hero) => Echoes.normalizeHero(hero));
    Echoes.normalizeInventory(safeState);
    Echoes.normalizeExpeditions(safeState);
    safeState.lastSavedAt = new Date().toISOString();
    localStorage.setItem(Echoes.CONFIG.saveKey, JSON.stringify(safeState));
    return safeState;
  }

  function resetGameState() {
    localStorage.removeItem(Echoes.CONFIG.saveKey);
    return Echoes.createInitialState();
  }

  Echoes.loadGameState = loadGameState;
  Echoes.saveGameState = saveGameState;
  Echoes.resetGameState = resetGameState;
  Echoes.loadGame = loadGameState;
  Echoes.saveGame = saveGameState;
  Echoes.resetGame = resetGameState;
})(window);
