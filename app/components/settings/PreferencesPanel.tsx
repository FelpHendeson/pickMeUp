"use client";

import { DEFAULT_PREFERENCES, getPreferences, type BattleSpeed } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useState } from "react";

export function PreferencesPanel() {
  const updatePreference = useGameStore((store) => store.updatePreference);
  const resetPreferencesAction = useGameStore((store) => store.resetPreferences);
  const applyPreferencesAction = useGameStore((store) => store.applyPreferences);
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
    <section className="preferences-panel">
      <div className="section-heading">
        <span>Configuracoes</span>
        <h2>Preferencias</h2>
        <p>Velocidade de combate, visual e audio persistidos neste navegador.</p>
      </div>

      <article className="preferences-card">
        <h3>Combate</h3>
        <div className="preferences-speed-row">
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

      <article className="preferences-card">
        <h3>Visual</h3>
        <label className="preferences-toggle">
          <input
            checked={preferences.visual.reduceAnimations}
            onChange={(event) => setPref("visual.reduceAnimations", event.target.checked)}
            type="checkbox"
          />
          <span>Reduzir animacoes</span>
        </label>
        <label className="preferences-toggle">
          <input
            checked={preferences.visual.compactMode}
            onChange={(event) => setPref("visual.compactMode", event.target.checked)}
            type="checkbox"
          />
          <span>Modo compacto</span>
        </label>
        <label className="preferences-toggle">
          <input
            checked={preferences.visual.showDetailedNumbers}
            onChange={(event) => setPref("visual.showDetailedNumbers", event.target.checked)}
            type="checkbox"
          />
          <span>Numeros detalhados</span>
        </label>
      </article>

      <article className="preferences-card">
        <h3>Audio</h3>
        {(["masterVolume", "musicVolume", "effectsVolume"] as const).map((key) => (
          <label className="preferences-range" key={key}>
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
      </article>

      <button
        className="hero-inline-action"
        onClick={() => {
          resetPreferencesAction();
          setPreferences(DEFAULT_PREFERENCES);
          setFeedback("Preferencias restauradas.");
        }}
        type="button"
      >
        Restaurar padrao
      </button>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
