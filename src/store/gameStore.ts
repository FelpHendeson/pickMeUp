"use client";

import { create } from "zustand";
import {
  GAME_CONFIG,
  addHeroToFormation,
  createInitialState,
  ensureStateShape,
  equipItem,
  removeHeroFromFormation,
  resolveTowerEventChoice,
  runTowerBattle,
  unequipItem,
  useConsumable,
  type EquipmentSlot,
  type GameState,
  type PartialGameState,
  type RunTowerBattleOptions,
  type RunTowerBattleResult,
} from "@/src/game";

type ActionResult = { ok: boolean; message: string };

type GameStore = {
  state: GameState;
  source: "initial" | "legacy-localstorage" | "manual";
  loadLegacyLocalSave: () => { ok: true; state: GameState } | { ok: false; message: string };
  replaceState: (state: PartialGameState) => void;
  resetLocalState: () => void;
  persistLegacySave: () => void;
  resolveTowerEventChoice: (choiceId: string) => ActionResult & { startBattle?: boolean; battleStarted?: boolean };
  startTowerBattle: (options?: RunTowerBattleOptions) => RunTowerBattleResult;
  addHeroToFormation: (heroId: string) => ActionResult;
  removeHeroFromFormation: (heroId: string) => ActionResult;
  equipItem: (heroId: string, equipmentId: string) => ActionResult;
  unequipItem: (heroId: string, slot: EquipmentSlot) => ActionResult;
  useConsumable: (consumableId: string, heroId?: string | null) => ActionResult;
};

function readLegacyLocalSave(): unknown {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(GAME_CONFIG.saveKey);
  return raw ? JSON.parse(raw) : null;
}

function writeLegacyLocalSave(state: GameState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    GAME_CONFIG.saveKey,
    JSON.stringify({
      ...state,
      lastSavedAt: new Date().toISOString(),
    }),
  );
}

function commitState(state: GameState): GameState {
  const normalized = ensureStateShape(state);
  writeLegacyLocalSave(normalized);
  return normalized;
}

function mutateState<T extends ActionResult>(
  get: () => GameStore,
  set: (partial: Pick<GameStore, "state" | "source">) => void,
  action: (state: GameState) => T,
): T {
  const current = get().state;
  const result = action(current);
  if (result.ok) {
    const nextState = commitState(current);
    set({ state: nextState, source: "manual" });
  }
  return result;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  source: "initial",
  loadLegacyLocalSave: () => {
    try {
      const raw = readLegacyLocalSave();
      if (!raw) return { ok: false, message: "Nenhum save legado encontrado neste navegador." };

      const state = ensureStateShape(raw as PartialGameState);
      set({ state, source: "legacy-localstorage" });
      return { ok: true, state };
    } catch {
      return { ok: false, message: "Save legado existe, mas nao pode ser lido como JSON valido." };
    }
  },
  replaceState: (state) => set({ state: commitState(ensureStateShape(state)), source: "manual" }),
  resetLocalState: () => {
    const state = createInitialState();
    writeLegacyLocalSave(state);
    set({ state, source: "initial" });
  },
  persistLegacySave: () => {
    const state = commitState(get().state);
    set({ state, source: "manual" });
  },
  resolveTowerEventChoice: (choiceId) => {
    const current = get().state;
    const result = resolveTowerEventChoice(current, choiceId);
    if (!result.ok) return result;

    let nextState = commitState(current);
    set({ state: nextState, source: "manual" });

    if (result.startBattle) {
      const battleResult = runTowerBattle(nextState, {
        skipEventRoll: true,
        difficultyMode: nextState.pendingTowerDifficultyMode || "normal",
      });
      nextState = commitState(nextState);
      set({ state: nextState, source: "manual" });
      return {
        ok: true,
        message: `${result.message} ${battleResult.ok && "battle" in battleResult ? (battleResult.battle.result === "victory" ? "Combate vencido." : "Combate perdido.") : "event" in battleResult && battleResult.event ? battleResult.message : !battleResult.ok ? battleResult.message : "Combate concluido."}`,
        startBattle: true,
        battleStarted: true,
      };
    }

    return result;
  },
  startTowerBattle: (options) => {
    const current = get().state;
    const result = runTowerBattle(current, options);
    const nextState = commitState(current);
    set({ state: nextState, source: "manual" });
    return result;
  },
  addHeroToFormation: (heroId) => mutateState(get, set, (state) => addHeroToFormation(state, heroId)),
  removeHeroFromFormation: (heroId) => mutateState(get, set, (state) => removeHeroFromFormation(state, heroId)),
  equipItem: (heroId, equipmentId) => mutateState(get, set, (state) => equipItem(state, heroId, equipmentId)),
  unequipItem: (heroId, slot) => mutateState(get, set, (state) => unequipItem(state, heroId, slot)),
  useConsumable: (consumableId, heroId) => mutateState(get, set, (state) => useConsumable(state, consumableId, heroId)),
}));
