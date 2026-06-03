"use client";

import {
  EXPEDITION_DEFINITIONS,
  GAME_CONFIG,
  applyExpeditionPresetToExpeditionSelection,
  formatDuration,
  getActiveExpedition,
  getActiveExpeditionReward,
  getExpeditionDurationMs,
  getExpeditionPower,
  getExpeditionRemainingMs,
  getExpeditionRewardName,
  getExpeditionRewardPreview,
  getHeroActiveInjuries,
  getHeroMoraleState,
  getHeroPower,
  getTeamPresets,
  isExpeditionComplete,
  isHeroOnExpedition,
  type ExpeditionRewardType,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useState } from "react";

const MAX_ACTIVE_EXPEDITIONS = 3;

type ExpeditionDefinition = (typeof EXPEDITION_DEFINITIONS)[number];
type ExpeditionStatus = "available" | "active" | "ready" | "blocked" | "no-heroes";
type RiskTone = "safe" | "warning" | "danger";

function getRarityStars(rarity: number): string {
  return "★".repeat(rarity) + "☆".repeat(Math.max(0, 5 - rarity));
}

function getRiskProfile(power: number, recommendedPower: number): { label: string; tone: RiskTone; description: string } {
  if (power <= 0) return { label: "Sem equipe", tone: "danger", description: "Selecione heróis antes de assinar o contrato." };

  const ratio = power / Math.max(1, recommendedPower);
  if (ratio >= 1.2) return { label: "Seguro", tone: "safe", description: "Equipe acima do recomendado; recompensa tende a render melhor." };
  if (ratio >= 1) return { label: "Adequado", tone: "safe", description: "Poder suficiente para cumprir o contrato." };
  if (ratio >= 0.7) return { label: "Arriscado", tone: "warning", description: "Poder abaixo do ideal; recompensa e segurança caem." };
  return { label: "Perigoso", tone: "danger", description: "Equipe muito fraca para esta rota." };
}

function getStatusLabel(status: ExpeditionStatus): string {
  if (status === "ready") return "Concluída";
  if (status === "active") return "Em andamento";
  if (status === "blocked") return "Bloqueada";
  if (status === "no-heroes") return "Sem heróis";
  return "Disponível";
}

function getRewardText(reward: { amount: number; type: ExpeditionRewardType; multiplier?: number }): string {
  return `${reward.amount} ${getExpeditionRewardName(reward.type)} · ${Math.round((reward.multiplier || 1) * 100)}%`;
}

function getHeroById(heroes: Hero[], heroId: string): Hero | null {
  return heroes.find((hero) => hero.id === heroId) ?? null;
}

function getHeroWarnings(hero: Hero): string[] {
  const warnings: string[] = [];
  const morale = getHeroMoraleState(hero);
  const injuries = getHeroActiveInjuries(hero);
  if (morale.tone === "collapse" || morale.tone === "shaken") warnings.push(morale.label);
  if (injuries.length > 0) warnings.push(`${injuries.length} ferimento(s)`);
  return warnings;
}

function ExpeditionHeroChip({ hero, disabled, selected, onToggle }: { hero: Hero; disabled?: boolean; selected?: boolean; onToggle?: () => void }) {
  const warnings = getHeroWarnings(hero);

  return (
    <button
      aria-pressed={selected}
      className={`expedition-hero-chip rarity-${hero.rarity}${selected ? " selected" : ""}${disabled ? " disabled" : ""}${warnings.length > 0 ? " warning" : ""}`}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      <strong>{hero.name}</strong>
      <span>
        {hero.className} · {getRarityStars(hero.rarity)}
      </span>
      <small>Poder {getHeroPower(hero)}</small>
      {warnings.length > 0 ? <em>{warnings.join(" · ")}</em> : null}
    </button>
  );
}

function ActiveHeroList({ heroIds, heroes }: { heroIds: string[]; heroes: Hero[] }) {
  const sentHeroes = heroIds.map((heroId) => getHeroById(heroes, heroId)).filter((hero): hero is Hero => Boolean(hero));

  if (sentHeroes.length === 0) return <small>Equipe enviada não encontrada.</small>;

  return (
    <div className="expedition-sent-heroes">
      {sentHeroes.map((hero) => (
        <div className={`expedition-sent-hero rarity-${hero.rarity}`} key={hero.id}>
          <strong>{hero.name}</strong>
          <span>
            {hero.className} · Poder {getHeroPower(hero)}
          </span>
          {getHeroWarnings(hero).length > 0 ? <small>{getHeroWarnings(hero).join(" · ")}</small> : <small>{getRarityStars(hero.rarity)}</small>}
        </div>
      ))}
    </div>
  );
}

function ExpeditionCard({ definition, now }: { definition: ExpeditionDefinition; now: number }) {
  const state = useGameStore((store) => store.state);
  const startExpeditionAction = useGameStore((store) => store.startExpedition);
  const collectExpeditionAction = useGameStore((store) => store.collectExpedition);
  const freeFormationHeroes = state.formation
    .filter((heroId): heroId is string => Boolean(heroId))
    .filter((heroId) => !isHeroOnExpedition(state, heroId))
    .slice(0, GAME_CONFIG.maxExpeditionHeroes);
  const [selectedHeroIds, setSelectedHeroIds] = useState<string[]>(freeFormationHeroes);
  const [feedback, setFeedback] = useState<string | null>(null);

  const active = getActiveExpedition(state, definition.id);
  const allHeroIds = new Set(state.heroes.map((hero) => hero.id));
  const selectedValidHeroIds = selectedHeroIds.filter((heroId) => allHeroIds.has(heroId) && !isHeroOnExpedition(state, heroId));
  const selectedPower = getExpeditionPower(state, selectedValidHeroIds);
  const selectionPreview = getExpeditionRewardPreview(state, definition, selectedValidHeroIds);
  const reward = active ? getActiveExpeditionReward(state, active) || selectionPreview : selectionPreview;
  const complete = active ? isExpeditionComplete(active, now) : false;
  const remaining = active ? getExpeditionRemainingMs(active, now) : getExpeditionDurationMs(state, definition);
  const durationMs = getExpeditionDurationMs(state, definition);
  const progress = active ? Math.round(((durationMs - getExpeditionRemainingMs(active, now)) / Math.max(1, durationMs)) * 100) : 0;
  const availableHeroes = useMemo(() => state.heroes.filter((hero) => !isHeroOnExpedition(state, hero.id)), [state]);
  const busyHeroes = useMemo(() => state.heroes.filter((hero) => isHeroOnExpedition(state, hero.id)), [state]);
  const capacityBlocked = !active && state.activeExpeditions.length >= MAX_ACTIVE_EXPEDITIONS;
  const noHeroes = !active && availableHeroes.length === 0;
  const status: ExpeditionStatus = active ? (complete ? "ready" : "active") : capacityBlocked ? "blocked" : noHeroes ? "no-heroes" : "available";
  const risk = getRiskProfile(active ? reward.power || 0 : selectedPower, definition.recommendedPower);
  const canStart =
    status === "available" &&
    selectedValidHeroIds.length > 0 &&
    selectedValidHeroIds.length <= GAME_CONFIG.maxExpeditionHeroes;

  const toggleHero = (heroId: string) => {
    if (isHeroOnExpedition(state, heroId)) return;
    setSelectedHeroIds((current) => {
      if (current.includes(heroId)) return current.filter((id) => id !== heroId);
      if (current.length >= GAME_CONFIG.maxExpeditionHeroes) return current;
      return [...current, heroId];
    });
  };

  return (
    <article className={`expedition-card status-${status} risk-${risk.tone}`}>
      <div className="expedition-seal" aria-hidden="true">
        {definition.name.slice(0, 1)}
      </div>

      <div className="expedition-card-head">
        <div>
          <span>{getStatusLabel(status)}</span>
          <h3>{definition.name}</h3>
          <p>{definition.description}</p>
        </div>
        <strong>{complete ? "Pronta" : formatDuration(remaining)}</strong>
      </div>

      <div className="expedition-contract-stats">
        <span>
          <strong>{formatDuration(durationMs)}</strong>
          Duração
        </span>
        <span>
          <strong>{definition.recommendedPower}</strong>
          Poder recomendado
        </span>
        <span className={`tone-${risk.tone}`}>
          <strong>{risk.label}</strong>
          Risco
        </span>
      </div>

      <div className="expedition-reward-scroll">
        <strong>Recompensa esperada</strong>
        <span>{getRewardText(reward)}</span>
        <small>{risk.description}</small>
      </div>

      <div className="expedition-progress-block">
        <div>
          <span>{active ? (complete ? "Retorno confirmado" : "Progresso da rota") : "Contrato aguardando assinatura"}</span>
          <strong>{active ? `${Math.min(100, Math.max(0, progress))}%` : "0%"}</strong>
        </div>
        <div className="expedition-progress">
          <i>
            <b style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </i>
        </div>
        <small>{active ? (complete ? "A equipe retornou à guilda." : `${formatDuration(remaining)} restante(s).`) : "Selecione heróis para iniciar a missão."}</small>
      </div>

      {active ? (
        <div className="expedition-active-team">
          <strong>Heróis enviados</strong>
          <ActiveHeroList heroIds={active.heroIds} heroes={state.heroes} />
          <div className="expedition-power-readout">
            <span>Poder enviado {reward.power || 0}</span>
            <span>Recompensa final {getRewardText(reward)}</span>
          </div>
          {complete ? (
            <button
              className="hero-inline-action primary expedition-collect-button"
              onClick={() => {
                const result = collectExpeditionAction(definition.id);
                setFeedback(result.message);
              }}
              type="button"
            >
              Coletar recompensa
            </button>
          ) : null}
        </div>
      ) : (
        <div className="expedition-selection-panel">
          <div className="expedition-selection-head">
            <div>
              <strong>Seleção da equipe</strong>
              <span>
                Poder {selectedPower}/{definition.recommendedPower} · {selectedValidHeroIds.length}/{GAME_CONFIG.maxExpeditionHeroes} herói(s)
              </span>
            </div>
            <em className={`tone-${risk.tone}`}>{risk.label}</em>
          </div>

          <div className="expedition-preset-row">
            {getTeamPresets(state, "expedition").map((preset, index) => (
              <button
                className="hero-inline-action"
                key={preset.id}
                onClick={() => {
                  const result = applyExpeditionPresetToExpeditionSelection(state, index);
                  if (result.ok) setSelectedHeroIds(result.heroIds.filter((heroId) => !isHeroOnExpedition(state, heroId)));
                  setFeedback(result.message);
                }}
                type="button"
              >
                Carregar {preset.name}
              </button>
            ))}
          </div>

          <div className="expedition-hero-picker">
            {state.heroes.length > 0 ? (
              <>
                {availableHeroes.map((hero) => (
                  <ExpeditionHeroChip
                    hero={hero}
                    key={hero.id}
                    onToggle={() => toggleHero(hero.id)}
                    selected={selectedHeroIds.includes(hero.id)}
                  />
                ))}
                {busyHeroes.map((hero) => (
                  <ExpeditionHeroChip disabled hero={hero} key={hero.id} selected={false} />
                ))}
              </>
            ) : (
              <small>Nenhum herói recrutado para enviar.</small>
            )}
          </div>

          {capacityBlocked ? <p className="expedition-warning">Limite de {MAX_ACTIVE_EXPEDITIONS} expedições ativas atingido.</p> : null}
          {noHeroes ? <p className="expedition-warning">Todos os heróis estão ocupados ou indisponíveis.</p> : null}
          {selectedPower > 0 && selectedPower < definition.recommendedPower ? <p className="expedition-warning">Equipe abaixo do poder recomendado para este contrato.</p> : null}

          <button
            className="hero-inline-action primary expedition-start-button"
            disabled={!canStart}
            onClick={() => {
              const result = startExpeditionAction(definition.id, selectedValidHeroIds);
              setFeedback(result.message);
            }}
            type="button"
          >
            Iniciar expedição ({selectedValidHeroIds.length}/{GAME_CONFIG.maxExpeditionHeroes})
          </button>
        </div>
      )}

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </article>
  );
}

export function ExpeditionsPanel() {
  const state = useGameStore((store) => store.state);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const readyCount = state.activeExpeditions.filter((expedition) => isExpeditionComplete(expedition, now)).length;
  const busyHeroCount = new Set(state.activeExpeditions.flatMap((expedition) => expedition.heroIds)).size;

  return (
    <section className="expeditions-panel">
      <div className="expedition-board-hero">
        <div>
          <span>Quadro de contratos</span>
          <h2>Expedições da guilda</h2>
          <p>Envie patrulhas para rotas perigosas, acompanhe retornos e colete recompensas fora da Torre.</p>
        </div>
        <div className="expedition-board-ledger">
          <span>
            <strong>{state.activeExpeditions.length}/{MAX_ACTIVE_EXPEDITIONS}</strong>
            Ativas
          </span>
          <span>
            <strong>{readyCount}</strong>
            Prontas
          </span>
          <span>
            <strong>{busyHeroCount}</strong>
            Heróis ocupados
          </span>
        </div>
      </div>

      <div className="expedition-grid">
        {EXPEDITION_DEFINITIONS.map((definition) => (
          <ExpeditionCard definition={definition} key={definition.id} now={now} />
        ))}
      </div>
    </section>
  );
}
