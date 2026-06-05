"use client";

import {
  ENEMY_ARCHETYPES,
  RELIC_DEFINITIONS,
  TOWER_CHAPTERS,
  TOWER_EVENT_LIBRARY_DEFINITIONS,
  getCompletedTowerChapterIds,
  getLibraryEnemyView,
  getLibraryTotals,
  getRelicCurrentEffectText,
  getRelicState,
  isRelicUnlocked,
  type GameState,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

type LibraryTab = "bestiary" | "bosses" | "chapters" | "events" | "relics" | "heroes";
type DiscoveryTone = "discovered" | "partial" | "locked";

type LibraryTabDefinition = {
  id: LibraryTab;
  label: string;
  eyebrow: string;
  description: string;
};

const libraryTabs: LibraryTabDefinition[] = [
  {
    id: "bestiary",
    label: "Inimigos",
    eyebrow: "Bestiario",
    description: "Criaturas catalogadas pela guilda conforme aparecem na Torre.",
  },
  {
    id: "bosses",
    label: "Chefes",
    eyebrow: "Marcos",
    description: "Entidades que guardam as transicoes de capitulo.",
  },
  {
    id: "chapters",
    label: "Capitulos",
    eyebrow: "Regioes",
    description: "Mapas, regioes perigosas e modificadores da campanha.",
  },
  {
    id: "events",
    label: "Eventos",
    eyebrow: "Pressagios",
    description: "Microdecisoes, encontros e pactos registrados durante a subida.",
  },
  {
    id: "relics",
    label: "Reliquias",
    eyebrow: "Artefatos",
    description: "Fragmentos permanentes que registram poder antigo da Torre.",
  },
  {
    id: "heroes",
    label: "Memoria",
    eyebrow: "Guilda",
    description: "Classes, raridades e tracos descobertos pelo elenco de herois.",
  },
];

function getToneLabel(tone: DiscoveryTone): string {
  if (tone === "discovered") return "Revelado";
  if (tone === "partial") return "Parcial";
  return "Selado";
}

function getBossName(bossKey: string): string {
  return ENEMY_ARCHETYPES[bossKey]?.name ?? bossKey;
}

function shortList(values: string[], fallback: string): string {
  return values.length > 0 ? values.slice(0, 4).join(", ") : fallback;
}

function CollectionProgress({ current, target, label }: { current: number; target: number; label: string }) {
  const percent = Math.min(100, Math.round((current / Math.max(1, target)) * 100));

  return (
    <div className="library-discovery-progress" aria-label={`${label}: ${percent}%`}>
      <span>
        <i style={{ width: `${percent}%` }} />
      </span>
      <small>
        {current}/{target} · {percent}%
      </small>
    </div>
  );
}

function LibrarySeal({ children, locked }: { children: string; locked?: boolean }) {
  return (
    <div className={`library-arcane-seal${locked ? " locked" : ""}`} aria-hidden="true">
      {children}
    </div>
  );
}

function LoreCard({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: DiscoveryTone;
}) {
  return <article className={`library-lore-card tone-${tone} ${className}`}>{children}</article>;
}

function LibraryCardHead({
  seal,
  type,
  title,
  tone,
}: {
  seal: string;
  type: string;
  title: string;
  tone: DiscoveryTone;
}) {
  return (
    <div className="library-card-head">
      <LibrarySeal locked={tone === "locked"}>{seal}</LibrarySeal>
      <div>
        <span>{type}</span>
        <h4>{title}</h4>
      </div>
      <em>{getToneLabel(tone)}</em>
    </div>
  );
}

function LibraryMeta({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="library-card-meta">
      {items.map((item) => (
        <span key={item.label}>
          <strong>{item.value}</strong>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function LibrarySection({
  activeTab,
  children,
  count,
  target,
}: {
  activeTab: LibraryTabDefinition;
  children: React.ReactNode;
  count: number;
  target: number;
}) {
  return (
    <div className="library-section grimoire-page">
      <div className="library-section-head">
        <div>
          <span>{activeTab.eyebrow}</span>
          <h3>{activeTab.label}</h3>
          <p>{activeTab.description}</p>
        </div>
        <CollectionProgress current={count} label={activeTab.label} target={target} />
      </div>
      {children}
    </div>
  );
}

function getChapterState(state: GameState, chapterId: string, startFloor: number, endFloor: number): DiscoveryTone {
  if (getCompletedTowerChapterIds(state).includes(chapterId)) return "discovered";
  if (state.towerFloor >= startFloor) return "partial";
  if (state.towerFloor > endFloor) return "discovered";
  return "locked";
}

function BestiarySection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const enemyViews = Object.keys(ENEMY_ARCHETYPES).map((enemyKey) => getLibraryEnemyView(state, enemyKey));
  const discoveredEnemies = enemyViews.filter((enemy) => enemy.discovered).length;

  return (
    <LibrarySection activeTab={activeTab} count={discoveredEnemies} target={enemyViews.length}>
      <div className="library-grid-react collection">
        {enemyViews.map((enemy) => {
          const tone: DiscoveryTone = enemy.detailsUnlocked ? "discovered" : enemy.discovered ? "partial" : "locked";
          const firstLetter = enemy.discovered ? enemy.name.slice(0, 1) : "?";

          return (
            <LoreCard className="collection-card" key={enemy.key} tone={tone}>
              <LibraryCardHead seal={firstLetter} title={enemy.name} tone={tone} type={enemy.discovered ? enemy.region : "Registro lacrado"} />
              <p>{enemy.discovered ? enemy.description : "Uma sombra ainda nao catalogada. Encontre-a na Torre para abrir este registro."}</p>
              <LibraryMeta
                items={[
                  { label: "encontros", value: enemy.encountered },
                  { label: "vitorias", value: enemy.defeated },
                  { label: "primeiro andar", value: enemy.firstFloor ?? "???" },
                ]}
              />
              {enemy.detailsUnlocked ? (
                <div className="library-revealed-lines">
                  <span>{shortList(enemy.abilities, "Sem habilidades registradas.")}</span>
                  <span>{shortList(enemy.drops, "Sem drops registrados.")}</span>
                </div>
              ) : (
                <em>{enemy.discovered ? "Detalhes completos apos 3 derrotas." : "Pista: avance pela campanha para encontrar este tipo de inimigo."}</em>
              )}
            </LoreCard>
          );
        })}
      </div>
    </LibrarySection>
  );
}

function BossesSection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const bossRecords = Object.values(state.library.bosses);
  const recordedBosses = new Map(bossRecords.map((boss) => [boss.key, boss]));
  const chapterBossCards = TOWER_CHAPTERS.map((chapter) => {
    const bossKey = Object.entries(ENEMY_ARCHETYPES).find(([, enemy]) => enemy.role === "chefe" && enemy.name === chapter.finalBoss)?.[0] ?? chapter.finalBoss;
    return {
      chapter,
      bossKey,
      record: recordedBosses.get(bossKey),
    };
  });
  const discoveredBosses = chapterBossCards.filter(({ record }) => Boolean(record && (record.attempts > 0 || record.defeated))).length;

  return (
    <LibrarySection activeTab={activeTab} count={discoveredBosses} target={chapterBossCards.length}>
      <div className="library-grid-react compact collection">
        {chapterBossCards.map(({ bossKey, chapter, record }) => {
          const encountered = Boolean(record && (record.attempts > 0 || record.defeated));
          const tone: DiscoveryTone = record?.defeated ? "discovered" : encountered ? "partial" : "locked";
          const title = encountered ? getBossName(bossKey) : "Guardiao sem nome";

          return (
            <LoreCard className="collection-card boss-card" key={chapter.id} tone={tone}>
              <LibraryCardHead seal={record?.defeated ? "!" : "?"} title={title} tone={tone} type={encountered ? chapter.name : `Capitulo ${chapter.number}`} />
              <p>{encountered ? `Chefe associado a ${chapter.theme}.` : "A porta final deste capitulo ainda nao revelou seu guardiao."}</p>
              <LibraryMeta
                items={[
                  { label: "tentativas", value: record?.attempts ?? 0 },
                  { label: "melhor marca", value: record?.bestResult || "???" },
                  { label: "andar", value: chapter.endFloor },
                ]}
              />
              {record?.specialReward ? <em>{record.specialReward}</em> : <em>{tone === "locked" ? "Pista: alcance o marco final do capitulo." : "Derrote para registrar recompensa especial."}</em>}
            </LoreCard>
          );
        })}
      </div>
    </LibrarySection>
  );
}

function ChaptersSection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const completedChapters = getCompletedTowerChapterIds(state);
  const currentChapterCount = TOWER_CHAPTERS.filter((chapter) => getChapterState(state, chapter.id, chapter.startFloor, chapter.endFloor) !== "locked").length;

  return (
    <LibrarySection activeTab={activeTab} count={currentChapterCount} target={TOWER_CHAPTERS.length}>
      <div className="library-grid-react compact collection">
        {TOWER_CHAPTERS.map((chapter) => {
          const tone = getChapterState(state, chapter.id, chapter.startFloor, chapter.endFloor);
          const completed = completedChapters.includes(chapter.id);
          const current = state.towerFloor >= chapter.startFloor && state.towerFloor <= chapter.endFloor;
          const progress = Math.min(100, Math.max(0, ((state.towerFloor - chapter.startFloor) / Math.max(1, chapter.endFloor - chapter.startFloor + 1)) * 100));

          return (
            <LoreCard className={`collection-card chapter-card tone-${chapter.tone}`} key={chapter.id} tone={tone}>
              <LibraryCardHead seal={String(chapter.number)} title={tone === "locked" ? "Regiao velada" : chapter.name} tone={tone} type={completed ? "Capitulo concluido" : current ? "Capitulo atual" : "Capitulo"} />
              <p>{tone === "locked" ? "As paginas adiante estao coladas por tinta negra. Avance na Torre para revelar a regiao." : chapter.description}</p>
              <LibraryMeta
                items={[
                  { label: "andares", value: `${chapter.startFloor}-${chapter.endFloor}` },
                  { label: "chefe", value: tone === "locked" ? "???" : chapter.finalBoss },
                  { label: "modificador", value: tone === "locked" ? "???" : chapter.regionalModifier.label },
                ]}
              />
              <CollectionProgress current={tone === "locked" ? 0 : Math.round(progress)} label={chapter.name} target={100} />
              <div className="library-revealed-lines">
                <span>{tone === "locked" ? "Inimigos predominantes ocultos." : shortList(chapter.predominantEnemies, "Sem inimigos registrados.")}</span>
                <span>{tone === "locked" ? "Eventos especificos ocultos." : shortList(chapter.specificEvents, "Sem eventos registrados.")}</span>
              </div>
            </LoreCard>
          );
        })}
      </div>
    </LibrarySection>
  );
}

function EventsSection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const eventEntries = Object.entries(TOWER_EVENT_LIBRARY_DEFINITIONS);
  const discoveredEvents = eventEntries.filter(([eventKey]) => Boolean(state.library.events[eventKey]?.encountered)).length;

  return (
    <LibrarySection activeTab={activeTab} count={discoveredEvents} target={eventEntries.length}>
      <div className="library-grid-react compact collection">
        {eventEntries.map(([eventKey, definition]) => {
          const record = state.library.events[eventKey];
          const discovered = Boolean(record?.encountered);
          const tone: DiscoveryTone = discovered ? (record.results.length > 0 ? "discovered" : "partial") : "locked";

          return (
            <LoreCard className="collection-card event-card" key={eventKey} tone={tone}>
              <LibraryCardHead seal={discovered ? definition.title.slice(0, 1) : "?"} title={discovered ? definition.title : "Evento cifrado"} tone={tone} type={discovered ? `${record.encountered} encontro(s)` : "Pressagio"} />
              <p>{discovered ? definition.description : "Uma nota arrancada descreve apenas um pressagio. Resolva eventos da Torre para decifrar o texto."}</p>
              {discovered && record.results.length > 0 ? (
                <div className="library-revealed-lines">
                  {record.results.slice(0, 3).map((result) => (
                    <span key={result}>{result}</span>
                  ))}
                </div>
              ) : (
                <em>{discovered ? "Resultados aparecem conforme escolhas feitas." : "Pista: eventos surgem antes ou depois de combates."}</em>
              )}
            </LoreCard>
          );
        })}
      </div>
    </LibrarySection>
  );
}

function RelicsSection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const discoveredRelics = RELIC_DEFINITIONS.filter((relic) => getRelicState(state, relic.id).level > 0).length;

  return (
    <LibrarySection activeTab={activeTab} count={discoveredRelics} target={RELIC_DEFINITIONS.length}>
      <div className="library-grid-react compact collection">
        {RELIC_DEFINITIONS.map((relic) => {
          const relicState = getRelicState(state, relic.id);
          const unlocked = isRelicUnlocked(state, relic);
          const active = relicState.level > 0;
          const tone: DiscoveryTone = active ? "discovered" : unlocked ? "partial" : "locked";

          return (
            <LoreCard className="collection-card relic-record-card" key={relic.id} tone={tone}>
              <LibraryCardHead seal={active ? relic.name.slice(0, 1) : "?"} title={unlocked ? relic.name : "Artefato velado"} tone={tone} type="Reliquia" />
              <p>{unlocked ? relic.description : "O contorno existe no grimorio, mas o nome ainda nao aceita tinta comum."}</p>
              <LibraryMeta
                items={[
                  { label: "nivel", value: `${relicState.level}/${relic.maxLevel}` },
                  { label: "efeito", value: active ? getRelicCurrentEffectText(state, relic) : relic.unlock.text },
                ]}
              />
              <em>{active ? "Eco permanente registrado." : unlocked ? "Disponivel para despertar no altar." : relic.unlock.text}</em>
            </LoreCard>
          );
        })}
      </div>
    </LibrarySection>
  );
}

function HeroMemorySection({ state, activeTab }: { state: GameState; activeTab: LibraryTabDefinition }) {
  const heroClasses = Object.values(state.library.heroes.classes).filter((record) => record.discovered);
  const heroRarities = Object.values(state.library.heroes.rarities).filter((record) => record.discovered);
  const heroTraits = Object.values(state.library.heroes.traits).filter((record) => record.discovered);
  const entries = [
    {
      id: "classes",
      seal: "C",
      title: `${heroClasses.length} classe(s)`,
      type: "Classes",
      description: shortList(heroClasses.map((entry) => entry.name), "Nenhuma classe registrada."),
      detail: "Cada classe aparece quando um heroi entra para a guilda.",
      count: heroClasses.reduce((sum, entry) => sum + (entry.count || 0), 0),
    },
    {
      id: "rarities",
      seal: "R",
      title: `${heroRarities.length} raridade(s)`,
      type: "Raridades",
      description: shortList(heroRarities.map((entry) => entry.name), "Nenhuma raridade registrada."),
      detail: "Raridades reforcam o peso das invocacoes e contratos.",
      count: heroRarities.length,
    },
    {
      id: "traits",
      seal: "T",
      title: `${heroTraits.length} traco(s)`,
      type: "Tracos",
      description: shortList(heroTraits.map((entry) => entry.name), "Nenhum traco registrado."),
      detail: shortList(heroTraits.map((entry) => entry.description || entry.name), "Tracos serao revelados ao recrutar novos herois."),
      count: heroTraits.length,
    },
  ];
  const total = heroClasses.length + heroRarities.length + heroTraits.length;

  return (
    <LibrarySection activeTab={activeTab} count={total} target={Math.max(1, total)}>
      <div className="library-grid-react compact collection">
        {entries.map((entry) => (
          <LoreCard className="collection-card memory-card" key={entry.id} tone={entry.count > 0 ? "discovered" : "locked"}>
            <LibraryCardHead seal={entry.seal} title={entry.title} tone={entry.count > 0 ? "discovered" : "locked"} type={entry.type} />
            <p>{entry.description}</p>
            <em>{entry.detail}</em>
          </LoreCard>
        ))}
      </div>
    </LibrarySection>
  );
}

export function LibraryPanel() {
  const state = useGameStore((store) => store.state);
  const [activeTab, setActiveTab] = useState<LibraryTab>("bestiary");
  const activeTabDefinition = libraryTabs.find((tab) => tab.id === activeTab) ?? libraryTabs[0];
  const totals = getLibraryTotals(state);
  const enemyViews = useMemo(() => Object.keys(ENEMY_ARCHETYPES).map((enemyKey) => getLibraryEnemyView(state, enemyKey)), [state]);
  const eventEntries = Object.entries(TOWER_EVENT_LIBRARY_DEFINITIONS);
  const discoveredRelics = RELIC_DEFINITIONS.filter((relic) => getRelicState(state, relic.id).level > 0).length;
  const discoveredEvents = eventEntries.filter(([eventKey]) => Boolean(state.library.events[eventKey]?.encountered)).length;
  const discoveredChapters = TOWER_CHAPTERS.filter((chapter) => getChapterState(state, chapter.id, chapter.startFloor, chapter.endFloor) !== "locked").length;
  const memoryCount =
    Object.values(state.library.heroes.classes).filter((record) => record.discovered).length +
    Object.values(state.library.heroes.rarities).filter((record) => record.discovered).length +
    Object.values(state.library.heroes.traits).filter((record) => record.discovered).length;

  return (
    <section className="library-panel grimoire-panel">
      <div className="library-hero">
        <div>
          <span>Arquivo proibido da torre</span>
          <h2>Biblioteca</h2>
          <p>Um grimorio vivo que registra criaturas, regioes, eventos, artefatos e memorias reveladas pela jornada.</p>
        </div>
        <div className="library-overview-rune" aria-hidden="true">
          {totals.enemies + totals.bosses + totals.events + discoveredRelics}
        </div>
      </div>

      <div className="library-ledger">
        <span>
          <strong>{totals.enemies}/{enemyViews.length}</strong>
          Inimigos
        </span>
        <span>
          <strong>{totals.bosses}</strong>
          Chefes
        </span>
        <span>
          <strong>{discoveredChapters}/{TOWER_CHAPTERS.length}</strong>
          Capitulos
        </span>
        <span>
          <strong>{discoveredEvents}/{eventEntries.length}</strong>
          Eventos
        </span>
        <span>
          <strong>{discoveredRelics}/{RELIC_DEFINITIONS.length}</strong>
          Reliquias
        </span>
        <span>
          <strong>{memoryCount}</strong>
          Memorias
        </span>
      </div>

      <div className="library-tab-row grimoire-tabs" role="tablist" aria-label="Secoes da biblioteca">
        {libraryTabs.map((tab) => (
          <button aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)} role="tab" type="button">
            <small>{tab.eyebrow}</small>
            <strong>{tab.label}</strong>
          </button>
        ))}
      </div>

      {activeTab === "bestiary" ? <BestiarySection activeTab={activeTabDefinition} state={state} /> : null}
      {activeTab === "bosses" ? <BossesSection activeTab={activeTabDefinition} state={state} /> : null}
      {activeTab === "chapters" ? <ChaptersSection activeTab={activeTabDefinition} state={state} /> : null}
      {activeTab === "events" ? <EventsSection activeTab={activeTabDefinition} state={state} /> : null}
      {activeTab === "relics" ? <RelicsSection activeTab={activeTabDefinition} state={state} /> : null}
      {activeTab === "heroes" ? <HeroMemorySection activeTab={activeTabDefinition} state={state} /> : null}
    </section>
  );
}
