import type { InitialSummonState } from "../types";

export const STARTER_COMMON_SUMMON_COUNT = 5;
export const INITIAL_SPECIAL_OPTION_COUNT = 3;
export const INITIAL_SPECIAL_PREFERRED_RARITY = 3;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function createInitialSummonState(): InitialSummonState {
  return {
    commonRemaining: STARTER_COMMON_SUMMON_COUNT,
    specialAvailable: true,
    specialClaimed: false,
    specialOptions: [],
  };
}

export function normalizeInitialSummonState(value: unknown): InitialSummonState {
  const source = asRecord(value);
  const defaults = createInitialSummonState();
  const specialClaimed = Boolean(source.specialClaimed);
  const specialOptions = Array.isArray(source.specialOptions)
    ? Array.from(new Set(source.specialOptions.filter((option): option is string => typeof option === "string" && Boolean(option))))
        .slice(0, INITIAL_SPECIAL_OPTION_COUNT)
    : defaults.specialOptions;

  return {
    commonRemaining: Math.min(
      STARTER_COMMON_SUMMON_COUNT,
      Math.max(0, Math.floor(Number(source.commonRemaining ?? defaults.commonRemaining) || 0)),
    ),
    specialAvailable: !specialClaimed && (source.specialAvailable === undefined ? true : Boolean(source.specialAvailable)),
    specialClaimed,
    specialOptions: specialClaimed ? [] : specialOptions,
  };
}
