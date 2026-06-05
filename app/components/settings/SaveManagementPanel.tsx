"use client";

import { EXPORT_FILE_NAME, GAME_CONFIG } from "@/src/game";
import { getOrCreatePlayerId } from "@/src/lib/playerId";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useConfirmDialog } from "../ui";

const cloudSaveEnabled = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SAVE === "true";
type CloudStatus = "disabled" | "checking" | "available" | "unavailable";

function getSourceLabel(source: string): string {
  if (source === "local-storage") return "localStorage";
  if (source === "cloud-postgres") return "Cloud Save";
  if (source === "manual") return "Sessao local";
  return "Novo save";
}

function getCloudStatusLabel(status: CloudStatus): string {
  if (status === "available") return "Disponivel para teste";
  if (status === "checking") return "Verificando API";
  if (status === "unavailable") return "Indisponivel";
  return "Desativado";
}

function SettingsSection({
  actions,
  children,
  description,
  eyebrow,
  title,
  tone = "default",
}: {
  actions?: ReactNode;
  children?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  tone?: "default" | "danger" | "warning" | "success" | "arcane";
}) {
  return (
    <section className={`settings-section-card tone-${tone}`}>
      <div className="settings-section-copy">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
      {actions ? <div className="settings-action-row">{actions}</div> : null}
    </section>
  );
}

export function SaveManagementPanel() {
  const { state, source, loadLocalSave, loadCloudSave, saveCloudSave, exportSave, importSave, resetLocalState, persistLocalSave } = useGameStore();
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
    <article className="save-management-card settings-save-panel">
      <div className="settings-panel-hero">
        <div>
          <span>Controle de progresso</span>
          <h2>Save e seguranca</h2>
          <p>Gerencie o progresso local, backups JSON e o cloud save experimental sem alterar o formato do save.</p>
        </div>
        <div className="settings-status-seal">
          <strong>{getSourceLabel(source)}</strong>
          <span>Fonte atual</span>
        </div>
      </div>

      <div className="settings-feedback-banner" role="status">
        <strong>Status</strong>
        <span>{message}</span>
      </div>

      <div className="settings-save-grid">
        <SettingsSection
          actions={
            <>
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
            </>
          }
          description="O progresso principal fica no localStorage deste navegador. A aplicacao continua jogavel sem PostgreSQL."
          eyebrow="Save local"
          title="Fonte principal"
          tone="success"
        >
          <div className="settings-info-list">
            <span>Chave: {GAME_CONFIG.saveKey}</span>
            <span>Versao do save: {GAME_CONFIG.saveVersion}</span>
            <span>Ultimo registro: {state.lastSavedAt || "ainda nao persistido"}</span>
          </div>
        </SettingsSection>

        <SettingsSection
          actions={
            <>
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
            </>
          }
          description="Use arquivo JSON para backup manual antes de resetar ou para restaurar progresso validado."
          eyebrow="Importacao / exportacao"
          title="Backup em arquivo"
          tone="arcane"
        >
          <div className="settings-info-list">
            <span>Arquivo padrao: {EXPORT_FILE_NAME}</span>
            <span>Importar sobrescreve o progresso local apos confirmacao.</span>
          </div>
          <input
            accept="application/json,.json"
            className="visually-hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const confirmed = await confirmDialog({
                title: "Importar backup JSON?",
                description: "O progresso local atual sera sobrescrito pelo arquivo selecionado apos validacao e normalizacao. Exporte o save atual antes se tiver duvida.",
                confirmLabel: "Importar backup",
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
        </SettingsSection>

        <SettingsSection
          actions={
            <>
              <button
                className="hero-inline-action"
                disabled={cloudDisabled}
                onClick={async () => {
                  const result = await loadCloudSave(playerId);
                  setMessage(result.ok ? result.message : `${result.message} O save local nao foi afetado.`);
                }}
                type="button"
              >
                Carregar cloud
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
                Salvar cloud
              </button>
            </>
          }
          description="Camada opcional para testes com PostgreSQL. O save local continua sendo a fonte segura quando a API falha ou esta desativada."
          eyebrow="Cloud save experimental"
          title={getCloudStatusLabel(cloudStatus)}
          tone={cloudAvailable ? "warning" : "default"}
        >
          <p className={cloudAvailable ? "save-ready-note" : "save-disabled-note"}>
            {cloudStatus === "available"
              ? "Recurso experimental disponivel neste ambiente. Use como snapshot de teste, nao como garantia final de sincronizacao."
              : cloudStatus === "checking"
                ? "Verificando a rota de cloud save. Nenhuma acao local depende dessa checagem."
                : cloudStatus === "unavailable"
                  ? "Cloud save indisponivel agora. O progresso local nao foi afetado."
                  : "Cloud save esta desativado neste ambiente. Nada muda para o progresso local."}
          </p>
          <label className="settings-field">
            Identificador do jogador
            <input
              className="cloud-save-input"
              disabled={!cloudAvailable}
              onChange={(event) => setPlayerId(event.target.value)}
              value={playerId}
            />
          </label>
        </SettingsSection>

        <SettingsSection
          actions={
            <button
              className="hero-inline-action danger"
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: "Apagar save local deste navegador?",
                  description: "Esta acao cria um novo estado inicial e substitui o progresso salvo neste dispositivo. Exporte um JSON antes se quiser manter backup.",
                  confirmLabel: "Apagar save local",
                  tone: "danger",
                });
                if (!confirmed) return;
                resetLocalState();
                setMessage("Save local resetado. Um novo estado inicial foi criado.");
              }}
              type="button"
            >
              Apagar save local
            </button>
          }
          description="Acao destrutiva. Use apenas se quiser recomecar neste navegador ou depois de exportar um backup."
          eyebrow="Zona de risco"
          title="Reset do progresso"
          tone="danger"
        />

        <SettingsSection
          description="Dados atuais do build e do save para facilitar suporte e verificacao manual."
          eyebrow="Informacoes do jogo"
          title="Versoes e ambiente"
        >
          <div className="settings-info-list">
            <span>Jogo: {GAME_CONFIG.gameVersion}</span>
            <span>Save: v{GAME_CONFIG.saveVersion}</span>
            <span>Cloud UI: {cloudSaveEnabled ? "habilitada" : "desativada"}</span>
          </div>
        </SettingsSection>
      </div>
    </article>
  );
}
