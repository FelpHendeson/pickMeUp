"use client";

import {
  EXPEDITION_DEFINITIONS,
  formatDuration,
  getActiveExpedition,
  getActiveExpeditionReward,
  getExpeditionDurationMs,
  getExpeditionRemainingMs,
  getExpeditionRewardName,
  getExpeditionRewardPreview,
  isExpeditionComplete,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

function getHeroNames(heroIds: string[], heroes: Array<{ id: string; name: string }>): string {
  const names = heroIds
    .map((heroId) => heroes.find((hero) => hero.id === heroId)?.name)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : "Equipe nao encontrada";
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
        <p>Leitura inicial das expedicoes usando o core TypeScript e o save normalizado.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Ativas</strong>
          <span>{state.activeExpeditions.length}/3</span>
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
        {EXPEDITION_DEFINITIONS.map((definition) => {
          const active = getActiveExpedition(state, definition.id);
          const preview = getExpeditionRewardPreview(state, definition, state.formation.filter((heroId): heroId is string => Boolean(heroId)).slice(0, 3));
          const reward = active ? getActiveExpeditionReward(state, active) || preview : preview;
          const complete = active ? isExpeditionComplete(active, now) : false;
          const remaining = active ? getExpeditionRemainingMs(active, now) : getExpeditionDurationMs(definition);
          const progress = active
            ? Math.round(
                ((getExpeditionDurationMs(definition) - getExpeditionRemainingMs(active, now)) / Math.max(1, getExpeditionDurationMs(definition))) *
                  100,
              )
            : 0;

          return (
            <article className={`expedition-card${active ? " active" : ""}${complete ? " ready" : ""}`} key={definition.id}>
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

              {active ? <small>Equipe: {getHeroNames(active.heroIds, state.heroes)}</small> : <small>Previa usa ate 3 herois da formacao atual.</small>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
