"use client";

import { GAME_CONFIG, getClaimableMissionCount, getEnergyRegenProgress, getFormationPower, getInjuredHeroes } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useRef, useState } from "react";

type ResourceTone = "gold" | "violet" | "cyan" | "ember" | "green" | "slate";
type ResourceChange = "gain" | "loss";

type ResourceHudItem = {
  key: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: ResourceTone;
  status?: string;
  progress?: number;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatTime(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function ResourceCard({ item, change }: { item: ResourceHudItem; change?: ResourceChange }) {
  const progress = item.progress != null ? Math.max(0, Math.min(100, item.progress)) : null;

  return (
    <div
      aria-label={`${item.label}: ${item.value}. ${item.detail}`}
      className={`resource-card tone-${item.tone}${change ? ` changed-${change}` : ""}`}
      role="listitem"
      title={item.detail}
    >
      <span aria-hidden="true" className="resource-card-icon">
        {item.icon}
      </span>
      <span className="resource-card-copy">
        <span className="resource-card-label">{item.label}</span>
        <strong>{item.value}</strong>
        {item.status ? <small>{item.status}</small> : null}
      </span>
      {progress != null ? (
        <span aria-hidden="true" className="resource-card-meter">
          <span style={{ width: `${progress}%` }} />
        </span>
      ) : null}
    </div>
  );
}

export function ResourceHudPanel() {
  const state = useGameStore((store) => store.state);
  const refreshSession = useGameStore((store) => store.refreshSession);
  const [now, setNow] = useState(Date.now());
  const [changedResources, setChangedResources] = useState<Record<string, ResourceChange>>({});
  const previousResources = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    refreshSession();
    const timer = window.setInterval(() => {
      refreshSession();
      setNow(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refreshSession]);

  const regen = getEnergyRegenProgress(state, now);
  const injuredCount = getInjuredHeroes(state).length;
  const claimableMissions = getClaimableMissionCount(state);
  const consumableTotal = Object.values(state.consumables).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
  const floorLabel = state.towerFloor > GAME_CONFIG.towerMaxFloor ? `${GAME_CONFIG.towerMaxFloor}/${GAME_CONFIG.towerMaxFloor}` : String(state.towerFloor);
  const formationPower = getFormationPower(state);
  const energyFull = state.resources.energy >= state.resources.maxEnergy;
  const energyLow = state.resources.energy < GAME_CONFIG.towerEnergyCost;
  const energyProgress = state.resources.maxEnergy > 0 ? (state.resources.energy / state.resources.maxEnergy) * 100 : 0;
  const energyStatus = energyFull ? "Cheia" : energyLow ? "Baixa" : regen.msRemaining > 0 ? `+1 em ${formatTime(regen.msRemaining)}` : undefined;

  const resourceSnapshot = useMemo(
    () => ({
      gold: state.resources.gold,
      crystals: state.resources.crystals,
      essence: state.resources.essence,
      fragments: state.resources.fragments,
      energy: state.resources.energy,
      echoFragments: state.echoFragments,
      heroContracts: state.heroContracts,
      consumables: consumableTotal,
      equipment: state.inventory.length,
      expeditions: state.activeExpeditions.length,
      missions: claimableMissions,
    }),
    [
      claimableMissions,
      consumableTotal,
      state.activeExpeditions.length,
      state.echoFragments,
      state.heroContracts,
      state.inventory.length,
      state.resources.crystals,
      state.resources.energy,
      state.resources.essence,
      state.resources.fragments,
      state.resources.gold,
    ],
  );

  useEffect(() => {
    const previous = previousResources.current;
    previousResources.current = resourceSnapshot;

    if (!previous) return;

    const changes = Object.entries(resourceSnapshot).reduce<Record<string, ResourceChange>>((acc, [key, value]) => {
      if (value === previous[key]) return acc;
      acc[key] = value > previous[key] ? "gain" : "loss";
      return acc;
    }, {});

    if (Object.keys(changes).length === 0) return;

    setChangedResources((current) => ({ ...current, ...changes }));
    const timer = window.setTimeout(() => {
      setChangedResources((current) =>
        Object.fromEntries(Object.entries(current).filter(([key]) => !Object.prototype.hasOwnProperty.call(changes, key))),
      );
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [resourceSnapshot]);

  const primaryResources: ResourceHudItem[] = [
    {
      key: "gold",
      label: "Ouro",
      value: formatNumber(state.resources.gold),
      detail: "Moeda para cura, base, eventos e custos comuns.",
      icon: "◈",
      tone: "gold",
    },
    {
      key: "crystals",
      label: "Cristais",
      value: formatNumber(state.resources.crystals),
      detail: "Recurso raro para invocação superior e progresso arcano.",
      icon: "◆",
      tone: "violet",
    },
    {
      key: "essence",
      label: "Essência",
      value: formatNumber(state.resources.essence),
      detail: "Material arcano usado em tratamentos e progressão.",
      icon: "✦",
      tone: "cyan",
    },
    {
      key: "fragments",
      label: "Fragmentos",
      value: formatNumber(state.resources.fragments),
      detail: "Estilhaços para relíquias, contratos e melhorias.",
      icon: "✧",
      tone: "ember",
    },
    {
      key: "energy",
      label: "Energia",
      value: `${state.resources.energy}/${state.resources.maxEnergy}`,
      detail: energyFull ? "Energia cheia para desafiar a Torre." : `A Torre consome ${GAME_CONFIG.towerEnergyCost} energia por desafio.`,
      icon: "☽",
      tone: energyLow ? "slate" : "green",
      status: energyStatus,
      progress: energyProgress,
    },
  ];

  const secondaryResources: ResourceHudItem[] = [
    {
      key: "echoFragments",
      label: "Frag. Eco",
      value: formatNumber(state.echoFragments),
      detail: "Fragmentos raros ligados aos ecos da Torre.",
      icon: "◇",
      tone: "violet",
    },
    {
      key: "heroContracts",
      label: "Contratos",
      value: formatNumber(state.heroContracts),
      detail: "Permitem recrutar aventureiros no quadro da guilda.",
      icon: "▣",
      tone: state.heroContracts > 0 ? "gold" : "slate",
      status: state.heroContracts > 0 ? "Disponível" : undefined,
    },
    {
      key: "consumables",
      label: "Consumíveis",
      value: formatNumber(consumableTotal),
      detail: "Itens de uso tático guardados no inventário.",
      icon: "✚",
      tone: consumableTotal > 0 ? "green" : "slate",
    },
    {
      key: "equipment",
      label: "Equipamentos",
      value: formatNumber(state.inventory.length),
      detail: "Armas, armaduras e acessórios guardados no arsenal.",
      icon: "⚔",
      tone: state.inventory.length > 0 ? "ember" : "slate",
    },
    {
      key: "expeditions",
      label: "Expedições",
      value: formatNumber(state.activeExpeditions.length),
      detail: "Contratos em andamento fora da base.",
      icon: "⌛",
      tone: state.activeExpeditions.length > 0 ? "cyan" : "slate",
    },
    {
      key: "missions",
      label: "Missões",
      value: formatNumber(claimableMissions),
      detail: "Missões e conquistas com recompensa pronta.",
      icon: "!",
      tone: claimableMissions > 0 ? "gold" : "slate",
      status: claimableMissions > 0 ? "Coletar" : undefined,
    },
  ];

  return (
    <section aria-label="Recursos da conta" className="resource-hud-panel">
      <div className="resource-hud-topline">
        <div className="resource-hud-header">
          <span>Vigília da Base</span>
          <strong>Andar {floorLabel}</strong>
          <small>Poder {formatNumber(formationPower)}</small>
        </div>
        <div className="resource-hud-flags" aria-label="Alertas de recursos">
          <span className={`resource-status-chip${energyFull ? " is-full" : energyLow ? " is-low" : ""}`}>
            {energyFull ? "Energia cheia" : energyLow ? "Energia baixa" : "Energia estável"}
          </span>
          {claimableMissions > 0 ? <span className="resource-status-chip is-ready">{claimableMissions} missão(ões)</span> : null}
          {injuredCount > 0 ? <span className="resource-status-chip is-danger">{injuredCount} ferido(s)</span> : null}
        </div>
      </div>
      <div className="resource-primary" role="list">
        {primaryResources.map((item) => (
          <ResourceCard change={changedResources[item.key]} item={item} key={item.key} />
        ))}
      </div>
      <details className="resource-secondary-details">
        <summary>Recursos secundários e status</summary>
        <div className="resource-secondary" role="list">
          {secondaryResources.map((item) => (
            <ResourceCard change={changedResources[item.key]} item={item} key={item.key} />
          ))}
        </div>
      </details>
    </section>
  );
}
