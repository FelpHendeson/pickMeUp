"use client";

import {
  CONSUMABLE_DEFINITIONS,
  EQUIPMENT_SLOTS,
  getClassSpecializations,
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroAffinitySummaries,
  getHeroExpedition,
  getHeroInjurySummary,
  getHeroInjuryTreatmentCost,
  getHeroMoraleState,
  getHeroPower,
  getHeroSpecialization,
  getHeroXpForNextLevel,
  getInjuryDefinition,
  getUnequippedInventory,
  hasHeroInjuries,
  INJURY_CONFIG,
  isHeroInFormation,
  isHeroOnExpedition,
  SPECIALIZATION_LEVEL,
  type EquipmentItem,
  type EquipmentSlot,
  type GameState,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

function getRarityStars(rarity: number): string {
  return "\u2605".repeat(rarity) + "\u2606".repeat(Math.max(0, 5 - rarity));
}

type HeroSort = "power" | "name" | "class" | "level" | "rarity";
type HeroStatusFilter = "all" | "available" | "formation" | "expedition" | "injured";

function heroMatchesStatus(hero: Hero, state: GameState, status: HeroStatusFilter): boolean {
  if (status === "all") return true;
  if (status === "available") {
    return !isHeroInFormation(state, hero.id) && !isHeroOnExpedition(state, hero.id) && !hasHeroInjuries(hero);
  }
  if (status === "formation") return isHeroInFormation(state, hero.id);
  if (status === "expedition") return isHeroOnExpedition(state, hero.id);
  if (status === "injured") return hasHeroInjuries(hero);
  return true;
}

function sortHeroesForDisplay(heroes: Hero[], sortBy: HeroSort): Hero[] {
  return [...heroes].sort((a, b) => {
    const powerDifference = getHeroPower(b) - getHeroPower(a);
    const rarityDifference = b.rarity - a.rarity;
    const levelDifference = b.level - a.level;

    if (sortBy === "name") return a.name.localeCompare(b.name) || powerDifference;
    if (sortBy === "class") return a.className.localeCompare(b.className) || powerDifference;
    if (sortBy === "level") return levelDifference || rarityDifference || powerDifference;
    if (sortBy === "rarity") return rarityDifference || levelDifference || powerDifference;
    return powerDifference || rarityDifference || levelDifference;
  });
}

function getActiveInjuryCount(hero: Hero): number {
  return getHeroActiveInjuries(hero).length;
}

function getEquippedItems(hero: Hero, inventory: EquipmentItem[]): EquipmentItem[] {
  const ids = new Set(Object.values(hero.equipment || {}).filter(Boolean));
  return inventory.filter((item) => ids.has(item.id));
}

function getRarityLabel(rarity: number): string {
  if (rarity >= 5) return "Lendário";
  if (rarity === 4) return "Épico";
  if (rarity === 3) return "Raro";
  if (rarity === 2) return "Incomum";
  return "Comum";
}

function HeroCompactCard({
  hero,
  selected,
  state,
  onSelect,
}: {
  hero: Hero;
  selected: boolean;
  state: GameState;
  onSelect: () => void;
}) {
  const currentHp = hero.currentHp ?? hero.stats.hp;
  const hpPercent = Math.round((Math.max(0, currentHp) / Math.max(1, hero.stats.hp)) * 100);
  const moraleState = getHeroMoraleState(hero);
  const injuryCount = getActiveInjuryCount(hero);
  const injurySummary = getHeroInjurySummary(hero);
  const specialization = getHeroSpecialization(hero);
  const affinity = getHeroAffinitySummaries(state, hero.id)[0];
  const inFormation = isHeroInFormation(state, hero.id);
  const onExpedition = isHeroOnExpedition(state, hero.id);
  const expedition = getHeroExpedition(state, hero.id);
  const specializationAvailable = hero.level >= SPECIALIZATION_LEVEL && !hero.specializationKey;
  const power = getHeroPower(hero);
  const availabilityTone = injuryCount > 0 ? "injured" : onExpedition ? "expedition" : inFormation ? "formation" : "available";

  return (
    <button
      className={`hero-compact-card rarity-${hero.rarity} morale-${moraleState.tone} state-${availabilityTone}${selected ? " selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <div className="hero-compact-head">
        <div className="hero-portrait-sigil" aria-hidden="true">
          {hero.name.slice(0, 1)}
        </div>
        <div className="hero-compact-title">
          <span>{hero.className}</span>
          <strong>{hero.name}</strong>
          <small>{getRarityLabel(hero.rarity)} | {getRarityStars(hero.rarity)}</small>
        </div>
        <em>Poder {power}</em>
      </div>

      <div className="hero-compact-stats">
        <span>Lv. {hero.level}</span>
        <span>HP {currentHp}/{hero.stats.hp}</span>
        <span>Moral {hero.morale}</span>
      </div>

      <div className="hero-card-bars">
        <label>
          <span>Vigor</span>
          <i className="hero-compact-life" aria-label={`HP em ${hpPercent}%`}>
            <b style={{ width: `${hpPercent}%` }} />
          </i>
        </label>
        <label>
          <span>{moraleState.label}</span>
          <i className={`hero-compact-morale tone-${moraleState.tone}`} aria-label={`Moral em ${hero.morale}%`}>
            <b style={{ width: `${Math.max(0, Math.min(100, hero.morale))}%` }} />
          </i>
        </label>
      </div>

      <div className="hero-tags">
        <span className={`tone-${moraleState.tone}`}>{moraleState.label}</span>
        {inFormation ? <span className="tone-formation">Formação</span> : null}
        {onExpedition ? <span className="tone-expedition">{expedition?.name || "Expedição"}</span> : null}
        {injuryCount > 0 ? <span className="tone-injured">{injuryCount} ferimento(s)</span> : null}
        {specialization ? <span>{specialization.name}</span> : null}
        {specializationAvailable ? <span className="tone-arcane">Especialização</span> : null}
        {affinity ? <span>{affinity.ally.name}: {affinity.label}</span> : null}
      </div>
      {injurySummary ? <small className="hero-card-warning">{injurySummary}</small> : null}
    </button>
  );
}

function HeroDetailPanel({ hero, state, inventory }: { hero: Hero; state: GameState; inventory: EquipmentItem[] }) {
  const addHeroToFormation = useGameStore((store) => store.addHeroToFormation);
  const removeHeroFromFormation = useGameStore((store) => store.removeHeroFromFormation);
  const equipItemOnHero = useGameStore((store) => store.equipItem);
  const unequipItemFromHero = useGameStore((store) => store.unequipItem);
  const chooseHeroSpecializationAction = useGameStore((store) => store.chooseHeroSpecialization);
  const treatHeroInjuriesAction = useGameStore((store) => store.treatHeroInjuries);
  const useConsumableAction = useGameStore((store) => store.useConsumable);
  const [selectedBySlot, setSelectedBySlot] = useState<Partial<Record<EquipmentSlot, string>>>({});
  const [selectedConsumableId, setSelectedConsumableId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const xpNeeded = getHeroXpForNextLevel(hero.level);
  const equippedItems = getEquippedItems(hero, inventory);
  const unequippedItems = getUnequippedInventory(state);
  const moraleState = getHeroMoraleState(hero);
  const injurySummary = getHeroInjurySummary(hero);
  const specialization = getHeroSpecialization(hero);
  const specializationOptions = getClassSpecializations(hero.classKey);
  const canChooseSpecialization = hero.level >= SPECIALIZATION_LEVEL && !hero.specializationKey;
  const activeInjuries = getHeroActiveInjuries(hero);
  const goldTreatmentCost = getHeroInjuryTreatmentCost(hero, "gold");
  const essenceTreatmentCost = getHeroInjuryTreatmentCost(hero, "essence");
  const affinities = getHeroAffinitySummaries(state, hero.id).slice(0, 4);
  const inFormation = isHeroInFormation(state, hero.id);
  const expedition = getHeroExpedition(state, hero.id);
  const onExpedition = Boolean(expedition);
  const consumables = Object.values(CONSUMABLE_DEFINITIONS).filter(
    (definition) => definition.target === "hero" && (state.consumables[definition.id] || 0) > 0,
  );

  return (
    <aside className="hero-detail-panel">
      <div className="hero-detail-head">
        <div className="hero-detail-identity">
          <div className="hero-portrait-sigil large" aria-hidden="true">
            {hero.name.slice(0, 1)}
          </div>
          <div>
          <span>{hero.className} | {getRarityLabel(hero.rarity)}</span>
          <h3>{hero.name}</h3>
          <small>{getRarityStars(hero.rarity)} | {moraleState.label} | Poder {getHeroPower(hero)}</small>
          </div>
        </div>
        <button
          className={inFormation ? "hero-inline-action" : "hero-inline-action primary"}
          onClick={() => {
            const result = inFormation ? removeHeroFromFormation(hero.id) : addHeroToFormation(hero.id);
            setFeedback(result.message);
          }}
          type="button"
        >
          {inFormation ? "Remover da formacao" : "Adicionar a formacao"}
        </button>
      </div>

      <div className="hero-detail-badges">
        <span className={`tone-${moraleState.tone}`}>Moral {hero.morale} | {moraleState.label}</span>
        {inFormation ? <span className="tone-formation">Na formação</span> : null}
        {onExpedition ? <span className="tone-expedition">{expedition?.name}</span> : null}
        {activeInjuries.length > 0 ? <span className="tone-injured">{activeInjuries.length} ferimento(s)</span> : <span>Pronto</span>}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Resumo</strong>
        <div className="hero-stat-grid hero-stat-grid-featured">
          <span><strong>Lv.</strong>{hero.level}</span>
          <span><strong>XP</strong>{hero.xp}/{xpNeeded}</span>
          <span><strong>Poder</strong>{getHeroPower(hero)}</span>
          <span><strong>HP</strong>{hero.currentHp ?? hero.stats.hp}/{hero.stats.hp}</span>
        </div>
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Combate</strong>
        <div className="hero-stat-grid">
          <span><strong>ATK</strong>{hero.stats.atk}</span>
          <span><strong>DEF</strong>{hero.stats.def}</span>
          <span><strong>SPD</strong>{hero.stats.spd}</span>
          <span><strong>FOCUS</strong>{hero.stats.focus}</span>
          <span><strong>LUCK</strong>{hero.stats.luck}</span>
          <span><strong>Moral</strong>{hero.morale}</span>
        </div>
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Status</strong>
        <span>{moraleState.label}: {moraleState.description}.</span>
        <span>{injurySummary || "Sem ferimentos ativos."}</span>
        {onExpedition ? <span>Em expedição: {expedition?.name}</span> : null}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Equipamentos</strong>
        {EQUIPMENT_SLOTS.map((slot) => {
          const equipped = equippedItems.find((item) => item.type === slot);
          const options = unequippedItems.filter((item) => item.type === slot);

          return (
            <div className="hero-equipment-row" key={slot}>
              <span>
                {getEquipmentTypeName(slot)}: {equipped ? `${equipped.name} (${getEquipmentBonusLabel(equipped)})` : "vazio"}
              </span>
              <div className="hero-equipment-actions">
                {equipped ? (
                  <button className="hero-inline-action" onClick={() => setFeedback(unequipItemFromHero(hero.id, slot).message)} type="button">
                    Remover
                  </button>
                ) : null}
                {options.length > 0 ? (
                  <>
                    <select
                      className="hero-equipment-select"
                      onChange={(event) => setSelectedBySlot((current) => ({ ...current, [slot]: event.target.value }))}
                      value={selectedBySlot[slot] || ""}
                    >
                      <option value="">Escolher item</option>
                      {options.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({getEquipmentBonusLabel(item)})
                        </option>
                      ))}
                    </select>
                    <button
                      className="hero-inline-action"
                      disabled={!selectedBySlot[slot]}
                      onClick={() => {
                        const equipmentId = selectedBySlot[slot];
                        if (!equipmentId) return;
                        setFeedback(equipItemOnHero(hero.id, equipmentId).message);
                      }}
                      type="button"
                    >
                      Equipar
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Especialização</strong>
        <span>{specialization ? `${specialization.passiveName}: ${specialization.description}` : "Nenhuma especializacao escolhida."}</span>
        {canChooseSpecialization
          ? specializationOptions.map((option) => (
              <button
                className="hero-inline-action"
                key={option.key}
                onClick={() => setFeedback(chooseHeroSpecializationAction(hero.id, option.key).message)}
                type="button"
              >
                {option.name}: {option.description}
              </button>
            ))
          : null}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Ferimentos e Enfermaria</strong>
        <span>{injurySummary || "Sem ferimentos ativos."}</span>
        {activeInjuries.map((injury) => {
          const definition = getInjuryDefinition(injury.typeKey);
          return (
            <span key={injury.id}>
              {definition?.name || injury.typeKey} ({definition?.description || "ferimento"}) - {injury.remainingBattles} batalha(s)
            </span>
          );
        })}
        <div className="hero-equipment-actions">
          {goldTreatmentCost ? (
            <button className="hero-inline-action" onClick={() => setFeedback(treatHeroInjuriesAction(hero.id, "gold").message)} type="button">
              Tratar com ouro ({goldTreatmentCost})
            </button>
          ) : null}
          {essenceTreatmentCost ? (
            <button className="hero-inline-action" onClick={() => setFeedback(treatHeroInjuriesAction(hero.id, "essence").message)} type="button">
              Tratar com essencia ({essenceTreatmentCost})
            </button>
          ) : null}
        </div>
        <small>
          Custo por ferimento: {INJURY_CONFIG.treatmentCosts.gold} ouro ou {INJURY_CONFIG.treatmentCosts.essence} essencia.
        </small>
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Afinidades</strong>
        {affinities.length > 0 ? (
          affinities.map((affinity) => (
            <span key={affinity.key}>
              {affinity.ally.name}: {affinity.label} ({affinity.nextXp ? `${affinity.xp}/${affinity.nextXp}` : "Max"})
            </span>
          ))
        ) : (
          <span>Nenhuma afinidade relevante ainda.</span>
        )}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Consumíveis</strong>
        {consumables.length > 0 ? (
          <div className="hero-equipment-actions">
            <select className="hero-equipment-select" onChange={(event) => setSelectedConsumableId(event.target.value)} value={selectedConsumableId}>
              <option value="">Escolher consumivel</option>
              {consumables.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.name} x{state.consumables[definition.id] || 0}
                </option>
              ))}
            </select>
            <button
              className="hero-inline-action"
              disabled={!selectedConsumableId}
              onClick={() => {
                if (!selectedConsumableId) return;
                setFeedback(useConsumableAction(selectedConsumableId, hero.id).message);
              }}
              type="button"
            >
              Usar
            </button>
          </div>
        ) : (
          <span>Nenhum consumivel disponivel.</span>
        )}
      </div>

      <div className="hero-detail-section hero-detail-block">
        <strong>Histórico</strong>
        <span>Combates, expedicoes e eventos detalhados ainda nao possuem historico individual persistido.</span>
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </aside>
  );
}

export function HeroRosterPanel() {
  const state = useGameStore((store) => store.state);
  const [sortBy, setSortBy] = useState<HeroSort>("power");
  const [classKey, setClassKey] = useState<string>("all");
  const [status, setStatus] = useState<HeroStatusFilter>("all");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const formationIds = useMemo(() => new Set(state.formation.filter(Boolean)), [state.formation]);
  const classOptions = Array.from(new Set(state.heroes.map((hero) => hero.classKey))).sort();
  const filteredHeroes = sortHeroesForDisplay(
    state.heroes.filter((hero) => (classKey === "all" || hero.classKey === classKey) && heroMatchesStatus(hero, state, status)),
    sortBy,
  );
  const selectedHero = state.heroes.find((hero) => hero.id === (selectedHeroId || filteredHeroes[0]?.id)) ?? null;
  const totalPower = filteredHeroes.reduce((sum, hero) => sum + getHeroPower(hero), 0);

  return (
    <section className="roster-panel">
      <div className="section-heading">
        <span>Quartel da Guilda</span>
        <h2>Heróis</h2>
        <p>Elenco ativo de aventureiros, vínculos, ferimentos e prontidão para a torre.</p>
      </div>

      <div className="hero-list-controls">
        <label>
          Ordenar
          <select onChange={(event) => setSortBy(event.target.value as HeroSort)} value={sortBy}>
            <option value="power">Poder</option>
            <option value="name">Nome</option>
            <option value="class">Classe</option>
            <option value="level">Nivel</option>
            <option value="rarity">Raridade</option>
          </select>
        </label>
        <label>
          Classe
          <select onChange={(event) => setClassKey(event.target.value)} value={classKey}>
            <option value="all">Todas</option>
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select onChange={(event) => setStatus(event.target.value as HeroStatusFilter)} value={status}>
            <option value="all">Todos</option>
            <option value="available">Disponiveis</option>
            <option value="formation">Na formacao</option>
            <option value="expedition">Em expedicao</option>
            <option value="injured">Feridos</option>
          </select>
        </label>
        <strong>
          {filteredHeroes.length}/{state.heroes.length} exibido(s)
        </strong>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Herois</strong>
          <span>{state.heroes.length}</span>
        </div>
        <div>
          <strong>Na formacao</strong>
          <span>{formationIds.size}</span>
        </div>
        <div>
          <strong>Poder filtrado</strong>
          <span>{totalPower}</span>
        </div>
      </div>

      {filteredHeroes.length > 0 ? (
        <div className="hero-roster-layout">
          <div className="hero-roster-grid compact">
            {filteredHeroes.map((hero) => (
              <HeroCompactCard
                hero={hero}
                key={hero.id}
                onSelect={() => setSelectedHeroId(hero.id)}
                selected={selectedHero?.id === hero.id}
                state={state}
              />
            ))}
          </div>
          {selectedHero ? <HeroDetailPanel hero={selectedHero} inventory={state.inventory} state={state} /> : null}
        </div>
      ) : state.heroes.length > 0 ? (
        <article className="empty-panel">
          <span>Sem resultados</span>
          <h3>Nenhum heroi corresponde aos filtros</h3>
          <p>Ajuste ordenacao, classe ou status para ver o elenco.</p>
        </article>
      ) : (
        <article className="empty-panel">
          <span>Sem herois</span>
          <h3>Nenhum heroi no save atual</h3>
          <p>Use as abas Invocacao ou Recrutamento para preencher o elenco.</p>
        </article>
      )}
    </section>
  );
}
