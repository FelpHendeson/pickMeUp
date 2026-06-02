"use client";

import {
  CONSUMABLE_DEFINITIONS,
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroMoraleState,
  type EquipmentItem,
  type EquipmentSlot,
  type Hero,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

type InventoryTab = "equipment" | "consumables";

const EQUIPMENT_ORDER: EquipmentSlot[] = ["weapon", "armor", "accessory"];

function getEquippedItemForSlot(hero: Hero | null, inventory: EquipmentItem[], slot: EquipmentSlot): EquipmentItem | null {
  const equippedId = hero?.equipment?.[slot];
  return equippedId ? inventory.find((item) => item.id === equippedId) ?? null : null;
}

function getEquipmentOwnerName(inventoryHeroList: Hero[], itemId: string): string | null {
  return inventoryHeroList.find((hero) => Object.values(hero.equipment || {}).includes(itemId))?.name ?? null;
}

function getComparisonLabel(item: EquipmentItem, equipped: EquipmentItem | null): string {
  if (!equipped) return "Slot vazio no heroi alvo";
  if (item.bonusStat !== equipped.bonusStat) return `${getEquipmentBonusLabel(equipped)} equipado`;

  const delta = item.bonusValue - equipped.bonusValue;
  if (delta > 0) return `+${delta} sobre o item equipado`;
  if (delta < 0) return `${delta} abaixo do item equipado`;
  return "Mesmo bonus do item equipado";
}

export function InventoryPanel() {
  const state = useGameStore((store) => store.state);
  const useConsumableOnHero = useGameStore((store) => store.useConsumable);
  const equipItemOnHero = useGameStore((store) => store.equipItem);
  const [activeTab, setActiveTab] = useState<InventoryTab>("equipment");
  const [selectedHeroId, setSelectedHeroId] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const defaultHeroId = selectedHeroId || state.heroes[0]?.id || "";
  const selectedHero = state.heroes.find((hero) => hero.id === defaultHeroId) ?? null;
  const consumables = Object.values(CONSUMABLE_DEFINITIONS).map((definition) => ({
    definition,
    quantity: state.consumables[definition.id] || 0,
  }));
  const ownedConsumableTotal = consumables.reduce((sum, item) => sum + item.quantity, 0);
  const equipmentBySlot = useMemo(
    () =>
      EQUIPMENT_ORDER.reduce<Record<EquipmentSlot, EquipmentItem[]>>(
        (grouped, slot) => {
          grouped[slot] = state.inventory
            .filter((item) => item.type === slot)
            .sort((a, b) => b.rarity - a.rarity || b.bonusValue - a.bonusValue || a.name.localeCompare(b.name));
          return grouped;
        },
        { weapon: [], armor: [], accessory: [] },
      ),
    [state.inventory],
  );
  const targetStatus = selectedHero
    ? [
        getHeroMoraleState(selectedHero).label,
        getHeroActiveInjuries(selectedHero).length > 0 ? `${getHeroActiveInjuries(selectedHero).length} ferimento(s)` : "Sem ferimentos",
      ]
    : [];

  return (
    <section className="inventory-panel">
      <div className="section-heading">
        <span>Inventario</span>
        <h2>Itens e suprimentos</h2>
        <p>Gerencie equipamentos e consumiveis com um heroi alvo claro para comparar e aplicar efeitos.</p>
      </div>

      <div className="inventory-tab-row" role="tablist" aria-label="Secoes do inventario">
        <button className={activeTab === "equipment" ? "active" : ""} onClick={() => setActiveTab("equipment")} type="button">
          Equipamentos
        </button>
        <button className={activeTab === "consumables" ? "active" : ""} onClick={() => setActiveTab("consumables")} type="button">
          Consumiveis
        </button>
      </div>

      <div className="inventory-target-card">
        <div>
          <span>Heroi alvo</span>
          <h3>{selectedHero ? selectedHero.name : "Nenhum heroi disponivel"}</h3>
          <p>
            {selectedHero
              ? `${selectedHero.className} | Lv. ${selectedHero.level} | ${targetStatus.join(" | ")}`
              : "Recrute um heroi para habilitar uso direcionado de itens."}
          </p>
        </div>
        {state.heroes.length > 0 ? (
          <label>
            Trocar alvo
            <select onChange={(event) => setSelectedHeroId(event.target.value)} value={defaultHeroId}>
              {state.heroes.map((hero) => (
                <option key={hero.id} value={hero.id}>
                  {hero.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="inventory-equipped-summary">
          {EQUIPMENT_ORDER.map((slot) => {
            const equipped = getEquippedItemForSlot(selectedHero, state.inventory, slot);
            return (
              <span key={slot}>
                {getEquipmentTypeName(slot)}: {equipped ? `${equipped.name} (${getEquipmentBonusLabel(equipped)})` : "vazio"}
              </span>
            );
          })}
        </div>
      </div>

      <div className="tower-summary roster-summary">
        <div>
          <strong>Equipamentos</strong>
          <span>{state.inventory.length}</span>
        </div>
        <div>
          <strong>Consumiveis</strong>
          <span>{ownedConsumableTotal}</span>
        </div>
        <div>
          <strong>Alvo</strong>
          <span>{selectedHero ? selectedHero.className : "-"}</span>
        </div>
      </div>

      {activeTab === "equipment" ? (
        <div className="inventory-equipment-sections">
          {EQUIPMENT_ORDER.map((slot) => {
            const equipped = getEquippedItemForSlot(selectedHero, state.inventory, slot);
            const items = equipmentBySlot[slot];

            return (
              <article className="inventory-list-card" key={slot}>
                <span>{getEquipmentTypeName(slot)}</span>
                <h3>{items.length} item(ns)</h3>
                {items.length > 0 ? (
                  <div className="inventory-list">
                    {items.map((item) => {
                      const ownerName = getEquipmentOwnerName(state.heroes, item.id);
                      const equippedOnTarget = selectedHero?.equipment?.[slot] === item.id;
                      return (
                        <div className={`inventory-row rarity-${item.rarity}${ownerName ? " equipped" : ""}`} key={item.id}>
                          <div className="inventory-row-head">
                            <strong>{item.name}</strong>
                            <em>{ownerName ? (equippedOnTarget ? "Equipado no alvo" : `Com ${ownerName}`) : "Livre"}</em>
                          </div>
                          <span>
                            Raridade {item.rarity} | {getEquipmentBonusLabel(item)}
                          </span>
                          <small>{getComparisonLabel(item, equipped)}</small>
                          {defaultHeroId && !equippedOnTarget ? (
                            <button
                              className="hero-inline-action"
                              onClick={() => {
                                const result = equipItemOnHero(defaultHeroId, item.id);
                                setFeedback(result.message);
                              }}
                              type="button"
                            >
                              Equipar no alvo
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Nenhum item deste tipo no inventario.</p>
                )}
              </article>
            );
          })}
        </div>
      ) : null}

      {activeTab === "consumables" ? (
        <article className="inventory-list-card">
          <span>Consumiveis</span>
          <h3>Suprimentos e preparacao</h3>
          <div className="inventory-list consumable-grid">
            {consumables.map(({ definition, quantity }) => {
              const needsHero = definition.target === "hero";
              const disabledReason = quantity <= 0 ? "Item indisponivel" : needsHero && !defaultHeroId ? "Selecione um heroi alvo" : "";

              return (
                <div className={`inventory-row${quantity > 0 ? " available" : ""}`} key={definition.id}>
                  <div className="inventory-row-head">
                    <strong>{definition.name}</strong>
                    <em>x{quantity}</em>
                  </div>
                  <span>{definition.description}</span>
                  <small>
                    Alvo: {needsHero ? "Heroi selecionado" : "Conta / proxima acao"} | Momento: {definition.moment}
                  </small>
                  <button
                    className="hero-inline-action"
                    disabled={Boolean(disabledReason)}
                    onClick={() => {
                      const result = useConsumableOnHero(definition.id, needsHero ? defaultHeroId : null);
                      setFeedback(result.message);
                    }}
                    type="button"
                  >
                    {disabledReason || (needsHero ? "Usar no alvo" : "Usar")}
                  </button>
                </div>
              );
            })}
          </div>
        </article>
      ) : null}

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
