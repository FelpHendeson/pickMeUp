"use client";

import {
  CONSUMABLE_DEFINITIONS,
  getEquipmentBonusLabel,
  getEquipmentTypeName,
  getHeroActiveInjuries,
  getHeroMoraleState,
  type ConsumableDefinition,
  type EquipmentItem,
  type EquipmentSlot,
  type Hero,
  type StatKey,
} from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";
import { useMemo, useState } from "react";

type InventoryTab = "equipment" | "consumables";
type EquipmentSlotFilter = EquipmentSlot | "all";
type RarityFilter = "all" | "1" | "2" | "3" | "4" | "5";
type OwnershipFilter = "all" | "free" | "equipped";
type ComparisonTone = "upgrade" | "downgrade" | "mixed" | "equal" | "empty";

const EQUIPMENT_ORDER: EquipmentSlot[] = ["weapon", "armor", "accessory"];
const rarityOptions: RarityFilter[] = ["all", "1", "2", "3", "4", "5"];
const statLabels: Record<StatKey, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spd: "SPD",
  focus: "FOCUS",
  luck: "SORTE",
};

function getEquippedItemForSlot(hero: Hero | null, inventory: EquipmentItem[], slot: EquipmentSlot): EquipmentItem | null {
  const equippedId = hero?.equipment?.[slot];
  return equippedId ? inventory.find((item) => item.id === equippedId) ?? null : null;
}

function getEquipmentOwner(heroes: Hero[], itemId: string): Hero | null {
  return heroes.find((hero) => Object.values(hero.equipment || {}).includes(itemId)) ?? null;
}

function getRarityLabel(rarity: number): string {
  if (rarity >= 5) return "Lendário";
  if (rarity === 4) return "Épico";
  if (rarity === 3) return "Raro";
  if (rarity === 2) return "Incomum";
  return "Comum";
}

function getRarityStars(rarity: number): string {
  return "★".repeat(rarity) + "☆".repeat(Math.max(0, 5 - rarity));
}

function getStatLabel(stat: StatKey | string): string {
  return statLabels[stat as StatKey] ?? stat.toUpperCase();
}

function getComparison(item: EquipmentItem, equipped: EquipmentItem | null): {
  tone: ComparisonTone;
  label: string;
  rows: Array<{ stat: string; value: number; tone: ComparisonTone; label: string }>;
} {
  if (!equipped) {
    return {
      tone: "empty",
      label: "Melhoria direta: slot vazio no herói alvo.",
      rows: [{ stat: getStatLabel(item.bonusStat), value: item.bonusValue, tone: "upgrade", label: "ganho novo" }],
    };
  }

  if (equipped.id === item.id) {
    return {
      tone: "equal",
      label: "Este item já está equipado no herói alvo.",
      rows: [{ stat: getStatLabel(item.bonusStat), value: 0, tone: "equal", label: "sem alteração" }],
    };
  }

  if (item.bonusStat === equipped.bonusStat) {
    const delta = item.bonusValue - equipped.bonusValue;
    const tone: ComparisonTone = delta > 0 ? "upgrade" : delta < 0 ? "downgrade" : "equal";
    return {
      tone,
      label: delta > 0 ? `+${delta} sobre o item atual.` : delta < 0 ? `${delta} abaixo do item atual.` : "Mesmo bônus do item atual.",
      rows: [{ stat: getStatLabel(item.bonusStat), value: delta, tone, label: "diferença" }],
    };
  }

  return {
    tone: "mixed",
    label: `Troca ${getEquipmentBonusLabel(equipped)} por ${getEquipmentBonusLabel(item)}.`,
    rows: [
      { stat: getStatLabel(item.bonusStat), value: item.bonusValue, tone: "upgrade", label: "ganha" },
      { stat: getStatLabel(equipped.bonusStat), value: -equipped.bonusValue, tone: "downgrade", label: "perde" },
    ],
  };
}

function isCompatibleItem(item: EquipmentItem, slotFilter: EquipmentSlotFilter, rarityFilter: RarityFilter, ownershipFilter: OwnershipFilter, owner: Hero | null): boolean {
  if (slotFilter !== "all" && item.type !== slotFilter) return false;
  if (rarityFilter !== "all" && item.rarity !== Number(rarityFilter)) return false;
  if (ownershipFilter === "free" && owner) return false;
  if (ownershipFilter === "equipped" && !owner) return false;
  return true;
}

function EmptyInventoryState({ title, description }: { title: string; description: string }) {
  return (
    <article className="inventory-empty-state">
      <span>Baú vazio</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function EquipmentCard({
  equipped,
  item,
  onEquip,
  onSelect,
  owner,
  selected,
  targetHero,
}: {
  equipped: EquipmentItem | null;
  item: EquipmentItem;
  onEquip: () => void;
  onSelect: () => void;
  owner: Hero | null;
  selected: boolean;
  targetHero: Hero | null;
}) {
  const comparison = getComparison(item, equipped);
  const equippedOnTarget = targetHero?.equipment?.[item.type] === item.id;

  return (
    <article className={`inventory-item-card rarity-${item.rarity}${owner ? " equipped" : ""}${selected ? " selected" : ""}`}>
      <button className="inventory-item-main" onClick={onSelect} type="button">
        <div className="inventory-item-sigil" aria-hidden="true">
          {getEquipmentTypeName(item.type).slice(0, 1)}
        </div>
        <div className="inventory-item-copy">
          <span>{getEquipmentTypeName(item.type)} · {getRarityLabel(item.rarity)}</span>
          <h3>{item.name}</h3>
          <small>{getRarityStars(item.rarity)}</small>
        </div>
      </button>

      <div className="inventory-item-stats">
        <span>
          <strong>{getStatLabel(item.bonusStat)}</strong>
          +{item.bonusValue}
        </span>
        <span>
          <strong>Andar</strong>
          {item.floorNumber ?? "-"}
        </span>
      </div>

      <div className="inventory-item-tags">
        <span className={owner ? "tone-equipped" : "tone-free"}>{owner ? `Com ${owner.name}` : "Livre"}</span>
        <span className={`tone-${comparison.tone}`}>{comparison.label}</span>
      </div>

      <div className="inventory-item-actions">
        <button className="hero-inline-action" onClick={onSelect} type="button">
          Detalhes
        </button>
        <button className="hero-inline-action primary" disabled={!targetHero || equippedOnTarget} onClick={onEquip} type="button">
          {equippedOnTarget ? "Equipado" : "Equipar"}
        </button>
      </div>
    </article>
  );
}

function EquipmentDetailPanel({
  item,
  onEquip,
  owner,
  targetEquipped,
  targetHero,
}: {
  item: EquipmentItem | null;
  onEquip: () => void;
  owner: Hero | null;
  targetEquipped: EquipmentItem | null;
  targetHero: Hero | null;
}) {
  if (!item) {
    return (
      <aside className="inventory-detail-panel empty">
        <span>Inspeção</span>
        <h3>Selecione um item</h3>
        <p>Escolha uma arma, armadura ou acessório para comparar com o herói alvo.</p>
      </aside>
    );
  }

  const comparison = getComparison(item, targetEquipped);
  const equippedOnTarget = targetHero?.equipment?.[item.type] === item.id;

  return (
    <aside className={`inventory-detail-panel rarity-${item.rarity}`}>
      <span>Detalhes do item</span>
      <h3>{item.name}</h3>
      <p>
        {getEquipmentTypeName(item.type)} · {getRarityLabel(item.rarity)} · {getEquipmentBonusLabel(item)}
      </p>
      <div className="inventory-detail-stars">{getRarityStars(item.rarity)}</div>

      <div className="inventory-compare-box">
        <strong>Comparação com {targetHero?.name ?? "nenhum herói"}</strong>
        <small>{comparison.label}</small>
        <div className="inventory-compare-rows">
          {comparison.rows.map((row) => (
            <span className={`tone-${row.tone}`} key={`${row.stat}-${row.label}`}>
              <strong>{row.stat}</strong>
              {row.value > 0 ? `+${row.value}` : row.value}
              <em>{row.label}</em>
            </span>
          ))}
        </div>
      </div>

      <div className="inventory-detail-meta">
        <span>Uso: {owner ? owner.name : "Livre no baú"}</span>
        <span>Atual no alvo: {targetEquipped ? `${targetEquipped.name} (${getEquipmentBonusLabel(targetEquipped)})` : "slot vazio"}</span>
      </div>

      <button className="hero-inline-action primary" disabled={!targetHero || equippedOnTarget} onClick={onEquip} type="button">
        {equippedOnTarget ? "Já equipado no alvo" : targetHero ? `Equipar em ${targetHero.name}` : "Selecione um herói"}
      </button>
    </aside>
  );
}

function ConsumableCard({
  definition,
  onSelect,
  onUse,
  quantity,
  selected,
  targetHero,
}: {
  definition: ConsumableDefinition;
  onSelect: () => void;
  onUse: () => void;
  quantity: number;
  selected: boolean;
  targetHero: Hero | null;
}) {
  const needsHero = definition.target === "hero";
  const disabledReason = quantity <= 0 ? "Indisponível" : needsHero && !targetHero ? "Sem herói alvo" : "";

  return (
    <article className={`inventory-consumable-card${quantity > 0 ? " available" : " unavailable"}${selected ? " selected" : ""}`}>
      <button className="inventory-item-main" onClick={onSelect} type="button">
        <div className="inventory-consumable-sigil" aria-hidden="true">
          {definition.name.slice(0, 1)}
        </div>
        <div className="inventory-item-copy">
          <span>{definition.moment}</span>
          <h3>{definition.name}</h3>
          <small>x{quantity}</small>
        </div>
      </button>
      <p>{definition.description}</p>
      <div className="inventory-item-tags">
        <span>{needsHero ? "Herói alvo" : "Efeito global"}</span>
        <span>{definition.effect}</span>
      </div>
      <div className="inventory-item-actions">
        <button className="hero-inline-action" onClick={onSelect} type="button">
          Detalhes
        </button>
        <button className="hero-inline-action primary" disabled={Boolean(disabledReason)} onClick={onUse} type="button">
          {disabledReason || (needsHero ? "Usar no alvo" : "Usar")}
        </button>
      </div>
    </article>
  );
}

function ConsumableDetailPanel({
  definition,
  onUse,
  quantity,
  targetHero,
}: {
  definition: ConsumableDefinition | null;
  onUse: () => void;
  quantity: number;
  targetHero: Hero | null;
}) {
  if (!definition) {
    return (
      <aside className="inventory-detail-panel empty">
        <span>Suprimentos</span>
        <h3>Selecione um consumível</h3>
        <p>Veja alvo, momento correto e disponibilidade antes de usar.</p>
      </aside>
    );
  }

  const needsHero = definition.target === "hero";
  const disabledReason = quantity <= 0 ? "Item indisponível" : needsHero && !targetHero ? "Selecione um herói alvo" : "";

  return (
    <aside className="inventory-detail-panel consumable-detail">
      <span>Detalhes do consumível</span>
      <h3>{definition.name}</h3>
      <p>{definition.description}</p>
      <div className="inventory-detail-meta">
        <span>Quantidade: {quantity}</span>
        <span>Momento: {definition.moment}</span>
        <span>Alvo: {needsHero ? targetHero?.name ?? "herói necessário" : "conta / próxima ação"}</span>
      </div>
      <button className="hero-inline-action primary" disabled={Boolean(disabledReason)} onClick={onUse} type="button">
        {disabledReason || (needsHero ? `Usar em ${targetHero?.name}` : "Usar agora")}
      </button>
    </aside>
  );
}

export function InventoryPanel() {
  const state = useGameStore((store) => store.state);
  const useConsumableOnHero = useGameStore((store) => store.useConsumable);
  const equipItemOnHero = useGameStore((store) => store.equipItem);
  const [activeTab, setActiveTab] = useState<InventoryTab>("equipment");
  const [selectedHeroId, setSelectedHeroId] = useState<string>("");
  const [slotFilter, setSlotFilter] = useState<EquipmentSlotFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedConsumableId, setSelectedConsumableId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const defaultHeroId = selectedHeroId || state.heroes[0]?.id || "";
  const selectedHero = state.heroes.find((hero) => hero.id === defaultHeroId) ?? null;
  const consumables = Object.values(CONSUMABLE_DEFINITIONS).map((definition) => ({
    definition,
    quantity: state.consumables[definition.id] || 0,
  }));
  const ownedConsumableTotal = consumables.reduce((sum, item) => sum + item.quantity, 0);
  const equippedItemIds = new Set(state.heroes.flatMap((hero) => Object.values(hero.equipment || {}).filter((itemId): itemId is string => Boolean(itemId))));
  const rareEquipmentCount = state.inventory.filter((item) => item.rarity >= 3).length;
  const selectedEquipment = selectedEquipmentId ? state.inventory.find((item) => item.id === selectedEquipmentId) ?? null : null;
  const selectedConsumable = selectedConsumableId ? CONSUMABLE_DEFINITIONS[selectedConsumableId] ?? null : null;
  const selectedConsumableQuantity = selectedConsumable ? state.consumables[selectedConsumable.id] || 0 : 0;
  const targetStatus = selectedHero
    ? [
        getHeroMoraleState(selectedHero).label,
        getHeroActiveInjuries(selectedHero).length > 0 ? `${getHeroActiveInjuries(selectedHero).length} ferimento(s)` : "Sem ferimentos",
      ]
    : [];

  const filteredEquipment = useMemo(
    () =>
      state.inventory
        .map((item) => ({ item, owner: getEquipmentOwner(state.heroes, item.id) }))
        .filter(({ item, owner }) => isCompatibleItem(item, slotFilter, rarityFilter, ownershipFilter, owner))
        .sort((a, b) => b.item.rarity - a.item.rarity || b.item.bonusValue - a.item.bonusValue || a.item.name.localeCompare(b.item.name)),
    [ownershipFilter, rarityFilter, slotFilter, state.heroes, state.inventory],
  );

  function equipSelectedItem(item: EquipmentItem) {
    if (!defaultHeroId) {
      setFeedback("Selecione um herói alvo antes de equipar.");
      return;
    }

    const result = equipItemOnHero(defaultHeroId, item.id);
    setSelectedEquipmentId(item.id);
    setFeedback(result.message);
  }

  function useSelectedConsumable(definition: ConsumableDefinition) {
    const needsHero = definition.target === "hero";
    const result = useConsumableOnHero(definition.id, needsHero ? defaultHeroId : null);
    setSelectedConsumableId(definition.id);
    setFeedback(result.message);
  }

  return (
    <section className="inventory-panel">
      <div className="inventory-hero-banner">
        <div>
          <span>Arsenal da guilda</span>
          <h2>Baú e forja</h2>
          <p>Compare equipamentos, confira quem usa cada peça e aplique suprimentos sem perder o contexto do herói alvo.</p>
        </div>
        <div className="inventory-ledger">
          <span>
            <strong>{state.inventory.length}</strong>
            Equipamentos
          </span>
          <span>
            <strong>{ownedConsumableTotal}</strong>
            Consumíveis
          </span>
          <span>
            <strong>{rareEquipmentCount}</strong>
            Raros+
          </span>
        </div>
      </div>

      <div className="inventory-tab-row" role="tablist" aria-label="Seções do inventário">
        <button className={activeTab === "equipment" ? "active" : ""} onClick={() => setActiveTab("equipment")} type="button">
          Equipamentos
        </button>
        <button className={activeTab === "consumables" ? "active" : ""} onClick={() => setActiveTab("consumables")} type="button">
          Consumíveis
        </button>
      </div>

      <div className="inventory-target-card">
        <div>
          <span>Herói alvo</span>
          <h3>{selectedHero ? selectedHero.name : "Nenhum herói disponível"}</h3>
          <p>
            {selectedHero
              ? `${selectedHero.className} · Lv. ${selectedHero.level} · ${targetStatus.join(" · ")}`
              : "Recrute um herói para habilitar comparação e uso direcionado."}
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
                <strong>{getEquipmentTypeName(slot)}</strong>
                {equipped ? `${equipped.name} · ${getEquipmentBonusLabel(equipped)}` : "slot vazio"}
              </span>
            );
          })}
        </div>
      </div>

      {activeTab === "equipment" ? (
        <>
          <div className="inventory-filter-bar">
            <label>
              Tipo
              <select onChange={(event) => setSlotFilter(event.target.value as EquipmentSlotFilter)} value={slotFilter}>
                <option value="all">Todos</option>
                {EQUIPMENT_ORDER.map((slot) => (
                  <option key={slot} value={slot}>
                    {getEquipmentTypeName(slot)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Raridade
              <select onChange={(event) => setRarityFilter(event.target.value as RarityFilter)} value={rarityFilter}>
                {rarityOptions.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity === "all" ? "Todas" : `${rarity} estrela(s)`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select onChange={(event) => setOwnershipFilter(event.target.value as OwnershipFilter)} value={ownershipFilter}>
                <option value="all">Todos</option>
                <option value="free">Livres</option>
                <option value="equipped">Equipados</option>
              </select>
            </label>
          </div>

          <div className="inventory-arsenal-layout">
            <div className="inventory-card-grid">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map(({ item, owner }) => (
                  <EquipmentCard
                    equipped={getEquippedItemForSlot(selectedHero, state.inventory, item.type)}
                    item={item}
                    key={item.id}
                    onEquip={() => equipSelectedItem(item)}
                    onSelect={() => setSelectedEquipmentId(item.id)}
                    owner={owner}
                    selected={selectedEquipmentId === item.id}
                    targetHero={selectedHero}
                  />
                ))
              ) : state.inventory.length > 0 ? (
                <EmptyInventoryState title="Nenhum item compatível" description="Os filtros atuais não encontraram peças. Altere tipo, raridade ou estado." />
              ) : (
                <EmptyInventoryState title="Arsenal vazio" description="Vença andares da Torre para encontrar armas, armaduras e acessórios." />
              )}
            </div>
            <EquipmentDetailPanel
              item={selectedEquipment}
              onEquip={() => {
                if (selectedEquipment) equipSelectedItem(selectedEquipment);
              }}
              owner={selectedEquipment ? getEquipmentOwner(state.heroes, selectedEquipment.id) : null}
              targetEquipped={selectedEquipment ? getEquippedItemForSlot(selectedHero, state.inventory, selectedEquipment.type) : null}
              targetHero={selectedHero}
            />
          </div>
        </>
      ) : null}

      {activeTab === "consumables" ? (
        <div className="inventory-arsenal-layout">
          <div className="inventory-card-grid consumable-grid">
            {consumables.some((item) => item.quantity > 0) ? (
              consumables.map(({ definition, quantity }) => (
                <ConsumableCard
                  definition={definition}
                  key={definition.id}
                  onSelect={() => setSelectedConsumableId(definition.id)}
                  onUse={() => useSelectedConsumable(definition)}
                  quantity={quantity}
                  selected={selectedConsumableId === definition.id}
                  targetHero={selectedHero}
                />
              ))
            ) : (
              <EmptyInventoryState title="Nenhum consumível disponível" description="Consumíveis aparecem em recompensas, missões e eventos da Torre." />
            )}
          </div>
          <ConsumableDetailPanel
            definition={selectedConsumable}
            onUse={() => {
              if (selectedConsumable) useSelectedConsumable(selectedConsumable);
            }}
            quantity={selectedConsumableQuantity}
            targetHero={selectedHero}
          />
        </div>
      ) : null}

      {feedback ? <p className="hero-action-feedback">{feedback}</p> : null}
    </section>
  );
}
