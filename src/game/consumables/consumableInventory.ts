import type { GameState, Hero, HeroInjury } from "../types";
import { CONSUMABLE_DEFINITIONS, RANDOM_CONSUMABLE_POOL, type ConsumableDefinition } from "./definitions";

export type ConsumableUseResult = {
  ok: boolean;
  message: string;
};

export type RandomSource = () => number;

type BattleEffect = {
  id: string;
  scope: "nextBattle";
  label: string;
  description: string;
  modifiers: Record<string, number>;
  createdAt: string;
};

function nonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function createEffectId(): string {
  return `consumable_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function findHero(state: GameState, heroId?: string | null): Hero | null {
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

function getHeroMaxHp(hero: Hero): number {
  return Math.max(1, Math.round(hero.stats?.hp || 1));
}

function normalizeHeroCurrentHp(hero: Hero): number {
  const maxHp = getHeroMaxHp(hero);
  hero.currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  hero.currentHp = Math.min(maxHp, hero.currentHp);
  return hero.currentHp;
}

function getActiveInjuries(hero: Hero): HeroInjury[] {
  return Array.isArray(hero.injuries) ? hero.injuries.filter((injury) => nonNegativeInteger(injury.remainingBattles) > 0) : [];
}

function queueConsumableBattleEffect(state: GameState, effect: Omit<BattleEffect, "id" | "scope" | "createdAt">): void {
  state.towerBattleEffects = Array.isArray(state.towerBattleEffects) ? state.towerBattleEffects : [];
  state.towerBattleEffects.push({
    id: createEffectId(),
    scope: "nextBattle",
    createdAt: new Date().toISOString(),
    ...effect,
  });
}

export function normalizeConsumablesState(input: unknown): Record<string, number> {
  const source = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};

  return Object.keys(CONSUMABLE_DEFINITIONS).reduce<Record<string, number>>((consumables, consumableId) => {
    consumables[consumableId] = nonNegativeInteger(source[consumableId]);
    return consumables;
  }, {});
}

export function getConsumableDefinition(consumableId: string): ConsumableDefinition | null {
  return CONSUMABLE_DEFINITIONS[consumableId] ?? null;
}

export function getConsumableQuantity(state: GameState, consumableId: string): number {
  state.consumables = normalizeConsumablesState(state.consumables);
  return state.consumables[consumableId] ?? 0;
}

export function addConsumable(state: GameState, consumableId: string, amount: number): number {
  if (!getConsumableDefinition(consumableId)) return 0;

  state.consumables = normalizeConsumablesState(state.consumables);
  state.consumables[consumableId] += nonNegativeInteger(amount);
  return state.consumables[consumableId];
}

export function spendConsumable(state: GameState, consumableId: string): boolean {
  if (getConsumableQuantity(state, consumableId) <= 0) return false;
  state.consumables[consumableId] -= 1;
  return true;
}

export function getRandomConsumableId(random: RandomSource = Math.random): string {
  return RANDOM_CONSUMABLE_POOL[Math.floor(random() * RANDOM_CONSUMABLE_POOL.length)] ?? "small_healing_potion";
}

export function getHeroHpSummary(hero: Hero): { current: number; max: number } {
  return {
    current: normalizeHeroCurrentHp(hero),
    max: getHeroMaxHp(hero),
  };
}

function useHealingPotion(hero: Hero, definition: ConsumableDefinition): ConsumableUseResult {
  const hp = getHeroHpSummary(hero);
  if (hp.current >= hp.max) return { ok: false, message: `${hero.name} ja esta com HP cheio.` };

  const recovered = Math.max(1, Math.round(hp.max * definition.value));
  hero.currentHp = Math.min(hp.max, hp.current + recovered);
  return { ok: true, message: `${hero.name} recuperou ${hero.currentHp - hp.current} HP.` };
}

function useVigorPotion(hero: Hero, definition: ConsumableDefinition): ConsumableUseResult {
  const morale = Number.isFinite(Number(hero.morale)) ? Math.round(Number(hero.morale)) : 80;
  if (morale >= 100) return { ok: false, message: `${hero.name} ja esta com moral maxima.` };

  hero.morale = Math.min(100, morale + definition.value);
  return { ok: true, message: `${hero.name} recuperou ${hero.morale - morale} moral.` };
}

function useMedicalKit(hero: Hero): ConsumableUseResult {
  const injuries = getActiveInjuries(hero);
  if (injuries.length === 0) return { ok: false, message: `${hero.name} nao tem ferimentos ativos.` };

  const target = injuries.slice().sort((a, b) => nonNegativeInteger(b.remainingBattles) - nonNegativeInteger(a.remainingBattles))[0];
  if (!target) return { ok: false, message: `${hero.name} nao tem ferimentos ativos.` };

  const before = nonNegativeInteger(target.remainingBattles);
  target.remainingBattles = before - 1;
  hero.injuries = injuries.filter((injury) => nonNegativeInteger(injury.remainingBattles) > 0);

  return {
    ok: true,
    message:
      target.remainingBattles > 0
        ? `${hero.name} reduziu um ferimento de ${before} para ${target.remainingBattles} batalha(s).`
        : `${hero.name} removeu um ferimento com o kit medico.`,
  };
}

function useFocusScroll(state: GameState): ConsumableUseResult {
  queueConsumableBattleEffect(state, {
    label: "Pergaminho de foco",
    description: "FOCUS +18% na proxima batalha.",
    modifiers: { focusMultiplier: 1.18 },
  });

  return { ok: true, message: "Pergaminho preparado. A proxima batalha tera FOCUS aumentado." };
}

function useProtectionAmulet(state: GameState): ConsumableUseResult {
  queueConsumableBattleEffect(state, {
    label: "Amuleto de protecao",
    description: "Chance de ferimento -35% na proxima batalha.",
    modifiers: { injuryChanceMultiplier: 0.65 },
  });

  return { ok: true, message: "Amuleto preparado. A proxima batalha tera menor chance de ferimentos." };
}

function useReturnStone(state: GameState): ConsumableUseResult {
  const event = state.pendingTowerEvent as { typeKey?: string } | null;
  const dangerous = event && (event.typeKey === "trap" || event.typeKey === "darkAltar");

  if (!dangerous) {
    return { ok: false, message: "A Pedra de retorno so pode cancelar Armadilha ou Altar sombrio pendente." };
  }

  state.pendingTowerEvent = null;
  state.plannedTowerPostEvent = null;
  return { ok: true, message: "Pedra de retorno ativada. O evento perigoso foi abandonado sem penalidade." };
}

export function useConsumable(state: GameState, consumableId: string, heroId?: string | null): ConsumableUseResult {
  state.consumables = normalizeConsumablesState(state.consumables);

  const definition = getConsumableDefinition(consumableId);
  if (!definition) return { ok: false, message: "Consumivel inexistente." };
  if (getConsumableQuantity(state, consumableId) <= 0) return { ok: false, message: `${definition.name} indisponivel.` };

  const hero = definition.target === "hero" ? findHero(state, heroId) : null;
  if (definition.target === "hero" && !hero) return { ok: false, message: "Selecione um heroi valido." };

  let result: ConsumableUseResult | null = null;
  if (definition.effect === "healHp" && hero) result = useHealingPotion(hero, definition);
  if (definition.effect === "restoreMorale" && hero) result = useVigorPotion(hero, definition);
  if (definition.effect === "reduceInjury" && hero) result = useMedicalKit(hero);
  if (definition.effect === "nextBattleFocus") result = useFocusScroll(state);
  if (definition.effect === "nextBattleInjuryProtection") result = useProtectionAmulet(state);
  if (definition.effect === "safeEventExit") result = useReturnStone(state);

  if (!result?.ok) return result ?? { ok: false, message: "Consumivel sem efeito configurado." };
  if (!spendConsumable(state, consumableId)) return { ok: false, message: `${definition.name} indisponivel.` };

  return { ok: true, message: result.message };
}

export function formatConsumableReward(consumables: Record<string, number>): string {
  return Object.keys(consumables || {})
    .filter((consumableId) => consumables[consumableId] > 0 && getConsumableDefinition(consumableId))
    .map((consumableId) => `${consumables[consumableId]} ${getConsumableDefinition(consumableId)?.name}`)
    .join(" | ");
}
