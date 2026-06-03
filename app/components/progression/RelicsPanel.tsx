"use client";

import {
  getRelicCurrentEffectText,
  getRelicNextEffectText,
  getRelicState,
  getRelicUnlockText,
  getRelicUpgradeCost,
  isRelicUnlocked,
  RELIC_DEFINITIONS,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

export function RelicsPanel() {
  const state = useGameStore((store) => store.state);
  const upgradeRelicAction = useGameStore((store) => store.upgradeRelic);
  const [feedback, setFeedback] = useState<string | null>(null);
  const unlockedCount = RELIC_DEFINITIONS.filter((relic) => isRelicUnlocked(state, relic)).length;
  const totalLevels = RELIC_DEFINITIONS.reduce((total, relic) => total + getRelicState(state, relic.id).level, 0);
  const relicCards = RELIC_DEFINITIONS.map((relic) => {
    const relicState = getRelicState(state, relic.id);
    const unlocked = isRelicUnlocked(state, relic);
    const maxed = relicState.level >= relic.maxLevel;
    const cost = getRelicUpgradeCost(relic, relicState.level);
    const affordable = state.echoFragments >= cost;
    const canUpgrade = unlocked && !maxed && affordable;
    const priority = canUpgrade ? 0 : unlocked ? 1 : 2;
    return { relic, relicState, unlocked, maxed, cost, affordable, canUpgrade, priority };
  }).sort((a, b) => a.priority - b.priority || b.relicState.level - a.relicState.level || a.relic.name.localeCompare(b.relic.name));
  const upgradeableCount = relicCards.filter((entry) => entry.canUpgrade).length;

  return (
    <section className="relics-panel">
      <div className="section-heading">
        <span>Reliquias</span>
        <h2>Progressao permanente</h2>
        <p>Priorize melhorias permanentes da conta usando Fragmentos de Eco.</p>
      </div>

      <div className="relic-echo-banner">
        <div>
          <span>Fragmentos de Eco</span>
          <strong>{state.echoFragments}</strong>
        </div>
        <p>{upgradeableCount > 0 ? `${upgradeableCount} reliquia(s) podem ser aprimoradas agora.` : "Acumule fragmentos em chefes, conquistas e recompensas raras."}</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Fragmentos de Eco</strong>
          <span>{state.echoFragments}</span>
        </div>
        <div>
          <strong>Desbloqueadas</strong>
          <span>
            {unlockedCount}/{RELIC_DEFINITIONS.length}
          </span>
        </div>
        <div>
          <strong>Niveis totais</strong>
          <span>{totalLevels}</span>
        </div>
      </div>

      <div className="relic-grid">
        {relicCards.map(({ relic, relicState, unlocked, maxed, cost, affordable, canUpgrade }) => {
          return (
            <article className={`relic-card${unlocked ? " unlocked" : " locked"}${maxed ? " maxed" : ""}${canUpgrade ? " upgradeable" : ""}`} key={relic.id}>
              <div className="relic-card-head">
                <div>
                  <span>{canUpgrade ? "Pode aprimorar" : unlocked ? "Desbloqueada" : "Bloqueada"}</span>
                  <h3>{relic.name}</h3>
                </div>
                <strong>
                  Nv. {relicState.level}/{relic.maxLevel}
                </strong>
              </div>

              <p>{unlocked ? relic.description : "Complete o requisito para revelar e aprimorar esta reliquia."}</p>
              {canUpgrade ? <b className="relic-upgrade-badge">Pode aprimorar</b> : null}
              {unlocked ? (
                <>
                  <div className="relic-effect">
                    <span>Atual</span>
                    <strong>{getRelicCurrentEffectText(state, relic)}</strong>
                  </div>
                  <div className="relic-effect next">
                    <span>Proximo</span>
                    <strong>{getRelicNextEffectText(state, relic)}</strong>
                  </div>
                </>
              ) : null}
              <small>{unlocked ? "Desbloqueada" : getRelicUnlockText(state, relic)}</small>
              <em>{maxed ? "Nivel maximo" : unlocked ? `${cost} Fragmentos de Eco${affordable ? "" : " necessarios"}` : "Aguardando requisito"}</em>
              {canUpgrade ? (
                <button
                  className="hero-inline-action primary"
                  onClick={() => {
                    const result = upgradeRelicAction(relic.id);
                    setFeedback(result.message);
                  }}
                  type="button"
                >
                  Aprimorar ({cost} fragmentos)
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
