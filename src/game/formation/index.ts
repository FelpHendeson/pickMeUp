import { GAME_CONFIG } from "../config";
import { getHeroPowerWithEquipment } from "../equipment";
import type { GameState, Hero } from "../types";

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
