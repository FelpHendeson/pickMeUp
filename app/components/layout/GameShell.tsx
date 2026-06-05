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
  getSummonCost,
  getRelicState,
  getRelicUpgradeCost,
  getHeroMoraleState,
  getTowerChapterByFloor,
  getUnequippedInventory,
  isExpeditionComplete,
  isRelicUnlocked,
  type GameState,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
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
import { ResourceHudPanel } from "./ResourceHudPanel";
import { SaveManagementPanel } from "../settings/SaveManagementPanel";
import { SummonPanel } from "../systems/SummonPanel";
import { TowerChallengePanel } from "../tower/TowerChallengePanel";
import { UiProgressBar } from "../ui";

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

type DashboardTabConfig = {
  id: DashboardTab;
  label: string;
  icon: string;
};

type DashboardTabGroup = {
  id: string;
  label: string;
  description: string;
  icon: string;
  tabs: DashboardTabConfig[];
};

const dashboardTabGroups: DashboardTabGroup[] = [
  {
    id: "main",
    label: "Principal",
    description: "Comando, campanha e equipe",
    icon: "✦",
    tabs: [
      { id: "base", label: "Base", icon: "⌂" },
      { id: "tower", label: "Torre", icon: "▲" },
      { id: "heroes", label: "Heróis", icon: "♟" },
      { id: "formation", label: "Formação", icon: "⬡" },
    ],
  },
  {
    id: "management",
    label: "Gestão",
    description: "Arsenal, contratos e objetivos",
    icon: "◆",
    tabs: [
      { id: "inventory", label: "Inventário", icon: "⚔" },
      { id: "expeditions", label: "Expedições", icon: "☽" },
      { id: "missions", label: "Missões", icon: "✉" },
      { id: "relics", label: "Relíquias", icon: "✧" },
    ],
  },
  {
    id: "progression",
    label: "Progressão",
    description: "Rituais, recrutas e registros",
    icon: "◇",
    tabs: [
      { id: "summon", label: "Invocação", icon: "✺" },
      { id: "recruitment", label: "Recrutamento", icon: "▣" },
      { id: "library", label: "Biblioteca", icon: "☰" },
    ],
  },
  {
    id: "system",
    label: "Sistema",
    description: "Preferências, save e informações",
    icon: "◈",
    tabs: [
      { id: "settings", label: "Config", icon: "⚙" },
      { id: "about", label: "Sobre", icon: "?" },
    ],
  },
];

function getActiveNavigation(tabId: DashboardTab) {
  const group = dashboardTabGroups.find((item) => item.tabs.some((tab) => tab.id === tabId)) || dashboardTabGroups[0];
  const tab = group.tabs.find((item) => item.id === tabId) || group.tabs[0];
  return { group, tab };
}

const currentSystems = [
  "Torre com capitulos e dificuldade",
  "Combate automatico e resultado 2.0",
  "Herois, equipamentos, moral e ferimentos",
  "Reliquias, biblioteca, missoes e conquistas",
  "Consumiveis, afinidade e recrutamento alternativo",
  "Narrativa, preferencias, HUD e export/import de save",
  "Regressao automatizada do core TypeScript, fixtures e banco",
];

const projectStackItems = ["Next.js", "React", "TypeScript", "Zustand", "localStorage", "Prisma/PostgreSQL opcional"];

const projectAlphaNotes = [
  "Alpha jogavel: sistemas podem evoluir, mas o save local continua protegido como fluxo principal.",
  "Cloud save e PostgreSQL seguem experimentais e opcionais; o jogo deve abrir sem banco.",
  "Deploy futuro continua orientado a Vercel, nao GitHub Pages.",
];

function getSaveSourceLabel(source: ReturnType<typeof useGameStore.getState>["source"]): string {
  if (source === "local-storage") return "Save local";
  if (source === "cloud-postgres") return "Cloud save";
  if (source === "manual") return "Sessao atual";
  return "Estado inicial";
}

type BaseAlert = {
  label: string;
  tab: DashboardTab;
  tone: "success" | "danger" | "arcane" | "gold" | "warning";
};

function SaveBootstrap() {
  const loadLocalSave = useGameStore((store) => store.loadLocalSave);
  const didLoadRef = useRef(false);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    loadLocalSave({ silent: true });
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

type BaseNextAction = {
  title: string;
  description: string;
  cta: string;
  tab: DashboardTab;
  tone: BaseAlert["tone"];
  detail: string;
};

type BaseSituation = {
  formationCount: number;
  completeExpeditions: number;
  injuredCount: number;
  lowMoraleCount: number;
  claimableMissions: number;
  upgradeableRelics: number;
  unequippedItems: number;
  canSummonCommon: boolean;
};

const baseShortcuts: Array<{ tab: DashboardTab; title: string; description: string }> = [
  { tab: "tower", title: "Torre", description: "Avancar campanha" },
  { tab: "formation", title: "Formacao", description: "Ajustar equipe" },
  { tab: "heroes", title: "Herois", description: "Tratar e revisar" },
  { tab: "expeditions", title: "Expedicoes", description: "Enviar patrulhas" },
  { tab: "missions", title: "Missoes", description: "Coletar ordens" },
  { tab: "inventory", title: "Inventario", description: "Equipar arsenal" },
];

function getBaseNextAction(state: GameState, situation: BaseSituation): BaseNextAction {
  if (situation.completeExpeditions > 0) {
    return {
      title: "Colete expedicoes prontas",
      description: `${situation.completeExpeditions} expedicao(oes) aguardam coleta. Pegue as recompensas antes do proximo combate.`,
      cta: "Coletar Expedicao",
      tab: "expeditions",
      tone: "success",
      detail: "Retorno da guilda",
    };
  }

  if (situation.injuredCount > 0) {
    return {
      title: "Trate herois feridos",
      description: `${situation.injuredCount} heroi(s) carregam ferimentos. Reduza o risco antes de entrar em combate dificil.`,
      cta: "Abrir Herois",
      tab: "heroes",
      tone: "danger",
      detail: "Enfermaria necessaria",
    };
  }

  if (situation.claimableMissions > 0) {
    return {
      title: "Colete missoes concluidas",
      description: `${situation.claimableMissions} recompensa(s) de missao aguardam registro no quadro de ordens.`,
      cta: "Coletar Missoes",
      tab: "missions",
      tone: "success",
      detail: "Ordens concluidas",
    };
  }

  if (situation.upgradeableRelics > 0) {
    return {
      title: "Melhore uma reliquia",
      description: `${situation.upgradeableRelics} reliquia(s) podem ser aprimoradas com os Fragmentos de Eco atuais.`,
      cta: "Abrir Reliquias",
      tab: "relics",
      tone: "arcane",
      detail: "Poder permanente",
    };
  }

  if (state.pendingTowerEvent) {
    return {
      title: "Resolva o evento pendente",
      description: `Um evento aguarda no andar ${state.pendingTowerEvent.floor}. Va para Torre e escolha como prosseguir.`,
      cta: "Resolver Evento",
      tab: "tower",
      tone: "warning",
      detail: "Torre bloqueada",
    };
  }

  if (state.heroes.length === 0) {
    return {
      title: "Recrute seu primeiro heroi",
      description: "Use invocacao ou contrato para formar uma equipe antes de desafiar a torre.",
      cta: state.heroContracts > 0 ? "Usar Contrato" : "Invocar Heroi",
      tab: state.heroContracts > 0 ? "recruitment" : "summon",
      tone: "gold",
      detail: "Guilda vazia",
    };
  }

  if (situation.formationCount === 0) {
    return {
      title: "Monte uma formacao",
      description: "Escolha ate cinco herois para liberar o proximo combate da torre.",
      cta: "Montar Formacao",
      tab: "formation",
      tone: "warning",
      detail: "Equipe ausente",
    };
  }

  if (situation.unequippedItems > 0) {
    return {
      title: "Revise o arsenal",
      description: `${situation.unequippedItems} item(ns) estao no inventario sem uso. Confira se algum melhora a formacao.`,
      cta: "Abrir Inventario",
      tab: "inventory",
      tone: "gold",
      detail: "Arsenal disponivel",
    };
  }

  if (state.lastChapterCompletion) {
    return {
      title: "Conclua a transicao do capitulo",
      description: "Colete a recompensa especial para registrar o avancao da campanha.",
      cta: "Ir para Torre",
      tab: "tower",
      tone: "gold",
      detail: "Marco de campanha",
    };
  }

  if (state.heroContracts > 0 || situation.canSummonCommon) {
    return {
      title: "Amplie o elenco",
      description: state.heroContracts > 0 ? "Ha contratos disponiveis para reforcar a guilda antes da proxima subida." : "Recursos suficientes para uma invocacao comum.",
      cta: state.heroContracts > 0 ? "Usar Contrato" : "Invocar Heroi",
      tab: state.heroContracts > 0 ? "recruitment" : "summon",
      tone: "gold",
      detail: "Reforco possivel",
    };
  }

  return {
    title: "Avance na torre",
    description: `Prepare a equipe e inicie o combate do andar ${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}.`,
    cta: "Ir para Torre",
    tab: "tower",
    tone: "arcane",
    detail: "Marcha recomendada",
  };
}

function BaseResourceStat({ label, value, tone }: { label: string; value: string | number; tone?: BaseAlert["tone"] }) {
  return (
    <span className={tone ? `tone-${tone}` : ""}>
      <strong>{value}</strong>
      {label}
    </span>
  );
}

function BaseShortcutButton({ description, onNavigate, tab, title }: { description: string; onNavigate: (tab: DashboardTab) => void; tab: DashboardTab; title: string }) {
  return (
    <button className="base-shortcut-card" onClick={() => onNavigate(tab)} type="button">
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
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
  const lowMoraleCount = state.heroes.filter((hero) => {
    const tone = getHeroMoraleState(hero).tone;
    return tone === "collapse" || tone === "shaken";
  }).length;
  const upgradeableRelics = getRelicUpgradeableCount(state);
  const unequippedItems = getUnequippedInventory(state).length;
  const commonSummonCost = getSummonCost(state, "common");
  const canSummonCommon = state.resources[commonSummonCost.resource] >= commonSummonCost.amount;
  const energyFull = state.resources.energy >= state.resources.maxEnergy;
  const situation: BaseSituation = {
    formationCount,
    completeExpeditions,
    injuredCount,
    lowMoraleCount,
    claimableMissions,
    upgradeableRelics,
    unequippedItems,
    canSummonCommon,
  };
  const nextAction = getBaseNextAction(state, situation);
  const floorProgress = `${Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}/${GAME_CONFIG.towerMaxFloor}`;
  const alertCandidates: Array<BaseAlert | null> = [
    completeExpeditions > 0 ? { label: `${completeExpeditions} expedicao(oes) concluida(s)`, tab: "expeditions" as const, tone: "success" } : null,
    injuredCount > 0 ? { label: `${injuredCount} heroi(s) ferido(s)`, tab: "heroes" as const, tone: "danger" } : null,
    lowMoraleCount > 0 ? { label: `${lowMoraleCount} heroi(s) com moral baixa`, tab: "heroes" as const, tone: "danger" } : null,
    claimableMissions > 0 ? { label: `${claimableMissions} missao(oes) pronta(s)`, tab: "missions" as const, tone: "success" } : null,
    upgradeableRelics > 0 ? { label: `${upgradeableRelics} reliquia(s) aprimoravel(is)`, tab: "relics" as const, tone: "arcane" } : null,
    energyFull ? { label: "Energia cheia", tab: "tower" as const, tone: "gold" } : null,
    unequippedItems > 0 ? { label: `${unequippedItems} item(ns) sem uso`, tab: "inventory" as const, tone: "warning" } : null,
    state.heroContracts > 0 ? { label: `${state.heroContracts} contrato(s) disponivel(is)`, tab: "recruitment" as const, tone: "gold" } : null,
    state.pendingTowerEvent ? { label: "Evento da torre pendente", tab: "tower" as const, tone: "warning" } : null,
  ];
  const alerts = alertCandidates.filter((alert): alert is BaseAlert => Boolean(alert));
  const campaignProgress = Math.min(100, (Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor) / GAME_CONFIG.towerMaxFloor) * 100);
  const chapterProgress = Math.min(
    100,
    Math.max(0, ((state.towerFloor - chapter.startFloor + 1) / Math.max(1, chapter.endFloor - chapter.startFloor + 1)) * 100),
  );

  return (
    <section className="command-center-panel base-hub-panel">
      <article className={`command-next-card base-war-room tone-${nextAction.tone}`}>
        <div className="base-war-room-copy">
          <span>Sala de comando | {nextAction.detail}</span>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.description}</p>
          <button className="hero-inline-action primary command-cta" onClick={() => onNavigate(nextAction.tab)} type="button">
            {nextAction.cta}
          </button>
        </div>
        <div className="base-war-room-map" aria-hidden="true">
          <strong>{Math.min(state.towerFloor, GAME_CONFIG.towerMaxFloor)}</strong>
          <span>Andar</span>
        </div>
      </article>

      <div className="base-status-ledger">
        <BaseResourceStat label="Andar atual" value={floorProgress} tone="gold" />
        <BaseResourceStat label="Capitulo" value={chapter.name} tone="arcane" />
        <BaseResourceStat label="Poder da formacao" value={formationPower} tone="success" />
        <BaseResourceStat label="Energia" value={`${state.resources.energy}/${state.resources.maxEnergy}`} tone={energyFull ? "gold" : undefined} />
        <BaseResourceStat label="Ouro" value={state.resources.gold} />
        <BaseResourceStat label="Cristais" value={state.resources.crystals} />
      </div>

      <div className="base-command-layout">
        <article className="command-card base-map-card">
          <div className="base-card-head">
            <span>Mesa de guerra</span>
            <h3>{chapter.name}</h3>
          </div>
          <p>{chapter.description}</p>
          <UiProgressBar label={`Progresso da torre ${floorProgress}`} value={campaignProgress} />
          <UiProgressBar label={`Progresso do capitulo ${chapter.startFloor}-${chapter.endFloor}`} value={chapterProgress} />
          <div className="command-metrics base-pill-row">
            <span>Chefe: {chapter.finalBoss}</span>
            <span>{chapter.regionalModifier.label}: {chapter.regionalModifier.description}</span>
          </div>
        </article>

        <article className={`command-card weekly tone-${weeklyEvent.tone}`}>
          <div className="base-card-head">
            <span>Evento semanal | Semana {weeklyEvent.weekNumber}</span>
            <h3>{weeklyEvent.name}</h3>
          </div>
          <p>{weeklyEvent.summary}</p>
          <div className="weekly-event-effects compact">
            {weeklyEvent.effects.slice(0, 3).map((effect) => (
              <small key={effect}>{effect}</small>
            ))}
          </div>
        </article>

        <article className="command-card base-team-card">
          <div className="base-card-head">
            <span>Equipe principal</span>
            <h3>{formationCount}/{GAME_CONFIG.maxFormationSize} herois</h3>
          </div>
          <p>Poder total {formationPower}. Revise ferimentos e moral antes de desafios mais arriscados.</p>
          <div className="command-team-list">
            {formationHeroes.length > 0 ? (
              formationHeroes.slice(0, 5).map((hero) => (
                <span key={hero.id}>
                  <strong>{hero.name}</strong>
                  Lv. {hero.level} | {getHeroMoraleState(hero).label}
                </span>
              ))
            ) : (
              <span>Nenhum heroi em formacao.</span>
            )}
          </div>
        </article>

        <article className="command-card base-alert-card">
          <div className="base-card-head">
            <span>Alertas da base</span>
            <h3>{alerts.length > 0 ? `${alerts.length} ponto(s) de atencao` : "Tudo sob controle"}</h3>
          </div>
          <div className="command-alert-list">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <button className={`command-alert-chip tone-${alert.tone}`} key={alert.label} onClick={() => onNavigate(alert.tab)} type="button">
                  {alert.label}
                </button>
              ))
            ) : (
              <span>Nenhum alerta urgente no momento.</span>
            )}
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

        <article className="command-card base-resources-card">
          <div className="base-card-head">
            <span>Cofres e suprimentos</span>
            <h3>Recursos principais</h3>
          </div>
          <div className="base-resource-grid">
            <BaseResourceStat label="Essencia" value={state.resources.essence} />
            <BaseResourceStat label="Fragmentos" value={state.resources.fragments} />
            <BaseResourceStat label="Frag. Eco" value={state.echoFragments} tone="arcane" />
            <BaseResourceStat label="Contratos" value={state.heroContracts} tone={state.heroContracts > 0 ? "gold" : undefined} />
          </div>
        </article>

        <article className="command-card base-shortcuts-card">
          <div className="base-card-head">
            <span>Atalhos de comando</span>
            <h3>Para onde ir agora</h3>
          </div>
          <div className="base-shortcut-grid">
            {baseShortcuts.map((shortcut) => (
              <BaseShortcutButton description={shortcut.description} key={shortcut.tab} onNavigate={onNavigate} tab={shortcut.tab} title={shortcut.title} />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="settings-panel settings-control-room">
      <div className="settings-page-hero">
        <span>Configuracoes</span>
        <h2>Menu seguro da guilda</h2>
        <p>Preferencias, backup, cloud save experimental e acoes destrutivas ficam separados para evitar erro acidental.</p>
      </div>
      <PreferencesPanel />
      <SaveManagementPanel />
    </section>
  );
}

function AboutPanel() {
  const { state, source } = useGameStore();
  const cloudSaveEnabled = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SAVE === "true";
  const floorLabel = state.towerFloor > GAME_CONFIG.towerMaxFloor ? `${GAME_CONFIG.towerMaxFloor}/${GAME_CONFIG.towerMaxFloor}` : String(state.towerFloor);

  return (
    <section className="about-project-panel">
      <div className="about-hero-card">
        <div className="about-project-seal" aria-hidden="true">
          Æ
        </div>
        <div>
          <span>Arquivo da Torre</span>
          <h2>Ascensão dos Ecos</h2>
          <p>
            RPG web single-player dark fantasy sobre uma guilda que escala a Torre, recruta aventureiros, sobrevive a
            ferimentos e transforma ecos em poder permanente.
          </p>
        </div>
        <div className="about-version-mark">
          <span>Versão</span>
          <strong>{GAME_CONFIG.gameVersion}</strong>
          <small>Alpha jogável</small>
        </div>
      </div>

      <div className="about-info-grid">
        <article>
          <span>Objetivo</span>
          <strong>Subir a Torre</strong>
          <p>Preparar formação, avaliar risco, vencer chefes e expandir a guilda.</p>
        </article>
        <article>
          <span>Progresso</span>
          <strong>Andar {floorLabel}</strong>
          <p>Campanha por capítulos com eventos, recompensas e repetição de andares.</p>
        </article>
        <article>
          <span>Save</span>
          <strong>{getSaveSourceLabel(source)}</strong>
          <p>Save principal no navegador via `localStorage`, com exportação/importação manual.</p>
        </article>
        <article>
          <span>Cloud</span>
          <strong>{cloudSaveEnabled ? "Experimental" : "Desativado"}</strong>
          <p>Snapshot PostgreSQL opcional; não é requisito para jogar localmente.</p>
        </article>
      </div>

      <div className="about-content-grid">
        <article className="about-grimoire-card">
          <span>Alpha atual</span>
          <h3>Sistemas em jogo</h3>
          <ul>
            {currentSystems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="about-grimoire-card">
          <span>Stack</span>
          <h3>Base técnica</h3>
          <div className="about-stack-list">
            {projectStackItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="about-credit-note">
            <strong>Créditos</strong>
            <p>Projeto original em desenvolvimento, com interface e sistemas mantidos no repositório atual.</p>
          </div>
        </article>
      </div>

      <article className="about-alpha-scroll">
        <span>Notas de produção</span>
        <h3>O que esta tela precisa deixar claro</h3>
        <div>
          {projectAlphaNotes.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </article>
    </section>
  );
}

export function GameShell() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("base");
  const activeNavigation = getActiveNavigation(activeTab);

  return (
    <section className="dashboard-shell">
      <SaveBootstrap />
      <header className="dashboard-shell-header">
        <div>
          <span className="eyebrow">Mesa da guilda</span>
          <h2>{activeNavigation.tab.label}</h2>
          <p>{activeNavigation.group.description}</p>
        </div>
        <div className="dashboard-shell-seal" aria-label={`Área atual: ${activeNavigation.group.label}`}>
          <span>{activeNavigation.group.icon}</span>
          <strong>{activeNavigation.group.label}</strong>
        </div>
      </header>
      <ResourceHudPanel />
      <NarrativeModal />

      <nav className="dashboard-tabs" aria-label="Navegação principal">
        {dashboardTabGroups.map((group) => (
          <div
            className="dashboard-tab-group"
            data-active-group={group.id === activeNavigation.group.id ? "true" : "false"}
            data-group={group.id}
            key={group.id}
          >
            <span className="dashboard-tab-group-label">
              <span aria-hidden="true">{group.icon}</span>
              {group.label}
            </span>
            <div className="dashboard-tab-list">
              {group.tabs.map((tab) => (
                <button
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  aria-pressed={activeTab === tab.id}
                  data-active={activeTab === tab.id ? "true" : "false"}
                  data-group={group.id}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="dashboard-tab-icon">
                    {tab.icon}
                  </span>
                  <span className="dashboard-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="dashboard-content">
        {activeTab === "base" ? <BasePanel onNavigate={setActiveTab} /> : null}
        {activeTab === "tower" ? (
          <>
            <ChapterCompletionPanel />
          <TowerChallengePanel onNavigate={setActiveTab} />
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
        {activeTab === "summon" ? <SummonPanel onViewHero={() => setActiveTab("heroes")} /> : null}
        {activeTab === "recruitment" ? <RecruitmentPanel onViewFormation={() => setActiveTab("formation")} onViewHeroes={() => setActiveTab("heroes")} /> : null}
        {activeTab === "library" ? <LibraryPanel /> : null}
        {activeTab === "settings" ? <SettingsPanel /> : null}
        {activeTab === "about" ? <AboutPanel /> : null}
      </div>
    </section>
  );
}
