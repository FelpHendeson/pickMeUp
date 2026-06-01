import type { GameState, Hero, Stats } from "../types";

export const MORALE_CONFIG = {
  min: 0,
  max: 100,
  startingMin: 60,
  startingMax: 100,
  victoryGain: 4,
  defeatLoss: 8,
  allyFallLoss: 3,
  selfFallLoss: 4,
  unusedBattleLimit: 3,
  unusedLoss: 1,
  lowFailChance: 0.04,
  criticalFailChance: 0.08,
} as const;

export const MORALE_STATES = {
  inspired: {
    label: "Inspirado",
    tone: "inspired",
    description: "bonus leve",
  },
  stable: {
    label: "Estavel",
    tone: "stable",
    description: "sem efeito",
  },
  shaken: {
    label: "Abalado",
    tone: "shaken",
    description: "pode hesitar",
  },
  collapse: {
    label: "Em colapso",
    tone: "collapse",
    description: "atributos reduzidos",
  },
} as const;

export type MoraleState = (typeof MORALE_STATES)[keyof typeof MORALE_STATES];

export function clampMorale(value: number): number {
  return Math.max(MORALE_CONFIG.min, Math.min(MORALE_CONFIG.max, Math.round(value)));
}

export function createStartingMorale(random = Math.random): number {
  return Math.floor(MORALE_CONFIG.startingMin + random() * (MORALE_CONFIG.startingMax - MORALE_CONFIG.startingMin + 1));
}

export function normalizeHeroMorale(hero: Hero): number {
  hero.morale = Number.isFinite(Number(hero.morale)) ? clampMorale(Number(hero.morale)) : createStartingMorale();
  hero.battlesSinceLastUsed = Number.isFinite(Number(hero.battlesSinceLastUsed)) ? Math.max(0, Math.round(Number(hero.battlesSinceLastUsed))) : 0;
  hero.lastUsedAt = Number.isFinite(Number(hero.lastUsedAt)) ? Number(hero.lastUsedAt) : null;
  return hero.morale;
}

export function getHeroMoraleState(hero: Hero): MoraleState {
  const morale = Number.isFinite(Number(hero.morale)) ? clampMorale(Number(hero.morale)) : createStartingMorale();
  if (morale > 80) return MORALE_STATES.inspired;
  if (morale < 20) return MORALE_STATES.collapse;
  if (morale < 40) return MORALE_STATES.shaken;
  return MORALE_STATES.stable;
}

export function adjustHeroMorale(hero: Hero, amount: number): number {
  normalizeHeroMorale(hero);
  const before = hero.morale;
  hero.morale = clampMorale(hero.morale + amount);
  return hero.morale - before;
}

function getInspiredStat(hero: Hero): "atk" | "spd" {
  return hero.classKey === "archer" || hero.classKey === "rogue" ? "spd" : "atk";
}

export function applyHeroMoraleModifiers(stats: Stats, hero: Hero): Stats {
  normalizeHeroMorale(hero);

  if (hero.morale > 80) {
    const statKey = getInspiredStat(hero);
    stats[statKey] = Math.max(1, Math.round((stats[statKey] || 1) * 1.04));
    return stats;
  }

  if (hero.morale < 20) {
    (["hp", "atk", "def", "spd", "focus"] as const).forEach((statKey) => {
      stats[statKey] = Math.max(1, Math.round((stats[statKey] || 1) * 0.94));
    });
  }

  return stats;
}

export function shouldUnitFailMoraleAction(unit: { side?: string; morale?: number } | null, random = Math.random): boolean {
  if (!unit || unit.side !== "player") return false;
  const morale = Number.isFinite(Number(unit.morale)) ? Number(unit.morale) : 100;
  if (morale >= 40) return false;
  const chance = morale < 20 ? MORALE_CONFIG.criticalFailChance : MORALE_CONFIG.lowFailChance;
  return random() < chance;
}

export function updateUnusedHeroMorale(hero: Hero, now = Date.now()): number {
  normalizeHeroMorale(hero);
  hero.battlesSinceLastUsed += 1;

  if (hero.battlesSinceLastUsed < MORALE_CONFIG.unusedBattleLimit || hero.morale <= 50) return 0;
  hero.lastUsedAt = hero.lastUsedAt || now;
  return adjustHeroMorale(hero, -MORALE_CONFIG.unusedLoss);
}

export function adjustFormationMorale(
  state: Pick<{ heroes: Hero[]; formation: Array<string | null> }, "heroes" | "formation">,
  amount: number,
  reason: string,
): string {
  const formationIds = new Set(state.formation.filter((heroId): heroId is string => Boolean(heroId)));
  const heroes = state.heroes.filter((hero) => formationIds.has(hero.id));
  const changed = heroes
    .map((hero) => ({ hero, delta: adjustHeroMorale(hero, amount) }))
    .filter((entry) => entry.delta !== 0);

  if (changed.length === 0) return "";

  const direction = amount > 0 ? "Moral +" : "Moral ";
  return `${reason} ${direction}${amount} para a equipe ativa.`;
}

export function applyBattleMoraleChanges(
  state: GameState,
  playerTeam: Array<{ side?: string; sourceId?: string; hp: number }>,
  battleResult: "victory" | "defeat" | string,
  onMorale?: (message: string) => void,
  now = Date.now(),
): string[] {
  const participatingHeroIds = new Set(
    playerTeam.filter((unit) => unit.side === "player" && unit.sourceId).map((unit) => unit.sourceId as string),
  );
  const fallenHeroIds = new Set(
    playerTeam.filter((unit) => unit.side === "player" && unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId as string),
  );
  const fallenCount = fallenHeroIds.size;
  const messages: string[] = [];

  state.heroes.forEach((hero) => {
    if (participatingHeroIds.has(hero.id)) {
      let delta = battleResult === "victory" ? MORALE_CONFIG.victoryGain : -MORALE_CONFIG.defeatLoss;
      if (fallenHeroIds.has(hero.id)) delta -= MORALE_CONFIG.selfFallLoss;

      const witnessedFalls = Math.max(0, fallenCount - (fallenHeroIds.has(hero.id) ? 1 : 0));
      if (witnessedFalls > 0) delta -= Math.min(6, witnessedFalls * MORALE_CONFIG.allyFallLoss);

      const actualDelta = adjustHeroMorale(hero, delta);
      hero.battlesSinceLastUsed = 0;
      hero.lastUsedAt = now;

      if (actualDelta !== 0) {
        const signal = actualDelta > 0 ? `ganhou ${actualDelta}` : `perdeu ${Math.abs(actualDelta)}`;
        const message = `${hero.name} ${signal} de moral (${hero.morale}/100).`;
        messages.push(message);
        onMorale?.(message);
      }
      return;
    }

    hero.battlesSinceLastUsed += 1;
    if (hero.battlesSinceLastUsed >= MORALE_CONFIG.unusedBattleLimit && hero.morale > 50) {
      const delta = updateUnusedHeroMorale(hero, now);
      if (delta < 0) {
        const message = `${hero.name} perdeu ${Math.abs(delta)} de moral por ficar fora da torre por muito tempo.`;
        messages.push(message);
        onMorale?.(message);
      }
    }
  });

  return messages;
}
