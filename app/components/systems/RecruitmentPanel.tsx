"use client";

import { getHeroPower, getRarityStars, type Hero, type StatKey } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

type RecruitmentPanelProps = {
  onViewFormation?: () => void;
  onViewHeroes?: () => void;
};

const statLabels: Record<StatKey, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spd: "VEL",
  focus: "FOCO",
  luck: "SORTE",
};

function getRarityLabel(rarity: number): string {
  if (rarity >= 5) return "Lendário";
  if (rarity === 4) return "Épico";
  if (rarity === 3) return "Raro";
  if (rarity === 2) return "Incomum";
  return "Comum";
}

function getSourceLabel(source?: string): string {
  if (source === "veteran") return "Veterano da Torre";
  if (source === "contract") return "Contrato da guilda";
  return "Oferta da guilda";
}

function getCandidatePitch(hero: Hero): string {
  const highestStat = getTopStats(hero, 1)[0]?.label;
  if (hero.rarity >= 4) return `Presença rara para decisões de longo prazo${highestStat ? `, com destaque em ${highestStat}` : ""}.`;
  if (hero.classKey === "guardian" || hero.classKey === "warrior") return "Boa opção para segurar a linha de frente e estabilizar a formação.";
  if (hero.classKey === "priest") return "Escolha segura para sustentar a equipe em subidas mais longas.";
  if (hero.classKey === "mage" || hero.classKey === "archer" || hero.classKey === "rogue") return "Reforço ofensivo para encurtar combates e reduzir risco.";
  return "Candidato flexível para preencher lacunas do elenco atual.";
}

function getTopStats(hero: Hero, amount = 3): Array<{ key: string; label: string; value: number }> {
  return Object.entries(hero.stats)
    .map(([key, value]) => ({
      key,
      label: statLabels[key as StatKey] ?? key.toUpperCase(),
      value: Number(value) || 0,
    }))
    .sort((current, next) => next.value - current.value)
    .slice(0, amount);
}

function RecruitmentCandidateCard({
  hero,
  onRecruit,
}: {
  hero: Hero;
  onRecruit: (hero: Hero) => void;
}) {
  const topStats = getTopStats(hero);
  const rareCandidate = hero.rarity >= 3;

  return (
    <article className={`recruitment-option-card rarity-${hero.rarity}${rareCandidate ? " rare-candidate" : ""}`}>
      <div className="recruitment-candidate-top">
        <div className="recruitment-contract-seal" aria-hidden="true">
          {hero.rarity >= 4 ? "✦" : "◆"}
        </div>
        <div>
          <span>{hero.className}</span>
          <h3>{hero.name}</h3>
          <small>
            {getRarityLabel(hero.rarity)} · {getRarityStars(hero.rarity)}
          </small>
        </div>
      </div>

      <div className="recruitment-candidate-meta">
        <span>Poder {getHeroPower(hero)}</span>
        <span>Lv. {hero.level}</span>
        <span>Custo pago</span>
      </div>

      <div className="recruitment-stat-strip">
        {topStats.map((stat) => (
          <span key={stat.key}>
            <strong>{stat.value}</strong>
            {stat.label}
          </span>
        ))}
      </div>

      <div className="recruitment-trait-box">
        <strong>{hero.traitName}</strong>
        <p>{hero.traitDescription || "Traço passivo revelado ao assinar o contrato."}</p>
      </div>

      <p className="recruitment-candidate-pitch">{getCandidatePitch(hero)}</p>
      {hero.recruitmentTag ? <em className="recruitment-origin">Origem: {hero.recruitmentTag}</em> : null}

      <button className="hero-inline-action primary recruitment-hire-button" onClick={() => onRecruit(hero)} type="button">
        Recrutar {hero.name}
      </button>
    </article>
  );
}

function RecruitmentResultCard({
  hero,
  message,
  onViewFormation,
  onViewHeroes,
}: {
  hero: Hero;
  message: string;
  onViewFormation?: () => void;
  onViewHeroes?: () => void;
}) {
  return (
    <article className={`recruitment-result-card rarity-${hero.rarity}`}>
      <div className="recruitment-contract-seal large" aria-hidden="true">
        ✓
      </div>
      <div>
        <span>Contrato assinado</span>
        <h3>{hero.name} entrou para a guilda</h3>
        <p>{message}</p>
        <small>
          {hero.className} · {getRarityLabel(hero.rarity)} · Poder {getHeroPower(hero)}
        </small>
      </div>
      <div className="recruitment-result-actions">
        <button className="hero-inline-action primary" onClick={onViewHeroes} type="button">
          Ver em Heróis
        </button>
        <button className="hero-inline-action" onClick={onViewFormation} type="button">
          Ir para Formação
        </button>
      </div>
    </article>
  );
}

export function RecruitmentPanel({ onViewFormation, onViewHeroes }: RecruitmentPanelProps) {
  const state = useGameStore((store) => store.state);
  const startContractRecruitmentAction = useGameStore((store) => store.startContractRecruitment);
  const chooseRecruitmentHeroAction = useGameStore((store) => store.chooseRecruitmentHero);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastRecruitedHero, setLastRecruitedHero] = useState<Hero | null>(null);
  const choice = state.pendingRecruitmentChoice;
  const hasContracts = state.heroContracts > 0;
  const sortedCandidates = useMemo(() => [...(choice?.options || [])].sort((current, next) => getHeroPower(next) - getHeroPower(current)), [choice?.options]);

  function handleOpenContract() {
    const result = startContractRecruitmentAction();
    setFeedback(result.message);
    if (result.ok) setLastRecruitedHero(null);
  }

  function handleRecruit(hero: Hero) {
    const result = chooseRecruitmentHeroAction(hero.id);
    setFeedback(result.message);
    if (result.ok) setLastRecruitedHero(hero);
  }

  return (
    <section className="recruitment-panel-react">
      <div className="recruitment-board-hero">
        <div>
          <span>Quadro de contratos</span>
          <h2>Recrutamento da Guilda</h2>
          <p>
            Avalie candidatos revelados por contratos. Aqui a decisão é controlada: você compara classe, raridade, poder e traço antes de assinar.
          </p>
        </div>
        <div className="recruitment-ledger">
          <span>Contratos</span>
          <strong>{state.heroContracts}</strong>
          <small>{choice ? "Escolha aberta" : hasContracts ? "Disponível" : "Insuficiente"}</small>
        </div>
      </div>

      <div className="recruitment-status-grid">
        <div>
          <strong>{getSourceLabel(choice?.source)}</strong>
          <span>Origem atual</span>
        </div>
        <div>
          <strong>{choice ? sortedCandidates.length : 0}</strong>
          <span>Candidatos</span>
        </div>
        <div>
          <strong>1 contrato</strong>
          <span>Custo para abrir</span>
        </div>
        <div>
          <strong>{choice ? "Escolher 1" : "Aguardando"}</strong>
          <span>Decisão</span>
        </div>
      </div>

      {!choice ? (
        <article className={`recruitment-empty-contract${hasContracts ? " available" : " blocked"}`}>
          <div className="recruitment-contract-seal" aria-hidden="true">
            ▣
          </div>
          <div>
            <span>{hasContracts ? "Recrutamento disponível" : "Sem contrato disponível"}</span>
            <h3>{hasContracts ? "Abrir mesa de candidatos" : "Nenhum candidato no quadro"}</h3>
            <p>
              {hasContracts
                ? "Use um contrato para revelar três aventureiros. Depois disso, a escolha é definitiva e apenas um entra para a guilda."
                : "Ganhe contratos na Torre, eventos ou recompensas para abrir uma nova seleção de candidatos."}
            </p>
          </div>
          <button className="hero-inline-action primary recruitment-open-button" disabled={!hasContracts} onClick={handleOpenContract} type="button">
            Usar contrato de herói
          </button>
        </article>
      ) : (
        <article className="recruitment-choice-card">
          <div className="recruitment-choice-head">
            <div>
              <span>{getSourceLabel(choice.source)}</span>
              <h3>{choice.title}</h3>
              <p>{choice.description}</p>
            </div>
            <strong>Escolha apenas um</strong>
          </div>

          {sortedCandidates.length > 0 ? (
            <div className="recruitment-options-grid">
              {sortedCandidates.map((hero) => (
                <RecruitmentCandidateCard hero={hero} key={hero.id} onRecruit={handleRecruit} />
              ))}
            </div>
          ) : (
            <article className="recruitment-empty-contract blocked">
              <div className="recruitment-contract-seal" aria-hidden="true">
                !
              </div>
              <div>
                <span>Sem candidatos</span>
                <h3>O contrato não revelou aventureiros</h3>
                <p>O save foi normalizado sem opções válidas. Abra outro contrato quando houver recurso disponível.</p>
              </div>
            </article>
          )}
        </article>
      )}

      {lastRecruitedHero ? (
        <RecruitmentResultCard hero={lastRecruitedHero} message={feedback || "Recrutamento concluído."} onViewFormation={onViewFormation} onViewHeroes={onViewHeroes} />
      ) : feedback ? (
        <p className="hero-action-feedback recruitment-feedback">{feedback}</p>
      ) : null}
    </section>
  );
}
