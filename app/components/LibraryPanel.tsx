"use client";

import {
  ENEMY_ARCHETYPES,
  RELIC_DEFINITIONS,
  TOWER_EVENT_LIBRARY_DEFINITIONS,
  getLibraryEnemyView,
  getLibraryTotals,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

type LibraryTab = "bestiary" | "bosses" | "events" | "relics" | "heroes";

const libraryTabs: Array<{ id: LibraryTab; label: string }> = [
  { id: "bestiary", label: "Bestiario" },
  { id: "bosses", label: "Chefes" },
  { id: "events", label: "Eventos" },
  { id: "relics", label: "Reliquias" },
  { id: "heroes", label: "Herois" },
];

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function DiscoveryProgress({ current, target }: { current: number; target: number }) {
  const percent = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  return (
    <div className="library-discovery-progress" aria-label={`Descoberta ${percent}%`}>
      <span>
        <i style={{ width: `${percent}%` }} />
      </span>
      <small>{current}/{target}</small>
    </div>
  );
}

export function LibraryPanel() {
  const state = useGameStore((store) => store.state);
  const [activeTab, setActiveTab] = useState<LibraryTab>("bestiary");
  const totals = getLibraryTotals(state);
  const enemyViews = Object.keys(ENEMY_ARCHETYPES).map((enemyKey) => getLibraryEnemyView(state, enemyKey));
  const bossRecords = Object.values(state.library.bosses);
  const eventEntries = Object.entries(TOWER_EVENT_LIBRARY_DEFINITIONS);
  const heroClasses = Object.values(state.library.heroes.classes).filter((record) => record.discovered);
  const heroRarities = Object.values(state.library.heroes.rarities).filter((record) => record.discovered);
  const heroTraits = Object.values(state.library.heroes.traits).filter((record) => record.discovered);
  const discoveredEnemies = enemyViews.filter((enemy) => enemy.discovered).length;
  const discoveredEvents = eventEntries.filter(([eventKey]) => Boolean(state.library.events[eventKey]?.encountered)).length;
  const discoveredRelics = RELIC_DEFINITIONS.filter((relic) => (state.relics[relic.id]?.level || 0) > 0).length;

  return (
    <section className="library-panel">
      <div className="section-heading">
        <span>Arquivo da Torre</span>
        <h2>Biblioteca</h2>
        <p>Colecao de inimigos, chefes, eventos, reliquias e herois descobertos durante a campanha.</p>
      </div>

      <div className="tower-summary">
        <StatLine label="Inimigos" value={`${totals.enemies}/${enemyViews.length}`} />
        <StatLine label="Chefes" value={totals.bosses} />
        <StatLine label="Eventos" value={`${totals.events}/${eventEntries.length}`} />
        <StatLine label="Reliquias" value={`${discoveredRelics}/${RELIC_DEFINITIONS.length}`} />
      </div>

      <div className="library-tab-row" role="tablist" aria-label="Secoes da biblioteca">
        {libraryTabs.map((tab) => (
          <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "bestiary" ? (
        <div className="library-section">
          <div className="library-section-head">
            <h3>Bestiario</h3>
            <DiscoveryProgress current={discoveredEnemies} target={enemyViews.length} />
          </div>
          <div className="library-grid-react collection">
            {enemyViews.map((enemy) => (
              <article className={`library-entry collection-card ${enemy.discovered ? "" : "locked"}`} key={enemy.key}>
                <div className="library-silhouette">{enemy.discovered ? enemy.name.slice(0, 1) : "?"}</div>
                <span>{enemy.discovered ? enemy.region : "Nao descoberto"}</span>
                <h4>{enemy.name}</h4>
                <p>{enemy.description}</p>
                <small>
                  {enemy.encountered} encontro(s) | {enemy.defeated} vitoria(s)
                </small>
                {enemy.detailsUnlocked ? <small>{enemy.abilities.join(", ")} | {enemy.drops.join(", ")}</small> : <em>Detalhes apos 3 derrotas.</em>}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "bosses" ? (
        <div className="library-section">
          <div className="library-section-head">
            <h3>Chefes</h3>
            <DiscoveryProgress current={bossRecords.filter((boss) => boss.attempts > 0 || boss.defeated).length} target={4} />
          </div>
          <div className="library-grid-react compact collection">
            {bossRecords.length > 0 ? (
              bossRecords.map((boss) => (
                <article className={`library-entry collection-card ${boss.defeated ? "" : "locked"}`} key={boss.key}>
                  <div className="library-silhouette">{boss.defeated ? "!" : "?"}</div>
                  <span>{boss.chapterName || "Capitulo desconhecido"}</span>
                  <h4>{boss.key}</h4>
                  <p>{boss.defeated ? "Derrotado" : "Ainda nao derrotado"}</p>
                  <small>
                    {boss.attempts} tentativa(s) | melhor: {boss.bestResult || "-"}
                  </small>
                </article>
              ))
            ) : (
              <article className="library-entry collection-card locked">
                <div className="library-silhouette">?</div>
                <span>Chefes</span>
                <h4>Nenhum chefe registrado</h4>
                <p>Enfrente marcos de capitulo para preencher esta secao.</p>
              </article>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "events" ? (
        <div className="library-section">
          <div className="library-section-head">
            <h3>Eventos da Torre</h3>
            <DiscoveryProgress current={discoveredEvents} target={eventEntries.length} />
          </div>
          <div className="library-grid-react compact collection">
            {eventEntries.map(([eventKey, definition]) => {
              const record = state.library.events[eventKey];
              const discovered = Boolean(record?.encountered);

              return (
                <article className={`library-entry collection-card ${discovered ? "" : "locked"}`} key={eventKey}>
                  <div className="library-silhouette">{discovered ? definition.title.slice(0, 1) : "?"}</div>
                  <span>{discovered ? `${record.encountered}x encontrado` : "Nao encontrado"}</span>
                  <h4>{discovered ? definition.title : "Evento desconhecido"}</h4>
                  <p>{discovered ? definition.description : "Resolva eventos da torre para revelar detalhes."}</p>
                  {discovered && record.results.length > 0 ? <small>{record.results.join(" | ")}</small> : <em>Resultados aparecem conforme escolhas.</em>}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "relics" ? (
        <div className="library-section">
          <div className="library-section-head">
            <h3>Reliquias</h3>
            <DiscoveryProgress current={discoveredRelics} target={RELIC_DEFINITIONS.length} />
          </div>
          <div className="library-grid-react compact collection">
            {RELIC_DEFINITIONS.map((relic) => {
              const level = state.relics[relic.id]?.level || 0;
              return (
                <article className={`library-entry collection-card ${level > 0 ? "" : "locked"}`} key={relic.id}>
                  <div className="library-silhouette">{level > 0 ? relic.name.slice(0, 1) : "?"}</div>
                  <span>Reliquia</span>
                  <h4>{level > 0 ? relic.name : "Reliquia bloqueada"}</h4>
                  <p>{level > 0 ? relic.description : relic.unlock.text}</p>
                  <small>Nivel {level}/{relic.maxLevel}</small>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "heroes" ? (
        <div className="library-section">
          <div className="library-section-head">
            <h3>Herois Encontrados</h3>
            <DiscoveryProgress current={heroClasses.length + heroTraits.length + heroRarities.length} target={Math.max(1, heroClasses.length + heroTraits.length + heroRarities.length)} />
          </div>
          <div className="library-grid-react compact collection">
            <article className="library-entry collection-card">
              <div className="library-silhouette">C</div>
              <span>Classes</span>
              <h4>{heroClasses.length} descoberta(s)</h4>
              <p>{heroClasses.map((entry) => entry.name).join(", ") || "Nenhuma classe registrada."}</p>
            </article>
            <article className="library-entry collection-card">
              <div className="library-silhouette">R</div>
              <span>Raridades</span>
              <h4>{heroRarities.length} descoberta(s)</h4>
              <p>{heroRarities.map((entry) => entry.name).join(", ") || "Nenhuma raridade registrada."}</p>
            </article>
            <article className="library-entry collection-card">
              <div className="library-silhouette">T</div>
              <span>Tracos</span>
              <h4>{heroTraits.length} encontrado(s)</h4>
              <p>{heroTraits.map((entry) => entry.name).join(", ") || "Nenhum traco registrado."}</p>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
