import type { GameState } from "../types";

export function clearChapterCompletion(state: GameState): { ok: true; message: string } {
  state.lastChapterCompletion = null;
  return { ok: true, message: "Campanha atualizada." };
}

export function hasChapterCompletion(state: Pick<GameState, "lastChapterCompletion">): boolean {
  const completion = state.lastChapterCompletion;
  return Boolean(completion && typeof completion === "object" && "chapterName" in completion && completion.chapterName);
}
