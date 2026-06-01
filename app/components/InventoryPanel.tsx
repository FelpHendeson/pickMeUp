"use client";

import { CONSUMABLE_DEFINITIONS, getEquipmentBonusLabel, getEquipmentTypeName, getUnequippedInventory } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useState } from "react";

export function InventoryPanel() {
  const state = useGameStore((store) => store.state);
  const useConsumableOnHero = useGameStore((store) => store.useConsumable);
  const equipItemOnHero = useGameStore((store) => store.equipItem);
  const [selectedHeroId, setSelectedHeroId] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const consumables = Object.values(CONSUMABLE_DEFINITIONS).map((definition) => ({
    definition,
    quantity: state.consumables[definition.id] || 0,
  }));
  const ownedConsumables = consumables.filter((item) => item.quantity > 0);
  const unequippedItems = getUnequippedInventory(state);
  const equipmentByRarity = state.inventory.reduce<Record<number, number>>((summary, item) => {
    summary[item.rarity] = (summary[item.rarity] || 0) + 1;
    return summary;
  }, {});

  const defaultHeroId = selectedHeroId || state.heroes[0]?.id || "";

  return (
    <section className="inventory-panel">
      <div className="section-heading">
        <span>Inventario React</span>
        <h2>Itens e suprimentos</h2>
        <p>Equipe itens e use consumiveis pelo core TypeScript com persistencia no save legado.</p>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Equipamentos</strong>
          <span>{state.inventory.length}</span>
        </div>
        <div>
          <strong>Consumiveis</strong>
          <span>{ownedConsumables.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div>
          <strong>Raridades</strong>
          <span>{Object.keys(equipmentByRarity).length || 0}</span>
        </div>
      </div>

      {state.heroes.length > 0 ? (
        <label className="inventory-hero-picker">
          Heroi alvo
          <select onChange={(event) => setSelectedHeroId(event.target.value)} value={defaultHeroId}>
            {state.heroes.map((hero) => (
              <option key={hero.id} value={hero.id}>
                {hero.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="inventory-columns">
        <article className="inventory-list-card">
          <span>Equipamentos</span>
          <h3>Itens obtidos</h3>
          {unequippedItems.length > 0 ? (
            <div className="inventory-list">
              {unequippedItems.slice(0, 10).map((item) => (
                <div className={`inventory-row rarity-${item.rarity}`} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>
                    {getEquipmentTypeName(item.type)} | {getEquipmentBonusLabel(item)} | Raridade {item.rarity}
                  </span>
                  {defaultHeroId ? (
                    <button
                      className="hero-inline-action"
                      onClick={() => {
                        const result = equipItemOnHero(defaultHeroId, item.id);
                        setFeedback(result.message);
                      }}
                      type="button"
                    >
                      Equipar no heroi selecionado
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum equipamento livre no save atual.</p>
          )}
        </article>

        <article className="inventory-list-card">
          <span>Consumiveis</span>
          <h3>Suprimentos</h3>
          <div className="inventory-list">
            {consumables.map(({ definition, quantity }) => (
              <div className={`inventory-row${quantity > 0 ? " available" : ""}`} key={definition.id}>
                <strong>
                  {definition.name} x{quantity}
                </strong>
                <span>
                  {definition.moment} | {definition.description}
                </span>
                {quantity > 0 ? (
                  <button
                    className="hero-inline-action"
                    disabled={definition.target === "hero" && !defaultHeroId}
                    onClick={() => {
                      const result = useConsumableOnHero(definition.id, definition.target === "hero" ? defaultHeroId : null);
                      setFeedback(result.message);
                    }}
                    type="button"
                  >
                    {definition.target === "hero" ? "Usar no heroi selecionado" : "Usar"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
