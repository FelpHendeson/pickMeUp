import { InvalidPlayerSavePayloadError, createPlayerSaveSnapshot, getLatestPlayerSave } from "@/src/lib/playerSave";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ playerId: string }>;
};

function databaseUnavailableResponse(error: unknown) {
  if (error instanceof InvalidPlayerSavePayloadError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Erro desconhecido";
  if (message.includes("DATABASE_URL") || message.includes("Environment variable not found")) {
    return NextResponse.json({ message: "DATABASE_URL nao configurada para PostgreSQL." }, { status: 503 });
  }
  return NextResponse.json({ message: "Falha ao acessar o banco de dados." }, { status: 500 });
}

export async function GET(_request: Request, context: RouteContext) {
  const { playerId } = await context.params;
  if (!playerId) return NextResponse.json({ message: "playerId obrigatorio." }, { status: 400 });

  try {
    const payload = await getLatestPlayerSave(playerId);
    if (!payload) return NextResponse.json({ message: "Save nao encontrado." }, { status: 404 });
    return NextResponse.json({ playerId, payload });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { playerId } = await context.params;
  if (!playerId) return NextResponse.json({ message: "playerId obrigatorio." }, { status: 400 });

  try {
    const body = (await request.json()) as { payload?: unknown };
    if (!body.payload || typeof body.payload !== "object") {
      return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
    }

    const snapshot = await createPlayerSaveSnapshot(playerId, body.payload);
    return NextResponse.json({
      ok: true,
      playerId,
      snapshotId: snapshot.id,
      createdAt: snapshot.createdAt,
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
