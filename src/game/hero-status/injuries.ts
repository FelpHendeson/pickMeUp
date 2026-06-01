import { canSpendResource, spendResource } from "../state/resources";
import type { GameState, Hero, HeroInjury, StatKey, Stats } from "../types";

export const INJURY_CONFIG = {
  durationBattles: 3,
  victoryChance: 0.35,
  defeatChance: 0.6,
  treatmentCosts: {
    gold: 120,
    essence: 8,
  },
} as const;

export type HeroInjuryDefinition = {
  name: string;
  stat: StatKey;
  multiplier: number;
  description: string;
};

export const HERO_INJURY_TYPES: Record<string, HeroInjuryDefinition> = {
  injuredArm: {
    name: "Braco machucado",
    stat: "atk",
    multiplier: 0.85,
    description: "ATK -15%",
  },
  brokenRib: {
    name: "Costela quebrada",
    stat: "hp",
    multiplier: 0.85,
    description: "HP maximo -15%",
  },
  arcaneTrauma: {
    name: "Trauma arcano",
    stat: "focus",
    multiplier: 0.82,
    description: "FOCUS -18%",
  },
  severeExhaustion: {
    name: "Exaustao severa",
    stat: "spd",
    multiplier: 0.85,
    description: "SPD -15%",
  },
};

function createInjuryId(): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return `injury_${globalThis.crypto.randomUUID()}`;
  }

  return `injury_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function normalizeHeroInjuries(hero: Hero): HeroInjury[] {
  hero.injuries = Array.isArray(hero.injuries)
    ? hero.injuries
        .map((injury) => {
          const raw = asRecord(injury);
          const typeKey = typeof raw.typeKey === "string" && HERO_INJURY_TYPES[raw.typeKey] ? raw.typeKey : null;
          if (!typeKey) return null;

          return {
            id: typeof raw.id === "string" ? raw.id : createInjuryId(),
            typeKey,
            remainingBattles: Number.isFinite(Number(raw.remainingBattles))
              ? Math.max(0, Math.round(Number(raw.remainingBattles)))
              : INJURY_CONFIG.durationBattles,
            createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
          };
        })
        .filter((injury): injury is HeroInjury => Boolean(injury && injury.remainingBattles > 0))
    : [];

  return hero.injuries;
}

export function getInjuryDefinition(typeKey: string): HeroInjuryDefinition | null {
  return HERO_INJURY_TYPES[typeKey] ?? null;
}

export function getHeroActiveInjuries(hero: Hero): HeroInjury[] {
  return normalizeHeroInjuries(hero).filter((injury) => injury.remainingBattles > 0);
}

export function hasHeroInjuries(hero: Hero): boolean {
  return getHeroActiveInjuries(hero).length > 0;
}

export function getHeroInjurySummary(hero: Hero): string {
  return getHeroActiveInjuries(hero)
    .map((injury) => {
      const definition = getInjuryDefinition(injury.typeKey);
      return definition ? `${definition.name} (${injury.remainingBattles} batalha${injury.remainingBattles === 1 ? "" : "s"})` : "";
    })
    .filter(Boolean)
    .join(", ");
}

export function applyHeroInjuryModifiers(stats: Stats, hero: Hero): Stats {
  getHeroActiveInjuries(hero).forEach((injury) => {
    const definition = getInjuryDefinition(injury.typeKey);
    if (!definition) return;
    stats[definition.stat] = Math.max(1, Math.round((stats[definition.stat] || 1) * definition.multiplier));
  });

  return stats;
}

export function addHeroInjury(hero: Hero, typeKey: string): { injury: HeroInjury; refreshed: boolean } {
  const activeInjuries = getHeroActiveInjuries(hero);
  const existing = activeInjuries.find((injury) => injury.typeKey === typeKey);

  if (existing) {
    existing.remainingBattles = INJURY_CONFIG.durationBattles;
    hero.injuries = activeInjuries;
    return { injury: existing, refreshed: true };
  }

  const injury: HeroInjury = {
    id: createInjuryId(),
    typeKey,
    remainingBattles: INJURY_CONFIG.durationBattles,
    createdAt: new Date().toISOString(),
  };

  hero.injuries = activeInjuries.concat(injury);
  return { injury, refreshed: false };
}

export function decrementHeroInjuriesAfterBattle(hero: Hero): string[] {
  const before = getHeroActiveInjuries(hero);
  if (before.length === 0) return [];

  hero.injuries = before
    .map((injury) => ({ ...injury, remainingBattles: injury.remainingBattles - 1 }))
    .filter((injury) => injury.remainingBattles > 0);

  const afterTypeKeys = new Set(hero.injuries.map((injury) => injury.typeKey));
  return before
    .filter((injury) => !afterTypeKeys.has(injury.typeKey))
    .map((injury) => {
      const definition = getInjuryDefinition(injury.typeKey);
      return `${hero.name} se recuperou de ${definition?.name || "um ferimento"}.`;
    });
}

export function getHeroInjuryTreatmentCost(hero: Hero, resourceKey: keyof typeof INJURY_CONFIG.treatmentCosts): number | null {
  const costPerInjury = INJURY_CONFIG.treatmentCosts[resourceKey];
  if (!costPerInjury) return null;
  return getHeroActiveInjuries(hero).length * costPerInjury;
}

export function treatHeroInjuries(state: GameState, heroId: string, resourceKey: keyof typeof INJURY_CONFIG.treatmentCosts): { ok: boolean; message: string } {
  const hero = state.heroes.find((item) => item.id === heroId);
  if (!hero) return { ok: false, message: "Heroi nao encontrado." };

  const activeInjuries = getHeroActiveInjuries(hero);
  if (activeInjuries.length === 0) return { ok: false, message: `${hero.name} nao tem ferimentos ativos.` };

  const cost = getHeroInjuryTreatmentCost(hero, resourceKey);
  if (!cost) return { ok: false, message: "Recurso de tratamento invalido." };
  if (!canSpendResource(state, resourceKey, cost)) return { ok: false, message: `Recursos insuficientes para tratar ${hero.name}.` };

  spendResource(state, resourceKey, cost);
  hero.injuries = [];
  return { ok: true, message: `${hero.name} recebeu tratamento na Enfermaria e removeu ${activeInjuries.length} ferimento(s).` };
}

export function decrementRosterInjuriesAfterBattle(
  state: Pick<GameState, "heroes">,
  onRecovery?: (message: string) => void,
): string[] {
  const recovered: string[] = [];

  state.heroes.forEach((hero) => {
    const before = getHeroActiveInjuries(hero);
    if (before.length === 0) return;

    hero.injuries = before
      .map((injury) => ({ ...injury, remainingBattles: injury.remainingBattles - 1 }))
      .filter((injury) => injury.remainingBattles > 0);

    const afterTypeKeys = new Set(hero.injuries.map((injury) => injury.typeKey));
    before.forEach((injury) => {
      if (!afterTypeKeys.has(injury.typeKey)) {
        const definition = getInjuryDefinition(injury.typeKey);
        const message = `${hero.name} se recuperou de ${definition?.name || "um ferimento"}.`;
        recovered.push(message);
        onRecovery?.(message);
      }
    });
  });

  return recovered;
}

function pickRandomInjuryType(random: () => number = Math.random): string {
  const keys = Object.keys(HERO_INJURY_TYPES);
  return keys[Math.floor(random() * keys.length)] ?? keys[0];
}

export function resolveBattleInjuries(
  state: GameState,
  playerTeam: Array<{ side?: string; sourceId?: string; hp: number }>,
  battleResult: "victory" | "defeat" | string,
  onInjury?: (message: string) => void,
  battleModifiers?: { injuryChanceMultiplier?: number },
  random: () => number = Math.random,
): void {
  decrementRosterInjuriesAfterBattle(state, onInjury);

  const fallenHeroIds = new Set(
    playerTeam.filter((unit) => unit.side === "player" && unit.sourceId && unit.hp <= 0).map((unit) => unit.sourceId as string),
  );
  const injuryChanceMultiplier =
    battleModifiers && Number.isFinite(battleModifiers.injuryChanceMultiplier) ? Number(battleModifiers.injuryChanceMultiplier) : 1;
  const injuryChance = (battleResult === "defeat" ? INJURY_CONFIG.defeatChance : INJURY_CONFIG.victoryChance) * injuryChanceMultiplier;

  fallenHeroIds.forEach((heroId) => {
    const hero = state.heroes.find((item) => item.id === heroId);
    if (!hero || random() >= injuryChance) return;

    const typeKey = pickRandomInjuryType(random);
    const result = addHeroInjury(hero, typeKey);
    const definition = getInjuryDefinition(typeKey);
    const verb = result.refreshed ? "agravou" : "recebeu";
    onInjury?.(
      `${hero.name} ${verb} um ferimento: ${definition?.name || typeKey} (${definition?.description || ""}, ${INJURY_CONFIG.durationBattles} batalhas).`,
    );
  });
}

export function getInjuredHeroes(state: GameState): Hero[] {
  return state.heroes.filter((hero) => hasHeroInjuries(hero));
}
