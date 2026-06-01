"use client";

import {
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroInjurySummary,
  getHeroMoraleState,
  getHeroSpecialization,
  getHeroPower,
  getHeroXpForNextLevel,
  type EquipmentItem,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

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
}: {
  hero: Hero;
  inventory: EquipmentItem[];
  inFormation: boolean;
}) {
  const xpNeeded = getHeroXpForNextLevel(hero.level);
  const xpPercent = Math.round((Math.min(hero.xp, xpNeeded) / xpNeeded) * 100);
  const currentHp = hero.currentHp ?? hero.stats.hp;
  const hpPercent = Math.round((Math.max(0, currentHp) / Math.max(1, hero.stats.hp)) * 100);
  const equippedItems = getEquippedItems(hero, inventory);
  const injuryCount = getActiveInjuryCount(hero);
  const moraleState = getHeroMoraleState(hero);
  const injurySummary = getHeroInjurySummary(hero);
  const specialization = getHeroSpecialization(hero);

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
        {equippedItems.length > 0 ? (
          equippedItems.map((item) => (
            <span key={item.id}>
              {getEquipmentTypeName(item.type)}: {item.name} ({getEquipmentBonusLabel(item)})
            </span>
          ))
        ) : (
          <span>Nenhum item equipado</span>
        )}
      </div>
    </article>
  );
}

export function HeroRosterPanel() {
  const state = useGameStore((store) => store.state);
  const formationIds = new Set(state.formation.filter(Boolean));
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
        <p>Primeira leitura React do elenco normalizado pelo core TypeScript.</p>
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
            <HeroCard hero={hero} inFormation={formationIds.has(hero.id)} inventory={state.inventory} key={hero.id} />
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
