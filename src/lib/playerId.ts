export const PLAYER_ID_STORAGE_KEY = "ascensao-dos-ecos-player-id";

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "server-player";

  const existing = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, generated);
  return generated;
}
