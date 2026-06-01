"use client";

import { useMemo } from "react";
import { describeReward, getFloorData, getFloorModifierSummary, getTowerChapterByFloor, getWeeklyTowerRewardOptions, TOWER_FLOORS } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

function clampFloor(floor: number): number {
  return Math.min(40, Math.max(1, Math.floor(Number(floor) || 1)));
}

export function TowerCampaignPanel() {
  const state = useGameStore((store) => store.state);
  const currentFloor = clampFloor(state.towerFloor);
  const currentChapter = getTowerChapterByFloor(currentFloor);
  const currentFloorData = getFloorData(currentFloor);
  const weeklyRewardOptions = getWeeklyTowerRewardOptions();
  const visibleFloors = useMemo(
    () =>
      TOWER_FLOORS.filter((floor) => floor.floor >= currentChapter.startFloor && floor.floor <= currentChapter.endFloor).slice(0, 10),
    [currentChapter.endFloor, currentChapter.startFloor],
  );
  const completedInChapter = Math.max(0, Math.min(currentFloor - currentChapter.startFloor, currentChapter.endFloor - currentChapter.startFloor + 1));
  const totalInChapter = currentChapter.endFloor - currentChapter.startFloor + 1;
  const progressPercent = Math.round((completedInChapter / totalInChapter) * 100);

  return (
    <section className="tower-panel">
      <div className="section-heading">
        <span>Campanha da Torre</span>
        <h2>
          Capitulo {currentChapter.number}: {currentChapter.name}
        </h2>
        <p>{currentChapter.description}</p>
      </div>

      <div className="tower-summary">
        <div>
          <strong>Andar atual</strong>
          <span>{currentFloor}</span>
        </div>
        <div>
          <strong>Chefe final</strong>
          <span>{currentChapter.finalBoss}</span>
        </div>
        <div>
          <strong>Progresso</strong>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <div className="progress-track" aria-label={`Progresso do capitulo em ${progressPercent}%`}>
        <div style={{ width: `${progressPercent}%` }} />
      </div>

      {currentFloorData ? (
        <article className="current-floor-card">
          <span>Proximo combate</span>
          <h3>
            {currentFloorData.floor}. {currentFloorData.title}
          </h3>
          <p>{currentFloorData.mechanic}</p>
          <small>{getFloorModifierSummary(currentFloorData) || "Sem modificador adicional alem da regiao."}</small>
          <small>{describeReward(currentFloorData.floor, weeklyRewardOptions)}</small>
        </article>
      ) : null}

      <div className="floor-strip">
        {visibleFloors.map((floor) => {
          const status = floor.floor < currentFloor ? "completed" : floor.floor === currentFloor ? "current" : "locked";
          return (
            <div className={`floor-chip ${status}`} key={floor.floor}>
              <strong>{floor.floor}</strong>
              <span>{floor.title}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
