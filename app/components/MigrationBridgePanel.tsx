"use client";

import { useEffect, useState } from "react";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";

export function MigrationBridgePanel() {
  const { state, source, loadLegacyLocalSave, loadCloudSave, saveCloudSave } = useGameStore();
  const [message, setMessage] = useState("Verificando save local...");
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    const result = loadLegacyLocalSave();
    setMessage(result.ok ? "Save legado encontrado e normalizado pelo core TypeScript." : result.message);
    setPlayerId(getOrCreatePlayerId());
  }, [loadLegacyLocalSave]);

  return (
    <article>
      <span>Ponte de save</span>
      <h2>Leitura do legado e nuvem</h2>
      <p>{message}</p>
      <div className="mini-grid">
        <div>
          <strong>{state.towerFloor}</strong>
          <small>Andar</small>
        </div>
        <div>
          <strong>{state.heroes.length}</strong>
          <small>Herois</small>
        </div>
        <div>
          <strong>{state.inventory.length}</strong>
          <small>Itens</small>
        </div>
        <div>
          <strong>{source}</strong>
          <small>Fonte</small>
        </div>
      </div>

      <div className="cloud-save-panel">
        <label className="inventory-hero-picker">
          ID do jogador (PostgreSQL)
          <input
            className="cloud-save-input"
            onChange={(event) => setPlayerId(event.target.value)}
            value={playerId}
          />
        </label>
        <div className="hero-action-row">
          <button
            className="hero-inline-action"
            disabled={!playerId}
            onClick={async () => {
              const result = await loadCloudSave(playerId);
              setMessage(result.message);
            }}
            type="button"
          >
            Carregar da nuvem
          </button>
          <button
            className="hero-inline-action primary"
            disabled={!playerId}
            onClick={async () => {
              const result = await saveCloudSave(playerId);
              setMessage(result.message);
            }}
            type="button"
          >
            Salvar na nuvem
          </button>
        </div>
        <small>Use DATABASE_URL e prisma migrate antes de sincronizar com PostgreSQL.</small>
      </div>
    </article>
  );
}
