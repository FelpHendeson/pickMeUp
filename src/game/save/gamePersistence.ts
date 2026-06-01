import { GAME_CONFIG } from "../config";
import { regenerateEnergy } from "../state/energy";
import { ensureStateShape } from "../state/normalizeState";
import type { GameState, PartialGameState } from "../types";
import { parseImportedSaveText, validateImportedSaveData } from "./saveSchema";

export const EXPORT_FILE_NAME = "ascensao-dos-ecos-save.json";

export function normalizeGameState(state: PartialGameState, now = Date.now()): GameState {
  return ensureStateShape(state, now);
}

export function prepareLoadedGameState(state: PartialGameState, now = Date.now()): GameState {
  const normalized = normalizeGameState(state, now);
  regenerateEnergy(normalized, now);
  return normalized;
}

export function serializeGameStateForExport(state: GameState): string {
  const normalized = normalizeGameState(state);
  return JSON.stringify(
    {
      ...normalized,
      lastSavedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function createExportBlob(state: GameState): Blob {
  return new Blob([serializeGameStateForExport(state)], { type: "application/json" });
}

export function downloadGameStateExport(state: GameState, fileName = EXPORT_FILE_NAME): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(createExportBlob(state));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { parseImportedSaveText, validateImportedSaveData };

export function importGameStateFromText(text: string, now = Date.now()) {
  const parsed = parseImportedSaveText(text);
  if (!parsed.ok) return parsed;
  return { ok: true as const, state: prepareLoadedGameState(parsed.state, now) };
}

export function isSaveVersionSupported(version: unknown): boolean {
  const numeric = Number(version);
  return Number.isInteger(numeric) && numeric > 0 && numeric <= GAME_CONFIG.saveVersion;
}
