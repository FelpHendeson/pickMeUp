import { GAME_CONFIG, type TeamPresetType } from "../config";
import type { TeamPreset, TeamPresets } from "../types";

export function createTeamPreset(type: TeamPresetType, index: number, size: number): TeamPreset {
  const label = type === "tower" ? "Torre" : "Expedicao";

  return {
    id: `${type}_${index + 1}`,
    name: `${label} ${index + 1}`,
    heroIds: Array<string | null>(size).fill(null),
  };
}

export function createTeamPresetList(type: TeamPresetType): TeamPreset[] {
  const count = type === "tower" ? GAME_CONFIG.maxTowerTeamPresets : GAME_CONFIG.maxExpeditionTeamPresets;
  const size = type === "tower" ? GAME_CONFIG.maxFormationSize : GAME_CONFIG.maxExpeditionHeroes;

  return Array.from({ length: count }, (_, index) => createTeamPreset(type, index, size));
}

export function createTeamPresets(): TeamPresets {
  return {
    tower: createTeamPresetList("tower"),
    expedition: createTeamPresetList("expedition"),
  };
}

export function normalizeTeamPresetList(
  type: TeamPresetType,
  savedPresets: unknown,
  validHeroIds: ReadonlySet<string>,
): TeamPreset[] {
  const defaults = createTeamPresetList(type);
  const size = type === "tower" ? GAME_CONFIG.maxFormationSize : GAME_CONFIG.maxExpeditionHeroes;
  const list = Array.isArray(savedPresets) ? savedPresets : [];

  return defaults.map((defaultPreset, index) => {
    const savedPreset = list[index] as Partial<TeamPreset> | undefined;
    const savedHeroIds = Array.isArray(savedPreset?.heroIds) ? savedPreset.heroIds : [];
    const used = new Set<string>();
    const heroIds = Array<string | null>(size).fill(null);

    savedHeroIds.slice(0, size).forEach((heroId, slotIndex) => {
      if (typeof heroId !== "string" || used.has(heroId) || !validHeroIds.has(heroId)) return;
      used.add(heroId);
      heroIds[slotIndex] = heroId;
    });

    return {
      id: defaultPreset.id,
      name: typeof savedPreset?.name === "string" && savedPreset.name.trim() ? savedPreset.name.trim() : defaultPreset.name,
      heroIds,
    };
  });
}

export function normalizeTeamPresets(savedPresets: unknown, validHeroIds: ReadonlySet<string>): TeamPresets {
  const presets = savedPresets && typeof savedPresets === "object" ? (savedPresets as Partial<TeamPresets>) : {};

  return {
    tower: normalizeTeamPresetList("tower", presets.tower, validHeroIds),
    expedition: normalizeTeamPresetList("expedition", presets.expedition, validHeroIds),
  };
}
