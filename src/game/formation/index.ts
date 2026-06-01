import { GAME_CONFIG } from "../config";
import { getHeroPowerWithEquipment } from "../equipment";
import { getHeroInjurySummary, hasHeroInjuries } from "../hero-status";
import type { GameState, Hero } from "../types";

export type FormationActionResult = { ok: true; message: string; slot?: number } | { ok: false; message: string };

export function findHero(state: Pick<GameState, "heroes">, heroId: string | null | undefined): Hero | null {
  if (!heroId) return null;
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

export function getFormationHeroes(state: Pick<GameState, "formation" | "heroes">): Array<Hero | null> {
  return state.formation.map((heroId) => (heroId ? findHero(state, heroId) : null));
}

export function getFormationPower(state: GameState): number {
  return getFormationHeroes(state).reduce((total, hero) => (hero ? total + getHeroPowerWithEquipment(state, hero) : total), 0);
}

export function isHeroInFormation(state: Pick<GameState, "formation">, heroId: string): boolean {
  return state.formation.includes(heroId);
}

export function getFormationHeroCount(state: Pick<GameState, "formation">): number {
  return state.formation.filter(Boolean).length;
}

export function getMaxFormationSize(): number {
  return GAME_CONFIG.maxFormationSize;
}

export function addHeroToFormation(state: GameState, heroId: string): FormationActionResult {
  const hero = findHero(state, heroId);
  if (!hero) return { ok: false, message: "Heroi nao encontrado." };
  if (isHeroInFormation(state, heroId)) return { ok: false, message: "Esse heroi ja esta na formacao." };

  const emptySlot = state.formation.findIndex((slot) => slot === null);
  if (emptySlot === -1) return { ok: false, message: "A formacao ja tem 5 herois." };

  state.formation[emptySlot] = heroId;
  if (hasHeroInjuries(hero)) {
    return {
      ok: true,
      message: `Heroi adicionado a formacao. Aviso: ${hero.name} esta ferido (${getHeroInjurySummary(hero)}).`,
      slot: emptySlot,
    };
  }

  return { ok: true, message: "Heroi adicionado a formacao.", slot: emptySlot };
}

export function removeHeroFromFormation(state: GameState, heroId: string): FormationActionResult {
  const slot = state.formation.findIndex((slotHeroId) => slotHeroId === heroId);
  if (slot === -1) return { ok: false, message: "Esse heroi nao esta na formacao." };

  state.formation[slot] = null;
  return { ok: true, message: "Heroi removido da formacao.", slot };
}
