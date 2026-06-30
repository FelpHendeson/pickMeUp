import type { GameState, PartialGameState } from "../types";
import { ensureStateShape } from "../state/normalizeState";
import { migrateSaveData, SaveMigrationError } from "./migrations";

export type ImportedSaveResult =
  | { ok: true; state: GameState }
  | { ok: false; message: string };

export function validateImportedSaveData(data: unknown): ImportedSaveResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "Arquivo invalido: o conteudo nao parece ser um save." };
  }

  const candidate = data as PartialGameState;
  const knownFields = ["schemaVersion", "saveVersion", "resources", "heroes", "formation", "towerFloor"];
  if (!knownFields.some((field) => field in candidate)) {
    return { ok: false, message: "Arquivo invalido: nenhum dado reconhecido de save foi encontrado." };
  }

  try {
    const migrated = migrateSaveData(candidate);
    return { ok: true, state: ensureStateShape(migrated) };
  } catch (error) {
    const detail = error instanceof SaveMigrationError ? error.message : "falha ao migrar o save.";
    return { ok: false, message: `Arquivo invalido: ${detail}` };
  }
}

export function parseImportedSaveText(text: string): ImportedSaveResult {
  try {
    return validateImportedSaveData(JSON.parse(text));
  } catch {
    return { ok: false, message: "JSON invalido ou corrompido." };
  }
}
