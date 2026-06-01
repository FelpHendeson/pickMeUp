"use client";

import {
  ACHIEVEMENT_DEFINITIONS,
  DAILY_MISSION_DEFINITIONS,
  formatMissionReward,
  getAchievementProgress,
  getClaimableMissionCount,
  getDailyMissionProgress,
  isAchievementComplete,
  isDailyMissionComplete,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function MissionsPanel() {
  const state = useGameStore((store) => store.state);
  const claimableCount = getClaimableMissionCount(state);

  return (
    <section className="missions-panel">
      <div className="section-heading">
        <span>Missoes React</span>
        <h2>Objetivos e conquistas</h2>
        <p>Leitura inicial das missoes diarias e conquistas permanentes pelo core TypeScript.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Coletaveis</strong>
          <span>{claimableCount}</span>
        </div>
        <div>
          <strong>Diarias</strong>
          <span>{DAILY_MISSION_DEFINITIONS.length}</span>
        </div>
        <div>
          <strong>Conquistas</strong>
          <span>{ACHIEVEMENT_DEFINITIONS.length}</span>
        </div>
      </div>

      <div className="mission-columns">
        <article className="mission-list-card">
          <span>Hoje</span>
          <h3>Missoes diarias</h3>
          <div className="mission-list">
            {DAILY_MISSION_DEFINITIONS.map((mission) => {
              const progress = getDailyMissionProgress(state, mission);
              const complete = isDailyMissionComplete(state, mission);
              const claimed = Boolean(state.dailyMissions.claimed[mission.id]);

              return (
                <div className={`mission-row${complete ? " complete" : ""}${claimed ? " claimed" : ""}`} key={mission.id}>
                  <strong>{mission.title}</strong>
                  <span>{mission.description}</span>
                  <small>
                    {progress}/{mission.target} | {claimed ? "Coletada" : complete ? "Pronta" : "Em progresso"}
                  </small>
                  <em>{formatMissionReward(mission.reward)}</em>
                </div>
              );
            })}
          </div>
        </article>

        <article className="mission-list-card">
          <span>Conta</span>
          <h3>Conquistas</h3>
          <div className="mission-list">
            {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
              const progress = getAchievementProgress(state, achievement);
              const complete = isAchievementComplete(state, achievement);
              const claimed = Boolean(state.achievements[achievement.id]?.claimed);

              return (
                <div className={`mission-row${complete ? " complete" : ""}${claimed ? " claimed" : ""}`} key={achievement.id}>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                  <small>
                    {progress}/{achievement.target} | {claimed ? "Coletada" : complete ? "Pronta" : "Em progresso"}
                  </small>
                  <em>{formatMissionReward(achievement.reward)}</em>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
