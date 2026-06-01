"use client";

import {
  advanceBattlePlayback,
  createBattlePlaybackState,
  getBattleEvents,
  getBattlePlaybackDelay,
  getDefaultBattleSpeed,
  setBattlePlaybackSpeed,
  type BattleSpeed,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useState } from "react";

const speedOptions: BattleSpeed[] = ["1x", "2x", "instant"];

export function BattleResultPanel() {
  const battle = useGameStore((store) => store.state.lastBattle);
  const [speed, setSpeed] = useState<BattleSpeed>(() => getDefaultBattleSpeed());
  const [eventCursor, setEventCursor] = useState(1);

  const allEvents = useMemo(() => (battle ? getBattleEvents(battle) : []), [battle]);
  const visibleEvents = allEvents.slice(0, Math.max(1, Math.min(eventCursor, allEvents.length || 1)));

  useEffect(() => {
    if (!battle) return;
    const initial = createBattlePlaybackState(battle, speed);
    setEventCursor(initial.eventCursor);
  }, [battle, battle?.floor, battle?.rounds, battle?.result, battle?.log?.length]);

  useEffect(() => {
    if (!battle || speed === "instant" || eventCursor >= allEvents.length) return;

    const delay = getBattlePlaybackDelay(speed);
    const timer = window.setInterval(() => {
      setEventCursor((current) => advanceBattlePlayback(current, allEvents.length, speed));
    }, delay);

    return () => window.clearInterval(timer);
  }, [allEvents.length, battle, eventCursor, speed]);

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

  const events = visibleEvents;
  const topPerformers = Object.values(battle.performance || {})
    .sort((a, b) => b.damageDealt - a.damageDealt || b.kills - a.kills)
    .slice(0, 3);

  return (
    <section className="battle-result-panel">
      <div className="section-heading">
        <span>Combate React</span>
        <h2>Ultimo resultado</h2>
        <p>Replay do combate automatico com velocidade configuravel.</p>
      </div>

      <div className="battle-speed-row">
        {speedOptions.map((option) => (
          <button
            className={speed === option ? "hero-inline-action primary" : "hero-inline-action"}
            key={option}
            onClick={() => {
              setSpeed(option);
              setEventCursor((current) => setBattlePlaybackSpeed(speed, option, current));
            }}
            type="button"
          >
            {option === "instant" ? "Instantaneo" : option}
          </button>
        ))}
        <small>
          Evento {Math.min(eventCursor, allEvents.length)}/{allEvents.length}
        </small>
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
        <h3>Replay do combate</h3>
        {events.map((event, index) => (
          <div className={`battle-event-line type-${event.type}`} key={`${event.message}_${index}`}>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
