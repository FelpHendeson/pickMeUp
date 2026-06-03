"use client";

import {
  canSpendResource,
  getAdjustedSummonRarityTable,
  getHeroPower,
  getRarityStars,
  getSummonCost,
  type Hero,
  type SummonCost,
  type SummonHistoryEntry,
  type SummonType,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

type SummonPanelProps = {
  onViewHero?: (heroId: string) => void;
};

type SummonResultPreview = {
  hero: Hero;
  type: SummonType;
  cost: SummonCost;
  message: string;
};

type SummonActionResult = {
  ok: boolean;
  message: string;
  hero?: Hero;
  cost?: SummonCost;
};

const summonTypes: Array<{
  type: SummonType;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  promise: string;
}> = [
  {
    type: "common",
    label: "Comum",
    title: "Invocação comum",
    subtitle: "Círculo de cinzas",
    description: "Um chamado estável para ampliar o elenco sem gastar cristais.",
    promise: "Alta frequência de heróis comuns e chance baixa de raridade épica.",
  },
  {
    type: "superior",
    label: "Superior",
    title: "Invocação superior",
    subtitle: "Ritual do eclipse",
    description: "Um selo mais caro, voltado para heróis raros e lendários.",
    promise: "Remove a menor raridade e concentra a chance em resultados fortes.",
  },
];

function formatResourceName(resource: SummonCost["resource"]): string {
  return resource === "gold" ? "ouro" : "cristais";
}

function getRarityLabel(rarity: number): string {
  if (rarity >= 5) return "Lendário";
  if (rarity === 4) return "Épico";
  if (rarity === 3) return "Raro";
  if (rarity === 2) return "Incomum";
  return "Comum";
}

function getRareChanceSummary(type: SummonType): string {
  const table = getAdjustedSummonRarityTable(type);
  const rareChance = table.filter((entry) => entry.rarity >= 4).reduce((total, entry) => total + entry.chance, 0);
  const bestRarity = table.reduce((best, entry) => Math.max(best, entry.rarity), 1);
  return `${rareChance}% para 4★+ · até ${bestRarity}★`;
}

function RitualRates({ type }: { type: SummonType }) {
  return (
    <div className="summon-rates">
      {getAdjustedSummonRarityTable(type).map((entry) => (
        <span className={`rarity-${entry.rarity >= 5 ? "legendary" : entry.rarity >= 4 ? "epic" : entry.rarity >= 3 ? "rare" : "common"}`} key={`${type}-${entry.rarity}`}>
          <strong>{entry.rarity}★</strong>
          {entry.chance}%
        </span>
      ))}
    </div>
  );
}

function SummonRitualCard({
  canAfford,
  cost,
  onSummon,
  type,
}: {
  canAfford: boolean;
  cost: SummonCost;
  onSummon: (type: SummonType) => void;
  type: (typeof summonTypes)[number];
}) {
  return (
    <article className={`summon-card-react ritual-${type.type}`}>
      <div className="summon-card-orb" aria-hidden="true">
        <i />
      </div>
      <div className="summon-card-head">
        <span>{type.label}</span>
        <h3>{type.title}</h3>
        <small>{type.subtitle}</small>
      </div>
      <p>{type.description}</p>
      <div className="summon-cost-row">
        <div>
          <strong>{cost.amount}</strong>
          <span>{formatResourceName(cost.resource)}</span>
        </div>
        <small>{canAfford ? "Recursos prontos para o ritual." : "Recursos insuficientes para este selo."}</small>
      </div>
      <div className="summon-odds-summary">
        <strong>Chances resumidas</strong>
        <span>{getRareChanceSummary(type.type)}</span>
      </div>
      <RitualRates type={type.type} />
      <button className="hero-inline-action primary summon-action-button" disabled={!canAfford} onClick={() => onSummon(type.type)} type="button">
        <strong>{type.type === "superior" ? "Abrir ritual superior" : "Abrir ritual comum"}</strong>
        <span>{type.promise}</span>
      </button>
    </article>
  );
}

function SummonResultPanel({
  lastResult,
  onRepeat,
  onViewHero,
}: {
  lastResult: SummonResultPreview | null;
  onRepeat: (type: SummonType) => void;
  onViewHero?: (heroId: string) => void;
}) {
  if (!lastResult) {
    return (
      <article className="summon-result-panel empty">
        <span>Resultado do ritual</span>
        <h3>O círculo ainda está em silêncio</h3>
        <p>Escolha um selo de invocação para revelar o próximo aventureiro da guilda.</p>
      </article>
    );
  }

  const hero = lastResult.hero;
  const rareImpact = hero.rarity >= 4;

  return (
    <article className={`summon-result-panel rarity-${hero.rarity}${rareImpact ? " rare-impact" : ""}`}>
      <div className="summon-result-sigil" aria-hidden="true">
        {hero.name.slice(0, 1)}
      </div>
      <div className="summon-result-copy">
        <span>{rareImpact ? "Chamado raro atendido" : "Herói invocado"}</span>
        <h3>{hero.name}</h3>
        <p>
          {getRarityLabel(hero.rarity)} · {hero.className} · Lv. {hero.level} · Poder {getHeroPower(hero)}
        </p>
        <div className="summon-result-stars">{getRarityStars(hero.rarity)}</div>
      </div>
      <div className="summon-result-stats">
        <span>
          <strong>{hero.stats.atk}</strong>
          ATK
        </span>
        <span>
          <strong>{hero.stats.def}</strong>
          DEF
        </span>
        <span>
          <strong>{hero.stats.hp}</strong>
          HP
        </span>
        <span>
          <strong>{hero.stats.spd}</strong>
          SPD
        </span>
      </div>
      <p className="summon-result-message">{lastResult.message}</p>
      <div className="summon-result-actions">
        <button className="hero-inline-action primary" onClick={() => onViewHero?.(hero.id)} type="button">
          Ver herói
        </button>
        <button className="hero-inline-action" onClick={() => onRepeat(lastResult.type)} type="button">
          Invocar novamente
        </button>
      </div>
    </article>
  );
}

function SummonHistoryCard({ entry }: { entry: SummonHistoryEntry }) {
  const rare = entry.rarity >= 4;

  return (
    <article className={`summon-history-entry rarity-${entry.rarity}${rare ? " rare" : ""}`}>
      <div>
        <strong>{entry.name}</strong>
        <span>
          {entry.className} · {entry.type === "superior" ? "Superior" : "Comum"}
        </span>
      </div>
      <em>{entry.rarity}★</em>
    </article>
  );
}

export function SummonPanel({ onViewHero }: SummonPanelProps) {
  const state = useGameStore((store) => store.state);
  const summonHeroAction = useGameStore((store) => store.summonHero);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SummonResultPreview | null>(null);
  const commonCost = getSummonCost(state, "common");
  const superiorCost = getSummonCost(state, "superior");
  const lastSummons = state.summonHistory.slice(0, 8);

  function getCost(type: SummonType): SummonCost {
    return type === "superior" ? superiorCost : commonCost;
  }

  function handleSummon(type: SummonType) {
    const result = summonHeroAction(type) as SummonActionResult;
    const cost = result.cost ?? getCost(type);

    setFeedback(result.message);
    if (result.ok && result.hero) {
      setLastResult({
        hero: result.hero,
        type,
        cost,
        message: result.message,
      });
    }
  }

  return (
    <section className="summon-panel-react">
      <div className="summon-ritual-hero">
        <div>
          <span>Portal de Invocação</span>
          <h2>Ritual dos Ecos</h2>
          <p>Escolha o selo, pague o custo e revele o aventureiro que respondeu ao chamado da Torre.</p>
        </div>
        <div className="summon-resource-ledger">
          <span>
            <strong>{state.resources.gold}</strong>
            Ouro
          </span>
          <span>
            <strong>{state.resources.crystals}</strong>
            Cristais
          </span>
        </div>
      </div>

      <div className="summon-grid-react">
        {summonTypes.map((type) => {
          const cost = getCost(type.type);
          return (
            <SummonRitualCard
              canAfford={canSpendResource(state, cost.resource, cost.amount)}
              cost={cost}
              key={type.type}
              onSummon={handleSummon}
              type={type}
            />
          );
        })}
      </div>

      <div className="summon-afterglow-layout">
        <SummonResultPanel lastResult={lastResult} onRepeat={handleSummon} onViewHero={onViewHero} />

        <article className="summon-history-react">
          <span>Histórico</span>
          <h3>Últimos chamados</h3>
          {lastSummons.length > 0 ? (
            <div className="history-list-react">
              {lastSummons.map((entry) => (
                <SummonHistoryCard entry={entry} key={`${entry.id}-${entry.at}`} />
              ))}
            </div>
          ) : (
            <p>Nenhuma invocação registrada neste save.</p>
          )}
        </article>
      </div>

      {feedback ? <p className="hero-action-feedback summon-feedback">{feedback}</p> : null}
    </section>
  );
}
