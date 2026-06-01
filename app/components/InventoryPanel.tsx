"use client";

import { CONSUMABLE_DEFINITIONS, getEquipmentBonusLabel, getEquipmentTypeName } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function InventoryPanel() {
  const state = useGameStore((store) => store.state);
  const consumables = Object.values(CONSUMABLE_DEFINITIONS).map((definition) => ({
    definition,
    quantity: state.consumables[definition.id] || 0,
  }));
  const ownedConsumables = consumables.filter((item) => item.quantity > 0);
  const equipmentByRarity = state.inventory.reduce<Record<number, number>>((summary, item) => {
    summary[item.rarity] = (summary[item.rarity] || 0) + 1;
    return summary;
  }, {});

  return (
    <section className="inventory-panel">
      <div className="section-heading">
        <span>Inventario React</span>
        <h2>Itens e suprimentos</h2>
        <p>Leitura inicial do inventario normalizado pelo core TypeScript.</p>
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

      <div className="inventory-columns">
        <article className="inventory-list-card">
          <span>Equipamentos</span>
          <h3>Itens obtidos</h3>
          {state.inventory.length > 0 ? (
            <div className="inventory-list">
              {state.inventory.slice(0, 8).map((item) => (
                <div className={`inventory-row rarity-${item.rarity}`} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>
                    {getEquipmentTypeName(item.type)} | {getEquipmentBonusLabel(item)} | Raridade {item.rarity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum equipamento no save atual.</p>
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
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
