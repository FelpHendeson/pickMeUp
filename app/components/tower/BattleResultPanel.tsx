"use client";

import {
  advanceBattlePlayback,
  createBattlePlaybackState,
  getBattleEvents,
  getBattlePlaybackDelay,
  getDefaultBattleSpeed,
  getTowerChapterByFloor,
  setBattlePlaybackSpeed,
  type BattleSpeed,
  type BattleEvent,
  type BattlePerformanceEntry,
  type BattleResult,
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
    { label: "Ouro", value: rewards?.gold || getFirstLoggedAmount(log, /\+(\d+)\s+ouro/i) },
    { label: "Energia", value: rewards?.energyRefund || getFirstLoggedAmount(log, /\+(\d+)\s+energia/i) },
    { label: "XP/herói", value: getHeroXpReward(battle) },
    { label: "Cristais", value: rewards?.crystals || getFirstLoggedAmount(log, /Cristais encontrados:\s+\+(\d+)/i) },
    { label: "Essencia", value: rewards?.essence || getFirstLoggedAmount(log, /Essencia recuperada:\s+\+(\d+)/i) },
    { label: "Fragmentos", value: rewards?.fragments || getFirstLoggedAmount(log, /Fragmentos recolhidos:\s+\+(\d+)/i) },
    { label: "Frag. eco", value: rewards?.echoFragments || getFirstLoggedAmount(log, /Fragmentos de Eco ressoaram:\s+\+(\d+)/i) },
    { label: "Contratos", value: rewards?.heroContracts || getFirstLoggedAmount(log, /\+(\d+)\s+contrato/i) },
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

export function BattleResultPanel({ compact = false, onContinue }: BattleResultPanelProps) {
  const battle = useGameStore((store) => store.state.lastBattle);
  const [speed, setSpeed] = useState<BattleSpeed>(() => getDefaultBattleSpeed());
  const [showReplay, setShowReplay] = useState(false);
  const [eventCursor, setEventCursor] = useState(1);

  const allEvents = useMemo(() => (battle ? getBattleEvents(battle) : []), [battle]);
  const visibleEvents = allEvents.slice(0, Math.max(1, Math.min(eventCursor, allEvents.length || 1)));

  useEffect(() => {
    if (!battle) return;
    const initial = createBattlePlaybackState(battle, speed);
    setEventCursor(initial.eventCursor);
  }, [battle, battle?.floor, battle?.rounds, battle?.result, battle?.log?.length]);

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
          <span>Combate React</span>
          <h2>Nenhum combate recente</h2>
          <p>O ultimo resultado da torre aparecera aqui quando existir no save.</p>
        </div>
      </section>
    );
  }

  const events = visibleEvents;
  const chapter = battle.summary ?? getTowerChapterByFloor(battle.floor);
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
  const achievementsAvailable = (battle.progression?.achievementsAvailable || []) as ProgressEntry[];
  const libraryUpdates = (battle.progression?.libraryUpdates || []) as LibraryUpdate[];
  const injuries = getConsequenceEvents(allEvents, "injury");
  const morale = getConsequenceEvents(allEvents, "morale");
  const deaths = getConsequenceEvents(allEvents, "death");

  return (
    <section className={`battle-result-panel ${battle.result === "victory" ? "result-victory" : "result-defeat"}${compact ? " compact" : ""}`}>
      <div className="battle-result-hero">
        <div>
          <span>Resultado de combate</span>
          <h2>{battle.result === "victory" ? "Vitoria" : "Derrota"}</h2>
          <p>
            Andar {battle.floor} | Capitulo {"chapterName" in chapter ? chapter.chapterName : chapter.name} |{" "}
            {battle.summary?.difficultyName || "Normal"} | {battle.rounds} turno(s)
          </p>
        </div>
        <div className="battle-result-actions">
          <button className="hero-inline-action primary" onClick={() => onContinue?.()} type="button">
            Continuar
          </button>
          <button className="hero-inline-action" onClick={() => setShowReplay((current) => !current)} type="button">
            {showReplay ? "Ocultar replay/log" : "Ver replay/log"}
          </button>
        </div>
      </div>

      <div className="battle-result-summary-grid">
        <div>
          <strong>Maior destaque</strong>
          <span>{topPerformer ? `${topPerformer.name}: ${topPerformer.damageDealt} dano, ${topPerformer.kills} abate(s)` : "Sem destaque registrado"}</span>
        </div>
        <div>
          <strong>Inimigos</strong>
          <span>{battle.summary?.enemyNames.join(", ") || battle.enemyTeam.map((enemy) => enemy.name).join(", ")}</span>
        </div>
        <div>
          <strong>Modificadores</strong>
          <span>{battle.summary?.modifiers?.join(", ") || "Sem modificador adicional"}</span>
        </div>
        <div>
          <strong>Evento semanal</strong>
          <span>{battle.summary?.weeklyEvent || "Sem impacto registrado"}</span>
        </div>
      </div>

      <div className="battle-result-section">
        <h3>Recompensas</h3>
        <div className="battle-reward-grid">
          {rewardRows.map((reward) => (
            <div key={reward.label}>
              <strong>{formatNumber(reward.value)}</strong>
              <span>{reward.label}</span>
            </div>
          ))}
          <div>
            <strong>{equipmentRewards.length}</strong>
            <span>Equipamentos</span>
          </div>
          <div>
            <strong>{consumableRewards.reduce((sum, item) => sum + item.amount, 0)}</strong>
            <span>Consumiveis</span>
          </div>
        </div>
        {equipmentRewards.length > 0 ? <small>Equipamentos: {equipmentRewards.map((item) => item.name).join(", ")}</small> : null}
        {consumableRewards.length > 0 ? <small>Consumiveis: {consumableRewards.map((item) => `${item.name} x${item.amount}`).join(", ")}</small> : null}
      </div>

      <div className="battle-result-section">
        <h3>Herois</h3>
        {topPerformers.length > 0 ? (
          <div className="battle-performance-grid">
          {topPerformers.map((entry) => (
            <article className="battle-performance-card" key={entry.id}>
              <strong>{entry.name}</strong>
              <span>{entry.className}</span>
              <small>
                XP {getHeroXpGain(battle, entry)} | Dano {entry.damageDealt} | Cura {entry.healingDone}
              </small>
              <small>
                Recebido {entry.damageTaken} | Abates {entry.kills} | Habilidades {entry.skillUses}
              </small>
            </article>
          ))}
          </div>
        ) : (
          <p>Nenhuma estatistica de heroi registrada.</p>
        )}
        {levelUps.length > 0 ? <small>Level up: {levelUps.map((item) => `${item.heroName} para nivel ${item.level}`).join(", ")}</small> : null}
        {specializations.length > 0 ? <small>Especializacao disponivel: {specializations.map((item) => item.heroName).join(", ")}</small> : null}
      </div>

      <div className="battle-result-section">
        <h3>Consequencias</h3>
        <div className="battle-consequence-grid">
          <div>
            <strong>Ferimentos</strong>
            {injuries.length > 0 ? injuries.slice(0, 3).map((event) => <span key={event.message}>{event.message}</span>) : <span>Nenhum ferimento registrado.</span>}
          </div>
          <div>
            <strong>Moral</strong>
            {morale.length > 0 ? morale.slice(0, 3).map((event) => <span key={event.message}>{event.message}</span>) : <span>Sem alteracao critica registrada.</span>}
          </div>
          <div>
            <strong>Hardcore</strong>
            {deaths.length > 0 ? deaths.slice(0, 3).map((event) => <span key={event.message}>{event.message}</span>) : <span>Nenhuma morte permanente registrada.</span>}
          </div>
          <div>
            <strong>Missoes</strong>
            <ProgressList entries={missionUpdates.filter((mission) => Boolean(mission.complete))} empty="Nenhuma missao concluida agora." />
          </div>
          <div>
            <strong>Conquistas</strong>
            <ProgressList entries={achievementsAvailable} empty="Nenhuma conquista pronta." />
          </div>
          <div>
            <strong>Biblioteca</strong>
            {libraryUpdates.length > 0 ? (
              libraryUpdates.slice(0, 3).map((entry, index) => (
                <span key={`${entry.name}_${index}`}>
                  {entry.name || "Descoberta"} {entry.detailsUnlocked ? "- detalhes liberados" : ""}
                </span>
              ))
            ) : (
              <span>Nenhuma nova descoberta destacada.</span>
            )}
          </div>
        </div>
      </div>

      {showReplay ? (
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
                {option === "instant" ? "Instantaneo" : option}
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
