"use client";

import { GAME_CONFIG, getClaimableMissionCount, getEnergyRegenProgress, getFormationPower, getInjuredHeroes } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useState } from "react";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function ResourceHudPanel() {
  const state = useGameStore((store) => store.state);
  const refreshSession = useGameStore((store) => store.refreshSession);
  const [now, setNow] = useState(Date.now());

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

  return (
    <section className="resource-hud-panel">
      <div className="resource-primary">
        <div className="resource-pill featured tone-gold">
          <span>Ouro</span>
          <strong>{formatNumber(state.resources.gold)}</strong>
        </div>
        <div className="resource-pill featured tone-violet">
          <span>Cristais</span>
          <strong>{formatNumber(state.resources.crystals)}</strong>
        </div>
        <div className="resource-pill featured tone-cyan">
          <span>Energia</span>
          <strong>
            {state.resources.energy}/{state.resources.maxEnergy}
          </strong>
        </div>
        <div className="resource-pill featured tone-gold">
          <span>Poder da equipe</span>
          <strong>{formatNumber(getFormationPower(state))}</strong>
        </div>
        <div className="resource-pill featured tone-cyan">
          <span>Andar da torre</span>
          <strong>{floorLabel}</strong>
        </div>
      </div>
      <div className="resource-secondary">
        <div className="resource-pill">
          <span>Essencia</span>
          <strong>{formatNumber(state.resources.essence)}</strong>
        </div>
        <div className="resource-pill">
          <span>Fragmentos</span>
          <strong>{formatNumber(state.resources.fragments)}</strong>
        </div>
        <div className="resource-pill">
          <span>Frag. Eco</span>
          <strong>{formatNumber(state.echoFragments)}</strong>
        </div>
        <div className="resource-pill">
          <span>Contratos</span>
          <strong>{formatNumber(state.heroContracts)}</strong>
        </div>
        <div className="resource-pill">
          <span>Consum.</span>
          <strong>{formatNumber(consumableTotal)}</strong>
        </div>
        <div className="resource-pill">
          <span>Equip.</span>
          <strong>{state.inventory.length}</strong>
        </div>
        <div className="resource-pill">
          <span>Exped.</span>
          <strong>{state.activeExpeditions.length}</strong>
        </div>
        <div className="resource-pill">
          <span>Feridos</span>
          <strong>{injuredCount}</strong>
        </div>
        <div className="resource-pill">
          <span>Missoes</span>
          <strong>{claimableMissions}</strong>
        </div>
      </div>
      {regen.msRemaining > 0 ? <small className="resource-regen-note">Proxima energia em ~{Math.ceil(regen.msRemaining / 1000)}s</small> : null}
    </section>
  );
}
