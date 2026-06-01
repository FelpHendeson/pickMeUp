"use client";

import {
  GAME_CONFIG,
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
  const setTeamPresetHeroAction = useGameStore((store) => store.setTeamPresetHero);
  const [feedback, setFeedback] = useState<string | null>(null);
  const presets = getTeamPresets(state, type);
  const slotCount = type === "tower" ? GAME_CONFIG.maxFormationSize : GAME_CONFIG.maxExpeditionHeroes;

  return (
    <article className="team-presets-card">
      <span>Times salvos</span>
      <h3>{label}</h3>
      <div className="team-presets-grid">
        {presets.map((preset, index) => {
          const heroIds = getTeamPresetHeroIds(state, type, index);
          const power = getTeamPresetPower(state, type, index);
          const slots = Array.from({ length: slotCount }, (_, slotIndex) => heroIds[slotIndex] || "");

          return (
            <div className="team-preset-row" key={preset.id}>
              <div>
                <strong>{preset.name}</strong>
                <small>Poder {power}</small>
              </div>
              <div className="team-preset-slots">
                {slots.map((heroId, slotIndex) => (
                  <select
                    className="hero-equipment-select"
                    key={`${preset.id}_${slotIndex}`}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const result = setTeamPresetHeroAction(type, index, slotIndex, value);
                      setFeedback(result.message);
                    }}
                    value={heroId}
                  >
                    <option value="">Slot vazio</option>
                    {state.heroes.map((hero) => (
                      <option key={hero.id} value={hero.id}>
                        {hero.name} ({hero.className})
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              <div className="team-preset-actions">
                {type === "tower" ? (
                  <>
                    <button className="hero-inline-action" onClick={() => setFeedback(saveTowerPreset(index).message)} type="button">
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
                  <button className="hero-inline-action" onClick={() => setFeedback(saveExpeditionPreset(index).message)} type="button">
                    Salvar formacao
                  </button>
                )}
                <button className="hero-inline-action" onClick={() => setFeedback(clearTeamPresetAction(type, index).message)} type="button">
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
        <p>Salve, edite slot a slot e aplique presets de torre e expedicao.</p>
      </div>

      <div className="team-presets-columns">
        <PresetGroup label="Torre" type="tower" />
        <PresetGroup label="Expedicao" type="expedition" />
      </div>
    </section>
  );
}
