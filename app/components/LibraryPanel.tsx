"use client";

import {
  ENEMY_ARCHETYPES,
  RELIC_DEFINITIONS,
  TOWER_EVENT_LIBRARY_DEFINITIONS,
  getLibraryEnemyView,
  getLibraryTotals,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

export function LibraryPanel() {
  const state = useGameStore((store) => store.state);
  const totals = getLibraryTotals(state);
  const enemyViews = Object.keys(ENEMY_ARCHETYPES).map((enemyKey) => getLibraryEnemyView(state, enemyKey));
  const bossRecords = Object.values(state.library.bosses);
  const eventEntries = Object.entries(TOWER_EVENT_LIBRARY_DEFINITIONS);
  const heroClasses = Object.values(state.library.heroes.classes).filter((record) => record.discovered);
  const heroTraits = Object.values(state.library.heroes.traits).filter((record) => record.discovered);

  return (
    <section className="library-panel">
      <div className="section-heading">
        <span>Arquivo da Torre</span>
        <h2>Biblioteca</h2>
        <p>Descobertas normalizadas do save legado, prontas para alimentar bestiario e colecoes React.</p>
      </div>

      <div className="tower-summary">
        <StatLine label="Inimigos" value={totals.enemies} />
        <StatLine label="Chefes" value={totals.bosses} />
        <StatLine label="Eventos" value={totals.events} />
        <StatLine label="Reliquias" value={totals.relics} />
      </div>

      <div className="library-section">
        <h3>Bestiario</h3>
        <div className="library-grid-react">
          {enemyViews.slice(0, 8).map((enemy) => (
            <article className={`library-entry ${enemy.discovered ? "" : "locked"}`} key={enemy.key}>
              <span>{enemy.region}</span>
              <h4>{enemy.name}</h4>
              <p>{enemy.description}</p>
              <small>
                {enemy.encountered} encontro(s) | {enemy.defeated} derrota(s)
              </small>
              {enemy.detailsUnlocked ? (
                <small>
                  {enemy.abilities.join(", ")} | {enemy.drops.join(", ")}
                </small>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="library-section">
        <h3>Chefes e Eventos</h3>
        <div className="library-grid-react compact">
          {bossRecords.length > 0 ? (
            bossRecords.map((boss) => (
              <article className={`library-entry ${boss.defeated ? "" : "locked"}`} key={boss.key}>
                <span>{boss.chapterName || "Capitulo desconhecido"}</span>
                <h4>{boss.key}</h4>
                <p>{boss.defeated ? "Derrotado" : "Ainda nao derrotado"}</p>
                <small>{boss.attempts} tentativa(s)</small>
              </article>
            ))
          ) : (
            <article className="library-entry locked">
              <span>Chefes</span>
              <h4>Nenhum chefe registrado</h4>
              <p>Enfrente marcos de capitulo para preencher esta secao.</p>
            </article>
          )}

          {eventEntries.map(([eventKey, definition]) => {
            const record = state.library.events[eventKey];
            const discovered = Boolean(record?.encountered);

            return (
              <article className={`library-entry ${discovered ? "" : "locked"}`} key={eventKey}>
                <span>{discovered ? `${record.encountered}x` : "Nao encontrado"}</span>
                <h4>{discovered ? definition.title : "Evento desconhecido"}</h4>
                <p>{discovered ? definition.description : "Resolva eventos da torre para revelar detalhes."}</p>
                {discovered && record.results.length > 0 ? <small>{record.results.join(" | ")}</small> : null}
              </article>
            );
          })}
        </div>
      </div>

      <div className="library-section">
        <h3>Reliquias e Herois Encontrados</h3>
        <div className="library-grid-react compact">
          {RELIC_DEFINITIONS.slice(0, 6).map((relic) => (
            <article className={`library-entry ${state.relics[relic.id]?.level > 0 ? "" : "locked"}`} key={relic.id}>
              <span>Reliquia</span>
              <h4>{state.relics[relic.id]?.level > 0 ? relic.name : "Reliquia bloqueada"}</h4>
              <p>{state.relics[relic.id]?.level > 0 ? relic.description : relic.unlock.text}</p>
            </article>
          ))}

          <article className="library-entry">
            <span>Herois</span>
            <h4>{heroClasses.length} classe(s) descobertas</h4>
            <p>{heroClasses.map((entry) => entry.name).join(", ") || "Nenhuma classe registrada."}</p>
            <small>{heroTraits.length} traco(s) encontrados</small>
          </article>
        </div>
      </div>
    </section>
  );
}
