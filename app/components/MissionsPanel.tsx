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
import { useState } from "react";

export function MissionsPanel() {
  const state = useGameStore((store) => store.state);
  const claimDailyMission = useGameStore((store) => store.claimDailyMission);
  const claimAchievement = useGameStore((store) => store.claimAchievement);
  const [feedback, setFeedback] = useState<string | null>(null);
  const claimableCount = getClaimableMissionCount(state);

  return (
    <section className="missions-panel">
      <div className="section-heading">
        <span>Missoes React</span>
        <h2>Objetivos e conquistas</h2>
        <p>Colete recompensas de missoes diarias e conquistas pelo core TypeScript.</p>
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
              const canClaim = complete && !claimed;

              return (
                <div className={`mission-row${complete ? " complete" : ""}${claimed ? " claimed" : ""}`} key={mission.id}>
                  <strong>{mission.title}</strong>
                  <span>{mission.description}</span>
                  <small>
                    {progress}/{mission.target} | {claimed ? "Coletada" : complete ? "Pronta" : "Em progresso"}
                  </small>
                  <em>{formatMissionReward(mission.reward)}</em>
                  {canClaim ? (
                    <button
                      className="hero-inline-action primary"
                      onClick={() => {
                        const result = claimDailyMission(mission.id);
                        setFeedback(result.message);
                      }}
                      type="button"
                    >
                      Coletar recompensa
                    </button>
                  ) : null}
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
              const canClaim = complete && !claimed;

              return (
                <div className={`mission-row${complete ? " complete" : ""}${claimed ? " claimed" : ""}`} key={achievement.id}>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                  <small>
                    {progress}/{achievement.target} | {claimed ? "Coletada" : complete ? "Pronta" : "Em progresso"}
                  </small>
                  <em>{formatMissionReward(achievement.reward)}</em>
                  {canClaim ? (
                    <button
                      className="hero-inline-action primary"
                      onClick={() => {
                        const result = claimAchievement(achievement.id);
                        setFeedback(result.message);
                      }}
                      type="button"
                    >
                      Coletar recompensa
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
