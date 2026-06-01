"use client";

import { getHeroPower, getRarityStars } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function RecruitmentPanel() {
  const state = useGameStore((store) => store.state);
  const choice = state.pendingRecruitmentChoice;

  return (
    <section className="recruitment-panel-react">
      <div className="section-heading">
        <span>Recrutamento React</span>
        <h2>Contratos de Heroi</h2>
        <p>Leitura inicial dos contratos e escolhas pendentes pelo core TypeScript.</p>
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
              </div>
            ))}
          </div>
        </article>
      ) : (
        <article className="recruitment-choice-card">
          <span>Sem escolha aberta</span>
          <h3>Nenhum contrato em andamento</h3>
          <p>Use contratos no jogo legado por enquanto. A tela React ja consegue ler e exibir a escolha quando existir.</p>
        </article>
      )}
    </section>
  );
}
