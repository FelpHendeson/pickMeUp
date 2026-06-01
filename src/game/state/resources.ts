import type { AccountResourceKey, GameState } from "../types";

export function getResourceAmount(state: GameState, resourceKey: AccountResourceKey): number {
  if (resourceKey === "echoFragments") return Number(state.echoFragments || 0);
  if (resourceKey === "heroContracts") return Number(state.heroContracts || 0);
  return Number(state.resources[resourceKey] || 0);
}

export function canSpendResource(state: GameState, resourceKey: AccountResourceKey, amount: number): boolean {
  return getResourceAmount(state, resourceKey) >= amount;
}

export function spendResource(state: GameState, resourceKey: AccountResourceKey, amount: number): boolean {
  if (!canSpendResource(state, resourceKey, amount)) return false;

  if (resourceKey === "echoFragments") {
    state.echoFragments -= amount;
    return true;
  }

  if (resourceKey === "heroContracts") {
    state.heroContracts -= amount;
    return true;
  }

  state.resources[resourceKey] -= amount;
  return true;
}

export function addResource(state: GameState, resourceKey: AccountResourceKey, amount: number): number {
  const nextAmount = getResourceAmount(state, resourceKey) + amount;

  if (resourceKey === "echoFragments") {
    state.echoFragments = Math.max(0, nextAmount);
    return state.echoFragments;
  }

  if (resourceKey === "heroContracts") {
    state.heroContracts = Math.max(0, nextAmount);
    return state.heroContracts;
  }

  if (resourceKey === "energy") {
    state.resources.energy = Math.min(state.resources.maxEnergy, nextAmount);
    return state.resources.energy;
  }

  state.resources[resourceKey] = Math.max(0, nextAmount);
  return state.resources[resourceKey];
}
