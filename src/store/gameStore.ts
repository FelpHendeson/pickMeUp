"use client";

import { create } from "zustand";
import {
  GAME_CONFIG,
  createInitialState,
  ensureStateShape,
  resolveTowerEventChoice,
  runTowerBattle,
  type GameState,
  type PartialGameState,
  type RunTowerBattleOptions,
  type RunTowerBattleResult,
} from "@/src/game";

type GameStore = {
  state: GameState;
  source: "initial" | "legacy-localstorage" | "manual";
  loadLegacyLocalSave: () => { ok: true; state: GameState } | { ok: false; message: string };
  replaceState: (state: PartialGameState) => void;
  resetLocalState: () => void;
  persistLegacySave: () => void;
  resolveTowerEventChoice: (choiceId: string) => { ok: boolean; message: string; startBattle?: boolean; battleStarted?: boolean };
  startTowerBattle: (options?: RunTowerBattleOptions) => RunTowerBattleResult;
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

function commitState(state: GameState, source: GameStore["source"] = "manual"): GameState {
  const normalized = ensureStateShape(state);
  writeLegacyLocalSave(normalized);
  return normalized;
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
}));
