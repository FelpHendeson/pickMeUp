"use client";

import { EXPORT_FILE_NAME } from "@/src/game";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useRef, useState } from "react";

export function MigrationBridgePanel() {
  const { state, source, loadLegacyLocalSave, loadCloudSave, saveCloudSave, exportSave, importSave, resetLocalState, persistLegacySave } =
    useGameStore();
  const [message, setMessage] = useState("Verificando save local...");
  const [playerId, setPlayerId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="hero-action-row">
          <button
            className="hero-inline-action"
            onClick={() => {
              const result = loadLegacyLocalSave();
              setMessage(result.ok ? "Save legado recarregado." : result.message);
            }}
            type="button"
          >
            Recarregar local
          </button>
          <button
            className="hero-inline-action"
            onClick={() => {
              persistLegacySave();
              setMessage("Save local persistido.");
            }}
            type="button"
          >
            Salvar local
          </button>
          <button
            className="hero-inline-action"
            onClick={() => {
              const result = exportSave();
              setMessage(result.message);
            }}
            type="button"
          >
            Exportar JSON
          </button>
          <button
            className="hero-inline-action"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Importar JSON
          </button>
          <button
            className="hero-inline-action"
            onClick={() => {
              if (!window.confirm("Resetar o save local deste navegador?")) return;
              resetLocalState();
              setMessage("Save local resetado.");
            }}
            type="button"
          >
            Reset local
          </button>
        </div>
        <input
          accept="application/json,.json"
          className="visually-hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            const result = importSave(text);
            setMessage(result.message);
            event.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
        <small>Arquivo padrao: {EXPORT_FILE_NAME}</small>

        <label className="inventory-hero-picker">
          ID do jogador (PostgreSQL)
          <input className="cloud-save-input" onChange={(event) => setPlayerId(event.target.value)} value={playerId} />
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
