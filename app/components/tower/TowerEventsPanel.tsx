"use client";

import {
  canChooseTowerEventOption,
  getTowerEventDefinition,
  getTowerEventPhaseLabel,
  getTowerEventResourceName,
  resolveTowerEventChoice,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function TowerEventsPanel() {
  const state = useGameStore((store) => store.state);
  const resolveEvent = useGameStore((store) => store.resolveTowerEventChoice);
  const event = state.pendingTowerEvent;
  const definition = event ? getTowerEventDefinition(event.typeKey) : null;
  const plannedPost = state.plannedTowerPostEvent;
  const activeEffects = state.towerBattleEffects.filter((effect) => effect.scope === "nextBattle");
  const recentHistory = state.towerEventHistory.slice(0, 4);

  if (!event && !plannedPost && activeEffects.length === 0 && recentHistory.length === 0) {
    return (
      <section className="tower-events-panel">
        <div className="section-heading">
          <span>Eventos da Torre</span>
          <h2>Nenhum evento pendente</h2>
          <p>A proxima tentativa na torre pode gerar eventos antes ou depois do combate.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="tower-events-panel">
      <div className="section-heading">
        <span>Eventos da Torre</span>
        <h2>Estado dos eventos</h2>
        <p>Leitura e resolucao dos eventos pendentes pelo core TypeScript.</p>
      </div>

      {plannedPost && !event ? (
        <article className="tower-event-card tone-support">
          <span>Evento pos-combate agendado</span>
          <h3>{getTowerEventDefinition(plannedPost.typeKey)?.title ?? plannedPost.typeKey}</h3>
          <p>
            Andar {plannedPost.floor}
            {plannedPost.floorTitle ? `: ${plannedPost.floorTitle}` : ""}. Sera ativado apos vencer o combate.
          </p>
        </article>
      ) : null}

      {event && definition ? (
        <article className={`tower-event-card tone-${definition.tone}`}>
          <div className="tower-event-head">
            <div>
              <span>{getTowerEventPhaseLabel(event.phase)}</span>
              <h3>{definition.title}</h3>
            </div>
            <strong>Andar {event.floor}</strong>
          </div>
          <p>{definition.description}</p>
          <p className="tower-event-next-step">
            {event.phase === "pre"
              ? "A escolha sera aplicada e o combate comecara em seguida."
              : "A escolha sera aplicada ao progresso atual da torre."}
          </p>
          <div className="tower-event-choice-grid">
            {definition.choices.map((choice) => {
              const availability = canChooseTowerEventOption(state, event, choice.id);
              const costText = choice.cost
                ? ` (${choice.cost.amount} ${getTowerEventResourceName(choice.cost.resource)})`
                : "";

              return (
                <button
                  className="tower-event-choice"
                  disabled={!availability.ok}
                  key={choice.id}
                  onClick={() => resolveEvent(choice.id)}
                  type="button"
                >
                  <strong>{choice.label}</strong>
                  <span>
                    {choice.description}
                    {costText}
                  </span>
                  {!availability.ok && availability.message ? <em>{availability.message}</em> : null}
                </button>
              );
            })}
          </div>
        </article>
      ) : null}

      {activeEffects.length > 0 ? (
        <div className="tower-effect-list">
          <h3>Efeitos na proxima luta</h3>
          {activeEffects.map((effect) => (
            <div className="tower-effect-item" key={effect.id}>
              <strong>{effect.label}</strong>
              <span>{effect.description}</span>
            </div>
          ))}
        </div>
      ) : null}

      {recentHistory.length > 0 ? (
        <div className="tower-event-history">
          <h3>Historico recente</h3>
          {recentHistory.map((entry) => (
            <div className="tower-history-item" key={entry.id}>
              <strong>
                {entry.title} | Andar {entry.floor}
              </strong>
              <span>
                {entry.choice}: {entry.message}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
