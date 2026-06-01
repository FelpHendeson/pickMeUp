import type { BattleEvent, BattleResult } from "../types";
import { getBattleEvents } from "./autoBattle";
import type { BattleSpeed } from "../preferences";

export function getBattlePlaybackId(battle: Pick<BattleResult, "floor" | "rounds" | "result" | "log"> & { id?: string }): string {
  return battle.id || `${battle.floor}_${battle.rounds}_${battle.result}_${(battle.log || []).length}`;
}

export function createBattlePlaybackState(
  battle: Pick<BattleResult, "events" | "log" | "playerTeam" | "enemyTeam" | "floor" | "rounds" | "result"> & { id?: string },
  speed: BattleSpeed,
  previousPlaybackId?: string | null,
  previousCursor = 0,
): { playbackId: string; eventCursor: number; events: BattleEvent[]; visibleEvents: BattleEvent[] } {
  const events = getBattleEvents(battle);
  const playbackId = getBattlePlaybackId(battle);
  let eventCursor = previousPlaybackId === playbackId ? previousCursor : speed === "instant" ? events.length : 1;

  if (speed === "instant") {
    eventCursor = events.length;
  }

  eventCursor = Math.max(1, Math.min(eventCursor, events.length || 1));

  return {
    playbackId,
    eventCursor,
    events,
    visibleEvents: events.slice(0, eventCursor),
  };
}

export function getCurrentBattleSnapshot(
  battle: Pick<BattleResult, "playerTeam" | "enemyTeam">,
  visibleEvents: BattleEvent[],
): { playerTeam: BattleResult["playerTeam"]; enemyTeam: BattleResult["enemyTeam"] } {
  const currentEvent = visibleEvents[visibleEvents.length - 1];
  return {
    playerTeam: currentEvent?.playerTeam || battle.playerTeam || [],
    enemyTeam: currentEvent?.enemyTeam || battle.enemyTeam || [],
  };
}

export function advanceBattlePlayback(eventCursor: number, eventsLength: number, speed: BattleSpeed): number {
  if (speed === "instant") return eventsLength;
  return Math.min(eventsLength, eventCursor + 1);
}

export function setBattlePlaybackSpeed(previousSpeed: BattleSpeed, nextSpeed: BattleSpeed, currentCursor: number): number {
  if (previousSpeed === "instant" && nextSpeed !== "instant") return 1;
  return currentCursor;
}
