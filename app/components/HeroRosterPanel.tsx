"use client";

import {
  EQUIPMENT_SLOTS,
  getClassSpecializations,
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroAffinitySummaries,
  getHeroInjurySummary,
  getHeroMoraleState,
  getHeroSpecialization,
  getHeroPower,
  getHeroXpForNextLevel,
  getUnequippedInventory,
  SPECIALIZATION_LEVEL,
  type EquipmentItem,
  type EquipmentSlot,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

function getRarityStars(rarity: number): string {
  return "\u2605".repeat(rarity) + "\u2606".repeat(Math.max(0, 5 - rarity));
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
  const formationIds = new Set(state.formation.filter(Boolean));
  const unequippedItems = getUnequippedInventory(state);
  const orderedHeroes = [...state.heroes].sort((a, b) => {
    const formationDelta = Number(formationIds.has(b.id)) - Number(formationIds.has(a.id));
    return formationDelta || getHeroPower(b) - getHeroPower(a);
  });
  const totalPower = orderedHeroes.reduce((sum, hero) => sum + getHeroPower(hero), 0);

  return (
    <section className="roster-panel">
      <div className="section-heading">
        <span>Elenco React</span>
        <h2>Herois</h2>
        <p>Gerencie formacao e equipamentos pelo core TypeScript com persistencia no save legado.</p>
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
          <strong>Poder total</strong>
          <span>{totalPower}</span>
        </div>
      </div>

      {orderedHeroes.length > 0 ? (
        <div className="hero-roster-grid">
          {orderedHeroes.slice(0, 6).map((hero) => (
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
