import { GAME_CONFIG } from "../config";
import { addHeroXp, getHeroPower } from "../heroes";
import { addResource } from "../state/resources";
import type { ActiveExpedition, ExpeditionReward, ExpeditionRewardType, GameState, Hero } from "../types";
import { EXPEDITION_DEFINITIONS, type ExpeditionDefinition } from "./definitions";

export type ExpeditionResult =
  | { ok: true; expedition: ActiveExpedition; message: string }
  | { ok: false; message: string };

export type CollectExpeditionResult =
  | { ok: true; reward: ExpeditionReward; message: string }
  | { ok: false; message: string };

function createExpeditionId(expeditionId: string): string {
  return `exp_${expeditionId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function findHero(state: GameState, heroId: string): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

export function getExpeditionDefinition(expeditionId: string): ExpeditionDefinition | null {
  return EXPEDITION_DEFINITIONS.find((expedition) => expedition.id === expeditionId) ?? null;
}

export function getExpeditionPower(state: Pick<GameState, "heroes">, heroIds: string[]): number {
  return heroIds.reduce((total, heroId) => {
    const hero = state.heroes.find((entry) => entry.id === heroId);
    return total + (hero ? getHeroPower(hero) : 0);
  }, 0);
}

export function getExpeditionRewardMultiplier(power: number, recommendedPower: number): number {
  if (recommendedPower <= 0) return 1;
  return Math.max(0.5, power / recommendedPower);
}

export function getExpeditionRewardPreview(
  state: Pick<GameState, "heroes">,
  definition: ExpeditionDefinition,
  heroIds: string[],
): ExpeditionReward {
  const power = getExpeditionPower(state, heroIds);
  const multiplier = getExpeditionRewardMultiplier(power, definition.recommendedPower);

  return {
    power,
    multiplier,
    type: definition.reward.type,
    amount: Math.max(1, Math.floor(definition.reward.amount * multiplier)),
    baseAmount: definition.reward.amount,
  };
}

export function normalizeExpeditions(state: GameState, now = Date.now()): ActiveExpedition[] {
  const validHeroIds = new Set(state.heroes.map((hero) => hero.id));
  const validExpeditionIds = new Set(EXPEDITION_DEFINITIONS.map((expedition) => expedition.id));

  state.activeExpeditions = Array.isArray(state.activeExpeditions)
    ? state.activeExpeditions
        .filter((expedition) => expedition && validExpeditionIds.has((expedition as ActiveExpedition).expeditionId))
        .map((expedition) => {
          const raw = asRecord(expedition);
          const expeditionId = String(raw.expeditionId || "");
          const definition = getExpeditionDefinition(expeditionId);
          const heroIds = Array.isArray(raw.heroIds)
            ? raw.heroIds
                .filter((heroId, index, list): heroId is string => typeof heroId === "string" && validHeroIds.has(heroId) && list.indexOf(heroId) === index)
                .slice(0, GAME_CONFIG.maxExpeditionHeroes)
            : [];
          const startedAt = finiteNumber(raw.startedAt, now);
          const endsAt = finiteNumber(raw.endsAt, startedAt + (definition?.durationMs || 0));
          const preview = definition ? getExpeditionRewardPreview(state, definition, heroIds) : null;
          const savedReward = asRecord(raw.reward);
          const reward: ExpeditionReward = {
            power: finiteNumber(savedReward.power, preview?.power || 0),
            multiplier: finiteNumber(savedReward.multiplier, preview?.multiplier || 1),
            type: savedReward.type === definition?.reward.type ? (savedReward.type as ExpeditionRewardType) : preview?.type || "gold",
            amount: Math.max(1, Math.floor(finiteNumber(savedReward.amount, preview?.amount || 1))),
            baseAmount: Math.max(1, Math.floor(finiteNumber(savedReward.baseAmount, preview?.baseAmount || 1))),
          };

          return {
            id: typeof raw.id === "string" && raw.id ? raw.id : createExpeditionId(expeditionId),
            expeditionId,
            heroIds,
            startedAt,
            endsAt,
            reward,
          };
        })
        .filter((expedition) => expedition.heroIds.length > 0)
    : [];

  return state.activeExpeditions;
}

export function getActiveExpedition(state: Pick<GameState, "activeExpeditions">, expeditionId: string): ActiveExpedition | null {
  return state.activeExpeditions.find((expedition) => expedition.expeditionId === expeditionId) ?? null;
}

export function isHeroOnExpedition(state: Pick<GameState, "activeExpeditions">, heroId: string): boolean {
  return state.activeExpeditions.some((expedition) => expedition.heroIds.includes(heroId));
}

export function getHeroExpedition(state: Pick<GameState, "activeExpeditions">, heroId: string): ExpeditionDefinition | null {
  const active = state.activeExpeditions.find((expedition) => expedition.heroIds.includes(heroId));
  return active ? getExpeditionDefinition(active.expeditionId) : null;
}

export function getActiveExpeditionReward(state: Pick<GameState, "heroes">, activeExpedition: ActiveExpedition): ExpeditionReward | null {
  const definition = getExpeditionDefinition(activeExpedition.expeditionId);
  if (!definition) return null;
  if (activeExpedition.reward?.type === definition.reward.type) return activeExpedition.reward;
  return getExpeditionRewardPreview(state, definition, activeExpedition.heroIds);
}

export function getExpeditionDurationMs(definition: ExpeditionDefinition, durationMultiplier = 1): number {
  return Math.max(30 * 1000, Math.round(definition.durationMs * durationMultiplier));
}

export function getExpeditionRemainingMs(activeExpedition: ActiveExpedition, now = Date.now()): number {
  return Math.max(0, activeExpedition.endsAt - now);
}

export function isExpeditionComplete(activeExpedition: ActiveExpedition, now = Date.now()): boolean {
  return getExpeditionRemainingMs(activeExpedition, now) <= 0;
}

export function startExpedition(state: GameState, expeditionId: string, heroIds: string[], now = Date.now(), durationMultiplier = 1): ExpeditionResult {
  const definition = getExpeditionDefinition(expeditionId);
  if (!definition) return { ok: false, message: "Expedicao nao encontrada." };
  if (getActiveExpedition(state, expeditionId)) return { ok: false, message: "Essa expedicao ja esta em andamento." };
  if (!Array.isArray(heroIds) || heroIds.length === 0) return { ok: false, message: "Selecione ao menos 1 heroi." };
  if (heroIds.length > GAME_CONFIG.maxExpeditionHeroes) return { ok: false, message: `Envie no maximo ${GAME_CONFIG.maxExpeditionHeroes} herois.` };

  const uniqueHeroIds = Array.from(new Set(heroIds));
  if (uniqueHeroIds.length !== heroIds.length) return { ok: false, message: "Ha herois duplicados na expedicao." };
  if (uniqueHeroIds.some((heroId) => !findHero(state, heroId))) return { ok: false, message: "Heroi invalido selecionado." };
  if (uniqueHeroIds.some((heroId) => isHeroOnExpedition(state, heroId))) return { ok: false, message: "Um dos herois selecionados ja esta em expedicao." };

  const durationMs = getExpeditionDurationMs(definition, durationMultiplier);
  const expedition: ActiveExpedition = {
    id: createExpeditionId(expeditionId),
    expeditionId,
    heroIds: uniqueHeroIds,
    startedAt: now,
    endsAt: now + durationMs,
    reward: getExpeditionRewardPreview(state, definition, uniqueHeroIds),
  };

  state.activeExpeditions.push(expedition);
  return { ok: true, expedition, message: `${definition.name} iniciada com ${uniqueHeroIds.length} heroi(s).` };
}

export function collectExpedition(state: GameState, expeditionId: string, now = Date.now()): CollectExpeditionResult {
  const activeExpedition = getActiveExpedition(state, expeditionId);
  const definition = getExpeditionDefinition(expeditionId);
  if (!activeExpedition || !definition) return { ok: false, message: "Expedicao nao encontrada." };
  if (!isExpeditionComplete(activeExpedition, now)) return { ok: false, message: "Essa expedicao ainda nao terminou." };

  const reward = getActiveExpeditionReward(state, activeExpedition) || getExpeditionRewardPreview(state, definition, activeExpedition.heroIds);
  if (reward.type === "xp") {
    activeExpedition.heroIds.forEach((heroId) => {
      const hero = findHero(state, heroId);
      if (hero) addHeroXp(hero, reward.amount);
    });
  } else {
    addResource(state, reward.type, reward.amount);
  }

  state.activeExpeditions = state.activeExpeditions.filter((expedition) => expedition.id !== activeExpedition.id);
  return { ok: true, reward, message: `${definition.name} concluida: +${reward.amount} ${getExpeditionRewardName(reward.type)}.` };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getExpeditionRewardName(type: ExpeditionRewardType): string {
  if (type === "xp") return "XP";
  if (type === "gold") return "ouro";
  if (type === "crystals") return "cristais";
  return type;
}
