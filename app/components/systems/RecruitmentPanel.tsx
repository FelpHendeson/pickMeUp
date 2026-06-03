"use client";

import { getHeroPower, getRarityStars } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

export function RecruitmentPanel() {
  const state = useGameStore((store) => store.state);
  const startContractRecruitmentAction = useGameStore((store) => store.startContractRecruitment);
  const chooseRecruitmentHeroAction = useGameStore((store) => store.chooseRecruitmentHero);
  const [feedback, setFeedback] = useState<string | null>(null);
  const choice = state.pendingRecruitmentChoice;

  return (
    <section className="recruitment-panel-react">
      <div className="section-heading">
        <span>Recrutamento React</span>
        <h2>Contratos de Heroi</h2>
        <p>Abra contratos e confirme recrutamentos pelo core TypeScript.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Contratos</strong>
          <span>{state.heroContracts}</span>
        </div>
        <div>
          <strong>Escolha pendente</strong>
          <span>{choice ? "Sim" : "Nao"}</span>
        </div>
        <div>
          <strong>Opcoes</strong>
          <span>{choice?.options.length || 0}</span>
        </div>
      </div>

      {!choice ? (
        <button
          className="hero-inline-action primary"
          disabled={state.heroContracts <= 0}
          onClick={() => {
            const result = startContractRecruitmentAction();
            setFeedback(result.message);
          }}
          type="button"
        >
          Usar contrato de heroi
        </button>
      ) : null}

      {choice ? (
        <article className="recruitment-choice-card">
          <span>{choice.source}</span>
          <h3>{choice.title}</h3>
          <p>{choice.description}</p>
          <div className="recruitment-options-grid">
            {choice.options.map((hero) => (
              <div className={`recruitment-option-card rarity-${hero.rarity}`} key={hero.id}>
                <strong>{hero.name}</strong>
                <span>
                  {hero.className} | {getRarityStars(hero.rarity)}
                </span>
                <small>
                  Poder {getHeroPower(hero)} | {hero.traitName}
                </small>
                {hero.recruitmentTag ? <em>Origem: {hero.recruitmentTag}</em> : null}
                <button
                  className="hero-inline-action primary"
                  onClick={() => {
                    const result = chooseRecruitmentHeroAction(hero.id);
                    setFeedback(result.message);
                  }}
                  type="button"
                >
                  Recrutar
                </button>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <article className="recruitment-choice-card">
          <span>Sem escolha aberta</span>
          <h3>Nenhum contrato em andamento</h3>
          <p>Use um contrato para revelar tres candidatos e escolher um heroi para o elenco.</p>
        </article>
      )}

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
