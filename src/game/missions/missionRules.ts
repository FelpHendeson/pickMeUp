import { addConsumable, formatConsumableReward } from "../consumables";
import { addResource } from "../state/resources";
import type { AchievementState, DailyMissionState, GameState, MissionReward } from "../types";
import {
  ACHIEVEMENT_DEFINITIONS,
  DAILY_MISSION_DEFINITIONS,
  TRACKED_MISSION_STATS,
  type AchievementDefinition,
  type DailyMissionDefinition,
  type MissionStatKey,
} from "./definitions";

export type MissionClaimResult = { ok: true; message: string } | { ok: false; message: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDailyMissionState(dateKey = getLocalDateKey()): DailyMissionState {
  return {
    dateKey,
    progress: {},
    claimed: {},
  };
}

export function normalizeMissionStats(state: GameState): Record<string, number> {
  const source = asRecord(state.missionStats);
  state.missionStats = {};

  TRACKED_MISSION_STATS.forEach((statKey) => {
    state.missionStats[statKey] = nonNegativeInteger(source[statKey]);
  });
  state.missionStats.summons = Math.max(state.missionStats.summons, state.heroes.length);

  return state.missionStats;
}

export function normalizeDailyMissions(input: unknown, dateKey = getLocalDateKey()): DailyMissionState {
  const saved = asRecord(input);
  if (saved.dateKey !== dateKey) return createDailyMissionState(dateKey);

  const progress = asRecord(saved.progress);
  const claimed = asRecord(saved.claimed);
  const daily = createDailyMissionState(dateKey);

  DAILY_MISSION_DEFINITIONS.forEach((mission) => {
    daily.progress[mission.statKey] = nonNegativeInteger(progress[mission.statKey]);
    daily.claimed[mission.id] = Boolean(claimed[mission.id]);
  });

  return daily;
}

export function normalizeAchievements(input: unknown): AchievementState {
  const source = asRecord(input);

  return ACHIEVEMENT_DEFINITIONS.reduce<AchievementState>((achievements, achievement) => {
    const saved = asRecord(source[achievement.id]);
    achievements[achievement.id] = { claimed: Boolean(saved.claimed) };
    return achievements;
  }, {});
}

export function normalizeMissionState(state: GameState, dateKey = getLocalDateKey()): GameState {
  normalizeMissionStats(state);
  state.dailyMissions = normalizeDailyMissions(state.dailyMissions, dateKey);
  state.achievements = normalizeAchievements(state.achievements);
  return state;
}

export function getMissionStat(state: GameState, statKey: MissionStatKey): number {
  normalizeMissionStats(state);
  return state.missionStats[statKey] || 0;
}

export function recordMissionProgress(state: GameState, statKey: MissionStatKey, amount: number): void {
  const increment = nonNegativeInteger(amount);
  if (increment <= 0) return;

  normalizeMissionState(state);
  state.missionStats[statKey] = (state.missionStats[statKey] || 0) + increment;
  state.dailyMissions.progress[statKey] = (state.dailyMissions.progress[statKey] || 0) + increment;
}

export function getDailyMissionProgress(state: GameState, mission: DailyMissionDefinition): number {
  normalizeMissionState(state);
  return Math.min(mission.target, state.dailyMissions.progress[mission.statKey] || 0);
}

export function getAchievementProgress(state: GameState, achievement: AchievementDefinition): number {
  normalizeMissionState(state);
  if (achievement.getProgress) {
    return Math.min(achievement.target, nonNegativeInteger(achievement.getProgress(state)));
  }
  return achievement.statKey ? Math.min(achievement.target, getMissionStat(state, achievement.statKey)) : 0;
}

export function isDailyMissionComplete(state: GameState, mission: DailyMissionDefinition): boolean {
  return getDailyMissionProgress(state, mission) >= mission.target;
}

export function isAchievementComplete(state: GameState, achievement: AchievementDefinition): boolean {
  return getAchievementProgress(state, achievement) >= achievement.target;
}

export function getRewardResourceName(resourceKey: string): string {
  if (resourceKey === "gold") return "ouro";
  if (resourceKey === "crystals") return "cristais";
  if (resourceKey === "essence") return "essencia";
  if (resourceKey === "fragments") return "fragmentos";
  if (resourceKey === "echoFragments") return "fragmentos de eco";
  if (resourceKey === "heroContracts") return "contrato(s) de heroi";
  return resourceKey;
}

export function formatMissionReward(reward: MissionReward): string {
  const resources = Object.entries(reward)
    .filter(([resourceKey, value]) => resourceKey !== "consumables" && Number(value) > 0)
    .map(([resourceKey, value]) => `${value} ${getRewardResourceName(resourceKey)}`);
  const consumables = reward.consumables ? formatConsumableReward(reward.consumables) : "";

  return resources.concat(consumables ? [consumables] : []).join(" | ");
}

export function grantMissionReward(state: GameState, reward: MissionReward): void {
  Object.entries(reward).forEach(([resourceKey, value]) => {
    if (resourceKey === "consumables") return;
    if (Number(value) > 0) addResource(state, resourceKey as never, Number(value));
  });

  Object.entries(reward.consumables || {}).forEach(([consumableId, amount]) => {
    if (amount > 0) addConsumable(state, consumableId, amount);
  });
}

export function claimDailyMissionReward(state: GameState, missionId: string): MissionClaimResult {
  normalizeMissionState(state);
  const mission = DAILY_MISSION_DEFINITIONS.find((item) => item.id === missionId);
  if (!mission) return { ok: false, message: "Missao diaria nao encontrada." };
  if (state.dailyMissions.claimed[mission.id]) return { ok: false, message: "Recompensa diaria ja coletada." };
  if (!isDailyMissionComplete(state, mission)) return { ok: false, message: "Missao diaria ainda incompleta." };

  grantMissionReward(state, mission.reward);
  state.dailyMissions.claimed[mission.id] = true;
  return { ok: true, message: `Missao concluida: ${mission.title}. Recompensa: ${formatMissionReward(mission.reward)}.` };
}

export function claimAchievementReward(state: GameState, achievementId: string): MissionClaimResult {
  normalizeMissionState(state);
  const achievement = ACHIEVEMENT_DEFINITIONS.find((item) => item.id === achievementId);
  if (!achievement) return { ok: false, message: "Conquista nao encontrada." };
  if (state.achievements[achievement.id].claimed) return { ok: false, message: "Conquista ja coletada." };
  if (!isAchievementComplete(state, achievement)) return { ok: false, message: "Conquista ainda incompleta." };

  grantMissionReward(state, achievement.reward);
  state.achievements[achievement.id].claimed = true;
  return { ok: true, message: `Conquista desbloqueada: ${achievement.title}. Recompensa: ${formatMissionReward(achievement.reward)}.` };
}

export function getClaimableMissionCount(state: GameState): number {
  normalizeMissionState(state);
  const dailyCount = DAILY_MISSION_DEFINITIONS.filter((mission) => isDailyMissionComplete(state, mission) && !state.dailyMissions.claimed[mission.id]).length;
  const achievementCount = ACHIEVEMENT_DEFINITIONS.filter(
    (achievement) => isAchievementComplete(state, achievement) && !state.achievements[achievement.id].claimed,
  ).length;
  return dailyCount + achievementCount;
}
