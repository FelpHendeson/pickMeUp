"use client";

import {
  getFloorData,
  getFormationHeroes,
  getFormationPower,
  getHeroActiveInjuries,
  getHeroMoraleState,
  getHeroPower,
  isHeroInFormation,
  isHeroOnExpedition,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";
import { TeamPresetsPanel } from "./TeamPresetsPanel";

function getSlotLabel(index: number): string {
  if (index < 2) return `Frente ${index + 1}`;
  return `Tras ${index - 1}`;
}

function getSlotLine(index: number): "Linha de frente" | "Linha traseira" {
  return index < 2 ? "Linha de frente" : "Linha traseira";
}

function getHeroAlerts(hero: Hero | null): string[] {
  if (!hero) return ["Slot vazio"];

  const alerts: string[] = [];
  if (getHeroActiveInjuries(hero).length > 0) alerts.push("Ferido");
  if (getHeroMoraleState(hero).tone === "collapse") alerts.push("Moral critica");
  return alerts;
}

export function FormationPanel() {
  const state = useGameStore((store) => store.state);
  const addHeroToFormation = useGameStore((store) => store.addHeroToFormation);
  const removeHeroFromFormation = useGameStore((store) => store.removeHeroFromFormation);
  const [feedback, setFeedback] = useState<string | null>(null);
  const formationHeroes = getFormationHeroes(state);
  const formationPower = getFormationPower(state);
  const nextFloor = getFloorData(state.towerFloor);
  const averageLevel =
    formationHeroes.filter(Boolean).reduce((total, hero) => total + (hero?.level || 0), 0) / Math.max(1, formationHeroes.filter(Boolean).length);
  const availableHeroes = state.heroes.filter((hero) => !isHeroInFormation(state, hero.id));
  const emptySlots = formationHeroes.filter((hero) => !hero).length;

  return (
    <section className="formation-panel">
      <div className="section-heading">
        <span>Formacao</span>
        <h2>Equipe da Torre</h2>
        <p>Monte frente e retaguarda, revise alertas e aplique presets sem abrir o detalhe completo dos herois.</p>
      </div>

      <div className="formation-overview">
        <div>
          <strong>Poder total</strong>
          <span>{formationPower}</span>
        </div>
        <div>
          <strong>Proximo andar</strong>
          <span>{nextFloor ? `${state.towerFloor}. ${nextFloor.title}` : `Andar ${state.towerFloor}`}</span>
        </div>
        <div>
          <strong>Nivel medio</strong>
          <span>
            {Math.round(averageLevel || 0)} / recomendado {nextFloor?.recommendedLevel || "-"}
          </span>
        </div>
        <div>
          <strong>Alertas</strong>
          <span>{emptySlots > 0 ? `${emptySlots} slot(s) vazio(s)` : "Equipe completa"}</span>
        </div>
      </div>

      <div className="formation-board">
        <div className="formation-line">
          <h3>Linha de frente</h3>
          <div className="formation-slot-row front">
            {formationHeroes.slice(0, 2).map((hero, index) => (
              <FormationSlot hero={hero} index={index} key={index} onRemove={(heroId) => setFeedback(removeHeroFromFormation(heroId).message)} />
            ))}
          </div>
        </div>

        <div className="formation-line">
          <h3>Linha traseira</h3>
          <div className="formation-slot-row back">
            {formationHeroes.slice(2, 5).map((hero, index) => (
              <FormationSlot hero={hero} index={index + 2} key={index + 2} onRemove={(heroId) => setFeedback(removeHeroFromFormation(heroId).message)} />
            ))}
          </div>
        </div>
      </div>

      <div className="formation-available-panel">
        <div className="section-heading compact">
          <span>Disponiveis</span>
          <h3>Herois fora da formacao</h3>
        </div>
        {availableHeroes.length > 0 ? (
          <div className="formation-available-grid">
            {availableHeroes.map((hero) => (
              <button
                className="formation-available-card"
                disabled={emptySlots === 0 || isHeroOnExpedition(state, hero.id)}
                key={hero.id}
                onClick={() => setFeedback(addHeroToFormation(hero.id).message)}
                type="button"
              >
                <strong>{hero.name}</strong>
                <span>
                  {hero.className} | Lv. {hero.level} | Poder {getHeroPower(hero)}
                </span>
                <small>{isHeroOnExpedition(state, hero.id) ? "Em expedicao" : "Adicionar ao proximo slot livre"}</small>
              </button>
            ))}
          </div>
        ) : (
          <p>Nenhum heroi disponivel fora da formacao.</p>
        )}
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
      <TeamPresetsPanel compact />
    </section>
  );
}

function FormationSlot({ hero, index, onRemove }: { hero: Hero | null; index: number; onRemove: (heroId: string) => void }) {
  const alerts = getHeroAlerts(hero);

  return (
    <article className={`formation-slot-card${hero ? " filled" : " empty"}`}>
      <span>{getSlotLabel(index)}</span>
      <small>{getSlotLine(index)}</small>
      {hero ? (
        <>
          <h4>{hero.name}</h4>
          <p>
            {hero.className} | Lv. {hero.level} | Poder {getHeroPower(hero)}
          </p>
          <div className="hero-tags">
            <span>{getHeroMoraleState(hero).label}</span>
            {alerts.map((alert) => (
              <span key={alert}>{alert}</span>
            ))}
          </div>
          <button className="hero-inline-action" onClick={() => onRemove(hero.id)} type="button">
            Remover
          </button>
        </>
      ) : (
        <>
          <h4>Slot vazio</h4>
          <p>Adicione um heroi disponivel para completar a {getSlotLine(index).toLowerCase()}.</p>
        </>
      )}
    </article>
  );
}
