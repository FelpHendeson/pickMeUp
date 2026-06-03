"use client";

import { canRepeatTowerFloor, describeReward, getWeeklyTowerRewardOptions, TOWER_FLOORS } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

export function RepeatFloorsPanel() {
  const state = useGameStore((store) => store.state);
  const startRepeatTowerBattle = useGameStore((store) => store.startRepeatTowerBattle);
  const [feedback, setFeedback] = useState<string | null>(null);
  const weeklyRewardOptions = getWeeklyTowerRewardOptions();
  const repeatableFloors = TOWER_FLOORS.filter((floor) => canRepeatTowerFloor(state, floor.floor));

  if (repeatableFloors.length === 0) return null;

  return (
    <section className="repeat-floors-panel">
      <details className="repeat-floors-details">
        <summary>
          <span>Andares repetiveis</span>
          <strong>{repeatableFloors.length} andar(es) liberado(s)</strong>
        </summary>
        <p>Repita andares ja vencidos para farmar recompensas sem avancar a campanha.</p>
        <div className="repeat-floor-grid">
          {repeatableFloors.slice(-8).map((floor) => (
            <article className="repeat-floor-card" key={floor.floor}>
              <strong>
                {floor.floor}. {floor.title}
              </strong>
              <span>{describeReward(floor.floor, weeklyRewardOptions)}</span>
              <button
                className="hero-inline-action primary"
                onClick={() => {
                  const result = startRepeatTowerBattle(floor.floor);
                  setFeedback(result.ok && "battle" in result ? `Repeticao do andar ${floor.floor} concluida.` : "message" in result ? result.message : "Combate concluido.");
                }}
                type="button"
              >
                Repetir andar
              </button>
            </article>
          ))}
        </div>
        {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
      </details>
    </section>
  );
}
