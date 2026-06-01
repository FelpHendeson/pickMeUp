"use client";

import { useState } from "react";
import { getActiveWeeklyEvent } from "@/src/game";
import { ExpeditionsPanel } from "./ExpeditionsPanel";
import { HeroRosterPanel } from "./HeroRosterPanel";
import { InventoryPanel } from "./InventoryPanel";
import { MigrationBridgePanel } from "./MigrationBridgePanel";
import { MissionsPanel } from "./MissionsPanel";
import { RecruitmentPanel } from "./RecruitmentPanel";
import { RelicsPanel } from "./RelicsPanel";
import { TowerCampaignPanel } from "./TowerCampaignPanel";

type DashboardTab = "base" | "tower" | "heroes" | "inventory" | "expeditions" | "missions" | "relics" | "recruitment" | "roadmap";

const dashboardTabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "base", label: "Base" },
  { id: "tower", label: "Torre" },
  { id: "heroes", label: "Herois" },
  { id: "inventory", label: "Inventario" },
  { id: "expeditions", label: "Expedicoes" },
  { id: "missions", label: "Missoes" },
  { id: "relics", label: "Reliquias" },
  { id: "recruitment", label: "Recrutamento" },
  { id: "roadmap", label: "Roadmap" },
];

const migrationMilestones = [
  "Extrair regras puras para game-core em TypeScript",
  "Migrar estado local para store React/Zustand",
  "Adicionar persistencia PostgreSQL com Prisma",
  "Recriar telas principais em componentes React",
  "Substituir o legado /game quando o fluxo da torre estiver completo",
];

const currentSystems = [
  "Torre com capitulos e dificuldade",
  "Combate automatico e resultado 2.0",
  "Herois, equipamentos, moral e ferimentos",
  "Reliquias, biblioteca, missoes e conquistas",
  "Consumiveis, afinidade e recrutamento alternativo",
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
            A implementacao em JavaScript puro continua em <code>game/</code>. A migracao deve trocar telas e regras
            por partes, mantendo o jogo jogavel durante o processo.
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
            O nucleo migrado ja possui estado, recursos, herois, equipamentos, consumiveis, dificuldade e dados da
            torre sem dependencia de DOM.
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
        {activeTab === "tower" ? <TowerCampaignPanel /> : null}
        {activeTab === "heroes" ? <HeroRosterPanel /> : null}
        {activeTab === "inventory" ? <InventoryPanel /> : null}
        {activeTab === "expeditions" ? <ExpeditionsPanel /> : null}
        {activeTab === "missions" ? <MissionsPanel /> : null}
        {activeTab === "relics" ? <RelicsPanel /> : null}
        {activeTab === "recruitment" ? <RecruitmentPanel /> : null}
        {activeTab === "roadmap" ? <RoadmapPanel /> : null}
      </div>
    </section>
  );
}
