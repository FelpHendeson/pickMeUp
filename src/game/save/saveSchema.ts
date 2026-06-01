import type { GameState, PartialGameState } from "../types";
import { ensureStateShape } from "../state/normalizeState";

export type ImportedSaveResult =
  | { ok: true; state: GameState }
  | { ok: false; message: string };

export function validateImportedSaveData(data: unknown): ImportedSaveResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "Arquivo invalido: o conteudo nao parece ser um save." };
  }

  const candidate = data as PartialGameState;
  const version = candidate.saveVersion === undefined ? 1 : Number(candidate.saveVersion);
  if (!Number.isInteger(version) || version <= 0) {
    return { ok: false, message: "Arquivo invalido: versao do save ausente ou corrompida." };
  }

  if (!candidate.resources || typeof candidate.resources !== "object") {
    return { ok: false, message: "Arquivo invalido: recursos do save ausentes." };
  }

  if (!Array.isArray(candidate.heroes) || !Array.isArray(candidate.formation)) {
    return { ok: false, message: "Arquivo invalido: herois ou formacao ausentes." };
  }

  if (!Number.isFinite(Number(candidate.towerFloor))) {
    return { ok: false, message: "Arquivo invalido: progresso da torre ausente." };
  }

  return { ok: true, state: ensureStateShape(candidate) };
}

export function parseImportedSaveText(text: string): ImportedSaveResult {
  try {
    return validateImportedSaveData(JSON.parse(text));
  } catch {
    return { ok: false, message: "JSON invalido ou corrompido." };
  }
}
