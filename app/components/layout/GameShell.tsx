"use client";

import { useEffect, useRef, useState } from "react";
import {
  GAME_CONFIG,
  RELIC_DEFINITIONS,
  getActiveWeeklyEvent,
  getClaimableMissionCount,
  getFormationHeroes,
  getFormationHeroCount,
  getFormationPower,
  getInjuredHeroes,
  getRelicState,
  getRelicUpgradeCost,
  getHeroMoraleState,
  getTowerChapterByFloor,
  isExpeditionComplete,
  isRelicUnlocked,
  type GameState,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { BattleResultPanel } from "../tower/BattleResultPanel";
import { ChapterCompletionPanel } from "../tower/ChapterCompletionPanel";
import { ExpeditionsPanel } from "../systems/ExpeditionsPanel";
import { FormationPanel } from "../heroes/FormationPanel";
import { HeroRosterPanel } from "../heroes/HeroRosterPanel";
import { InventoryPanel } from "../inventory/InventoryPanel";
import { LibraryPanel } from "../progression/LibraryPanel";
import { MemorialPanel } from "../heroes/MemorialPanel";
import { MissionsPanel } from "../progression/MissionsPanel";
import { NarrativeModal } from "./NarrativeModal";
import { PreferencesPanel } from "../settings/PreferencesPanel";
import { RecruitmentPanel } from "../systems/RecruitmentPanel";
import { RelicsPanel } from "../progression/RelicsPanel";
import { RepeatFloorsPanel } from "../tower/RepeatFloorsPanel";
import { ResourceHudPanel } from "./ResourceHudPanel";
import { SaveManagementPanel } from "../settings/SaveManagementPanel";
import { SummonPanel } from "../systems/SummonPanel";
import { TowerBattlePanel } from "../tower/TowerBattlePanel";
import { TowerCampaignPanel } from "../tower/TowerCampaignPanel";
import { TowerEventsPanel } from "../tower/TowerEventsPanel";

type DashboardTab =
  | "base"
  | "tower"
  | "heroes"
  | "formation"
  | "inventory"
  | "expeditions"
  | "missions"
  | "relics"
  | "recruitment"
  | "summon"
  | "library"
  | "settings"
  | "about";

const dashboardTabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "base", label: "Base" },
  { id: "tower", label: "Torre" },
  { id: "heroes", label: "Herois" },
  { id: "formation", label: "Formacao" },
  { id: "inventory", label: "Inventario" },
  { id: "expeditions", label: "Expedicoes" },
  { id: "missions", label: "Missoes" },
  { id: "relics", label: "Reliquias" },
  { id: "summon", label: "Invocacao" },
  { id: "recruitment", label: "Recrutamento" },
  { id: "library", label: "Biblioteca" },
  { id: "settings", label: "Config" },
  { id: "about", label: "Sobre" },
];

const migrationMilestones = [
  "Manter regressao do core TypeScript e fixtures estaveis sempre verdes",
  "Completar QA manual do fluxo React-only",
  "Validar snapshots PostgreSQL com save normalizado",
  "Evoluir sincronizacao de nuvem sem remover o fallback local",
  "Normalizar novos sistemas em tabelas proprias quando o JSON estabilizar",
];

const currentSystems = [
  "Torre com capitulos e dificuldade",
  "Combate automatico e resultado 2.0",
  "Herois, equipamentos, moral e ferimentos",
  "Reliquias, biblioteca, missoes e conquistas",
  "Consumiveis, afinidade e recrutamento alternativo",
  "Narrativa, preferencias, HUD e export/import de save",
  "Regressao automatizada do core TypeScript, fixtures e banco",
];

function SaveBootstrap() {
  const loadLocalSave = useGameStore((store) => store.loadLocalSave);
  const didLoadRef = useRef(false);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    loadLocalSave();
  }, [loadLocalSave]);

  return null;
}

function getRelicUpgradeableCount(state: GameState): number {
  return RELIC_DEFINITIONS.filter((relic) => {
    const relicState = getRelicState(state, relic.id);
    if (!isRelicUnlocked(state, relic)) return false;
    if (relicState.level >= relic.maxLevel) return false;
    return state.echoFragments >= getRelicUpgradeCost(relic, relicState.level);
  }).length;
}

function getBaseNextAction(
  state: GameState,
  formationCount: number,
  completeExpeditions: number,
): { title: string; description: string; cta: string; tab: DashboardTab } {
  if (completeExpeditions > 0) {
    return {
      title: "Colete expedicoes prontas",
      description: `${completeExpeditions} expedicao(oes) aguardam coleta. Pegue as recompensas antes do proximo combate.`,
      cta: "Coletar Expedicao",
      tab: "expeditions",
    };
  }

  if (state.heroes.length === 0) {
    return {
      title: "Recrute seu primeiro heroi",
      description: "Use invocacao ou contrato para formar uma equipe antes de desafiar a torre.",
      cta: state.heroContracts > 0 ? "Usar Contrato" : "Invocar Heroi",
      tab: state.heroContracts > 0 ? "recruitment" : "summon",
    };
  }

  if (formationCount === 0) {
    return {
      title: "Monte uma formacao",
      description: "Escolha ate cinco herois para liberar o proximo combate da torre.",
      cta: "Montar Formacao",
      tab: "formation",
    };
  }

  if (state.pendingTowerEvent) {
    return {
      title: "Resolva o evento pendente",
      description: `Um evento aguarda no andar ${state.pendingTowerEvent.floor}. Va para Torre e escolha como prosseguir.`,
      cta: "Resolver Evento",
      tab: "tower",
    };
  }

  if (state.lastChapterCompletion) {
    return {
      title: "Conclua a transicao do capitulo",
      description: "Colete a recompensa especial para registrar o avancao da campanha.",
      cta: "Ir para Torre",
      tab: "tower",
    };
  }

  return {
    title: "Avance na torre",
    description: `Prepare a equipe e inicie o combate do andar ${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}.`,
    cta: "Ir para Torre",
    tab: "tower",
  };
}

function BasePanel({ onNavigate }: { onNavigate: (tab: DashboardTab) => void }) {
  const state = useGameStore((store) => store.state);
  const weeklyEvent = getActiveWeeklyEvent();
  const chapter = getTowerChapterByFloor(state.towerFloor);
  const formationCount = getFormationHeroCount(state);
  const formationHeroes = getFormationHeroes(state).filter((hero): hero is Hero => Boolean(hero));
  const formationPower = getFormationPower(state);
  const injuredCount = getInjuredHeroes(state).length;
  const claimableMissions = getClaimableMissionCount(state);
  const completeExpeditions = state.activeExpeditions.filter((expedition) => isExpeditionComplete(expedition)).length;
  const criticalMoraleCount = state.heroes.filter((hero) => getHeroMoraleState(hero).tone === "collapse").length;
  const upgradeableRelics = getRelicUpgradeableCount(state);
  const nextAction = getBaseNextAction(state, formationCount, completeExpeditions);
  const floorProgress = `${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}/${GAME_CONFIG.towerMaxFloor}`;
  const alerts = [
    completeExpeditions > 0 ? `${completeExpeditions} expedicao(oes) concluida(s)` : null,
    injuredCount > 0 ? `${injuredCount} heroi(s) ferido(s)` : null,
    criticalMoraleCount > 0 ? `${criticalMoraleCount} heroi(s) com moral critica` : null,
    claimableMissions > 0 ? `${claimableMissions} missao(oes) pronta(s)` : null,
    upgradeableRelics > 0 ? `${upgradeableRelics} reliquia(s) aprimoravel(is)` : null,
    state.heroContracts > 0 ? `${state.heroContracts} contrato(s) disponivel(is)` : null,
  ].filter((alert): alert is string => Boolean(alert));

  return (
    <section className="command-center-panel">
      <article className="command-next-card">
        <span>Central de Comando</span>
        <h2>{nextAction.title}</h2>
        <p>{nextAction.description}</p>
        <button className="hero-inline-action primary command-cta" onClick={() => onNavigate(nextAction.tab)} type="button">
          {nextAction.cta}
        </button>
      </article>

      <div className="command-grid">
        <article className="command-card">
          <span>Campanha</span>
          <h3>{chapter.name}</h3>
          <p>{chapter.description}</p>
          <div className="command-progress-bar" aria-label={`Progresso da torre ${floorProgress}`}>
            <i style={{ width: `${Math.min(100, (Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor) / GAME_CONFIG.towerMaxFloor) * 100)}%` }} />
          </div>
          <div className="command-metrics">
            <span>Andar {floorProgress}</span>
            <span>Chefe: {chapter.finalBoss}</span>
          </div>
        </article>

        <article className={`command-card weekly tone-${weeklyEvent.tone}`}>
          <span>Evento semanal | Semana {weeklyEvent.weekNumber}</span>
          <h3>{weeklyEvent.name}</h3>
          <p>{weeklyEvent.summary}</p>
          <div className="weekly-event-effects compact">
            {weeklyEvent.effects.slice(0, 2).map((effect) => (
              <small key={effect}>{effect}</small>
            ))}
          </div>
        </article>

        <article className="command-card">
          <span>Equipe principal</span>
          <h3>{formationCount}/{GAME_CONFIG.maxFormationSize} herois</h3>
          <p>Poder total {formationPower}. Revise ferimentos e moral antes de desafios mais arriscados.</p>
          <div className="command-team-list">
            {formationHeroes.length > 0 ? (
              formationHeroes.slice(0, 5).map((hero) => (
                <span key={hero.id}>
                  {hero.name} | Lv. {hero.level} | {getHeroMoraleState(hero).label}
                </span>
              ))
            ) : (
              <span>Nenhum heroi em formacao.</span>
            )}
          </div>
        </article>

        <article className="command-card">
          <span>Alertas</span>
          <h3>{alerts.length > 0 ? `${alerts.length} ponto(s) de atencao` : "Tudo sob controle"}</h3>
          <div className="command-alert-list">
            {alerts.length > 0 ? alerts.map((alert) => <span key={alert}>{alert}</span>) : <span>Nenhum alerta urgente no momento.</span>}
          </div>
          <div className="command-alert-actions">
            {completeExpeditions > 0 ? (
              <button className="hero-inline-action" onClick={() => onNavigate("expeditions")} type="button">
                Expedicoes
              </button>
            ) : null}
            {claimableMissions > 0 ? (
              <button className="hero-inline-action" onClick={() => onNavigate("missions")} type="button">
                Missoes
              </button>
            ) : null}
            {upgradeableRelics > 0 ? (
              <button className="hero-inline-action" onClick={() => onNavigate("relics")} type="button">
                Reliquias
              </button>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="settings-panel">
      <SaveManagementPanel />
      <PreferencesPanel />
    </section>
  );
}

function AboutPanel() {
  return (
    <section className="columns dashboard-roadmap">
      <div>
        <span className="eyebrow">Sobre</span>
        <h2>Alpha atual</h2>
        <ul>
          {currentSystems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="eyebrow">Migracao</span>
        <h2>Proximos passos</h2>
        <ol>
          {migrationMilestones.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function GameShell() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("base");
  const lastBattle = useGameStore((store) => store.state.lastBattle);
  const pendingTowerEvent = useGameStore((store) => store.state.pendingTowerEvent);
  const [dismissedBattleId, setDismissedBattleId] = useState<string | null>(null);
  const showBattleResultFirst = Boolean(lastBattle && lastBattle.id !== dismissedBattleId && !pendingTowerEvent);

  return (
    <section className="dashboard-shell">
      <SaveBootstrap />
      <ResourceHudPanel />
      <NarrativeModal />

      <nav className="dashboard-tabs" aria-label="Navegacao principal">
        {dashboardTabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            data-active={activeTab === tab.id ? "true" : "false"}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="dashboard-content">
        {activeTab === "base" ? <BasePanel onNavigate={setActiveTab} /> : null}
        {activeTab === "tower" ? (
          <>
            <ChapterCompletionPanel />
            {pendingTowerEvent ? <TowerEventsPanel /> : null}
            {showBattleResultFirst ? (
              <BattleResultPanel onContinue={() => setDismissedBattleId(lastBattle?.id ?? null)} />
            ) : null}
            <TowerCampaignPanel />
            <TowerBattlePanel priority={pendingTowerEvent ? "blocked-by-event" : showBattleResultFirst ? "after-result" : "primary"} />
            {!pendingTowerEvent ? <TowerEventsPanel /> : null}
            <RepeatFloorsPanel />
            {!showBattleResultFirst && lastBattle ? <BattleResultPanel compact onContinue={() => setDismissedBattleId(lastBattle.id)} /> : null}
          </>
        ) : null}
        {activeTab === "heroes" ? (
          <>
            <HeroRosterPanel />
            <MemorialPanel />
          </>
        ) : null}
        {activeTab === "formation" ? <FormationPanel /> : null}
        {activeTab === "inventory" ? <InventoryPanel /> : null}
        {activeTab === "expeditions" ? <ExpeditionsPanel /> : null}
        {activeTab === "missions" ? <MissionsPanel /> : null}
        {activeTab === "relics" ? <RelicsPanel /> : null}
        {activeTab === "summon" ? <SummonPanel /> : null}
        {activeTab === "recruitment" ? <RecruitmentPanel /> : null}
        {activeTab === "library" ? <LibraryPanel /> : null}
        {activeTab === "settings" ? <SettingsPanel /> : null}
        {activeTab === "about" ? <AboutPanel /> : null}
      </div>
    </section>
  );
}
