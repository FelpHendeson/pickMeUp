(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});
  const PREFERENCES_STORAGE_KEY = "ascensao-dos-ecos-preferences-v1";

  const DEFAULT_PREFERENCES = {
    battle: {
      defaultSpeed: "instant",
    },
    visual: {
      reduceAnimations: false,
      compactMode: false,
      showDetailedNumbers: true,
    },
    audio: {
      masterVolume: 80,
      musicVolume: 70,
      effectsVolume: 80,
    },
  };

  let preferences = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSpeed(speed) {
    return ["1x", "2x", "instant"].includes(speed) ? speed : DEFAULT_PREFERENCES.battle.defaultSpeed;
  }

  function normalizeVolume(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function normalizePreferences(rawPreferences) {
    const raw = rawPreferences && typeof rawPreferences === "object" ? rawPreferences : {};
    const battle = raw.battle && typeof raw.battle === "object" ? raw.battle : {};
    const visual = raw.visual && typeof raw.visual === "object" ? raw.visual : {};
    const audio = raw.audio && typeof raw.audio === "object" ? raw.audio : {};

    return {
      battle: {
        defaultSpeed: normalizeSpeed(battle.defaultSpeed),
      },
      visual: {
        reduceAnimations: Boolean(visual.reduceAnimations),
        compactMode: Boolean(visual.compactMode),
        showDetailedNumbers:
          typeof visual.showDetailedNumbers === "boolean"
            ? visual.showDetailedNumbers
            : DEFAULT_PREFERENCES.visual.showDetailedNumbers,
      },
      audio: {
        masterVolume: normalizeVolume(audio.masterVolume, DEFAULT_PREFERENCES.audio.masterVolume),
        musicVolume: normalizeVolume(audio.musicVolume, DEFAULT_PREFERENCES.audio.musicVolume),
        effectsVolume: normalizeVolume(audio.effectsVolume, DEFAULT_PREFERENCES.audio.effectsVolume),
      },
    };
  }

  function readStoredPreferences() {
    if (!global.localStorage) return null;

    try {
      const raw = global.localStorage.getItem(PREFERENCES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Falha ao carregar preferencias locais. Usando padrao.", error);
      return null;
    }
  }

  function getPreferences() {
    if (!preferences) {
      preferences = normalizePreferences(readStoredPreferences());
    }

    return clone(preferences);
  }

  function savePreferences(nextPreferences) {
    preferences = normalizePreferences(nextPreferences);

    if (global.localStorage) {
      global.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    }

    return getPreferences();
  }

  function setNestedPreference(target, path, value) {
    const parts = String(path || "").split(".");
    if (parts.length !== 2 || !target[parts[0]] || !(parts[1] in target[parts[0]])) {
      return false;
    }

    target[parts[0]][parts[1]] = value;
    return true;
  }

  function updatePreference(path, value) {
    const nextPreferences = getPreferences();

    if (!setNestedPreference(nextPreferences, path, value)) {
      return { ok: false, message: "Preferencia invalida." };
    }

    return {
      ok: true,
      preferences: savePreferences(nextPreferences),
      message: "Preferencias salvas.",
    };
  }

  function resetPreferences() {
    return savePreferences(DEFAULT_PREFERENCES);
  }

  function applyPreferences(nextPreferences) {
    const activePreferences = nextPreferences ? normalizePreferences(nextPreferences) : getPreferences();
    const body = global.document && global.document.body;

    if (!body) return activePreferences;

    body.classList.toggle("pref-reduce-motion", activePreferences.visual.reduceAnimations);
    body.classList.toggle("pref-compact", activePreferences.visual.compactMode);
    body.classList.toggle("pref-detailed-numbers", activePreferences.visual.showDetailedNumbers);
    body.dataset.defaultBattleSpeed = activePreferences.battle.defaultSpeed;

    return activePreferences;
  }

  function getDefaultBattleSpeed() {
    return getPreferences().battle.defaultSpeed;
  }

  function shouldShowDetailedNumbers() {
    return getPreferences().visual.showDetailedNumbers;
  }

  function getAudioPreferences() {
    return getPreferences().audio;
  }

  Echoes.PREFERENCES_STORAGE_KEY = PREFERENCES_STORAGE_KEY;
  Echoes.DEFAULT_PREFERENCES = clone(DEFAULT_PREFERENCES);
  Echoes.getPreferences = getPreferences;
  Echoes.savePreferences = savePreferences;
  Echoes.updatePreference = updatePreference;
  Echoes.resetPreferences = resetPreferences;
  Echoes.applyPreferences = applyPreferences;
  Echoes.getDefaultBattleSpeed = getDefaultBattleSpeed;
  Echoes.shouldShowDetailedNumbers = shouldShowDetailedNumbers;
  Echoes.getAudioPreferences = getAudioPreferences;
})(window);
