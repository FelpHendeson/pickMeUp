"use client";

import { create } from "zustand";
import {
  GAME_CONFIG,
  addHeroToFormation,
  applyTowerPresetToFormation,
  chooseHeroSpecialization,
  chooseRecruitmentHero,
  claimAchievementReward,
  claimDailyMissionReward,
  clearChapterCompletion,
  clearTeamPreset,
  collectExpedition,
  createInitialState,
  downloadGameStateExport,
  ensureStateShape,
  equipItem,
  importGameStateFromText,
  initializeNarrativeForSession,
  markNarrativeSceneSeen,
  prepareLoadedGameState,
  queueBossBeforeNarrative,
  regenerateEnergy,
  removeHeroFromFormation,
  resolveTowerEventChoice,
  runTowerBattle,
  saveExpeditionPresetFromFormation,
  saveTowerPresetFromFormation,
  setTeamPresetHero,
  skipNarrativeScene,
  startContractRecruitment,
  startExpedition,
  summonHero,
  treatHeroInjuries,
  unequipItem,
  upgradeRelic,
  useConsumable,
  applyPreferencesToDocument,
  resetPreferences as resetStoredPreferences,
  updatePreference as updateStoredPreference,
  type EquipmentSlot,
  type GameState,
  type PartialGameState,
  type RunTowerBattleOptions,
  type RunTowerBattleResult,
  type SummonType,
  type TeamPresetType,
} from "@/src/game";

type InjuryTreatmentResource = keyof typeof import("@/src/game/hero-status/injuries").INJURY_CONFIG.treatmentCosts;

type ActionResult = { ok: boolean; message: string };

type GameStore = {
  state: GameState;
  source: "initial" | "legacy-localstorage" | "manual" | "cloud-postgres";
  loadLegacyLocalSave: () => { ok: true; state: GameState } | { ok: false; message: string };
  replaceState: (state: PartialGameState) => void;
  resetLocalState: () => void;
  persistLegacySave: () => void;
  refreshSession: () => void;
  continueNarrative: (sceneId: string) => ActionResult;
  skipNarrative: (sceneId: string) => ActionResult;
  clearChapterCompletion: () => ActionResult;
  exportSave: () => ActionResult;
  importSave: (text: string) => ActionResult;
  updatePreference: (path: string, value: unknown) => ReturnType<typeof updateStoredPreference>;
  resetPreferences: () => void;
  applyPreferences: () => void;
  resolveTowerEventChoice: (choiceId: string) => ActionResult & { startBattle?: boolean; battleStarted?: boolean };
  startTowerBattle: (options?: RunTowerBattleOptions) => RunTowerBattleResult;
  startRepeatTowerBattle: (floor: number, options?: Omit<RunTowerBattleOptions, "repeatFloor">) => RunTowerBattleResult;
  addHeroToFormation: (heroId: string) => ActionResult;
  removeHeroFromFormation: (heroId: string) => ActionResult;
  equipItem: (heroId: string, equipmentId: string) => ActionResult;
  unequipItem: (heroId: string, slot: EquipmentSlot) => ActionResult;
  useConsumable: (consumableId: string, heroId?: string | null) => ActionResult;
  startExpedition: (expeditionId: string, heroIds: string[]) => ActionResult;
  collectExpedition: (expeditionId: string) => ActionResult;
  claimDailyMission: (missionId: string) => ActionResult;
  claimAchievement: (achievementId: string) => ActionResult;
  upgradeRelic: (relicId: string) => ActionResult;
  summonHero: (type: SummonType) => ActionResult;
  startContractRecruitment: () => ActionResult;
  chooseRecruitmentHero: (heroId: string) => ActionResult;
  chooseHeroSpecialization: (heroId: string, specializationKey: string) => ActionResult;
  treatHeroInjuries: (heroId: string, resourceKey: InjuryTreatmentResource) => ActionResult;
  saveTowerPresetFromFormation: (presetIndex: number) => ActionResult;
  applyTowerPresetToFormation: (presetIndex: number) => ActionResult;
  saveExpeditionPresetFromFormation: (presetIndex: number) => ActionResult;
  clearTeamPreset: (type: TeamPresetType, presetIndex: number) => ActionResult;
  setTeamPresetHero: (type: TeamPresetType, presetIndex: number, slotIndex: number, heroId: string | null) => ActionResult;
  loadCloudSave: (playerId: string) => Promise<ActionResult>;
  saveCloudSave: (playerId: string) => Promise<ActionResult>;
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

function hydrateLoadedState(raw: PartialGameState): GameState {
  const state = prepareLoadedGameState(raw);
  initializeNarrativeForSession(state);
  return state;
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

      const state = hydrateLoadedState(raw as PartialGameState);
      set({ state, source: "legacy-localstorage" });
      applyPreferencesToDocument();
      return { ok: true, state };
    } catch {
      return { ok: false, message: "Save legado existe, mas nao pode ser lido como JSON valido." };
    }
  },
  replaceState: (state) => {
    const next = commitState(hydrateLoadedState(state));
    set({ state: next, source: "manual" });
  },
  resetLocalState: () => {
    const state = createInitialState();
    writeLegacyLocalSave(state);
    set({ state, source: "initial" });
  },
  persistLegacySave: () => {
    const state = commitState(get().state);
    set({ state, source: "manual" });
  },
  refreshSession: () => {
    const current = get().state;
    regenerateEnergy(current);
    const nextState = commitState(current);
    set({ state: nextState, source: get().source === "initial" ? "initial" : "manual" });
  },
  continueNarrative: (sceneId) => mutateState(get, set, (state) => markNarrativeSceneSeen(state, sceneId)),
  skipNarrative: (sceneId) => mutateState(get, set, (state) => skipNarrativeScene(state, sceneId)),
  clearChapterCompletion: () => mutateState(get, set, (state) => clearChapterCompletion(state)),
  exportSave: () => {
    downloadGameStateExport(get().state);
    return { ok: true, message: "Save exportado para download." };
  },
  importSave: (text) => {
    const parsed = importGameStateFromText(text);
    if (!parsed.ok) return parsed;
    initializeNarrativeForSession(parsed.state);
    const state = commitState(parsed.state);
    set({ state, source: "manual" });
    return { ok: true, message: "Save importado e normalizado." };
  },
  updatePreference: (path, value) => {
    const result = updateStoredPreference(path, value);
    if (result.preferences) applyPreferencesToDocument(result.preferences);
    return result;
  },
  resetPreferences: () => {
    resetStoredPreferences();
    applyPreferencesToDocument();
  },
  applyPreferences: () => {
    applyPreferencesToDocument();
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
    const isRepeat = Number.isInteger(options?.repeatFloor);

    if (!isRepeat && !options?.skipEventRoll) {
      const queued = queueBossBeforeNarrative(current, current.towerFloor);
      if (queued) {
        const nextState = commitState(current);
        set({ state: nextState, source: "manual" });
        return { ok: true, narrative: true, message: "Uma cena apareceu antes do chefe." };
      }
    }

    const result = runTowerBattle(current, options);
    const nextState = commitState(current);
    set({ state: nextState, source: "manual" });
    return result;
  },
  startRepeatTowerBattle: (floor, options) => get().startTowerBattle({ ...options, repeatFloor: floor }),
  addHeroToFormation: (heroId) => mutateState(get, set, (state) => addHeroToFormation(state, heroId)),
  removeHeroFromFormation: (heroId) => mutateState(get, set, (state) => removeHeroFromFormation(state, heroId)),
  equipItem: (heroId, equipmentId) => mutateState(get, set, (state) => equipItem(state, heroId, equipmentId)),
  unequipItem: (heroId, slot) => mutateState(get, set, (state) => unequipItem(state, heroId, slot)),
  useConsumable: (consumableId, heroId) => mutateState(get, set, (state) => useConsumable(state, consumableId, heroId)),
  startExpedition: (expeditionId, heroIds) => mutateState(get, set, (state) => startExpedition(state, expeditionId, heroIds)),
  collectExpedition: (expeditionId) => mutateState(get, set, (state) => collectExpedition(state, expeditionId)),
  claimDailyMission: (missionId) => mutateState(get, set, (state) => claimDailyMissionReward(state, missionId)),
  claimAchievement: (achievementId) => mutateState(get, set, (state) => claimAchievementReward(state, achievementId)),
  upgradeRelic: (relicId) => mutateState(get, set, (state) => upgradeRelic(state, relicId)),
  summonHero: (type) => mutateState(get, set, (state) => summonHero(state, type)),
  startContractRecruitment: () => mutateState(get, set, (state) => startContractRecruitment(state)),
  chooseRecruitmentHero: (heroId) => mutateState(get, set, (state) => chooseRecruitmentHero(state, heroId)),
  chooseHeroSpecialization: (heroId, specializationKey) =>
    mutateState(get, set, (state) => chooseHeroSpecialization(state, heroId, specializationKey)),
  treatHeroInjuries: (heroId, resourceKey) => mutateState(get, set, (state) => treatHeroInjuries(state, heroId, resourceKey)),
  saveTowerPresetFromFormation: (presetIndex) => mutateState(get, set, (state) => saveTowerPresetFromFormation(state, presetIndex)),
  applyTowerPresetToFormation: (presetIndex) => mutateState(get, set, (state) => applyTowerPresetToFormation(state, presetIndex)),
  saveExpeditionPresetFromFormation: (presetIndex) =>
    mutateState(get, set, (state) => saveExpeditionPresetFromFormation(state, presetIndex)),
  clearTeamPreset: (type, presetIndex) => mutateState(get, set, (state) => clearTeamPreset(state, type, presetIndex)),
  setTeamPresetHero: (type, presetIndex, slotIndex, heroId) =>
    mutateState(get, set, (state) => setTeamPresetHero(state, type, presetIndex, slotIndex, heroId)),
  loadCloudSave: async (playerId) => {
    try {
      const response = await fetch(`/api/saves/${encodeURIComponent(playerId)}`);
      if (response.status === 404) return { ok: false, message: "Nenhum save encontrado no PostgreSQL para este jogador." };
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return { ok: false, message: body?.message || "Falha ao carregar save da nuvem." };
      }

      const body = (await response.json()) as { payload?: PartialGameState };
      if (!body.payload) return { ok: false, message: "Resposta da nuvem sem payload valido." };

      const state = commitState(hydrateLoadedState(body.payload));
      set({ state, source: "cloud-postgres" });
      applyPreferencesToDocument();
      return { ok: true, message: "Save carregado do PostgreSQL e sincronizado com o navegador." };
    } catch {
      return { ok: false, message: "Nao foi possivel conectar a API de save." };
    }
  },
  saveCloudSave: async (playerId) => {
    try {
      const state = commitState(get().state);
      set({ state, source: "manual" });

      const response = await fetch(`/api/saves/${encodeURIComponent(playerId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: state }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return { ok: false, message: body?.message || "Falha ao salvar na nuvem." };
      }

      set({ state, source: "cloud-postgres" });
      return { ok: true, message: "Save enviado para o PostgreSQL." };
    } catch {
      return { ok: false, message: "Nao foi possivel conectar a API de save." };
    }
  },
}));
