import { GAME_CONFIG } from "@/src/game/config";
import { validateImportedSaveData } from "@/src/game/save/saveSchema";
import type { GameState, Hero } from "@/src/game/types";
import { getPrismaClient } from "@/src/lib/prisma";

export class InvalidPlayerSavePayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPlayerSavePayloadError";
  }
}

function asJsonObject(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

export function normalizePlayerSavePayload(payload: unknown): GameState {
  const validation = validateImportedSaveData(payload);
  if (!validation.ok) {
    throw new InvalidPlayerSavePayloadError(validation.message);
  }

  return validation.state;
}

function getHeroPersistenceData(hero: Hero, playerId: string) {
  return {
    id: hero.id,
    playerId,
    name: hero.name,
    classKey: String(hero.classKey),
    rarity: hero.rarity,
    level: hero.level,
    xp: hero.xp,
    moral: hero.morale,
    currentHp: hero.currentHp,
    specializationKey: hero.specializationKey,
    data: asJsonObject(hero),
  };
}

export async function getLatestPlayerSave(playerId: string): Promise<GameState | null> {
  const prisma = getPrismaClient();
  const snapshot = await prisma.saveSnapshot.findFirst({
    where: { playerId },
    orderBy: { createdAt: "desc" },
  });

  return snapshot ? normalizePlayerSavePayload(snapshot.payload) : null;
}

export async function createPlayerSaveSnapshot(playerId: string, payload: unknown) {
  const prisma = getPrismaClient();
  const state = normalizePlayerSavePayload(payload);
  const heroIds = state.heroes.map((hero) => hero.id);

  return prisma.$transaction(async (transaction) => {
    await transaction.player.upsert({
      where: { id: playerId },
      create: {
        id: playerId,
        name: "Jogador migracao",
      },
      update: {},
    });

    await transaction.playerProfile.upsert({
      where: { playerId },
      create: {
        playerId,
        accountLevel: state.accountLevel,
        accountXp: state.accountXp,
        towerFloor: state.towerFloor,
        gold: state.resources.gold,
        crystals: state.resources.crystals,
        essence: state.resources.essence,
        fragments: state.resources.fragments,
        echoFragments: state.echoFragments,
        heroContracts: state.heroContracts,
      },
      update: {
        accountLevel: state.accountLevel,
        accountXp: state.accountXp,
        towerFloor: state.towerFloor,
        gold: state.resources.gold,
        crystals: state.resources.crystals,
        essence: state.resources.essence,
        fragments: state.resources.fragments,
        echoFragments: state.echoFragments,
        heroContracts: state.heroContracts,
      },
    });

    await transaction.hero.deleteMany({
      where: {
        playerId,
        ...(heroIds.length > 0 ? { id: { notIn: heroIds } } : {}),
      },
    });

    await Promise.all(
      state.heroes.map((hero) => {
        const data = getHeroPersistenceData(hero, playerId);
        return transaction.hero.upsert({
          where: { id: hero.id },
          create: data,
          update: data,
        });
      }),
    );

    return transaction.saveSnapshot.create({
      data: {
        playerId,
        version: GAME_CONFIG.saveVersion,
        payload: asJsonObject(state),
      },
    });
  });
}
