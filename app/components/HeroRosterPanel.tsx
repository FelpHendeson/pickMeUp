"use client";

import {
  EQUIPMENT_SLOTS,
  getClassSpecializations,
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroAffinitySummaries,
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
  type Hero,
  type GameState,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

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

function sortHeroesForDisplay(heroes: Hero[], _state: GameState, sortBy: HeroSort): Hero[] {
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

function HeroCard({
  hero,
  inventory,
  inFormation,
  state,
  unequippedItems,
}: {
  hero: Hero;
  inventory: EquipmentItem[];
  inFormation: boolean;
  state: Parameters<typeof getHeroAffinitySummaries>[0];
  unequippedItems: EquipmentItem[];
}) {
  const addHeroToFormation = useGameStore((store) => store.addHeroToFormation);
  const removeHeroFromFormation = useGameStore((store) => store.removeHeroFromFormation);
  const equipItemOnHero = useGameStore((store) => store.equipItem);
  const unequipItemFromHero = useGameStore((store) => store.unequipItem);
  const chooseHeroSpecializationAction = useGameStore((store) => store.chooseHeroSpecialization);
  const treatHeroInjuriesAction = useGameStore((store) => store.treatHeroInjuries);
  const [selectedBySlot, setSelectedBySlot] = useState<Partial<Record<EquipmentSlot, string>>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const xpNeeded = getHeroXpForNextLevel(hero.level);
  const xpPercent = Math.round((Math.min(hero.xp, xpNeeded) / xpNeeded) * 100);
  const currentHp = hero.currentHp ?? hero.stats.hp;
  const hpPercent = Math.round((Math.max(0, currentHp) / Math.max(1, hero.stats.hp)) * 100);
  const equippedItems = getEquippedItems(hero, inventory);
  const injuryCount = getActiveInjuryCount(hero);
  const moraleState = getHeroMoraleState(hero);
  const injurySummary = getHeroInjurySummary(hero);
  const specialization = getHeroSpecialization(hero);
  const specializationOptions = getClassSpecializations(hero.classKey);
  const canChooseSpecialization = hero.level >= SPECIALIZATION_LEVEL && !hero.specializationKey;
  const activeInjuries = getHeroActiveInjuries(hero);
  const goldTreatmentCost = getHeroInjuryTreatmentCost(hero, "gold");
  const essenceTreatmentCost = getHeroInjuryTreatmentCost(hero, "essence");
  const affinities = getHeroAffinitySummaries(state, hero.id).slice(0, 2);

  return (
    <article className={`hero-card rarity-${hero.rarity}${inFormation ? " in-formation" : ""}${injuryCount > 0 ? " injured" : ""}`}>
      <div className="hero-card-head">
        <div>
          <span>{hero.className}</span>
          <h3>{hero.name}</h3>
        </div>
        <strong>{getRarityStars(hero.rarity)}</strong>
      </div>

      <div className="hero-tags">
        {inFormation ? <span>Formacao</span> : null}
        {injuryCount > 0 ? <span>{injuryCount} ferimento(s)</span> : null}
        {specialization ? <span>{specialization.name}</span> : hero.level >= 10 ? <span>Especializacao disponivel</span> : null}
        <span>{moraleState.label}</span>
      </div>

      <div className="hero-bars">
        <label>
          HP {currentHp}/{hero.stats.hp}
          <i>
            <b style={{ width: `${hpPercent}%` }} />
          </i>
        </label>
        <label>
          XP {hero.xp}/{xpNeeded}
          <i>
            <b style={{ width: `${xpPercent}%` }} />
          </i>
        </label>
      </div>

      <div className="hero-stat-grid">
        <span>Lv. {hero.level}</span>
        <span>Poder {getHeroPower(hero)}</span>
        <span>ATK {hero.stats.atk}</span>
        <span>DEF {hero.stats.def}</span>
        <span>SPD {hero.stats.spd}</span>
        <span>FOCUS {hero.stats.focus}</span>
      </div>

      <div className="hero-equipment">
        <strong>{specialization ? `${specialization.passiveName} - ${specialization.description}` : injurySummary || "Equipamentos"}</strong>
        {affinities.map((affinity) => (
          <span key={affinity.key}>
            Afinidade: {affinity.ally.name} ({affinity.label}, {affinity.nextXp ? `${affinity.xp}/${affinity.nextXp}` : "Max"})
          </span>
        ))}
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
                  <button
                    className="hero-inline-action"
                    onClick={() => {
                      const result = unequipItemFromHero(hero.id, slot);
                      setFeedback(result.message);
                    }}
                    type="button"
                  >
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
                        const result = equipItemOnHero(hero.id, equipmentId);
                        setFeedback(result.message);
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

      {canChooseSpecialization ? (
        <div className="hero-specialization-picker">
          <strong>Escolher especializacao (nivel {SPECIALIZATION_LEVEL}+)</strong>
          {specializationOptions.map((option) => (
            <button
              className="hero-inline-action"
              key={option.key}
              onClick={() => {
                const result = chooseHeroSpecializationAction(hero.id, option.key);
                setFeedback(result.message);
              }}
              type="button"
            >
              {option.name}: {option.description}
            </button>
          ))}
        </div>
      ) : null}

      {activeInjuries.length > 0 ? (
        <div className="hero-injury-panel">
          <strong>Enfermaria</strong>
          {activeInjuries.map((injury) => {
            const definition = getInjuryDefinition(injury.typeKey);
            return (
              <span key={injury.id}>
                {definition?.name || injury.typeKey} ({definition?.description || "ferimento"}) — {injury.remainingBattles} batalha(s)
              </span>
            );
          })}
          <div className="hero-equipment-actions">
            {goldTreatmentCost ? (
              <button
                className="hero-inline-action"
                onClick={() => {
                  const result = treatHeroInjuriesAction(hero.id, "gold");
                  setFeedback(result.message);
                }}
                type="button"
              >
                Tratar com ouro ({goldTreatmentCost})
              </button>
            ) : null}
            {essenceTreatmentCost ? (
              <button
                className="hero-inline-action"
                onClick={() => {
                  const result = treatHeroInjuriesAction(hero.id, "essence");
                  setFeedback(result.message);
                }}
                type="button"
              >
                Tratar com essencia ({essenceTreatmentCost})
              </button>
            ) : null}
          </div>
          <small>
            Custo por ferimento: {INJURY_CONFIG.treatmentCosts.gold} ouro ou {INJURY_CONFIG.treatmentCosts.essence} essencia.
          </small>
        </div>
      ) : null}

      <div className="hero-action-row">
        {inFormation ? (
          <button
            className="hero-inline-action"
            onClick={() => {
              const result = removeHeroFromFormation(hero.id);
              setFeedback(result.message);
            }}
            type="button"
          >
            Remover da formacao
          </button>
        ) : (
          <button
            className="hero-inline-action primary"
            onClick={() => {
              const result = addHeroToFormation(hero.id);
              setFeedback(result.message);
            }}
            type="button"
          >
            Adicionar a formacao
          </button>
        )}
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </article>
  );
}

export function HeroRosterPanel() {
  const state = useGameStore((store) => store.state);
  const [sortBy, setSortBy] = useState<HeroSort>("power");
  const [classKey, setClassKey] = useState<string>("all");
  const [status, setStatus] = useState<HeroStatusFilter>("all");
  const formationIds = new Set(state.formation.filter(Boolean));
  const unequippedItems = getUnequippedInventory(state);
  const classOptions = Array.from(new Set(state.heroes.map((hero) => hero.classKey))).sort();
  const filteredHeroes = sortHeroesForDisplay(
    state.heroes.filter((hero) => (classKey === "all" || hero.classKey === classKey) && heroMatchesStatus(hero, state, status)),
    state,
    sortBy,
  );
  const totalPower = filteredHeroes.reduce((sum, hero) => sum + getHeroPower(hero), 0);

  return (
    <section className="roster-panel">
      <div className="section-heading">
        <span>Elenco React</span>
        <h2>Herois</h2>
        <p>Gerencie formacao e equipamentos pelo core TypeScript com persistencia no save legado.</p>
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
        <div className="hero-roster-grid">
          {filteredHeroes.slice(0, 12).map((hero) => (
            <HeroCard
              hero={hero}
              inFormation={formationIds.has(hero.id)}
              inventory={state.inventory}
              key={hero.id}
              state={state}
              unequippedItems={unequippedItems}
            />
          ))}
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
          <p>Abra o jogo legado, invoque ou recrute herois e recarregue esta pagina para ver o painel preenchido.</p>
        </article>
      )}
    </section>
  );
}
