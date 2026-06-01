import { GAME_CONFIG } from "../config";
import type { GameState } from "../types";

export function regenerateEnergy(state: GameState, now = Date.now()): number {
  const maxEnergy = state.resources.maxEnergy || GAME_CONFIG.maxEnergy;
  const currentEnergy = state.resources.energy;

  if (currentEnergy >= maxEnergy) {
    state.resources.energy = maxEnergy;
    state.lastEnergyAt = now;
    return 0;
  }

  const elapsed = now - state.lastEnergyAt;
  const gained = Math.floor(elapsed / GAME_CONFIG.energyRegenMs);
  if (gained <= 0) return 0;

  state.resources.energy = Math.min(maxEnergy, currentEnergy + gained);
  state.lastEnergyAt += gained * GAME_CONFIG.energyRegenMs;

  if (state.resources.energy >= maxEnergy) {
    state.lastEnergyAt = now;
  }

  return gained;
}

export function getEnergyRegenProgress(state: GameState, now = Date.now()): { gainedNext: number; msRemaining: number } {
  const maxEnergy = state.resources.maxEnergy || GAME_CONFIG.maxEnergy;
  if (state.resources.energy >= maxEnergy) return { gainedNext: 0, msRemaining: 0 };

  const elapsed = now - state.lastEnergyAt;
  const msIntoCycle = elapsed % GAME_CONFIG.energyRegenMs;
  return {
    gainedNext: 1,
    msRemaining: GAME_CONFIG.energyRegenMs - msIntoCycle,
  };
}
