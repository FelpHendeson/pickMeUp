(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});
  const EXPORT_FILE_NAME = "ascensao-dos-ecos-save.json";

  function normalizeGameState(state) {
    const safeState = Echoes.ensureStateShape(state);
    safeState.heroes = safeState.heroes.map((hero) => Echoes.normalizeHero(hero));
    Echoes.normalizeInventory(safeState);
    Echoes.normalizeExpeditions(safeState);
    if (Echoes.normalizeMissionState) {
      Echoes.normalizeMissionState(safeState);
    }
    if (Echoes.normalizeRelicState) {
      Echoes.normalizeRelicState(safeState);
    }
    return safeState;
  }

  function loadGameState() {
    const rawSave = localStorage.getItem(Echoes.CONFIG.saveKey);

    if (!rawSave) {
      return Echoes.createInitialState();
    }

    try {
      const parsed = JSON.parse(rawSave);
      const safeState = normalizeGameState(parsed);
      Echoes.regenerateEnergy(safeState);
      return safeState;
    } catch (error) {
      console.warn("Falha ao carregar save local. Um novo save sera criado.", error);
      return Echoes.createInitialState();
    }
  }

  function saveGameState(state) {
    const safeState = normalizeGameState(state);
    safeState.lastSavedAt = new Date().toISOString();
    localStorage.setItem(Echoes.CONFIG.saveKey, JSON.stringify(safeState));
    return safeState;
  }

  function resetGameState() {
    localStorage.removeItem(Echoes.CONFIG.saveKey);
    return Echoes.createInitialState();
  }

  function validateImportedSaveData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, message: "Arquivo invalido: o conteudo nao parece ser um save." };
    }

    const version = data.saveVersion === undefined ? 1 : Number(data.saveVersion);
    if (!Number.isInteger(version) || version <= 0) {
      return { ok: false, message: "Arquivo invalido: versao do save ausente ou corrompida." };
    }

    if (version > Echoes.CONFIG.saveVersion) {
      return {
        ok: false,
        message: `Versao incompatavel: save v${version}, jogo suporta ate v${Echoes.CONFIG.saveVersion}.`,
      };
    }

    if (!data.resources || typeof data.resources !== "object") {
      return { ok: false, message: "Arquivo invalido: recursos do save ausentes." };
    }

    if (!Array.isArray(data.heroes) || !Array.isArray(data.formation)) {
      return { ok: false, message: "Arquivo invalido: herois ou formacao ausentes." };
    }

    if (!Number.isFinite(Number(data.towerFloor))) {
      return { ok: false, message: "Arquivo invalido: progresso da torre ausente." };
    }

    return { ok: true, state: normalizeGameState(data) };
  }

  function parseImportedSaveText(text) {
    try {
      return validateImportedSaveData(JSON.parse(text));
    } catch (error) {
      return { ok: false, message: "JSON invalido ou corrompido." };
    }
  }

  Echoes.EXPORT_FILE_NAME = EXPORT_FILE_NAME;
  Echoes.normalizeGameState = normalizeGameState;
  Echoes.validateImportedSaveData = validateImportedSaveData;
  Echoes.parseImportedSaveText = parseImportedSaveText;
  Echoes.loadGameState = loadGameState;
  Echoes.saveGameState = saveGameState;
  Echoes.resetGameState = resetGameState;
  Echoes.loadGame = loadGameState;
  Echoes.saveGame = saveGameState;
  Echoes.resetGame = resetGameState;
})(window);
