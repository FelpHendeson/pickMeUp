"use client";

import {
  advanceBattlePlayback,
  createBattlePlaybackState,
  getBattleEvents,
  getBattlePlaybackDelay,
  getDefaultBattleSpeed,
  getTowerChapterByFloor,
  setBattlePlaybackSpeed,
  type BattleEvent,
  type BattlePerformanceEntry,
  type BattleResult,
  type BattleSpeed,
  type GameState,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useState } from "react";

const speedOptions: BattleSpeed[] = ["1x", "2x", "instant"];

type BattleResultPanelProps = {
  compact?: boolean;
  onContinue?: () => void;
};

type ProgressEntry = {
  title?: string;
  name?: string;
  progress?: number;
  target?: number;
  complete?: boolean;
  claimed?: boolean;
};

type LibraryUpdate = {
  name?: string;
  defeated?: number;
  detailsUnlocked?: boolean;
};

type ResultTone = "success" | "warning" | "danger" | "neutral";
type BattleResultTab = "summary" | "rewards" | "heroes" | "consequences" | "log";

const battleResultTabs: Array<{ id: BattleResultTab; label: string }> = [
  { id: "summary", label: "Resumo" },
  { id: "rewards", label: "Recompensas" },
  { id: "heroes", label: "Heróis" },
  { id: "consequences", label: "Consequências" },
  { id: "log", label: "Log" },
];

function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function getFirstLoggedAmount(log: string[], pattern: RegExp): number {
  for (const line of log) {
    const match = line.match(pattern);
    if (match?.[1]) return Number(match[1]) || 0;
  }
  return 0;
}

function getHeroXpReward(battle: BattleResult): number {
  const progressionXp = battle.progression?.heroXp?.[0]?.xp;
  if (typeof progressionXp === "number" && progressionXp > 0) return progressionXp;
  return getFirstLoggedAmount(battle.log || [], /\+(\d+)\s+XP para cada heroi/i);
}

function getResourceRewards(battle: BattleResult) {
  const rewards = battle.rewards;
  const log = battle.log || [];
  return [
    { label: "Ouro", value: rewards?.gold || getFirstLoggedAmount(log, /\+(\d+)\s+ouro/i), description: "Moeda para cura, base e melhorias." },
    { label: "Cristais", value: rewards?.crystals || getFirstLoggedAmount(log, /Cristais encontrados:\s+\+(\d+)/i), description: "Recurso raro para invocação superior." },
    { label: "Essência", value: rewards?.essence || getFirstLoggedAmount(log, /Essencia recuperada:\s+\+(\d+)/i), description: "Material arcano de progressão." },
    { label: "Fragmentos", value: rewards?.fragments || getFirstLoggedAmount(log, /Fragmentos recolhidos:\s+\+(\d+)/i), description: "Material de avanço e contratos." },
    { label: "Frag. eco", value: rewards?.echoFragments || getFirstLoggedAmount(log, /Fragmentos de Eco ressoaram:\s+\+(\d+)/i), description: "Usado em relíquias e marcos especiais." },
    { label: "Energia", value: rewards?.energyRefund || getFirstLoggedAmount(log, /\+(\d+)\s+energia/i), description: "Energia recuperada pela vitória." },
    { label: "Contratos", value: rewards?.heroContracts || getFirstLoggedAmount(log, /\+(\d+)\s+contrato/i), description: "Chamados diretos para recrutamento." },
  ];
}

function getConsequenceEvents(events: BattleEvent[], type: string): BattleEvent[] {
  return events.filter((event) => event.type === type);
}

function getTopPerformer(performance: Record<string, BattlePerformanceEntry>): BattlePerformanceEntry | null {
  return (
    Object.values(performance || {}).sort(
      (a, b) => b.damageDealt - a.damageDealt || b.kills - a.kills || b.healingDone - a.healingDone,
    )[0] ?? null
  );
}

function getHeroXpGain(battle: BattleResult, entry: BattlePerformanceEntry): number {
  return battle.progression?.heroXp.find((xp) => xp.heroId === entry.id || xp.heroName === entry.name)?.xp || 0;
}

function getBattleKind(battle: BattleResult): string {
  const firstLine = battle.log?.[0] || "";
  const eventAfterBattle = (battle.log || []).some((line) => /evento surgiu depois do combate/i.test(line));

  if (battle.summary?.isBoss) return "Chefe";
  if (/Repeti[cç][aã]o do andar/i.test(firstLine)) return "Repetição";
  if (eventAfterBattle) return "Evento pós-combate";
  return "Andar comum";
}

function getRiskReadout(battle: BattleResult): { label: string; tone: ResultTone; description: string } {
  const modifierCount = battle.summary?.modifiers?.length || 0;
  const difficultyId = battle.summary?.difficultyId || "normal";

  if (difficultyId === "hardcore") {
    return { label: "Extremo", tone: "danger", description: "Modo Hardcore aumentou risco de morte permanente e punições severas." };
  }

  if (battle.summary?.isBoss) {
    return { label: "Alto", tone: "danger", description: "Andar de chefe com pressão acima do combate comum." };
  }

  if (difficultyId === "challenge") {
    return { label: "Alto", tone: "warning", description: "Dificuldade de desafio elevou inimigos, recompensas e chance de desgaste." };
  }

  if (modifierCount > 1) {
    return { label: "Moderado", tone: "warning", description: "Múltiplos modificadores alteraram o comportamento da luta." };
  }

  if (modifierCount === 1) {
    return { label: "Atenção", tone: "warning", description: "Um modificador ativo influenciou a batalha." };
  }

  return { label: "Controlado", tone: "success", description: "Nenhum risco adicional relevante ficou registrado no resultado." };
}

function getBattleTacticalRead(
  battle: BattleResult,
  topPerformer: BattlePerformanceEntry | null,
  injuries: BattleEvent[],
  morale: BattleEvent[],
  deaths: BattleEvent[],
): string {
  const enemyNames = battle.summary?.enemyNames.join(", ") || battle.enemyTeam.map((enemy) => enemy.name).join(", ");
  const tacticalLead = topPerformer ? `${topPerformer.name} foi o destaque com ${topPerformer.damageDealt} de dano.` : "Nenhum destaque individual foi registrado.";

  if (battle.result === "victory") {
    const consequence = injuries.length > 0 || morale.length > 0 ? " A vitória teve custo e exige recuperação." : " A equipe saiu sem consequência crítica registrada.";
    return `A formação superou ${enemyNames} em ${battle.rounds} turno(s). ${tacticalLead}${consequence}`;
  }

  if (deaths.length > 0) {
    return `A formação foi quebrada por ${enemyNames}; houve morte permanente registrada. Reavalie dificuldade, HP e moral antes da próxima tentativa.`;
  }

  if (injuries.length > 0 || morale.length > 0) {
    return `A formação caiu contra ${enemyNames} e sofreu desgaste crítico. Trate ferimentos, recupere moral ou fortaleça a equipe.`;
  }

  return `A formação não sustentou pressão contra ${enemyNames}. O resultado indica falta de dano, defesa ou preparo para o modificador ativo.`;
}

function getNextStep(
  state: GameState,
  battle: BattleResult,
  injuries: BattleEvent[],
  morale: BattleEvent[],
  deaths: BattleEvent[],
  levelUps: Array<{ heroName: string }>,
  achievementsAvailable: ProgressEntry[],
): string {
  if (deaths.length > 0) return "Revise o memorial e a formação antes de tentar novamente.";
  if (injuries.length > 0) return "Trate ferimentos no quartel antes de subir o risco.";
  if (morale.length > 0) return "Recupere moral ou reduza a dificuldade do próximo combate.";
  if (levelUps.length > 0) return "Confira os heróis que evoluíram e ajuste equipamentos.";
  if (achievementsAvailable.length > 0) return "Colete conquistas liberadas antes da próxima luta.";
  if (battle.result === "victory" && state.towerFloor > battle.floor) return `Continue a campanha no andar ${state.towerFloor}.`;
  if (battle.result === "victory") return "Resultado registrado; escolha outro andar ou repita para loot.";
  return "Reforce a formação e tente novamente quando estiver pronto.";
}

function ProgressList({ entries, empty }: { entries: ProgressEntry[]; empty: string }) {
  if (entries.length === 0) return <span>{empty}</span>;

  return (
    <>
      {entries.slice(0, 4).map((entry, index) => (
        <span key={`${entry.title || entry.name || "entry"}_${index}`}>
          {entry.title || entry.name || "Progresso"} {typeof entry.progress === "number" && typeof entry.target === "number" ? `${entry.progress}/${entry.target}` : ""}
          {entry.complete ? " - pronta" : ""}
        </span>
      ))}
    </>
  );
}

function DetailCard({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail?: string; tone?: ResultTone }) {
  return (
    <article className={`battle-detail-card tone-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function BattleResultPanel({ compact = false, onContinue }: BattleResultPanelProps) {
  const state = useGameStore((store) => store.state);
  const battle = state.lastBattle;
  const [speed, setSpeed] = useState<BattleSpeed>(() => getDefaultBattleSpeed());
  const [activeTab, setActiveTab] = useState<BattleResultTab>("summary");
  const [eventCursor, setEventCursor] = useState(1);

  const allEvents = useMemo(() => (battle ? getBattleEvents(battle) : []), [battle]);
  const visibleEvents = allEvents.slice(0, Math.max(1, Math.min(eventCursor, allEvents.length || 1)));

  useEffect(() => {
    if (!battle) return;
    const initial = createBattlePlaybackState(battle, speed);
    setEventCursor(initial.eventCursor);
  }, [battle, battle?.floor, battle?.rounds, battle?.result, battle?.log?.length, speed]);

  useEffect(() => {
    setActiveTab("summary");
  }, [battle?.floor, battle?.rounds, battle?.result, battle?.log?.length]);

  useEffect(() => {
    if (!battle || speed === "instant" || eventCursor >= allEvents.length) return;

    const delay = getBattlePlaybackDelay(speed);
    const timer = window.setInterval(() => {
      setEventCursor((current) => advanceBattlePlayback(current, allEvents.length, speed));
    }, delay);

    return () => window.clearInterval(timer);
  }, [allEvents.length, battle, eventCursor, speed]);

  if (!battle) {
    return (
      <section className="battle-result-panel">
        <div className="section-heading">
          <span>Resultado de combate</span>
          <h2>Nenhum combate recente</h2>
          <p>O último resultado da torre aparecerá aqui quando existir no save.</p>
        </div>
      </section>
    );
  }

  const events = visibleEvents;
  const fallbackChapter = getTowerChapterByFloor(battle.floor);
  const chapterName = battle.summary?.chapterName ?? fallbackChapter.name;
  const chapterNumber = battle.summary?.chapterNumber ?? fallbackChapter.number;
  const battleKind = getBattleKind(battle);
  const riskReadout = getRiskReadout(battle);
  const topPerformer = getTopPerformer(battle.performance || {});
  const topPerformers = Object.values(battle.performance || {})
    .sort((a, b) => b.damageDealt - a.damageDealt || b.kills - a.kills)
    .slice(0, compact ? 3 : 6);
  const rewardRows = getResourceRewards(battle);
  const equipmentRewards = battle.rewards?.equipment || [];
  const consumableRewards = battle.rewards?.consumables || [];
  const levelUps = battle.progression?.levelUps || [];
  const specializations = battle.progression?.specializationsAvailable || [];
  const missionUpdates = (battle.progression?.missionUpdates || []) as ProgressEntry[];
  const completedMissions = missionUpdates.filter((mission) => Boolean(mission.complete));
  const achievementsAvailable = (battle.progression?.achievementsAvailable || []) as ProgressEntry[];
  const libraryUpdates = (battle.progression?.libraryUpdates || []) as LibraryUpdate[];
  const injuries = getConsequenceEvents(allEvents, "injury");
  const morale = getConsequenceEvents(allEvents, "morale");
  const deaths = getConsequenceEvents(allEvents, "death");
  const heroXpReward = getHeroXpReward(battle);
  const tacticalRead = getBattleTacticalRead(battle, topPerformer, injuries, morale, deaths);
  const nextStep = getNextStep(state, battle, injuries, morale, deaths, levelUps, achievementsAvailable);
  const advancedFloor = battle.result === "victory" && state.towerFloor > battle.floor;
  const enemyNames = battle.summary?.enemyNames.join(", ") || battle.enemyTeam.map((enemy) => enemy.name).join(", ");
  const modifiers = battle.summary?.modifiers?.length ? battle.summary.modifiers.join(", ") : "Sem modificador adicional";
  const weeklyEvent = battle.summary?.weeklyEvent || "Sem impacto registrado";
  const rewardTabCount =
    rewardRows.filter((reward) => reward.value > 0).length + equipmentRewards.length + consumableRewards.reduce((sum, item) => sum + item.amount, 0);
  const heroTabCount = topPerformers.length + levelUps.length;
  const consequenceTabCount = injuries.length + morale.length + deaths.length + completedMissions.length + achievementsAvailable.length + libraryUpdates.length;
  const tabCounts: Partial<Record<BattleResultTab, number>> = {
    rewards: rewardTabCount,
    heroes: heroTabCount,
    consequences: consequenceTabCount,
    log: allEvents.length,
  };

  return (
    <section className={`battle-result-panel ${battle.result === "victory" ? "result-victory" : "result-defeat"}${compact ? " compact" : ""}`}>
      <header className="battle-result-hero">
        <div className="battle-result-emblem" aria-hidden="true">
          {battle.result === "victory" ? "✦" : "☠"}
        </div>
        <div className="battle-result-copy">
          <span>{battle.result === "victory" ? "Conquista registrada" : "Alerta de derrota"}</span>
          <h2>{battle.result === "victory" ? "Vitória" : "Derrota"}</h2>
          <p>
            Capítulo {chapterNumber}: {chapterName} · Andar {battle.floor} · {battleKind}
          </p>
          <div className="battle-result-tags">
            <span>{battle.summary?.difficultyName || "Normal"}</span>
            <span>Risco {riskReadout.label}</span>
            <span>{battle.rounds} turno(s)</span>
            {battle.summary?.isBoss ? <span>Chefe</span> : null}
          </div>
          <p className="battle-result-verdict">{tacticalRead}</p>
        </div>
        <div className="battle-result-actions">
          <button className="hero-inline-action primary" onClick={() => onContinue?.()} type="button">
            Continuar
          </button>
          <button className="hero-inline-action" onClick={() => setActiveTab("log")} type="button">
            Ver replay/log
          </button>
        </div>
      </header>

      <section className="battle-result-answer-strip" aria-label="Resumo rápido do combate">
        <DetailCard label="O que aconteceu" value={battle.result === "victory" ? "Vitória" : "Derrota"} detail={battleKind} tone={battle.result === "victory" ? "success" : "danger"} />
        <DetailCard label="Por quê" value={topPerformer ? topPerformer.name : "Pressão inimiga"} detail={topPerformer ? `${topPerformer.damageDealt} dano, ${topPerformer.kills} abate(s)` : "Sem destaque registrado"} />
        <DetailCard label="Loot principal" value={formatNumber(rewardRows.reduce((total, reward) => total + reward.value, 0))} detail={`${equipmentRewards.length} equipamento(s), ${consumableRewards.length} tipo(s) de item`} tone="success" />
        <DetailCard label="Próximo passo" value={nextStep} tone={injuries.length || deaths.length || morale.length ? "warning" : "neutral"} />
      </section>

      <nav className="battle-result-tabs" aria-label="Seções do resultado de combate">
        {battleResultTabs.map((tab) => (
          <button aria-pressed={activeTab === tab.id} className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
            <strong>{tab.label}</strong>
            {tabCounts[tab.id] ? <span>{tabCounts[tab.id]}</span> : null}
          </button>
        ))}
      </nav>

      {activeTab === "summary" ? (
        <section className="battle-result-section battle-result-overview">
        <div className="battle-result-section-head">
          <span>Resumo da batalha</span>
          <h3>Confronto e condições</h3>
        </div>
        <div className="battle-result-summary-grid">
          <DetailCard label="Inimigos enfrentados" value={enemyNames} />
          <DetailCard label="Duração" value={`${battle.rounds} turno(s)`} detail={`${allEvents.length} evento(s) registrados`} />
          <DetailCard label="Modificadores ativos" value={modifiers} />
          <DetailCard label="Risco estimado" value={riskReadout.label} detail={riskReadout.description} tone={riskReadout.tone} />
          <DetailCard label="Evento semanal" value={weeklyEvent} />
          <DetailCard label="Campanha" value={advancedFloor ? `Avançou para ${state.towerFloor}` : "Sem avanço detectado"} detail={battle.result === "victory" ? "Vitória registrada na Torre." : "O andar permanece disponível."} />
        </div>
        </section>
      ) : null}

      {activeTab === "rewards" ? (
        <section className="battle-result-section battle-result-loot-section">
        <div className="battle-result-section-head">
          <span>Loot conquistado</span>
          <h3>Recompensas</h3>
        </div>
        <div className="battle-reward-grid">
          {rewardRows.map((reward) => (
            <div className={reward.value > 0 ? "has-value" : ""} key={reward.label}>
              <strong>{formatNumber(reward.value)}</strong>
              <span>{reward.label}</span>
              <small>{reward.description}</small>
            </div>
          ))}
          <div className={equipmentRewards.length > 0 ? "has-value" : ""}>
            <strong>{equipmentRewards.length}</strong>
            <span>Equipamentos</span>
            <small>{equipmentRewards.length > 0 ? equipmentRewards.map((item) => item.name).join(", ") : "Nenhum equipamento novo."}</small>
          </div>
          <div className={consumableRewards.length > 0 ? "has-value" : ""}>
            <strong>{consumableRewards.reduce((sum, item) => sum + item.amount, 0)}</strong>
            <span>Consumíveis</span>
            <small>{consumableRewards.length > 0 ? consumableRewards.map((item) => `${item.name} x${item.amount}`).join(", ") : "Nenhum item consumível novo."}</small>
          </div>
        </div>
        </section>
      ) : null}

      {activeTab === "heroes" ? (
        <section className="battle-result-section battle-result-progression-section">
        <div className="battle-result-section-head">
          <span>Heróis</span>
          <h3>XP, level up e desempenho</h3>
        </div>
        <div className="battle-result-impact-row">
          <article className="tone-xp">
            <strong>{formatNumber(heroXpReward)}</strong>
            <span>XP por herói</span>
            <small>{heroXpReward > 0 ? "Progressão aplicada aos heróis participantes." : "Nenhum ganho de XP registrado."}</small>
          </article>
          <article className={levelUps.length > 0 ? "tone-success" : ""}>
            <strong>{levelUps.length}</strong>
            <span>Level up</span>
            <small>{levelUps.length > 0 ? levelUps.map((item) => `${item.heroName} nível ${item.level}`).join(", ") : "Nenhum nível novo nesta luta."}</small>
          </article>
        </div>
        {topPerformers.length > 0 ? (
          <div className="battle-performance-grid">
            {topPerformers.map((entry) => (
              <article className="battle-performance-card" key={entry.id}>
                <strong>{entry.name}</strong>
                <span>{entry.className}</span>
                <small>
                  XP {getHeroXpGain(battle, entry)} · Dano {entry.damageDealt} · Cura {entry.healingDone}
                </small>
                <small>
                  Recebido {entry.damageTaken} · Abates {entry.kills} · Habilidades {entry.skillUses}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <p>Nenhuma estatística de herói registrada.</p>
        )}
        </section>
      ) : null}

      {activeTab === "consequences" ? (
        <section className="battle-result-section battle-result-consequence-section">
        <div className="battle-result-section-head">
          <span>Consequências</span>
          <h3>Ferimentos, moral e alertas</h3>
        </div>
        <div className="battle-consequence-grid">
          <div className={injuries.length > 0 ? "tone-danger" : ""}>
            <strong>Ferimentos</strong>
            {injuries.length > 0 ? injuries.slice(0, 4).map((event) => <span key={event.message}>{event.message}</span>) : <span>Nenhum ferimento registrado.</span>}
          </div>
          <div className={morale.length > 0 ? "tone-warning" : ""}>
            <strong>Moral</strong>
            {morale.length > 0 ? morale.slice(0, 4).map((event) => <span key={event.message}>{event.message}</span>) : <span>Sem alteração crítica registrada.</span>}
          </div>
          <div className={deaths.length > 0 ? "tone-danger" : ""}>
            <strong>Heróis abatidos</strong>
            {deaths.length > 0 ? deaths.slice(0, 4).map((event) => <span key={event.message}>{event.message}</span>) : <span>Nenhuma morte permanente registrada.</span>}
          </div>
          <div className={nextStep.includes("Trate") || nextStep.includes("Recupere") || nextStep.includes("Revise") ? "tone-warning" : ""}>
            <strong>Alerta importante</strong>
            <span>{nextStep}</span>
          </div>
        </div>
        <div className="battle-progression-grid">
          <div className={advancedFloor ? "tone-success" : ""}>
            <strong>Avanço da Torre</strong>
            <span>{advancedFloor ? `Próximo andar liberado: ${state.towerFloor}.` : "Sem avanço novo registrado."}</span>
          </div>
          <div className={completedMissions.length > 0 ? "tone-success" : ""}>
            <strong>Missões prontas</strong>
            <ProgressList entries={completedMissions} empty="Nenhuma missão concluída agora." />
          </div>
          <div>
            <strong>Conquistas</strong>
            <ProgressList entries={achievementsAvailable} empty="Nenhuma conquista pronta." />
          </div>
          <div>
            <strong>Especializações</strong>
            {specializations.length > 0 ? specializations.slice(0, 4).map((item) => <span key={item.heroId}>{item.heroName}</span>) : <span>Nenhuma especialização nova.</span>}
          </div>
          <div>
            <strong>Biblioteca</strong>
            {libraryUpdates.length > 0 ? (
              libraryUpdates.slice(0, 4).map((entry, index) => (
                <span key={`${entry.name}_${index}`}>
                  {entry.name || "Descoberta"} {entry.detailsUnlocked ? "- detalhes liberados" : ""}
                </span>
              ))
            ) : (
              <span>Nenhuma nova descoberta destacada.</span>
            )}
          </div>
        </div>
        </section>
      ) : null}

      {activeTab === "log" ? (
        <div className="battle-event-log">
          <div className="battle-speed-row">
            {speedOptions.map((option) => (
              <button
                className={speed === option ? "hero-inline-action primary" : "hero-inline-action"}
                key={option}
                onClick={() => {
                  setSpeed(option);
                  setEventCursor((current) => setBattlePlaybackSpeed(speed, option, current));
                }}
                type="button"
              >
                {option === "instant" ? "Instantâneo" : option}
              </button>
            ))}
            <small>
              Evento {Math.min(eventCursor, allEvents.length)}/{allEvents.length}
            </small>
          </div>
          <h3>Replay do combate</h3>
          {events.map((event, index) => (
            <div className={`battle-event-line type-${event.type}`} key={`${event.message}_${index}`}>
              <span>{event.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
