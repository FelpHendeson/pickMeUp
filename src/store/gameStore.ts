"use client";

import { create } from "zustand";
import { GAME_CONFIG, createInitialState, ensureStateShape, type GameState, type PartialGameState } from "@/src/game";

type GameStore = {
  state: GameState;
  source: "initial" | "legacy-localstorage" | "manual";
  loadLegacyLocalSave: () => { ok: true; state: GameState } | { ok: false; message: string };
  replaceState: (state: PartialGameState) => void;
  resetLocalState: () => void;
};

function readLegacyLocalSave(): unknown {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(GAME_CONFIG.saveKey);
  return raw ? JSON.parse(raw) : null;
}

export const useGameStore = create<GameStore>((set) => ({
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
  replaceState: (state) => set({ state: ensureStateShape(state), source: "manual" }),
  resetLocalState: () => set({ state: createInitialState(), source: "initial" }),
}));
