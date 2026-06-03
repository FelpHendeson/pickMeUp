"use client";

import {
  canSpendResource,
  describeReward,
  GAME_CONFIG,
  getFloorData,
  getFloorModifierSummary,
  getFormationHeroCount,
  getFormationPower,
  getTowerDifficultySummary,
  getTowerChapterByFloor,
  getWeeklyTowerRewardOptions,
  isBossFloor,
  normalizeTowerDifficultyMode,
  type RunTowerBattleResult,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";
import { useConfirmDialog } from "../ui";

const difficultyModes = ["normal", "challenge", "hardcore"] as const;

function formatBattleMessage(result: RunTowerBattleResult): string {
  if (!result.ok) return result.message;
  if ("narrative" in result && result.narrative) return result.message;
  if ("event" in result && result.event) return result.message;
  if ("battle" in result) {
    return result.battle.result === "victory"
      ? `Combate vencido no andar ${result.battle.floor}. Recompensas aplicadas.`
      : `Combate perdido no andar ${result.battle.floor}.`;
  }
  return "Combate concluido.";
}

export function TowerBattlePanel({ priority = "primary" }: { priority?: "primary" | "blocked-by-event" | "after-result" }) {
  const state = useGameStore((store) => store.state);
  const startTowerBattle = useGameStore((store) => store.startTowerBattle);
  const confirmDialog = useConfirmDialog();
  const [difficultyMode, setDifficultyMode] = useState<(typeof difficultyModes)[number]>("normal");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const normalizedDifficulty = normalizeTowerDifficultyMode(difficultyMode);
  const difficultySummary = getTowerDifficultySummary(normalizedDifficulty);
  const currentChapter = getTowerChapterByFloor(state.towerFloor);
  const currentFloor = getFloorData(state.towerFloor);
  const modifierSummary = currentFloor ? getFloorModifierSummary(currentFloor) : "";
  const rewardPreview = describeReward(state.towerFloor, getWeeklyTowerRewardOptions());
  const bossFloor = isBossFloor(state.towerFloor);
  const heroCount = getFormationHeroCount(state);
  const formationPower = getFormationPower(state);
  const energy = state.resources.energy;
  const canStart =
    heroCount > 0 &&
    !state.pendingTowerEvent &&
    canSpendResource(state, "energy", GAME_CONFIG.towerEnergyCost);

  const statusMessage = useMemo(() => {
    if (state.pendingTowerEvent) return "Resolva o evento pendente antes de iniciar o combate.";
    if (heroCount === 0) return "Monte uma formacao com herois no save atual.";
    if (energy < GAME_CONFIG.towerEnergyCost) return `Energia insuficiente (${energy}/${GAME_CONFIG.towerEnergyCost}).`;
    return `Pronto para lutar no andar ${state.towerFloor}.`;
  }, [energy, heroCount, state.pendingTowerEvent, state.towerFloor]);

  return (
    <section className={`tower-battle-panel tower-battle-${priority}`}>
      <div className="section-heading">
        <span>{priority === "blocked-by-event" ? "Combate bloqueado por evento" : priority === "after-result" ? "Proxima tentativa" : "Preparacao"}</span>
        <h2>{currentFloor ? `${state.towerFloor}. ${currentFloor.title}` : "Tentativa na Torre"}</h2>
        <p>
          Capitulo {currentChapter.number}: {currentChapter.name}. {bossFloor ? `Chefe: ${currentChapter.finalBoss}.` : "Prepare a equipe para o proximo andar."}
        </p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Formacao</strong>
          <span>{heroCount} heroi(s)</span>
        </div>
        <div>
          <strong>Poder</strong>
          <span>{formationPower}</span>
        </div>
        <div>
          <strong>Energia</strong>
          <span>
            {energy}/{state.resources.maxEnergy}
          </span>
        </div>
        <div>
          <strong>Dificuldade</strong>
          <span>{difficultySummary.name}</span>
        </div>
        <div>
          <strong>Risco</strong>
          <span>{difficultySummary.injuryRisk}</span>
        </div>
        <div>
          <strong>Recompensa</strong>
          <span>{difficultySummary.reward}</span>
        </div>
      </div>

      <p className="tower-event-next-step">{statusMessage}</p>

      <div className="tower-difficulty-picker">
        {difficultyModes.map((mode) => (
          <button
            className={normalizedDifficulty === mode ? "tower-event-choice active" : "tower-event-choice"}
            key={mode}
            onClick={() => setDifficultyMode(mode)}
            type="button"
          >
            <strong>{getTowerDifficultySummary(mode).name}</strong>
            <span>{getTowerDifficultySummary(mode).description}</span>
          </button>
        ))}
      </div>

      <article className="tower-event-card tone-support">
        <span>Previsao do andar</span>
        <h3>{bossFloor ? "Andar de chefe" : "Combate regular"}</h3>
        <p>
          Inimigos {difficultySummary.enemyPower} | Recompensa {difficultySummary.reward} | Risco {difficultySummary.injuryRisk}
        </p>
        <p>{difficultySummary.permanentDeath}</p>
        <small>{modifierSummary || "Sem modificador adicional alem da regiao."}</small>
        <small>{rewardPreview}</small>
      </article>

      <button
        className="tower-start-battle-button"
        disabled={!canStart}
        onClick={async () => {
          if (normalizedDifficulty === "hardcore") {
            const confirmed = await confirmDialog({
              title: "Iniciar modo Hardcore?",
              description: "Heróis que caírem neste modo podem morrer permanentemente. Esta tentativa deve ser tratada como uma decisão de alto risco.",
              confirmLabel: "Iniciar Hardcore",
              tone: "danger",
            });
            if (!confirmed) {
              return;
            }
          }
          if (!canStart) {
            return;
          }
          const result = startTowerBattle({ difficultyMode: normalizedDifficulty });
          setLastMessage(formatBattleMessage(result));
        }}
        type="button"
      >
        Iniciar combate ({GAME_CONFIG.towerEnergyCost} energia)
      </button>

      {lastMessage ? <p className="tower-battle-feedback">{lastMessage}</p> : null}
    </section>
  );
}
