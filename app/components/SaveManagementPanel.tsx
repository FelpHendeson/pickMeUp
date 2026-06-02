"use client";

import { EXPORT_FILE_NAME } from "@/src/game";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useRef, useState } from "react";

export function SaveManagementPanel() {
  const { source, loadLocalSave, loadCloudSave, saveCloudSave, exportSave, importSave, resetLocalState, persistLocalSave } = useGameStore();
  const [message, setMessage] = useState("Controle manual de backup, importacao e sincronizacao opcional.");
  const [playerId, setPlayerId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  return (
    <article>
      <span>Save</span>
      <h2>Save e backup</h2>
      <p>{message}</p>
      <small className="save-source-note">Fonte atual: {source}</small>

      <div className="cloud-save-panel">
        <div className="save-section">
          <strong>Backup local</strong>
          <small>Exporte um JSON antes de resetar ou importar outro progresso.</small>
        </div>
        <div className="hero-action-row">
          <button
            className="hero-inline-action"
            onClick={() => {
              const result = loadLocalSave();
              setMessage(result.ok ? "Save local recarregado." : result.message);
            }}
            type="button"
          >
            Recarregar local
          </button>
          <button
            className="hero-inline-action"
            onClick={() => {
              persistLocalSave();
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
          <button className="hero-inline-action" onClick={() => fileInputRef.current?.click()} type="button">
            Importar JSON
          </button>
          <button
            className="hero-inline-action"
            onClick={() => {
              if (!window.confirm("Resetar o save local deste navegador? Esta acao apaga o progresso salvo neste dispositivo.")) return;
              if (!window.confirm("Confirmacao final: o reset local e irreversivel sem um export JSON ou save na nuvem.")) return;
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
            if (!window.confirm("Importar este JSON vai sobrescrever o progresso local atual. Continuar?")) {
              event.target.value = "";
              return;
            }
            const text = await file.text();
            const result = importSave(text);
            setMessage(result.message);
            event.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
        <small>Arquivo padrao: {EXPORT_FILE_NAME}</small>

        <div className="save-section">
          <strong>Nuvem manual</strong>
          <small>Sincronizacao opcional. O save local continua sendo o fallback deste navegador.</small>
        </div>
        <label className="inventory-hero-picker">
          ID do jogador para nuvem
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
      </div>
    </article>
  );
}
