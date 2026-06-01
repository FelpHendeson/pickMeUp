"use client";

import {
  getTeamPresetHeroIds,
  getTeamPresetPower,
  getTeamPresets,
  type TeamPresetType,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

function PresetGroup({ type, label }: { type: TeamPresetType; label: string }) {
  const state = useGameStore((store) => store.state);
  const saveTowerPreset = useGameStore((store) => store.saveTowerPresetFromFormation);
  const applyTowerPreset = useGameStore((store) => store.applyTowerPresetToFormation);
  const saveExpeditionPreset = useGameStore((store) => store.saveExpeditionPresetFromFormation);
  const clearTeamPresetAction = useGameStore((store) => store.clearTeamPreset);
  const [feedback, setFeedback] = useState<string | null>(null);
  const presets = getTeamPresets(state, type);

  return (
    <article className="team-presets-card">
      <span>Times salvos</span>
      <h3>{label}</h3>
      <div className="team-presets-grid">
        {presets.map((preset, index) => {
          const heroIds = getTeamPresetHeroIds(state, type, index);
          const power = getTeamPresetPower(state, type, index);
          const heroNames = heroIds
            .map((heroId) => state.heroes.find((hero) => hero.id === heroId)?.name)
            .filter(Boolean)
            .join(", ");

          return (
            <div className="team-preset-row" key={preset.id}>
              <div>
                <strong>{preset.name}</strong>
                <span>{heroIds.length > 0 ? heroNames : "Vazio"}</span>
                <small>Poder {power}</small>
              </div>
              <div className="team-preset-actions">
                {type === "tower" ? (
                  <>
                    <button
                      className="hero-inline-action"
                      onClick={() => setFeedback(saveTowerPreset(index).message)}
                      type="button"
                    >
                      Salvar formacao
                    </button>
                    <button
                      className="hero-inline-action primary"
                      disabled={heroIds.length === 0}
                      onClick={() => setFeedback(applyTowerPreset(index).message)}
                      type="button"
                    >
                      Aplicar
                    </button>
                  </>
                ) : (
                  <button
                    className="hero-inline-action"
                    onClick={() => setFeedback(saveExpeditionPreset(index).message)}
                    type="button"
                  >
                    Salvar formacao
                  </button>
                )}
                <button
                  className="hero-inline-action"
                  onClick={() => setFeedback(clearTeamPresetAction(type, index).message)}
                  type="button"
                >
                  Limpar
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </article>
  );
}

export function TeamPresetsPanel() {
  return (
    <section className="team-presets-panel">
      <div className="section-heading">
        <span>Formacao React</span>
        <h2>Times salvos</h2>
        <p>Salve e aplique presets de torre e expedicao pelo core TypeScript.</p>
      </div>

      <div className="team-presets-columns">
        <PresetGroup label="Torre" type="tower" />
        <PresetGroup label="Expedicao" type="expedition" />
      </div>
    </section>
  );
}
