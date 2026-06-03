"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canChooseTowerEventOption,
  canRepeatTowerFloor,
  canSpendResource,
  describeReward,
  GAME_CONFIG,
  getEnemyArchetype,
  getFloorData,
  getFloorModifierSummary,
  getFormationHeroCount,
  getFormationHeroes,
  getFormationPower,
  getTowerChapterByFloor,
  getTowerDifficultySummary,
  getTowerEventDefinition,
  getTowerEventPhaseLabel,
  getTowerEventResourceName,
  getWeeklyTowerRewardOptions,
  isBossFloor,
  normalizeTowerDifficultyMode,
  TOWER_FLOORS,
  type BattleResult,
  type GameState,
  type Hero,
  type RunTowerBattleResult,
  type TowerDifficultyModeId,
  type TowerFloor,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useConfirmDialog, UiAlertBox, UiProgressBar } from "../ui";
import { BattleResultPanel } from "./BattleResultPanel";

const difficultyModes = ["normal", "challenge", "hardcore"] as const;
const maxTowerFloor = TOWER_FLOORS.at(-1)?.floor ?? GAME_CONFIG.towerMaxFloor;

function clampFloor(floor: number): number {
  return Math.min(maxTowerFloor, Math.max(1, Math.floor(Number(floor) || 1)));
}

function formatBattleMessage(result: RunTowerBattleResult): string {
  if (!result.ok) return result.message;
  if ("narrative" in result && result.narrative) return result.message;
  if ("event" in result && result.event) return result.message;
  if ("battle" in result) {
    return result.battle.result === "victory"
      ? `Combate vencido no andar ${result.battle.floor}. Resultado registrado.`
      : `Combate perdido no andar ${result.battle.floor}. Resultado registrado.`;
  }
  return "Combate concluido.";
}

function getEnemyPreview(floor: TowerFloor): Array<{ key: string; label: string; role: string; count: number }> {
  const entries = new Map<string, { key: string; label: string; role: string; count: number }>();

  floor.enemyKeys.forEach((enemyKey) => {
    const archetype = getEnemyArchetype(enemyKey);
    const current = entries.get(enemyKey);
    if (current) {
      current.count += 1;
      return;
    }
    entries.set(enemyKey, {
      key: enemyKey,
      label: archetype.name,
      role: archetype.role,
      count: 1,
    });
  });

  return [...entries.values()];
}

function getBattleSummary(battle: BattleResult | null): string {
  if (!battle) return "Nenhum combate registrado nesta sessão.";
  const outcome = battle.result === "victory" ? "Vitória" : "Derrota";
  return `${outcome} no andar ${battle.floor} em ${battle.rounds} turno(s).`;
}

function isHeroWounded(hero: Hero): boolean {
  const maxHp = Math.max(1, Math.round(Number(hero.stats.hp) || 1));
  const currentHp = Number.isFinite(Number(hero.currentHp)) ? Math.max(0, Math.round(Number(hero.currentHp))) : maxHp;
  return currentHp / maxHp <= 0.45;
}

function getFormationReadiness(state: Pick<GameState, "formation" | "heroes">) {
  const heroes = getFormationHeroes(state).filter((hero): hero is Hero => Boolean(hero));
  const averageLevel = heroes.length > 0 ? heroes.reduce((total, hero) => total + hero.level, 0) / heroes.length : 0;
  const injuredHeroes = heroes.filter((hero) => hero.injuries.some((injury) => injury.remainingBattles > 0));
  const woundedHeroes = heroes.filter((hero) => isHeroWounded(hero));
  const lowMoraleHeroes = heroes.filter((hero) => hero.morale < 40);

  return {
    heroes,
    averageLevel,
    injuredHeroes,
    woundedHeroes,
    lowMoraleHeroes,
  };
}

function formatHeroNames(heroes: Hero[]): string {
  if (heroes.length === 0) return "";
  const names = heroes.slice(0, 3).map((hero) => hero.name).join(", ");
  return heroes.length > 3 ? `${names} e mais ${heroes.length - 3}` : names;
}

function getRiskProfile(options: {
  averageLevel: number;
  bossFloor: boolean;
  difficultyMode: TowerDifficultyModeId;
  energy: number;
  heroCount: number;
  injuredCount: number;
  lowMoraleCount: number;
  pendingEvent: boolean;
  recommendedLevel: number;
  selectedIsLocked: boolean;
  woundedCount: number;
}) {
  if (options.pendingEvent) {
    return { label: "Bloqueado", tone: "danger", description: "Evento pendente impede a marcha até a Torre." };
  }

  if (options.selectedIsLocked) {
    return { label: "Selado", tone: "locked", description: "A campanha ainda não liberou este andar." };
  }

  if (options.heroCount === 0) {
    return { label: "Sem equipe", tone: "danger", description: "Nenhum herói está escalado para sustentar o avanço." };
  }

  if (options.energy < GAME_CONFIG.towerEnergyCost) {
    return { label: "Sem energia", tone: "danger", description: "Falta energia para abrir o portal deste desafio." };
  }

  const levelGap = options.recommendedLevel - options.averageLevel;
  let score = Math.max(0, levelGap);

  if (options.bossFloor) score += 1.4;
  if (options.difficultyMode === "challenge") score += 1.1;
  if (options.difficultyMode === "hardcore") score += 2.2;
  score += Math.min(2, options.injuredCount * 0.7);
  score += Math.min(1.5, options.lowMoraleCount * 0.55);
  score += Math.min(1.2, options.woundedCount * 0.45);

  if (score >= 4) {
    return { label: "Crítico", tone: "critical", description: "A formação entra abaixo da ameaça prevista; espere perdas reais." };
  }

  if (score >= 2.2) {
    return { label: "Alto", tone: "danger", description: "O andar favorece desgaste, ferimentos e falhas de moral." };
  }

  if (score >= 1) {
    return { label: "Moderado", tone: "warning", description: "A luta é viável, mas a região ainda pune descuidos." };
  }

  return { label: "Controlado", tone: "safe", description: "A formação parece preparada para este andar." };
}

export function TowerChallengePanel() {
  const state = useGameStore((store) => store.state);
  const startTowerBattle = useGameStore((store) => store.startTowerBattle);
  const startRepeatTowerBattle = useGameStore((store) => store.startRepeatTowerBattle);
  const resolveEvent = useGameStore((store) => store.resolveTowerEventChoice);
  const confirmDialog = useConfirmDialog();
  const highestAvailableFloor = clampFloor(state.towerFloor);
  const [selectedFloor, setSelectedFloor] = useState(highestAvailableFloor);
  const [difficultyMode, setDifficultyMode] = useState<TowerDifficultyModeId>("normal");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const normalizedDifficulty = normalizeTowerDifficultyMode(difficultyMode);
  const difficultySummary = getTowerDifficultySummary(normalizedDifficulty);
  const selectedFloorData = getFloorData(selectedFloor);
  const selectedChapter = getTowerChapterByFloor(selectedFloor);
  const currentChapter = getTowerChapterByFloor(highestAvailableFloor);
  const selectedIsCurrent = selectedFloor === highestAvailableFloor && state.towerFloor <= maxTowerFloor;
  const selectedIsRepeatable = selectedFloor < state.towerFloor && canRepeatTowerFloor(state, selectedFloor);
  const selectedIsLocked = selectedFloor > state.towerFloor;
  const bossFloor = isBossFloor(selectedFloor);
  const heroCount = getFormationHeroCount(state);
  const formationPower = getFormationPower(state);
  const formationReadiness = getFormationReadiness(state);
  const energy = state.resources.energy;
  const weeklyRewardOptions = getWeeklyTowerRewardOptions();
  const rewardPreview = selectedFloorData ? describeReward(selectedFloor, { ...weeklyRewardOptions, difficultyMode: normalizedDifficulty }) : "";
  const modifierSummary = selectedFloorData ? getFloorModifierSummary(selectedFloorData) : "";
  const enemyPreview = selectedFloorData ? getEnemyPreview(selectedFloorData) : [];
  const recommendedLevel = selectedFloorData?.recommendedLevel ?? 1;
  const averageFormationLevel = Math.round(formationReadiness.averageLevel * 10) / 10;
  const chapterFloorCount = currentChapter.endFloor - currentChapter.startFloor + 1;
  const chapterFloorPosition = Math.max(1, Math.min(highestAvailableFloor - currentChapter.startFloor + 1, chapterFloorCount));
  const chapterProgress = Math.round((chapterFloorPosition / chapterFloorCount) * 100);
  const pendingEvent = state.pendingTowerEvent;
  const pendingEventDefinition = pendingEvent ? getTowerEventDefinition(pendingEvent.typeKey) : null;
  const activeEffects = state.towerBattleEffects.filter((effect) => effect.scope === "nextBattle");
  const recentHistory = state.towerEventHistory.slice(0, 5);
  const lastBattle = state.lastBattle;
  const weakTeam = heroCount > 0 && formationReadiness.averageLevel + 0.5 < recommendedLevel;
  const riskProfile = getRiskProfile({
    averageLevel: formationReadiness.averageLevel,
    bossFloor,
    difficultyMode: normalizedDifficulty,
    energy,
    heroCount,
    injuredCount: formationReadiness.injuredHeroes.length,
    lowMoraleCount: formationReadiness.lowMoraleHeroes.length,
    pendingEvent: Boolean(pendingEvent),
    recommendedLevel,
    selectedIsLocked,
    woundedCount: formationReadiness.woundedHeroes.length,
  });
  const towerWarnings: Array<{ key: string; tone: "info" | "warning" | "danger" | "success"; title: string; description: string }> = [];

  if (pendingEvent) {
    towerWarnings.push({
      key: "event",
      tone: "danger",
      title: "Evento pendente",
      description: `Resolva o evento do andar ${pendingEvent.floor} antes de iniciar outro combate.`,
    });
  }

  if (energy < GAME_CONFIG.towerEnergyCost) {
    towerWarnings.push({
      key: "energy",
      tone: "danger",
      title: "Energia insuficiente",
      description: `A Torre exige ${GAME_CONFIG.towerEnergyCost} energia; você tem ${energy}.`,
    });
  }

  if (weakTeam) {
    towerWarnings.push({
      key: "weak-team",
      tone: "warning",
      title: "Equipe abaixo do recomendado",
      description: `Nível médio ${averageFormationLevel || 0}; este andar recomenda nível ${recommendedLevel}.`,
    });
  }

  if (formationReadiness.injuredHeroes.length > 0 || formationReadiness.woundedHeroes.length > 0 || formationReadiness.lowMoraleHeroes.length > 0) {
    towerWarnings.push({
      key: "injured",
      tone: formationReadiness.injuredHeroes.length > 0 ? "danger" : "warning",
      title: "Formação desgastada",
      description: [
        formationReadiness.injuredHeroes.length > 0 ? `Feridos: ${formatHeroNames(formationReadiness.injuredHeroes)}.` : "",
        formationReadiness.woundedHeroes.length > 0 ? `HP crítico: ${formatHeroNames(formationReadiness.woundedHeroes)}.` : "",
        formationReadiness.lowMoraleHeroes.length > 0 ? `Moral baixa: ${formatHeroNames(formationReadiness.lowMoraleHeroes)}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (bossFloor) {
    towerWarnings.push({
      key: "boss",
      tone: "danger",
      title: "Andar de chefe",
      description: `${selectedChapter.finalBoss} guarda o fechamento desta região.`,
    });
  }
  const canChallenge =
    !selectedIsLocked &&
    (selectedIsCurrent || selectedIsRepeatable) &&
    heroCount > 0 &&
    !pendingEvent &&
    canSpendResource(state, "energy", GAME_CONFIG.towerEnergyCost);
  const actionLabel = selectedIsCurrent ? "Desafiar andar" : selectedIsRepeatable ? "Repetir andar" : "Andar bloqueado";
  const statusMessage = useMemo(() => {
    if (pendingEvent) return `Resolva o evento pendente no andar ${pendingEvent.floor} antes de lutar.`;
    if (selectedIsLocked) return "Este andar ainda não foi liberado pela campanha.";
    if (!selectedIsCurrent && !selectedIsRepeatable) return "Este andar não pode ser repetido agora.";
    if (heroCount === 0) return "Monte uma formação antes de desafiar a torre.";
    if (energy < GAME_CONFIG.towerEnergyCost) return `Energia insuficiente (${energy}/${GAME_CONFIG.towerEnergyCost}).`;
    if (weakTeam) return "A equipe pode lutar, mas está abaixo do nível recomendado.";
    if (formationReadiness.injuredHeroes.length > 0 || formationReadiness.lowMoraleHeroes.length > 0) return "A equipe pode lutar, mas há desgaste relevante na formação.";
    return selectedIsCurrent ? "Pronto para avançar a campanha." : "Pronto para repetir este andar e farmar recompensas.";
  }, [
    energy,
    formationReadiness.injuredHeroes.length,
    formationReadiness.lowMoraleHeroes.length,
    heroCount,
    pendingEvent,
    selectedIsCurrent,
    selectedIsLocked,
    selectedIsRepeatable,
    weakTeam,
  ]);

  useEffect(() => {
    setSelectedFloor(highestAvailableFloor);
  }, [highestAvailableFloor]);

  async function confirmHardcore(): Promise<boolean> {
    if (normalizedDifficulty !== "hardcore") return true;
    return confirmDialog({
      title: "Iniciar modo Hardcore?",
      description: "Heróis que caírem neste modo podem morrer permanentemente. Esta tentativa deve ser tratada como uma decisão de alto risco.",
      confirmLabel: "Iniciar Hardcore",
      tone: "danger",
    });
  }

  async function handleChallenge() {
    if (!canChallenge) {
      setFeedback(statusMessage);
      return;
    }

    const confirmed = await confirmHardcore();
    if (!confirmed) return;

    const result = selectedIsCurrent
      ? startTowerBattle({ difficultyMode: normalizedDifficulty })
      : startRepeatTowerBattle(selectedFloor, { difficultyMode: normalizedDifficulty });

    setFeedback(formatBattleMessage(result));
    if (result.ok && "battle" in result) {
      setShowBattleModal(true);
    }
  }

  function handleEventChoice(choiceId: string) {
    const result = resolveEvent(choiceId);
    setFeedback(result.message);
    if (result.battleStarted) {
      setShowBattleModal(true);
    }
  }

  return (
    <section className={`tower-command-panel risk-${riskProfile.tone}`}>
      <header className={`tower-campaign-hero${isBossFloor(highestAvailableFloor) ? " is-boss" : ""}`}>
        <div className="tower-campaign-copy">
          <div className="tower-campaign-kicker">
            <span>Torre Dimensional</span>
            <strong>{isBossFloor(highestAvailableFloor) ? "Marco de chefe" : "Região perigosa"}</strong>
          </div>
          <h2>
            Capítulo {currentChapter.number}: {currentChapter.name}
          </h2>
          <p>{currentChapter.description}</p>
        </div>

        <div className="tower-campaign-meta">
          <div>
            <strong>Andar atual</strong>
            <span>{highestAvailableFloor}</span>
          </div>
          <div>
            <strong>Rota do capítulo</strong>
            <span>
              {chapterFloorPosition}/{chapterFloorCount}
            </span>
          </div>
          <div>
            <strong>Chefe final</strong>
            <span>{currentChapter.finalBoss}</span>
          </div>
        </div>

        <div className="tower-campaign-progress">
          <div>
            <span>Progresso do capítulo</span>
            <strong>{chapterProgress}%</strong>
          </div>
          <UiProgressBar label={`Progresso do capítulo em ${chapterProgress}%`} value={chapterProgress} />
          <small>{getBattleSummary(lastBattle)}</small>
        </div>
      </header>

      <div className="tower-command-layout">
        <aside className="tower-floor-map" aria-label="Andares da torre">
          <div className="tower-map-head">
            <span>Torre</span>
            <strong>Selecione um andar</strong>
          </div>
          <div className="tower-floor-grid">
            {TOWER_FLOORS.map((floor) => {
              const locked = floor.floor > state.towerFloor;
              const current = floor.floor === highestAvailableFloor && state.towerFloor <= maxTowerFloor;
              const completed = floor.floor < state.towerFloor;
              const selected = floor.floor === selectedFloor;
              const repeatable = completed && canRepeatTowerFloor(state, floor.floor);
              const status = locked ? "locked" : current ? "current" : repeatable ? "repeatable" : "completed";

              return (
                <button
                  aria-pressed={selected}
                  className={`tower-floor-node ${status}${selected ? " selected" : ""}`}
                  disabled={locked}
                  key={floor.floor}
                  onClick={() => setSelectedFloor(floor.floor)}
                  title={`${floor.floor}. ${floor.title}`}
                  type="button"
                >
                  <strong>{floor.floor}</strong>
                  <span>{isBossFloor(floor.floor) ? "Chefe" : floor.floor < 10 ? `0${floor.floor}` : floor.floor}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className={`tower-challenge-detail risk-${riskProfile.tone}${bossFloor ? " boss-floor" : ""}`}>
          <div className="tower-challenge-head">
            <div>
              <span>Dados do Desafio</span>
              <h3>
                {selectedFloor}. {selectedFloorData?.title ?? "Andar desconhecido"}
              </h3>
              <p>
                Capítulo {selectedChapter.number}: {selectedChapter.name}. {bossFloor ? `Chefe: ${selectedChapter.finalBoss}.` : "Combate regular da campanha."}
              </p>
            </div>
            <div className="tower-challenge-actions">
              <button className="hero-inline-action" disabled={!lastBattle} onClick={() => setShowBattleModal(true)} type="button">
                Último resultado
              </button>
              <button className="hero-inline-action" onClick={() => setShowHistoryModal(true)} type="button">
                Histórico
              </button>
            </div>
          </div>

          <div className="tower-selected-tags">
            <span>{selectedIsCurrent ? "Avanço" : selectedIsRepeatable ? "Repetição" : selectedIsLocked ? "Bloqueado" : "Concluído"}</span>
            <span>Risco {riskProfile.label}</span>
            <span>Nível recomendado {recommendedLevel}</span>
            <span>{difficultySummary.name}</span>
          </div>

          {towerWarnings.length > 0 ? (
            <div className="tower-state-alerts">
              {towerWarnings.map((warning) => (
                <UiAlertBox key={warning.key} tone={warning.tone}>
                  <strong>{warning.title}</strong>
                  <span>{warning.description}</span>
                </UiAlertBox>
              ))}
            </div>
          ) : null}

          {pendingEvent && pendingEventDefinition ? (
            <section className={`tower-event-card tower-event-compact tone-${pendingEventDefinition.tone}`}>
              <div className="tower-event-head">
                <div>
                  <span>{getTowerEventPhaseLabel(pendingEvent.phase)}</span>
                  <h3>{pendingEventDefinition.title}</h3>
                </div>
                <strong>Andar {pendingEvent.floor}</strong>
              </div>
              <p>{pendingEventDefinition.description}</p>
              <div className="tower-event-choice-grid compact">
                {pendingEventDefinition.choices.map((choice) => {
                  const availability = canChooseTowerEventOption(state, pendingEvent, choice.id);
                  const costText = choice.cost ? ` (${choice.cost.amount} ${getTowerEventResourceName(choice.cost.resource)})` : "";

                  return (
                    <button
                      className="tower-event-choice"
                      disabled={!availability.ok}
                      key={choice.id}
                      onClick={() => handleEventChoice(choice.id)}
                      type="button"
                    >
                      <strong>{choice.label}</strong>
                      <span>
                        {choice.description}
                        {costText}
                      </span>
                      {!availability.ok && availability.message ? <em>{availability.message}</em> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="tower-challenge-grid">
            <section className="tower-threat-card">
              <h4>Inimigos previstos</h4>
              <div className="tower-enemy-list">
                {enemyPreview.map((enemy) => (
                  <span key={enemy.key}>
                    {enemy.label}
                    {enemy.count > 1 ? ` x${enemy.count}` : ""} | {enemy.role}
                  </span>
                ))}
              </div>
              <small>{bossFloor ? `Chefe detectado: ${selectedChapter.finalBoss}.` : "Composição estimada pela patrulha da guilda."}</small>
            </section>
            <section className={`tower-risk-card tone-${riskProfile.tone}`}>
              <h4>Risco estimado</h4>
              <strong>{riskProfile.label}</strong>
              <p>{riskProfile.description}</p>
              <small>
                Equipe nível médio {averageFormationLevel || 0} contra recomendado {recommendedLevel}.
              </small>
            </section>
            <section>
              <h4>Modificadores ativos</h4>
              <p>{selectedFloorData?.mechanic ?? "Sem mecânica registrada."}</p>
              <small>{modifierSummary || "Sem modificador adicional além da região."}</small>
            </section>
            <section className="tower-reward-card">
              <h4>Recompensas possíveis</h4>
              <p>{rewardPreview}</p>
              <small>{selectedFloorData?.rewardHint ?? "Recompensas variam conforme dificuldade e eventos."}</small>
            </section>
            <section className="tower-cost-card">
              <h4>Custo e equipe</h4>
              <div className="tower-cost-grid">
                <span>
                  <strong>{GAME_CONFIG.towerEnergyCost}</strong>
                  Energia
                </span>
                <span>
                  <strong>{heroCount}</strong>
                  Heróis
                </span>
                <span>
                  <strong>{formationPower}</strong>
                  Poder
                </span>
              </div>
              <small>
                Energia atual {energy}/{state.resources.maxEnergy}.
              </small>
            </section>
          </div>

          {activeEffects.length > 0 ? (
            <div className="tower-effect-inline">
              {activeEffects.map((effect) => (
                <span key={effect.id}>{effect.label}</span>
              ))}
            </div>
          ) : null}

          <div className="tower-difficulty-picker compact">
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

          <div className="tower-challenge-footer">
            <p className="tower-event-next-step">{statusMessage}</p>
            <button className="tower-start-battle-button" disabled={!canChallenge} onClick={() => void handleChallenge()} type="button">
              <strong>{actionLabel}</strong>
              <span>{GAME_CONFIG.towerEnergyCost} energia · risco {riskProfile.label}</span>
            </button>
          </div>

          {feedback ? <p className="tower-battle-feedback">{feedback}</p> : null}
        </article>
      </div>

      {showBattleModal ? (
        <section className="modal-backdrop tower-result-backdrop" role="dialog" aria-modal="true" aria-labelledby="towerResultTitle">
          <article className="modal-card tower-result-modal-card">
            <div className="tower-modal-head">
              <span>Resultado de combate</span>
              <button className="hero-inline-action" onClick={() => setShowBattleModal(false)} type="button">
                Fechar
              </button>
            </div>
            <h2 id="towerResultTitle">Resultado da Torre</h2>
            <BattleResultPanel onContinue={() => setShowBattleModal(false)} />
          </article>
        </section>
      ) : null}

      {showHistoryModal ? (
        <section className="modal-backdrop tower-history-backdrop" role="dialog" aria-modal="true" aria-labelledby="towerHistoryTitle">
          <article className="modal-card tower-history-modal-card">
            <div className="tower-modal-head">
              <span>Registro da Torre</span>
              <button className="hero-inline-action" onClick={() => setShowHistoryModal(false)} type="button">
                Fechar
              </button>
            </div>
            <h2 id="towerHistoryTitle">Histórico recente</h2>
            <p>{getBattleSummary(lastBattle)}</p>
            <div className="tower-history-modal-list">
              {recentHistory.length > 0 ? (
                recentHistory.map((entry) => (
                  <div className="tower-history-item" key={entry.id}>
                    <strong>
                      {entry.title} | Andar {entry.floor}
                    </strong>
                    <span>
                      {entry.choice}: {entry.message}
                    </span>
                  </div>
                ))
              ) : (
                <span>Nenhum evento recente registrado.</span>
              )}
            </div>
          </article>
        </section>
      ) : null}
    </section>
  );
}
