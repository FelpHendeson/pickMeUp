"use client";

import { EXPORT_FILE_NAME } from "@/src/game";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useRef, useState } from "react";

const cloudSaveEnabled = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SAVE === "true";
type CloudStatus = "disabled" | "checking" | "available" | "unavailable";

function getSourceLabel(source: string): string {
  if (source === "local-storage") return "localStorage";
  if (source === "cloud-postgres") return "Cloud Save";
  if (source === "manual") return "Sessao local";
  return "Novo save";
}

export function SaveManagementPanel() {
  const { source, loadLocalSave, loadCloudSave, saveCloudSave, exportSave, importSave, resetLocalState, persistLocalSave } = useGameStore();
  const [message, setMessage] = useState("Save local ativo. O progresso fica salvo neste navegador.");
  const [playerId, setPlayerId] = useState("");
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(cloudSaveEnabled ? "checking" : "disabled");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudAvailable = cloudStatus === "available";
  const cloudDisabled = !cloudAvailable || !playerId;

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId());
  }, []);

  useEffect(() => {
    if (!cloudSaveEnabled) {
      setCloudStatus("disabled");
      return;
    }
    if (!playerId) return;

    let cancelled = false;
    setCloudStatus("checking");
    fetch(`/api/saves/${encodeURIComponent(playerId)}`)
      .then((response) => {
        if (cancelled) return;
        setCloudStatus(response.status === 200 || response.status === 404 ? "available" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setCloudStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  return (
    <article className="save-management-card">
      <span>Save</span>
      <h2>Save e backup</h2>
      <p>{message}</p>
      <small className="save-source-note">Save principal: localStorage | Fonte atual: {getSourceLabel(source)}</small>

      <div className="save-management-stack">
        <section className="save-panel-section">
          <div className="save-section">
            <strong>Save Local</strong>
            <small>O progresso fica neste navegador via localStorage. Banco de dados nao e necessario para jogar.</small>
          </div>
          <div className="hero-action-row">
            <button
              className="hero-inline-action"
              onClick={() => {
                const result = loadLocalSave();
                setMessage(result.ok ? "Save local recarregado do navegador." : result.message);
              }}
              type="button"
            >
              Recarregar local
            </button>
            <button
              className="hero-inline-action primary"
              onClick={() => {
                persistLocalSave();
                setMessage("Save local persistido no navegador.");
              }}
              type="button"
            >
              Salvar local
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
        </section>

        <section className="save-panel-section">
          <div className="save-section">
            <strong>Backup em Arquivo</strong>
            <small>Exporte um JSON antes de resetar ou importe um arquivo para restaurar progresso local.</small>
          </div>
          <div className="hero-action-row">
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
        </section>

        <section className="save-panel-section">
          <div className="save-section">
            <strong>Cloud Save Experimental</strong>
            <small>
              Opcional e voltado a testes com PostgreSQL. Ative `NEXT_PUBLIC_ENABLE_CLOUD_SAVE=true` e configure `DATABASE_URL` para usar.
            </small>
          </div>
          {cloudStatus === "disabled" ? (
            <p className="save-disabled-note">
              Cloud save esta desativado neste ambiente. O save local continua ativo e o jogo funciona normalmente sem banco.
            </p>
          ) : null}
          {cloudStatus === "checking" ? <p className="save-disabled-note">Verificando disponibilidade da API de cloud save...</p> : null}
          {cloudStatus === "unavailable" ? (
            <p className="save-disabled-note">
              Cloud save nao esta disponivel agora. Confira `DATABASE_URL` e o PostgreSQL local. O save local nao foi afetado.
            </p>
          ) : null}
          {cloudStatus === "available" ? (
            <p className="save-ready-note">API de cloud save disponivel para testes. O save local continua sendo a fonte principal.</p>
          ) : null}
          <label className="inventory-hero-picker">
            ID do jogador para nuvem
            <input
              className="cloud-save-input"
              disabled={!cloudAvailable}
              onChange={(event) => setPlayerId(event.target.value)}
              value={playerId}
            />
          </label>
          <div className="hero-action-row">
            <button
              className="hero-inline-action"
              disabled={cloudDisabled}
              onClick={async () => {
                const result = await loadCloudSave(playerId);
                setMessage(result.ok ? result.message : `${result.message} O save local nao foi afetado.`);
              }}
              type="button"
            >
              Carregar da nuvem
            </button>
            <button
              className="hero-inline-action primary"
              disabled={cloudDisabled}
              onClick={async () => {
                const result = await saveCloudSave(playerId);
                setMessage(result.ok ? result.message : `${result.message} O save local continua ativo.`);
              }}
              type="button"
            >
              Salvar na nuvem
            </button>
          </div>
        </section>
      </div>
    </article>
  );
}
