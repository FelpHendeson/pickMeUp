"use client";

import { getBattleEvents } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function BattleResultPanel() {
  const battle = useGameStore((store) => store.state.lastBattle);

  if (!battle) {
    return (
      <section className="battle-result-panel">
        <div className="section-heading">
          <span>Combate React</span>
          <h2>Nenhum combate recente</h2>
          <p>O ultimo resultado da torre aparecera aqui quando existir no save.</p>
        </div>
      </section>
    );
  }

  const events = getBattleEvents(battle).slice(-6);
  const topPerformers = Object.values(battle.performance || {})
    .sort((a, b) => b.damageDealt - a.damageDealt || b.kills - a.kills)
    .slice(0, 3);

  return (
    <section className="battle-result-panel">
      <div className="section-heading">
        <span>Combate React</span>
        <h2>Ultimo resultado</h2>
        <p>Leitura inicial do combate automatico salvo pelo jogo legado.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Resultado</strong>
          <span>{battle.result === "victory" ? "Vitoria" : "Derrota"}</span>
        </div>
        <div>
          <strong>Andar</strong>
          <span>{battle.floor}</span>
        </div>
        <div>
          <strong>Turnos</strong>
          <span>{battle.rounds}</span>
        </div>
      </div>

      {topPerformers.length > 0 ? (
        <div className="battle-performance-grid">
          {topPerformers.map((entry) => (
            <article className="battle-performance-card" key={entry.id}>
              <strong>{entry.name}</strong>
              <span>{entry.className}</span>
              <small>
                Dano {entry.damageDealt} | Cura {entry.healingDone} | Abates {entry.kills}
              </small>
            </article>
          ))}
        </div>
      ) : null}

      <div className="battle-event-log">
        <h3>Eventos recentes</h3>
        {events.map((event, index) => (
          <div className={`battle-event-line type-${event.type}`} key={`${event.message}_${index}`}>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
