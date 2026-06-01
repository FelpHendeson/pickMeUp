import { getTowerChapterByFloor } from "../tower";
import type { GameState, NarrativeState } from "../types";
import { CHAPTER_SCENES, NARRATIVE_SCENES, type NarrativeScene } from "./definitions";

export { CHAPTER_SCENES, NARRATIVE_SCENES, type NarrativeScene } from "./definitions";

function buildChapterSceneId(chapterId: string, moment: "start" | "bossBefore" | "bossAfter"): string {
  return `chapter_${chapterId}_${moment}`;
}

export function getNarrativeScene(sceneId: string): NarrativeScene | null {
  if (NARRATIVE_SCENES[sceneId]) return NARRATIVE_SCENES[sceneId];

  const match = /^chapter_(.+)_(start|bossBefore|bossAfter)$/.exec(sceneId);
  if (!match) return null;

  const chapterId = match[1];
  const moment = match[2] as "start" | "bossBefore" | "bossAfter";
  const scene = CHAPTER_SCENES[chapterId]?.[moment];
  if (!scene) return null;

  return {
    id: sceneId,
    title: scene.title,
    text: scene.text,
  };
}

export function normalizeNarrativeState(state: Pick<GameState, "narrative">): NarrativeState {
  const narrative = state.narrative && typeof state.narrative === "object" ? state.narrative : { seenSceneIds: [], pendingScenes: [] };
  const seen = Array.isArray(narrative.seenSceneIds) ? narrative.seenSceneIds.filter((sceneId): sceneId is string => typeof sceneId === "string") : [];
  const pending = Array.isArray(narrative.pendingScenes) ? narrative.pendingScenes.filter((sceneId): sceneId is string => typeof sceneId === "string") : [];
  const seenSet = new Set(seen.filter((sceneId) => getNarrativeScene(sceneId)));

  state.narrative = {
    seenSceneIds: Array.from(seenSet),
    pendingScenes: pending
      .filter((sceneId, index, list) => getNarrativeScene(sceneId) && !seenSet.has(sceneId) && list.indexOf(sceneId) === index)
      .slice(0, 6),
  };

  return state.narrative;
}

export function hasSeenNarrativeScene(state: Pick<GameState, "narrative">, sceneId: string): boolean {
  normalizeNarrativeState(state);
  return state.narrative.seenSceneIds.includes(sceneId);
}

export function queueNarrativeScene(state: Pick<GameState, "narrative">, sceneId: string): boolean {
  if (!getNarrativeScene(sceneId)) return false;

  normalizeNarrativeState(state);
  if (state.narrative.seenSceneIds.includes(sceneId)) return false;
  if (state.narrative.pendingScenes.includes(sceneId)) return false;

  state.narrative.pendingScenes.push(sceneId);
  return true;
}

export function getPendingNarrativeScene(state: Pick<GameState, "narrative">): NarrativeScene | null {
  normalizeNarrativeState(state);
  const sceneId = state.narrative.pendingScenes.find((id) => getNarrativeScene(id));
  return sceneId ? getNarrativeScene(sceneId) : null;
}

export function markNarrativeSceneSeen(state: Pick<GameState, "narrative">, sceneId: string): { ok: boolean; message: string } {
  normalizeNarrativeState(state);
  state.narrative.pendingScenes = state.narrative.pendingScenes.filter((id) => id !== sceneId);
  if (!state.narrative.seenSceneIds.includes(sceneId)) {
    state.narrative.seenSceneIds.push(sceneId);
  }
  return { ok: true, message: "Cena registrada." };
}

export function skipNarrativeScene(state: Pick<GameState, "narrative">, sceneId: string): { ok: boolean; message: string } {
  return markNarrativeSceneSeen(state, sceneId);
}

export function ensureIntroNarrative(state: Pick<GameState, "narrative">): void {
  queueNarrativeScene(state, "intro");
}

export function queueChapterStartNarrative(state: Pick<GameState, "narrative" | "towerFloor">, floorNumber: number): boolean {
  const chapter = getTowerChapterByFloor(floorNumber);
  if (chapter.startFloor !== floorNumber) return false;
  return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "start"));
}

export function queueBossBeforeNarrative(state: Pick<GameState, "narrative" | "towerFloor">, floorNumber: number): boolean {
  const chapter = getTowerChapterByFloor(floorNumber);
  if (chapter.endFloor !== floorNumber) return false;
  return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "bossBefore"));
}

export function queueBossAfterNarrative(state: Pick<GameState, "narrative" | "towerFloor">, floorNumber: number): boolean {
  const chapter = getTowerChapterByFloor(floorNumber);
  if (chapter.endFloor !== floorNumber) return false;
  return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "bossAfter"));
}

export function queueFirstSevereInjuryNarrative(state: Pick<GameState, "narrative">): boolean {
  return queueNarrativeScene(state, "firstSevereInjury");
}

export function queueFirstCriticalMoraleNarrative(state: Pick<GameState, "narrative">): boolean {
  return queueNarrativeScene(state, "firstCriticalMorale");
}

export function initializeNarrativeForSession(state: GameState): void {
  ensureIntroNarrative(state);
  queueChapterStartNarrative(state, state.towerFloor);
}
