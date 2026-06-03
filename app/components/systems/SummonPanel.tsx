"use client";

import { getAdjustedSummonRarityTable, getSummonCost } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

function Rates({ type }: { type: "common" | "superior" }) {
  return (
    <div className="summon-rates">
      {getAdjustedSummonRarityTable(type).map((entry) => (
        <span key={`${type}-${entry.rarity}`}>
          {entry.rarity} estrela(s): {entry.chance}%
        </span>
      ))}
    </div>
  );
}

export function SummonPanel() {
  const state = useGameStore((store) => store.state);
  const summonHeroAction = useGameStore((store) => store.summonHero);
  const [feedback, setFeedback] = useState<string | null>(null);
  const commonCost = getSummonCost(state, "common");
  const superiorCost = getSummonCost(state, "superior");
  const lastSummons = state.summonHistory.slice(0, 6);

  return (
    <section className="summon-panel-react">
      <div className="section-heading">
        <span>Portal Migrado</span>
        <h2>Invocacao</h2>
        <p>Invoque herois pelo core TypeScript com persistencia no save local e na nuvem.</p>
      </div>

      <div className="summon-grid-react">
        <article className="summon-card-react">
          <span>Comum</span>
          <h3>Invocacao comum</h3>
          <p>
            Custo: {commonCost.amount} {commonCost.resource === "gold" ? "ouro" : "cristais"}.
          </p>
          <Rates type="common" />
          <button
            className="hero-inline-action primary"
            onClick={() => {
              const result = summonHeroAction("common");
              setFeedback(result.message);
            }}
            type="button"
          >
            Invocar comum
          </button>
        </article>

        <article className="summon-card-react superior">
          <span>Superior</span>
          <h3>Invocacao superior</h3>
          <p>
            Custo: {superiorCost.amount} {superiorCost.resource === "gold" ? "ouro" : "cristais"}.
          </p>
          <Rates type="superior" />
          <button
            className="hero-inline-action primary"
            onClick={() => {
              const result = summonHeroAction("superior");
              setFeedback(result.message);
            }}
            type="button"
          >
            Invocar superior
          </button>
        </article>
      </div>

      <article className="summon-history-react">
        <span>Historico</span>
        <h3>Ultimos chamados</h3>
        {lastSummons.length > 0 ? (
          <div className="history-list-react">
            {lastSummons.map((entry) => (
              <small key={`${entry.id}-${entry.at}`}>
                {entry.name} - {entry.className} - {entry.rarity} estrela(s) - {entry.type === "superior" ? "Superior" : "Comum"}
              </small>
            ))}
          </div>
        ) : (
          <p>Nenhuma invocacao registrada neste save.</p>
        )}
      </article>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
