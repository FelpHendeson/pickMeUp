"use client";

import { useEffect, useState } from "react";
import {
  canChooseTowerEventOption,
  canRepeatTowerFloor,
  canSpendResource,
  describeReward,
  GAME_CONFIG,
  getEnemyArchetype,
  getFloorData,
  getFloorModifierSummary,
  getHeroExpedition,
  getTowerChapterByFloor,
  getTowerDifficultyJumpLabel,
  getTowerDifficultySummary,
  getTowerEventDefinition,
  getTowerEventPhaseLabel,
  getTowerEventResourceName,
  getTowerMilestoneInfo,
  getTowerReadinessReport,
  getWeeklyTowerRewardOptions,
  isBossFloor,
  normalizeTowerDifficultyMode,
  TOWER_FLOORS,
  type BattleResult,
  type Hero,
  type RunTowerBattleResult,
  type TowerDifficultyModeId,
  type TowerFloor,
  type TowerReadinessReport,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useConfirmDialog, useToast, UiAlertBox, UiModal, UiProgressBar } from "../ui";
import { BattleResultPanel, BattleResultSummaryCard, getBattleRewardHighlights } from "./BattleResultPanel";

const difficultyModes = ["normal", "challenge", "hardcore"] as const;
const maxTowerFloor = TOWER_FLOORS.at(-1)?.floor ?? GAME_CONFIG.towerMaxFloor;

type TowerChallengePanelProps = {
  onNavigate?: (tab: "formation") => void;
};

type TowerEventOutcome = {
  message: string;
  title: string;
  tone: "default" | "danger" | "ritual" | "arcane";
};

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

function getTowerEventModalTone(tone: string): "default" | "danger" | "ritual" | "arcane" {
  if (tone === "danger") return "danger";
  if (tone === "reward" || tone === "merchant") return "ritual";
  if (tone === "support" || tone === "choice") return "arcane";
  return "default";
}

function formatHeroNames(heroes: Hero[]): string {
  if (heroes.length === 0) return "";
  const names = heroes.slice(0, 3).map((hero) => hero.name).join(", ");
  return heroes.length > 3 ? `${names} e mais ${heroes.length - 3}` : names;
}

function getBattleProgressLabels(entries: unknown[] | undefined, includeClaimed = false): string[] {
  return (entries || [])
    .map((entry) => entry as { title?: unknown; name?: unknown; complete?: unknown; claimed?: unknown })
    .filter((entry) => Boolean(entry.complete) && (includeClaimed || !entry.claimed))
    .map((entry) => String(entry.title || entry.name || "Progresso concluído"))
    .slice(0, 3);
}

function getRiskProfile(options: {
  difficultyMode: TowerDifficultyModeId;
  pendingEvent: boolean;
  readinessReport: TowerReadinessReport;
  selectedIsLocked: boolean;
}) {
  if (options.pendingEvent) {
    return { label: "Bloqueado", tone: "danger", description: "Evento pendente impede a marcha até a Torre." };
  }

  if (options.selectedIsLocked) {
    return { label: "Selado", tone: "locked", description: "A campanha ainda não liberou este andar." };
  }

  let riskScore = 100 - options.readinessReport.score;
  if (options.difficultyMode === "challenge") riskScore += 12;
  if (options.difficultyMode === "hardcore") riskScore += 25;

  if (options.readinessReport.level === "critical" || riskScore >= 65) {
    return { label: "Crítico", tone: "critical", description: "A formação entra abaixo da ameaça prevista; espere perdas reais." };
  }

  if (options.readinessReport.level === "danger" || riskScore >= 40) {
    return { label: "Alto", tone: "danger", description: "O andar favorece desgaste, ferimentos e falhas de moral." };
  }

  if (options.readinessReport.level === "caution" || riskScore >= 20) {
    return { label: "Moderado", tone: "warning", description: "A luta é viável, mas a região ainda pune descuidos." };
  }

  return { label: "Controlado", tone: "safe", description: "A formação parece preparada para este andar." };
}

export function TowerChallengePanel({ onNavigate }: TowerChallengePanelProps = {}) {
  const state = useGameStore((store) => store.state);
  const startTowerBattle = useGameStore((store) => store.startTowerBattle);
  const startRepeatTowerBattle = useGameStore((store) => store.startRepeatTowerBattle);
  const resolveEvent = useGameStore((store) => store.resolveTowerEventChoice);
  const confirmDialog = useConfirmDialog();
  const { showToast } = useToast();
  const highestAvailableFloor = clampFloor(state.towerFloor);
  const [selectedFloor, setSelectedFloor] = useState(highestAvailableFloor);
  const [difficultyMode, setDifficultyMode] = useState<TowerDifficultyModeId>("normal");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasUnseenBattleResult, setHasUnseenBattleResult] = useState(false);
  const [lastOpenedEventId, setLastOpenedEventId] = useState<string | null>(null);
  const [towerEventOutcome, setTowerEventOutcome] = useState<TowerEventOutcome | null>(null);
  const [showTowerEventModal, setShowTowerEventModal] = useState(false);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [dismissedBattleId, setDismissedBattleId] = useState<string | null>(null);
  const normalizedDifficulty = normalizeTowerDifficultyMode(difficultyMode);
  const difficultySummary = getTowerDifficultySummary(normalizedDifficulty);
  const selectedFloorData = getFloorData(selectedFloor);
  const selectedChapter = getTowerChapterByFloor(selectedFloor);
  const currentChapter = getTowerChapterByFloor(highestAvailableFloor);
  const selectedIsCurrent = selectedFloor === highestAvailableFloor && state.towerFloor <= maxTowerFloor;
  const selectedIsRepeatable = selectedFloor < state.towerFloor && canRepeatTowerFloor(state, selectedFloor);
  const selectedIsLocked = selectedFloor > state.towerFloor;
  const bossFloor = isBossFloor(selectedFloor);
  const milestoneInfo = getTowerMilestoneInfo(selectedFloor);
  const readinessReport = getTowerReadinessReport(state, selectedFloor);
  const heroCount = readinessReport.metrics.formationSize;
  const formationPower = readinessReport.metrics.formationPower;
  const energy = readinessReport.metrics.energy;
  const averageFormationLevel = readinessReport.metrics.averageLevel;
  const getReadinessCheck = (key: string) => readinessReport.checks.find((check) => check.key === key);
  const getReadinessHeroes = (key: string) => {
    const heroIds = new Set(getReadinessCheck(key)?.heroIds ?? []);
    return state.heroes.filter((hero) => heroIds.has(hero.id));
  };
  const busyHeroes = getReadinessHeroes("expedition");
  const injuredHeroes = getReadinessHeroes("injuries");
  const woundedHeroes = getReadinessHeroes("health");
  const readinessProblemChecks = readinessReport.checks.filter((check) => check.status !== "good");
  const weeklyRewardOptions = getWeeklyTowerRewardOptions();
  const rewardPreview = selectedFloorData ? describeReward(selectedFloor, { ...weeklyRewardOptions, difficultyMode: normalizedDifficulty }) : "";
  const modifierSummary = selectedFloorData ? getFloorModifierSummary(selectedFloorData) : "";
  const enemyPreview = selectedFloorData ? getEnemyPreview(selectedFloorData) : [];
  const recommendedLevel = selectedFloorData?.recommendedLevel ?? 1;
  const chapterFloorCount = currentChapter.endFloor - currentChapter.startFloor + 1;
  const chapterFloorPosition = Math.max(1, Math.min(highestAvailableFloor - currentChapter.startFloor + 1, chapterFloorCount));
  const chapterProgress = Math.round((chapterFloorPosition / chapterFloorCount) * 100);
  const pendingEvent = state.pendingTowerEvent;
  const pendingEventDefinition = pendingEvent ? getTowerEventDefinition(pendingEvent.typeKey) : null;
  const activeEffects = state.towerBattleEffects.filter((effect) => effect.scope === "nextBattle");
  const recentHistory = state.towerEventHistory.slice(0, 5);
  const lastBattle = state.lastBattle;
  const riskProfile = getRiskProfile({
    difficultyMode: normalizedDifficulty,
    pendingEvent: Boolean(pendingEvent),
    readinessReport,
    selectedIsLocked,
  });
  const towerWarnings: Array<{ key: string; tone: "info" | "warning" | "danger" | "success"; title: string; description: string }> = [];

  if (milestoneInfo.type !== "normal") {
    towerWarnings.push({
      key: "milestone",
      tone: milestoneInfo.type === "chapter-boss" ? "danger" : "warning",
      title: milestoneInfo.title,
      description: `${milestoneInfo.warning} ${milestoneInfo.preparationHint}`,
    });
  }

  if (pendingEvent) {
    towerWarnings.push({
      key: "event",
      tone: "danger",
      title: "Evento pendente",
      description: `Resolva o evento do andar ${pendingEvent.floor} antes de iniciar outro combate.`,
    });
  }

  const canChallenge =
    !selectedIsLocked &&
    (selectedIsCurrent || selectedIsRepeatable) &&
    heroCount > 0 &&
    readinessReport.metrics.busyHeroCount === 0 &&
    !pendingEvent &&
    canSpendResource(state, "energy", GAME_CONFIG.towerEnergyCost);
  const actionLabel = selectedIsCurrent ? "Desafiar andar" : selectedIsRepeatable ? "Repetir andar" : "Andar bloqueado";
  const statusMessage = (() => {
    if (pendingEvent) return `Resolva o evento pendente no andar ${pendingEvent.floor} antes de lutar.`;
    if (selectedIsLocked) return "Este andar ainda não foi liberado pela campanha.";
    if (!selectedIsCurrent && !selectedIsRepeatable) return "Este andar não pode ser repetido agora.";
    if (heroCount === 0) return "Monte uma formação antes de desafiar a torre.";
    if (busyHeroes.length > 0) return `${formatHeroNames(busyHeroes)} está em expedição. Troque a formação antes de lutar.`;
    if (energy < GAME_CONFIG.towerEnergyCost) return `Energia insuficiente (${energy}/${GAME_CONFIG.towerEnergyCost}).`;
    if (readinessReport.level !== "ready") return `${readinessReport.label}: ${readinessReport.summary}`;
    return selectedIsCurrent ? "Pronto para avançar a campanha." : "Pronto para repetir este andar e farmar recompensas.";
  })();

  useEffect(() => {
    setSelectedFloor(highestAvailableFloor);
  }, [highestAvailableFloor]);

  useEffect(() => {
    if (!pendingEvent || lastOpenedEventId === pendingEvent.id || showBattleModal) return;
    setTowerEventOutcome(null);
    setLastOpenedEventId(pendingEvent.id);
    setShowTowerEventModal(true);
  }, [lastOpenedEventId, pendingEvent, showBattleModal]);

  async function confirmHardcore(): Promise<boolean> {
    if (normalizedDifficulty !== "hardcore") return true;
    return confirmDialog({
      title: "Iniciar modo Hardcore?",
      description: "Heróis que caírem neste modo podem morrer permanentemente. Esta tentativa deve ser tratada como uma decisão de alto risco.",
      confirmLabel: "Iniciar Hardcore",
      tone: "danger",
    });
  }

  function openBattleResult() {
    if (!lastBattle) return;
    setHasUnseenBattleResult(false);
    setShowBattleModal(true);
  }

  function closeBattleResult() {
    setHasUnseenBattleResult(false);
    setShowBattleModal(false);
  }

  function continueFromLastBattle() {
    if (lastBattle) setDismissedBattleId(lastBattle.id);
    setHasUnseenBattleResult(false);
    setShowBattleModal(false);
  }

  function openPendingEvent() {
    setTowerEventOutcome(null);
    setShowTowerEventModal(true);
  }

  function showBattleToasts(battle: BattleResult) {
    const rewardHighlights = getBattleRewardHighlights(battle, 3).filter((reward) => !reward.label.startsWith("Sem") && !reward.label.startsWith("Derrota"));
    const completedMissions = getBattleProgressLabels(battle.progression?.missionUpdates);
    const completedAchievements = getBattleProgressLabels(battle.progression?.achievementsAvailable);

    showToast({
      title: battle.result === "victory" ? "Resultado registrado" : "Derrota registrada",
      message: `${battle.result === "victory" ? "Vitória" : "Derrota"} no andar ${battle.floor} em ${battle.rounds} turno(s).`,
      tone: battle.result === "victory" ? "success" : "danger",
    });

    if (rewardHighlights.length > 0) {
      showToast({
        title: "Recompensa recebida",
        message: rewardHighlights.map((reward) => reward.label).join(" | "),
        tone: "reward",
      });
    }

    if (completedMissions.length > 0) {
      showToast({
        title: "Missão concluída",
        message: completedMissions.join(" | "),
        tone: "success",
      });
    }

    if (completedAchievements.length > 0) {
      showToast({
        title: "Conquista concluída",
        message: completedAchievements.join(" | "),
        tone: "arcane",
      });
    }
  }

  async function handleChallenge() {
    if (!canChallenge) {
      setFeedback(statusMessage);
      showToast({
        title: energy < GAME_CONFIG.towerEnergyCost ? "Energia insuficiente" : busyHeroes.length > 0 ? "Herói em expedição" : "Ação indisponível",
        message: statusMessage,
        tone: "warning",
      });
      return;
    }

    const confirmed = await confirmHardcore();
    if (!confirmed) return;

    const result = selectedIsCurrent
      ? startTowerBattle({ difficultyMode: normalizedDifficulty })
      : startRepeatTowerBattle(selectedFloor, { difficultyMode: normalizedDifficulty });

    setFeedback(formatBattleMessage(result));

    if (injuredHeroes.length > 0 || woundedHeroes.length > 0) {
      showToast({
        title: "Herói ferido",
        message: "A formação entrou na Torre com ferimentos ou HP crítico.",
        tone: "warning",
      });
    }

    if (result.ok && "event" in result && result.event) {
      if (result.phase === "post") {
        const completedBattle = useGameStore.getState().state.lastBattle;
        if (completedBattle) {
          setDismissedBattleId(null);
          setHasUnseenBattleResult(true);
          setShowBattleModal(true);
          showBattleToasts(completedBattle);
        }
        setTowerEventOutcome(null);
        setShowTowerEventModal(false);
        return;
      }

      showToast({
        title: "Evento revelado",
        message: formatBattleMessage(result),
        tone: "arcane",
      });
      setTowerEventOutcome(null);
      setShowTowerEventModal(true);
    }
    if (result.ok && "battle" in result) {
      setDismissedBattleId(null);
      setHasUnseenBattleResult(true);
      setShowBattleModal(true);
      showBattleToasts(result.battle);
      return;
    }

    if (result.ok) {
      showToast({
        title: "Ação concluída",
        message: formatBattleMessage(result),
        tone: "success",
      });
      return;
    }

    if (!result.ok) {
      showToast({
        title: "Erro de ação",
        message: result.message,
        tone: "warning",
      });
    }
  }

  function handleEventChoice(choiceId: string) {
    const result = resolveEvent(choiceId);
    setFeedback(result.message);
    if (!result.ok) return;

    if (result.battleStarted) {
      const completedBattle = useGameStore.getState().state.lastBattle;
      setTowerEventOutcome(null);
      setShowTowerEventModal(false);
      setDismissedBattleId(null);
      setHasUnseenBattleResult(true);
      setShowBattleModal(true);
      if (completedBattle) showBattleToasts(completedBattle);
      return;
    }

    setTowerEventOutcome({
      title: "Consequência do evento",
      message: result.message,
      tone: "arcane",
    });
    setShowTowerEventModal(true);
  }

  const resultIsDominant = Boolean(lastBattle && dismissedBattleId !== lastBattle.id && !pendingEvent);
  const blockingState = (() => {
    if (pendingEvent || resultIsDominant) return null;

    if (heroCount === 0) {
      return {
        title: "Formação incompleta",
        description: "A Torre exige pelo menos um herói escalado antes de abrir o combate.",
        cta: "Montar formação",
        tone: "warning" as const,
        onClick: () => {
          if (onNavigate) onNavigate("formation");
          else
            showToast({
              title: "Formação incompleta",
              message: "Abra a aba Formação e escale heróis antes de desafiar a Torre.",
              tone: "warning",
            });
        },
      };
    }

    if (busyHeroes.length > 0) {
      const busyHero = busyHeroes[0];
      const expedition = busyHero ? getHeroExpedition(state, busyHero.id) : null;
      return {
        title: "Herói indisponível",
        description: `${formatHeroNames(busyHeroes)} está em expedição${expedition ? `: ${expedition.name}` : ""}. Troque a formação para lutar.`,
        cta: "Trocar herói indisponível",
        tone: "danger" as const,
        onClick: () => {
          if (onNavigate) onNavigate("formation");
          else
            showToast({
              title: "Herói em expedição",
              message: "Troque o herói indisponível antes de desafiar a Torre.",
              tone: "warning",
            });
        },
      };
    }

    if (energy < GAME_CONFIG.towerEnergyCost) {
      return {
        title: "Energia insuficiente",
        description: `A Torre exige ${GAME_CONFIG.towerEnergyCost} energia; você tem ${energy}.`,
        cta: "Recuperar energia",
        tone: "danger" as const,
        onClick: () =>
          showToast({
            title: "Energia insuficiente",
            message: `A Torre exige ${GAME_CONFIG.towerEnergyCost} energia. Aguarde regenerar antes de desafiar.`,
            tone: "warning",
          }),
      };
    }

    if (selectedIsLocked) {
      return {
        title: "Andar bloqueado",
        description: "Este andar ainda não foi liberado pela campanha.",
        cta: "Voltar ao andar atual",
        tone: "warning" as const,
        onClick: () => setSelectedFloor(highestAvailableFloor),
      };
    }

    if (!selectedIsCurrent && !selectedIsRepeatable) {
      return {
        title: "Repetição indisponível",
        description: "Este andar ainda não pode ser repetido para recompensas.",
        cta: "Selecionar andar atual",
        tone: "warning" as const,
        onClick: () => setSelectedFloor(highestAvailableFloor),
      };
    }

    return null;
  })();
  const shouldShowPreparation = !pendingEvent && !resultIsDominant && !blockingState;

  const primaryAction = (() => {
    if (pendingEvent) {
      return {
        label: "Resolver evento",
        detail: `${pendingEventDefinition?.title ?? "Evento pendente"} | combate bloqueado`,
        disabled: false,
        onClick: openPendingEvent,
      };
    }

    if (resultIsDominant && lastBattle) {
      return {
        label: hasUnseenBattleResult ? "Ver resultado" : "Continuar subida",
        detail: hasUnseenBattleResult ? "Combate recente ainda precisa ser revisado" : "Resumo recente em destaque",
        disabled: false,
        onClick: hasUnseenBattleResult ? openBattleResult : continueFromLastBattle,
      };
    }

    if (blockingState) {
      return {
        label: blockingState.cta,
        detail: blockingState.description,
        disabled: false,
        onClick: blockingState.onClick,
      };
    }

    if (!canChallenge) {
      return {
        label: actionLabel,
        detail: statusMessage,
        disabled: true,
        onClick: () => undefined,
      };
    }

    return {
      label: actionLabel,
      detail: `${GAME_CONFIG.towerEnergyCost} energia | risco ${riskProfile.label}`,
      disabled: false,
      onClick: () => void handleChallenge(),
    };
  })();

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
              const floorMilestone = getTowerMilestoneInfo(floor.floor);
              const locked = floor.floor > state.towerFloor;
              const current = floor.floor === highestAvailableFloor && state.towerFloor <= maxTowerFloor;
              const completed = floor.floor < state.towerFloor;
              const selected = floor.floor === selectedFloor;
              const repeatable = completed && canRepeatTowerFloor(state, floor.floor);
              const status = locked ? "locked" : current ? "current" : repeatable ? "repeatable" : "completed";

              return (
                <button
                  aria-pressed={selected}
                  className={`tower-floor-node ${status}${selected ? " selected" : ""}${floorMilestone.type !== "normal" ? ` milestone-${floorMilestone.type}` : ""}`}
                  disabled={locked}
                  key={floor.floor}
                  onClick={() => setSelectedFloor(floor.floor)}
                  title={`${floor.floor}. ${floor.title}`}
                  type="button"
                >
                  <strong>{floor.floor}</strong>
                  <span>{floorMilestone.type === "chapter-boss" ? "Chefe" : floorMilestone.type === "block-test" ? "Prova" : floor.floor < 10 ? `0${floor.floor}` : floor.floor}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className={`tower-challenge-detail risk-${riskProfile.tone}${bossFloor ? " boss-floor" : ""}${milestoneInfo.type !== "normal" ? ` milestone-${milestoneInfo.type}` : ""}`}>
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
              <button className={hasUnseenBattleResult ? "hero-inline-action primary" : "hero-inline-action"} disabled={!lastBattle} onClick={openBattleResult} type="button">
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
            <span>Preparo {readinessReport.score}/100</span>
            <span>Nível recomendado {recommendedLevel}</span>
            <span>{difficultySummary.name}</span>
            {milestoneInfo.type !== "normal" ? <span>{getTowerDifficultyJumpLabel(selectedFloor)}</span> : null}
          </div>

          <section className={`tower-readiness-card tone-${readinessReport.level}`}>
            <div className="tower-readiness-head">
              <div>
                <span>Diagnóstico do Lobby</span>
                <h4>{readinessReport.label}</h4>
                <p>{readinessReport.summary}</p>
              </div>
              <strong aria-label={`Score de preparo ${readinessReport.score} de 100`}>{readinessReport.score}</strong>
            </div>

            <div className="tower-readiness-metrics">
              <span>
                Formação <strong>{heroCount}/{readinessReport.metrics.maxFormationSize}</strong>
              </span>
              <span>
                Poder <strong>{formationPower}/{readinessReport.metrics.recommendedPower}</strong>
              </span>
              <span>
                Nível <strong>{averageFormationLevel || 0}/{recommendedLevel}</strong>
              </span>
              <span>
                Energia <strong>{energy}/{readinessReport.metrics.energyCost}</strong>
              </span>
            </div>

            <div className="tower-readiness-content">
              <div>
                <h5>Pontos de atenção</h5>
                {readinessProblemChecks.length > 0 ? (
                  <ul className="tower-readiness-checks">
                    {readinessProblemChecks.map((check) => (
                      <li className={`status-${check.status}`} key={check.key}>
                        <strong>{check.label}</strong>
                        <span>{check.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tower-readiness-clear">Nenhum problema relevante detectado na formação.</p>
                )}
              </div>
              <div>
                <h5>Recomendações</h5>
                <ul className="tower-readiness-recommendations">
                  {readinessReport.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>

            <small>Este diagnóstico é informativo e não cria um novo bloqueio para a tentativa.</small>
          </section>

          {shouldShowPreparation && towerWarnings.length > 0 ? (
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
            <section className={`tower-event-card tower-event-compact tower-event-cta tone-${pendingEventDefinition.tone}`}>
              <div className="tower-event-head">
                <div>
                  <span>{getTowerEventPhaseLabel(pendingEvent.phase)}</span>
                  <h3>{pendingEventDefinition.title}</h3>
                </div>
                <strong>Andar {pendingEvent.floor}</strong>
              </div>
              <p>{pendingEventDefinition.description}</p>
              <button className="tower-start-battle-button tower-event-open-button" onClick={openPendingEvent} type="button">
                <strong>Resolver evento</strong>
                <span>
                  {pendingEventDefinition.choices.length} escolha(s) disponível(is) | combate bloqueado
                </span>
              </button>
            </section>
          ) : null}

          {resultIsDominant && lastBattle ? (
            <BattleResultSummaryCard battle={lastBattle} onContinue={continueFromLastBattle} onOpen={openBattleResult} state={state} />
          ) : null}

          {blockingState ? (
            <section className={`tower-blocker-card tone-${blockingState.tone}`}>
              <span>Combate bloqueado</span>
              <h3>{blockingState.title}</h3>
              <p>{blockingState.description}</p>
              <button className="tower-start-battle-button" onClick={() => void blockingState.onClick()} type="button">
                <strong>{blockingState.cta}</strong>
                <span>{primaryAction.detail}</span>
              </button>
            </section>
          ) : null}

          {shouldShowPreparation ? (
            <>
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
                <button className="tower-start-battle-button" disabled={primaryAction.disabled} onClick={() => void primaryAction.onClick()} type="button">
                  <strong>{primaryAction.label}</strong>
                  <span>{primaryAction.detail}</span>
                </button>
              </div>
            </>
          ) : null}

          {feedback ? <p className="tower-battle-feedback">{feedback}</p> : null}
        </article>
      </div>

      {showTowerEventModal && towerEventOutcome ? (
        <UiModal
          actions={
            <button className="ui-action primary" onClick={() => setShowTowerEventModal(false)} type="button">
              Continuar
            </button>
          }
          className="tower-event-modal-card"
          labelledBy="towerEventOutcomeTitle"
          onClose={() => setShowTowerEventModal(false)}
          overline="Evento resolvido"
          title={towerEventOutcome.title}
          tone={towerEventOutcome.tone}
        >
          <div className="tower-event-modal-body">
            <p>{towerEventOutcome.message}</p>
            <p className="tower-event-next-step">A consequência foi aplicada e registrada no histórico da Torre.</p>
          </div>
        </UiModal>
      ) : null}

      {showTowerEventModal && !towerEventOutcome && pendingEvent && pendingEventDefinition ? (
        <UiModal
          className={`tower-event-modal-card tone-${pendingEventDefinition.tone}`}
          labelledBy="towerEventModalTitle"
          onClose={() => setShowTowerEventModal(false)}
          overline={getTowerEventPhaseLabel(pendingEvent.phase)}
          title={pendingEventDefinition.title}
          tone={getTowerEventModalTone(pendingEventDefinition.tone)}
        >
          <div className="tower-event-modal-body">
            <p>{pendingEventDefinition.description}</p>
            <p className="tower-event-next-step">
              Escolha como a guilda vai reagir. O combate da Torre permanece bloqueado até este evento ser resolvido.
            </p>
            <div className="tower-event-choice-grid modal">
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
          </div>
        </UiModal>
      ) : null}

      {showBattleModal ? (
        <UiModal
          className="tower-result-modal-card"
          labelledBy="towerResultTitle"
          onClose={closeBattleResult}
          overline="Resultado de combate"
          size="large"
          subtitle="Resumo, recompensas, heróis, consequências e log ficam separados para leitura rápida."
          title="Resultado da Torre"
          tone={lastBattle?.result === "victory" ? "ritual" : "danger"}
        >
          <BattleResultPanel onContinue={closeBattleResult} />
        </UiModal>
      ) : null}

      {showHistoryModal ? (
        <UiModal
          className="tower-history-modal-card"
          labelledBy="towerHistoryTitle"
          onClose={() => setShowHistoryModal(false)}
          overline="Registro da Torre"
          size="large"
          subtitle={getBattleSummary(lastBattle)}
          title="Histórico recente"
          tone="arcane"
        >
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
        </UiModal>
      ) : null}
    </section>
  );
}
