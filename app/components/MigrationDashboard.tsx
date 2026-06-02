"use client";

import { useEffect, useRef, useState } from "react";
import {
  GAME_CONFIG,
  getActiveWeeklyEvent,
  getClaimableMissionCount,
  getFormationHeroCount,
  getInjuredHeroes,
  getTowerChapterByFloor,
  type GameState,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { BattleResultPanel } from "./BattleResultPanel";
import { ChapterCompletionPanel } from "./ChapterCompletionPanel";
import { ExpeditionsPanel } from "./ExpeditionsPanel";
import { HeroRosterPanel } from "./HeroRosterPanel";
import { InventoryPanel } from "./InventoryPanel";
import { LibraryPanel } from "./LibraryPanel";
import { MemorialPanel } from "./MemorialPanel";
import { MissionsPanel } from "./MissionsPanel";
import { NarrativeModal } from "./NarrativeModal";
import { PreferencesPanel } from "./PreferencesPanel";
import { RecruitmentPanel } from "./RecruitmentPanel";
import { RelicsPanel } from "./RelicsPanel";
import { RepeatFloorsPanel } from "./RepeatFloorsPanel";
import { ResourceHudPanel } from "./ResourceHudPanel";
import { SaveManagementPanel } from "./SaveManagementPanel";
import { SummonPanel } from "./SummonPanel";
import { TeamPresetsPanel } from "./TeamPresetsPanel";
import { TowerBattlePanel } from "./TowerBattlePanel";
import { TowerCampaignPanel } from "./TowerCampaignPanel";
import { TowerEventsPanel } from "./TowerEventsPanel";

type DashboardTab =
  | "base"
  | "tower"
  | "heroes"
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

function getBaseNextAction(state: GameState, formationCount: number): { title: string; description: string } {
  if (state.heroes.length === 0) {
    return {
      title: "Recrute seu primeiro heroi",
      description: "Use invocacao ou contrato para formar uma equipe antes de desafiar a torre.",
    };
  }

  if (formationCount === 0) {
    return {
      title: "Monte uma formacao",
      description: "Escolha ate cinco herois para liberar o proximo combate da torre.",
    };
  }

  if (state.pendingTowerEvent) {
    return {
      title: "Resolva o evento pendente",
      description: `Um evento aguarda no andar ${state.pendingTowerEvent.floor}. Va para Torre e escolha como prosseguir.`,
    };
  }

  if (state.lastChapterCompletion) {
    return {
      title: "Conclua a transicao do capitulo",
      description: "Colete a recompensa especial para registrar o avancao da campanha.",
    };
  }

  return {
    title: "Avance na torre",
    description: `Prepare a equipe e inicie o combate do andar ${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}.`,
  };
}

function BasePanel() {
  const state = useGameStore((store) => store.state);
  const weeklyEvent = getActiveWeeklyEvent();
  const chapter = getTowerChapterByFloor(state.towerFloor);
  const formationCount = getFormationHeroCount(state);
  const injuredCount = getInjuredHeroes(state).length;
  const claimableMissions = getClaimableMissionCount(state);
  const nextAction = getBaseNextAction(state, formationCount);
  const floorProgress = `${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}/${GAME_CONFIG.towerMaxFloor}`;

  return (
    <>
      <section className="grid">
        <article>
          <span>Proximo passo</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.description}</p>
          <div className="mini-grid">
            <div>
              <strong>{formationCount}/{GAME_CONFIG.maxFormationSize}</strong>
              <small>Formacao</small>
            </div>
            <div>
              <strong>{claimableMissions}</strong>
              <small>Missoes</small>
            </div>
            <div>
              <strong>{injuredCount}</strong>
              <small>Feridos</small>
            </div>
            <div>
              <strong>{state.activeExpeditions.length}</strong>
              <small>Exped.</small>
            </div>
          </div>
        </article>

        <article>
          <span>Campanha</span>
          <h2>{chapter.name}</h2>
          <p>{chapter.description}</p>
          <div className="mini-grid">
            <div>
              <strong>{floorProgress}</strong>
              <small>Torre</small>
            </div>
            <div>
              <strong>{chapter.finalBoss}</strong>
              <small>Chefe</small>
            </div>
            <div>
              <strong>{state.echoFragments}</strong>
              <small>Frag. eco</small>
            </div>
            <div>
              <strong>{state.heroContracts}</strong>
              <small>Contratos</small>
            </div>
          </div>
        </article>
      </section>

      <article className={`weekly-event-card tone-${weeklyEvent.tone}`}>
        <span>Evento semanal | Semana {weeklyEvent.weekNumber}</span>
        <h2>{weeklyEvent.name}</h2>
        <p>{weeklyEvent.summary}</p>
        <div className="weekly-event-effects">
          {weeklyEvent.effects.map((effect) => (
            <small key={effect}>{effect}</small>
          ))}
        </div>
      </article>
    </>
  );
}

function SettingsPanel() {
  return (
    <section className="grid">
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

export function MigrationDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("base");

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
        {activeTab === "base" ? <BasePanel /> : null}
        {activeTab === "tower" ? (
          <>
            <ChapterCompletionPanel />
            <TowerCampaignPanel />
            <TowerBattlePanel />
            <RepeatFloorsPanel />
            <TowerEventsPanel />
            <BattleResultPanel />
          </>
        ) : null}
        {activeTab === "heroes" ? (
          <>
            <TeamPresetsPanel />
            <HeroRosterPanel />
            <MemorialPanel />
          </>
        ) : null}
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
