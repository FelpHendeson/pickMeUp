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

export function RelicsPanel() {
  const state = useGameStore((store) => store.state);
  const unlockedCount = RELIC_DEFINITIONS.filter((relic) => isRelicUnlocked(state, relic)).length;
  const totalLevels = RELIC_DEFINITIONS.reduce((total, relic) => total + getRelicState(state, relic.id).level, 0);

  return (
    <section className="relics-panel">
      <div className="section-heading">
        <span>Reliquias React</span>
        <h2>Progressao permanente</h2>
        <p>Bonus globais de conta lidos pelo core TypeScript e preservados no save.</p>
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
        {RELIC_DEFINITIONS.map((relic) => {
          const relicState = getRelicState(state, relic.id);
          const unlocked = isRelicUnlocked(state, relic);
          const maxed = relicState.level >= relic.maxLevel;
          const cost = getRelicUpgradeCost(relic, relicState.level);
          const affordable = state.echoFragments >= cost;

          return (
            <article className={`relic-card${unlocked ? " unlocked" : " locked"}${maxed ? " maxed" : ""}`} key={relic.id}>
              <div className="relic-card-head">
                <div>
                  <span>{unlocked ? "Desbloqueada" : "Bloqueada"}</span>
                  <h3>{relic.name}</h3>
                </div>
                <strong>
                  Nv. {relicState.level}/{relic.maxLevel}
                </strong>
              </div>

              <p>{relic.description}</p>
              <div className="relic-effect">
                <span>Atual</span>
                <strong>{getRelicCurrentEffectText(state, relic)}</strong>
              </div>
              <div className="relic-effect next">
                <span>Proximo</span>
                <strong>{getRelicNextEffectText(state, relic)}</strong>
              </div>
              <small>{getRelicUnlockText(state, relic)}</small>
              <em>{maxed ? "Nivel maximo" : unlocked ? `${cost} Fragmentos de Eco${affordable ? "" : " necessarios"}` : "Aguardando requisito"}</em>
            </article>
          );
        })}
      </div>
    </section>
  );
}
