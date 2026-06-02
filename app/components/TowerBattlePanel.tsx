"use client";

import {
  canSpendResource,
  GAME_CONFIG,
  getFormationHeroCount,
  getFormationPower,
  getTowerDifficultySummary,
  normalizeTowerDifficultyMode,
  type RunTowerBattleResult,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

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

export function TowerBattlePanel() {
  const state = useGameStore((store) => store.state);
  const startTowerBattle = useGameStore((store) => store.startTowerBattle);
  const [difficultyMode, setDifficultyMode] = useState<(typeof difficultyModes)[number]>("normal");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const normalizedDifficulty = normalizeTowerDifficultyMode(difficultyMode);
  const difficultySummary = getTowerDifficultySummary(normalizedDifficulty);
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
    <section className="tower-battle-panel">
      <div className="section-heading">
        <span>Combate React</span>
        <h2>Tentativa na Torre</h2>
        <p>Inicia o fluxo completo pelo core TypeScript e persiste no save local deste navegador.</p>
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
        <span>Modo selecionado</span>
        <h3>{difficultySummary.name}</h3>
        <p>
          Inimigos {difficultySummary.enemyPower} | Recompensa {difficultySummary.reward} | Risco {difficultySummary.injuryRisk}
        </p>
        <p>{difficultySummary.permanentDeath}</p>
      </article>

      <button
        className="tower-start-battle-button"
        disabled={!canStart}
        onClick={() => {
          if (normalizedDifficulty === "hardcore" && !window.confirm("Iniciar combate no modo Hardcore? Herois que cairem podem morrer permanentemente.")) {
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
