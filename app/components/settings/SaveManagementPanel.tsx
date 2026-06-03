"use client";

import { EXPORT_FILE_NAME } from "@/src/game";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useRef, useState } from "react";
import { useConfirmDialog } from "../ui";

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
  const confirmDialog = useConfirmDialog();
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
      <small className="save-source-note">Save principal: navegador local | Fonte atual: {getSourceLabel(source)}</small>

      <div className="save-management-stack">
        <section className="save-panel-section">
          <div className="save-section">
            <strong>Save Local</strong>
            <small>O progresso fica salvo neste navegador. Voce pode jogar normalmente sem banco de dados.</small>
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
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: "Resetar save local?",
                  description: "Esta ação apaga o progresso salvo neste dispositivo. Exporte um JSON antes se quiser manter backup.",
                  confirmLabel: "Resetar save",
                  tone: "danger",
                });
                if (!confirmed) return;
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
              const confirmed = await confirmDialog({
                title: "Importar backup JSON?",
                description: "O progresso local atual será sobrescrito pelo arquivo selecionado após validação e normalização.",
                confirmLabel: "Importar",
                tone: "danger",
              });
              if (!confirmed) {
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

        <details className="save-panel-section save-advanced-section">
          <summary>Avancado / Experimental</summary>
          <div className="save-section">
            <strong>Cloud Save Experimental</strong>
            <small>Opcional para testes. Se nao estiver disponivel, o save local continua funcionando normalmente.</small>
          </div>
          {cloudStatus === "disabled" ? (
            <p className="save-disabled-note">Cloud save esta desativado neste ambiente. Nada muda para o progresso local.</p>
          ) : null}
          {cloudStatus === "checking" ? <p className="save-disabled-note">Verificando disponibilidade do cloud save...</p> : null}
          {cloudStatus === "unavailable" ? (
            <p className="save-disabled-note">Cloud save nao esta disponivel agora. O save local nao foi afetado.</p>
          ) : null}
          {cloudStatus === "available" ? (
            <p className="save-ready-note">Cloud save disponivel para testes. O save local continua sendo a fonte principal.</p>
          ) : null}
          <label className="inventory-hero-picker">
            Identificador do jogador
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
              Carregar cloud save
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
              Salvar cloud save
            </button>
          </div>
        </details>
      </div>
    </article>
  );
}
