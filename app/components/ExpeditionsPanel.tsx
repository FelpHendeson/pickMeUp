"use client";

import {
  EXPEDITION_DEFINITIONS,
  GAME_CONFIG,
  applyExpeditionPresetToExpeditionSelection,
  formatDuration,
  getActiveExpedition,
  getActiveExpeditionReward,
  getExpeditionDurationMs,
  getExpeditionRemainingMs,
  getExpeditionRewardName,
  getExpeditionRewardPreview,
  getTeamPresets,
  isExpeditionComplete,
  isHeroOnExpedition,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

const MAX_ACTIVE_EXPEDITIONS = 3;

function getHeroNames(heroIds: string[], heroes: Array<{ id: string; name: string }>): string {
  const names = heroIds
    .map((heroId) => heroes.find((hero) => hero.id === heroId)?.name)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : "Equipe nao encontrada";
}

function ExpeditionCard({
  definition,
  now,
}: {
  definition: (typeof EXPEDITION_DEFINITIONS)[number];
  now: number;
}) {
  const state = useGameStore((store) => store.state);
  const startExpeditionAction = useGameStore((store) => store.startExpedition);
  const collectExpeditionAction = useGameStore((store) => store.collectExpedition);
  const [selectedHeroIds, setSelectedHeroIds] = useState<string[]>(() =>
    state.formation.filter((heroId): heroId is string => Boolean(heroId)).slice(0, GAME_CONFIG.maxExpeditionHeroes),
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const active = getActiveExpedition(state, definition.id);
  const preview = getExpeditionRewardPreview(
    state,
    definition,
    selectedHeroIds.length > 0 ? selectedHeroIds : state.formation.filter((heroId): heroId is string => Boolean(heroId)).slice(0, 3),
  );
  const reward = active ? getActiveExpeditionReward(state, active) || preview : preview;
  const complete = active ? isExpeditionComplete(active, now) : false;
  const remaining = active ? getExpeditionRemainingMs(active, now) : getExpeditionDurationMs(state, definition);
  const durationMs = getExpeditionDurationMs(state, definition);
  const progress = active
    ? Math.round(((durationMs - getExpeditionRemainingMs(active, now)) / Math.max(1, durationMs)) * 100)
    : 0;
  const availableHeroes = useMemo(
    () => state.heroes.filter((hero) => !isHeroOnExpedition(state, hero.id)),
    [state],
  );
  const canStart =
    !active &&
    state.activeExpeditions.length < MAX_ACTIVE_EXPEDITIONS &&
    selectedHeroIds.length > 0 &&
    selectedHeroIds.length <= GAME_CONFIG.maxExpeditionHeroes;

  const toggleHero = (heroId: string) => {
    setSelectedHeroIds((current) => {
      if (current.includes(heroId)) return current.filter((id) => id !== heroId);
      if (current.length >= GAME_CONFIG.maxExpeditionHeroes) return current;
      return [...current, heroId];
    });
  };

  return (
    <article className={`expedition-card${active ? " active" : ""}${complete ? " ready" : ""}`}>
      <div className="expedition-card-head">
        <div>
          <span>{active ? (complete ? "Pronta" : "Em andamento") : "Disponivel"}</span>
          <h3>{definition.name}</h3>
        </div>
        <strong>{formatDuration(remaining)}</strong>
      </div>

      <p>{definition.description}</p>

      <div className="expedition-progress">
        <i>
          <b style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </i>
      </div>

      <div className="expedition-stats">
        <span>Poder recomendado: {definition.recommendedPower}</span>
        <span>
          Recompensa: {reward.amount} {getExpeditionRewardName(reward.type)}
        </span>
        <span>Multiplicador: {Math.round((reward.multiplier || 1) * 100)}%</span>
      </div>

      {active ? (
        <>
          <small>Equipe: {getHeroNames(active.heroIds, state.heroes)}</small>
          {complete ? (
            <button
              className="hero-inline-action primary"
              onClick={() => {
                const result = collectExpeditionAction(definition.id);
                setFeedback(result.message);
              }}
              type="button"
            >
              Coletar recompensa
            </button>
          ) : null}
        </>
      ) : (
        <>
          <div className="expedition-preset-row">
            {getTeamPresets(state, "expedition").map((preset, index) => (
              <button
                className="hero-inline-action"
                key={preset.id}
                onClick={() => {
                  const result = applyExpeditionPresetToExpeditionSelection(state, index);
                  if (result.ok) setSelectedHeroIds(result.heroIds);
                  setFeedback(result.message);
                }}
                type="button"
              >
                Carregar {preset.name}
              </button>
            ))}
          </div>
          <div className="expedition-hero-picker">
            {availableHeroes.length > 0 ? (
              availableHeroes.slice(0, 8).map((hero) => (
                <label className="expedition-hero-option" key={hero.id}>
                  <input
                    checked={selectedHeroIds.includes(hero.id)}
                    onChange={() => toggleHero(hero.id)}
                    type="checkbox"
                  />
                  <span>{hero.name}</span>
                </label>
              ))
            ) : (
              <small>Nenhum heroi livre para enviar.</small>
            )}
          </div>
          <button
            className="hero-inline-action primary"
            disabled={!canStart}
            onClick={() => {
              const result = startExpeditionAction(definition.id, selectedHeroIds);
              setFeedback(result.message);
            }}
            type="button"
          >
            Iniciar expedicao ({selectedHeroIds.length}/{GAME_CONFIG.maxExpeditionHeroes})
          </button>
        </>
      )}

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </article>
  );
}

export function ExpeditionsPanel() {
  const state = useGameStore((store) => store.state);
  const now = Date.now();
  const readyCount = state.activeExpeditions.filter((expedition) => isExpeditionComplete(expedition, now)).length;

  return (
    <section className="expeditions-panel">
      <div className="section-heading">
        <span>Expedicoes React</span>
        <h2>Rotas disponiveis</h2>
        <p>Inicie e colete expedicoes pelo core TypeScript com persistencia no save legado.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Ativas</strong>
          <span>
            {state.activeExpeditions.length}/{MAX_ACTIVE_EXPEDITIONS}
          </span>
        </div>
        <div>
          <strong>Prontas</strong>
          <span>{readyCount}</span>
        </div>
        <div>
          <strong>Rotas</strong>
          <span>{EXPEDITION_DEFINITIONS.length}</span>
        </div>
      </div>

      <div className="expedition-grid">
        {EXPEDITION_DEFINITIONS.map((definition) => (
          <ExpeditionCard definition={definition} key={definition.id} now={now} />
        ))}
      </div>
    </section>
  );
}
