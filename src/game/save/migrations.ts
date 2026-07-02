import { GAME_CONFIG } from "../config";
import type { PartialGameState } from "../types";

export const CURRENT_SAVE_SCHEMA_VERSION = 3;

type SaveRecord = Record<string, unknown>;
type SaveMigration = (save: SaveRecord) => SaveRecord;

export class SaveMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveMigrationError";
  }
}

function asSaveRecord(value: unknown): SaveRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SaveMigrationError("O conteudo nao parece ser um save.");
  }
  return { ...(value as SaveRecord) };
}

function readPositiveVersion(value: unknown, fieldName: string, fallback: number): number {
  if (value === undefined) return fallback;
  const version = Number(value);
  if (!Number.isInteger(version) || version <= 0) {
    throw new SaveMigrationError(`${fieldName} ausente ou corrompida.`);
  }
  return version;
}

function readSchemaVersion(value: unknown): number {
  if (value === undefined) return 0;
  const version = Number(value);
  if (!Number.isInteger(version) || version < 0) {
    throw new SaveMigrationError("schemaVersion ausente ou corrompida.");
  }
  return version;
}

const migrations: Record<number, SaveMigration> = {
  0: (save) => ({
    ...save,
    schemaVersion: 1,
    saveVersion: save.saveVersion ?? 1,
  }),
  1: (save) => ({
    ...save,
    schemaVersion: 2,
    initialSummon: save.initialSummon ?? {
      commonRemaining: 5,
      specialAvailable: true,
      specialClaimed: false,
      specialOptions: [],
    },
  }),
  2: (save) => ({
    ...save,
    schemaVersion: 3,
    training: save.training ?? {
      currentFocusByHeroId: {},
      heroProgress: {},
      lastTrainingAt: null,
    },
  }),
};

export function migrateSaveData(data: unknown): PartialGameState {
  let migrated = asSaveRecord(data);
  const saveVersion = readPositiveVersion(migrated.saveVersion, "Versao do save", 1);
  if (saveVersion > GAME_CONFIG.saveVersion) {
    throw new SaveMigrationError(`Save v${saveVersion} requer uma versao mais recente do jogo.`);
  }

  let schemaVersion = readSchemaVersion(migrated.schemaVersion);
  if (schemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    throw new SaveMigrationError(`Schema v${schemaVersion} requer uma versao mais recente do jogo.`);
  }

  while (schemaVersion < CURRENT_SAVE_SCHEMA_VERSION) {
    const migration = migrations[schemaVersion];
    if (!migration) {
      throw new SaveMigrationError(`Nao existe migration para o schema v${schemaVersion}.`);
    }
    migrated = migration(migrated);
    schemaVersion = readSchemaVersion(migrated.schemaVersion);
  }

  return {
    ...migrated,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveVersion: GAME_CONFIG.saveVersion,
  } as PartialGameState;
}
