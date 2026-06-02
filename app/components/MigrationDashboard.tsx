"use client";

import { useState } from "react";
import { getActiveWeeklyEvent } from "@/src/game";
import { BattleResultPanel } from "./BattleResultPanel";
import { ChapterCompletionPanel } from "./ChapterCompletionPanel";
import { ExpeditionsPanel } from "./ExpeditionsPanel";
import { HeroRosterPanel } from "./HeroRosterPanel";
import { InventoryPanel } from "./InventoryPanel";
import { LibraryPanel } from "./LibraryPanel";
import { MemorialPanel } from "./MemorialPanel";
import { MigrationBridgePanel } from "./MigrationBridgePanel";
import { MissionsPanel } from "./MissionsPanel";
import { NarrativeModal } from "./NarrativeModal";
import { PreferencesPanel } from "./PreferencesPanel";
import { RecruitmentPanel } from "./RecruitmentPanel";
import { RelicsPanel } from "./RelicsPanel";
import { RepeatFloorsPanel } from "./RepeatFloorsPanel";
import { ResourceHudPanel } from "./ResourceHudPanel";
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
  | "roadmap";

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
  { id: "roadmap", label: "Roadmap" },
];

const migrationMilestones = [
  "Manter regressao do core e paridade com o legado sempre verdes",
  "Fechar o fluxo principal jogavel pela UI React",
  "Validar snapshots PostgreSQL com save normalizado",
  "Usar o legado apenas como fallback ate o QA do fluxo React",
  "Remover dependencia operacional de /game somente depois da validacao completa",
];

const currentSystems = [
  "Torre com capitulos e dificuldade",
  "Combate automatico e resultado 2.0",
  "Herois, equipamentos, moral e ferimentos",
  "Reliquias, biblioteca, missoes e conquistas",
  "Consumiveis, afinidade e recrutamento alternativo",
  "Narrativa, preferencias, HUD e export/import de save",
  "Regressao automatizada do legado, core TypeScript e paridade",
];

function BasePanel() {
  const weeklyEvent = getActiveWeeklyEvent();

  return (
    <>
      <section className="grid">
        <article>
          <span>Status atual</span>
          <h2>Legado preservado</h2>
          <p>
            A implementacao em JavaScript puro continua em <code>game/</code>. A migracao deve trocar telas e regras por
            partes, mantendo o jogo jogavel durante o processo.
          </p>
        </article>

        <MigrationBridgePanel />
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

      <section className="grid">
        <article>
          <span>Stack alvo</span>
          <h2>Next + PostgreSQL</h2>
          <p>
            A branch prepara Next.js, TypeScript, Prisma, Zustand e TanStack Query para suportar login, cloud save e
            sincronizacao futura.
          </p>
        </article>

        <article>
          <span>Core TypeScript</span>
          <h2>Estado tipado</h2>
          <p>
            O nucleo migrado ja possui estado, recursos, herois, equipamentos, consumiveis, dificuldade e dados da torre
            sem dependencia de DOM.
          </p>
        </article>
      </section>
    </>
  );
}

function RoadmapPanel() {
  return (
    <section className="columns dashboard-roadmap">
      <div>
        <h2>Sistemas existentes</h2>
        <ul>
          {currentSystems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
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
      <ResourceHudPanel />
      <NarrativeModal />

      <nav className="dashboard-tabs" aria-label="Navegacao da migracao">
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
        {activeTab === "settings" ? <PreferencesPanel /> : null}
        {activeTab === "roadmap" ? <RoadmapPanel /> : null}
      </div>
    </section>
  );
}
