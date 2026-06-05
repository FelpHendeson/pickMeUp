"use client";

import { DEFAULT_PREFERENCES, getPreferences, type BattleSpeed } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useState } from "react";
import { useConfirmDialog } from "../ui";

function PreferenceToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="settings-toggle-card">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}

export function PreferencesPanel() {
  const updatePreference = useGameStore((store) => store.updatePreference);
  const resetPreferencesAction = useGameStore((store) => store.resetPreferences);
  const applyPreferencesAction = useGameStore((store) => store.applyPreferences);
  const confirmDialog = useConfirmDialog();
  const [preferences, setPreferences] = useState(getPreferences());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    applyPreferencesAction();
  }, [applyPreferencesAction, preferences]);

  const setPref = (path: string, value: unknown) => {
    const result = updatePreference(path, value);
    if (result.preferences) setPreferences(result.preferences);
    setFeedback(result.message);
  };

  return (
    <section className="preferences-panel settings-preferences-panel">
      <div className="settings-panel-hero compact">
        <div>
          <span>Menu do sistema</span>
          <h2>Preferencias</h2>
          <p>Ajustes locais de combate, leitura e audio. Essas opcoes ficam neste navegador.</p>
        </div>
      </div>

      <div className="settings-preference-grid">
        <article className="settings-section-card">
          <div className="settings-section-copy">
            <span>Combate</span>
            <h3>Velocidade padrao</h3>
            <p>Controla como o replay de batalha avanca quando um combate abre.</p>
          </div>
          <div className="preferences-speed-row settings-speed-row">
            {(["1x", "2x", "instant"] as BattleSpeed[]).map((speed) => (
              <button
                className={preferences.battle.defaultSpeed === speed ? "hero-inline-action primary" : "hero-inline-action"}
                key={speed}
                onClick={() => setPref("battle.defaultSpeed", speed)}
                type="button"
              >
                {speed === "instant" ? "Instantaneo" : speed}
              </button>
            ))}
          </div>
        </article>

        <article className="settings-section-card">
          <div className="settings-section-copy">
            <span>Interface</span>
            <h3>Leitura e densidade</h3>
            <p>Ajustes visuais para reduzir movimento, compactar a tela ou mostrar numeros mais detalhados.</p>
          </div>
          <div className="settings-toggle-grid">
            <PreferenceToggle
              checked={preferences.visual.reduceAnimations}
              description="Remove transicoes e pulsos visuais quando possivel."
              label="Reduzir animacoes"
              onChange={(value) => setPref("visual.reduceAnimations", value)}
            />
            <PreferenceToggle
              checked={preferences.visual.compactMode}
              description="Diminui espacamentos de cards e HUD."
              label="Modo compacto"
              onChange={(value) => setPref("visual.compactMode", value)}
            />
            <PreferenceToggle
              checked={preferences.visual.showDetailedNumbers}
              description="Mantem valores numericos mais explicitos na interface."
              label="Numeros detalhados"
              onChange={(value) => setPref("visual.showDetailedNumbers", value)}
            />
          </div>
        </article>

        <article className="settings-section-card">
          <div className="settings-section-copy">
            <span>Audio</span>
            <h3>Volumes preparados</h3>
            <p>Preferencias de audio persistidas para quando os canais sonoros forem usados pela UI.</p>
          </div>
          <div className="settings-range-grid">
            {(["masterVolume", "musicVolume", "effectsVolume"] as const).map((key) => (
              <label className="preferences-range settings-range" key={key}>
                <span>
                  {key === "masterVolume" ? "Volume geral" : key === "musicVolume" ? "Musica" : "Efeitos"} ({preferences.audio[key]})
                </span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) => setPref(`audio.${key}`, Number(event.target.value))}
                  type="range"
                  value={preferences.audio[key]}
                />
              </label>
            ))}
          </div>
        </article>

        <article className="settings-section-card tone-warning">
          <div className="settings-section-copy">
            <span>Preferencias locais</span>
            <h3>Restaurar padroes</h3>
            <p>Retorna somente as preferencias para o padrao. O save do jogo nao e apagado.</p>
          </div>
          <div className="settings-action-row">
            <button
              className="hero-inline-action"
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: "Restaurar preferencias?",
                  description: "Velocidade de combate, visual e volumes voltarao ao padrao. O progresso do jogo nao sera alterado.",
                  confirmLabel: "Restaurar preferencias",
                  tone: "default",
                });
                if (!confirmed) return;
                resetPreferencesAction();
                setPreferences(DEFAULT_PREFERENCES);
                setFeedback("Preferencias restauradas.");
              }}
              type="button"
            >
              Restaurar padrao
            </button>
          </div>
        </article>
      </div>

      {feedback ? <p className="hero-action-feedback settings-feedback-inline">{feedback}</p> : null}
    </section>
  );
}
