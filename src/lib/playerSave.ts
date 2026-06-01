import { GAME_CONFIG } from "@/src/game/config";
import { getPrismaClient } from "@/src/lib/prisma";

export async function getLatestPlayerSave(playerId: string): Promise<unknown | null> {
  const prisma = getPrismaClient();
  const snapshot = await prisma.saveSnapshot.findFirst({
    where: { playerId },
    orderBy: { createdAt: "desc" },
  });

  return snapshot?.payload ?? null;
}

export async function createPlayerSaveSnapshot(playerId: string, payload: unknown) {
  const prisma = getPrismaClient();
  await prisma.player.upsert({
    where: { id: playerId },
    create: {
      id: playerId,
      name: "Jogador migracao",
    },
    update: {},
  });

  return prisma.saveSnapshot.create({
    data: {
      playerId,
      version: GAME_CONFIG.saveVersion,
      payload: payload as object,
    },
  });
}
