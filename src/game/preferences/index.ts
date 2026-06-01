export const PREFERENCES_STORAGE_KEY = "ascensao-dos-ecos-preferences-v1";

export type BattleSpeed = "1x" | "2x" | "instant";

export type GamePreferences = {
  battle: {
    defaultSpeed: BattleSpeed;
  };
  visual: {
    reduceAnimations: boolean;
    compactMode: boolean;
    showDetailedNumbers: boolean;
  };
  audio: {
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
  };
};

export const DEFAULT_PREFERENCES: GamePreferences = {
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

function clonePreferences(preferences: GamePreferences): GamePreferences {
  return JSON.parse(JSON.stringify(preferences)) as GamePreferences;
}

function normalizeSpeed(speed: unknown): BattleSpeed {
  return speed === "1x" || speed === "2x" || speed === "instant" ? speed : DEFAULT_PREFERENCES.battle.defaultSpeed;
}

function normalizeVolume(value: unknown, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function normalizePreferences(rawPreferences: unknown): GamePreferences {
  const raw = rawPreferences && typeof rawPreferences === "object" ? (rawPreferences as Partial<GamePreferences>) : {};
  const battle = raw.battle && typeof raw.battle === "object" ? (raw.battle as Partial<GamePreferences["battle"]>) : {};
  const visual = raw.visual && typeof raw.visual === "object" ? (raw.visual as Partial<GamePreferences["visual"]>) : {};
  const audio = raw.audio && typeof raw.audio === "object" ? (raw.audio as Partial<GamePreferences["audio"]>) : {};

  return {
    battle: {
      defaultSpeed: normalizeSpeed(battle.defaultSpeed),
    },
    visual: {
      reduceAnimations: Boolean(visual.reduceAnimations),
      compactMode: Boolean(visual.compactMode),
      showDetailedNumbers:
        typeof visual.showDetailedNumbers === "boolean" ? visual.showDetailedNumbers : DEFAULT_PREFERENCES.visual.showDetailedNumbers,
    },
    audio: {
      masterVolume: normalizeVolume(audio.masterVolume, DEFAULT_PREFERENCES.audio.masterVolume),
      musicVolume: normalizeVolume(audio.musicVolume, DEFAULT_PREFERENCES.audio.musicVolume),
      effectsVolume: normalizeVolume(audio.effectsVolume, DEFAULT_PREFERENCES.audio.effectsVolume),
    },
  };
}

function readStoredPreferences(): unknown {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getPreferences(): GamePreferences {
  return normalizePreferences(readStoredPreferences());
}

export function savePreferences(nextPreferences: GamePreferences): GamePreferences {
  const normalized = normalizePreferences(nextPreferences);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  }
  return clonePreferences(normalized);
}

function setNestedPreference(target: GamePreferences, path: string, value: unknown): boolean {
  const parts = path.split(".");
  if (parts.length !== 2) return false;
  const group = parts[0] as keyof GamePreferences;
  const key = parts[1];
  const section = target[group];
  if (!section || typeof section !== "object" || !(key in section)) return false;
  (section as Record<string, unknown>)[key] = value;
  return true;
}

export function updatePreference(path: string, value: unknown): { ok: boolean; message: string; preferences?: GamePreferences } {
  const nextPreferences = getPreferences();
  if (!setNestedPreference(nextPreferences, path, value)) {
    return { ok: false, message: "Preferencia invalida." };
  }
  return { ok: true, message: "Preferencias salvas.", preferences: savePreferences(nextPreferences) };
}

export function resetPreferences(): GamePreferences {
  return savePreferences(DEFAULT_PREFERENCES);
}

export function applyPreferencesToDocument(preferences = getPreferences()): GamePreferences {
  if (typeof document === "undefined") return preferences;
  document.body.classList.toggle("pref-reduce-motion", preferences.visual.reduceAnimations);
  document.body.classList.toggle("pref-compact", preferences.visual.compactMode);
  document.body.classList.toggle("pref-detailed-numbers", preferences.visual.showDetailedNumbers);
  document.body.dataset.defaultBattleSpeed = preferences.battle.defaultSpeed;
  return preferences;
}

export function getDefaultBattleSpeed(): BattleSpeed {
  return getPreferences().battle.defaultSpeed;
}

export function shouldShowDetailedNumbers(): boolean {
  return getPreferences().visual.showDetailedNumbers;
}

export function getAudioPreferences(): GamePreferences["audio"] {
  return getPreferences().audio;
}

export function getBattlePlaybackDelay(speed: BattleSpeed): number {
  if (speed === "2x") return 320;
  if (speed === "1x") return 700;
  return 0;
}
