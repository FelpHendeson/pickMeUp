import type { GameState } from "../types";

export function getAccountXpForNextLevel(level: number): number {
  return Math.floor(120 * level * 1.2);
}

export function addAccountXp(state: GameState, xpAmount: number): void {
  state.accountXp += Math.max(0, Math.floor(xpAmount));

  while (state.accountXp >= getAccountXpForNextLevel(state.accountLevel)) {
    state.accountXp -= getAccountXpForNextLevel(state.accountLevel);
    state.accountLevel += 1;
  }
}
