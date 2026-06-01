import { recordDangerousEventAffinity } from "../affinity";
import { addConsumable, getConsumableDefinition, getRandomConsumableId } from "../consumables";
import { getDifficultyEventChanceMultiplier } from "../difficulty";
import {
  addEquipmentToInventory,
  generateEquipment,
  normalizeEquipmentItem,
} from "../equipment";
import { generateHero, type RandomSource } from "../heroes";
import { adjustFormationMorale } from "../hero-status";
import { recordTowerEventDiscovery } from "../library";
import { addResource, getResourceAmount, spendResource } from "../state/resources";
import { getChapterEventKeys } from "../tower";
import type {
  GameState,
  TowerBattleEffect,
  TowerBattleEffectModifiers,
  TowerEventChoice,
  TowerEventDefinition,
  TowerEventHistoryEntry,
  TowerEventInstance,
  TowerEventPhase,
  TowerEventTypeKey,
} from "../types";
import {
  BATTLE_MAX_UNIT_ENERGY,
  MAX_TOWER_EVENT_HISTORY_ITEMS,
  POST_TOWER_EVENT_KEYS,
  PRE_TOWER_EVENT_KEYS,
  TOWER_EVENT_CHANCE,
  TOWER_EVENT_DEFINITIONS,
  TOWER_EVENT_RESOURCE_NAMES,
} from "./definitions";

export {
  BATTLE_MAX_UNIT_ENERGY,
  MAX_TOWER_EVENT_HISTORY_ITEMS,
  POST_TOWER_EVENT_KEYS,
  PRE_TOWER_EVENT_KEYS,
  TOWER_EVENT_CHANCE,
  TOWER_EVENT_DEFINITIONS,
  TOWER_EVENT_RESOURCE_NAMES,
} from "./definitions";

type TowerEventPlanContext = {
  floorNumber: number;
  floorData: { title?: string };
  difficultyMode?: string;
  isBoss?: boolean;
};

type TowerEventChoiceResult = {
  ok: boolean;
  message: string;
  startBattle?: boolean;
};

type TowerEffectBattleUnit = {
  maxHp: number;
  hp: number;
  energy?: number;
  stats: Record<string, number>;
};

type FloorModifiers = {
  healingDoneMultiplier: number;
  playerDamageTakenMultiplier: number;
  injuryChanceMultiplier?: number;
};

function pickRandom<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function randomId(prefix: string, random: RandomSource): string {
  return `${prefix}_${Date.now().toString(36)}_${random().toString(36).slice(2, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function getTowerEventResourceName(resourceKey: string): string {
  return TOWER_EVENT_RESOURCE_NAMES[resourceKey] || resourceKey;
}

export function getFloorEventScale(floorNumber: number): number {
  return Math.max(1, Number(floorNumber) || 1);
}

export function normalizeTowerEventInstance(value: unknown): TowerEventInstance | null {
  const raw = asRecord(value);
  if (!raw.typeKey || typeof raw.typeKey !== "string") return null;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : randomId("tower_event", Math.random),
    typeKey: raw.typeKey,
    phase: raw.phase === "post" ? "post" : "pre",
    floor: Math.max(1, Math.floor(Number(raw.floor) || 1)),
    floorTitle: typeof raw.floorTitle === "string" ? raw.floorTitle : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

export function normalizeTowerBattleEffect(value: unknown): TowerBattleEffect | null {
  const raw = asRecord(value);
  if (!raw.label || typeof raw.label !== "string") return null;

  const modifiersRaw = asRecord(raw.modifiers);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : randomId("tower_effect", Math.random),
    scope: typeof raw.scope === "string" && raw.scope ? raw.scope : "nextBattle",
    label: raw.label,
    description: typeof raw.description === "string" ? raw.description : "",
    modifiers: {
      initialEnergyBonus: Number.isFinite(Number(modifiersRaw.initialEnergyBonus)) ? Number(modifiersRaw.initialEnergyBonus) : undefined,
      healingDoneMultiplier: Number.isFinite(Number(modifiersRaw.healingDoneMultiplier))
        ? Number(modifiersRaw.healingDoneMultiplier)
        : undefined,
      atkMultiplier: Number.isFinite(Number(modifiersRaw.atkMultiplier)) ? Number(modifiersRaw.atkMultiplier) : undefined,
      defMultiplier: Number.isFinite(Number(modifiersRaw.defMultiplier)) ? Number(modifiersRaw.defMultiplier) : undefined,
      spdMultiplier: Number.isFinite(Number(modifiersRaw.spdMultiplier)) ? Number(modifiersRaw.spdMultiplier) : undefined,
      focusMultiplier: Number.isFinite(Number(modifiersRaw.focusMultiplier)) ? Number(modifiersRaw.focusMultiplier) : undefined,
      luckMultiplier: Number.isFinite(Number(modifiersRaw.luckMultiplier)) ? Number(modifiersRaw.luckMultiplier) : undefined,
      maxHpMultiplier: Number.isFinite(Number(modifiersRaw.maxHpMultiplier)) ? Number(modifiersRaw.maxHpMultiplier) : undefined,
      initialDamagePct: Number.isFinite(Number(modifiersRaw.initialDamagePct)) ? Number(modifiersRaw.initialDamagePct) : undefined,
      playerDamageTakenMultiplier: Number.isFinite(Number(modifiersRaw.playerDamageTakenMultiplier))
        ? Number(modifiersRaw.playerDamageTakenMultiplier)
        : undefined,
      injuryChanceMultiplier: Number.isFinite(Number(modifiersRaw.injuryChanceMultiplier))
        ? Number(modifiersRaw.injuryChanceMultiplier)
        : undefined,
    },
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  };
}

export function normalizeTowerEventHistoryEntry(value: unknown): TowerEventHistoryEntry | null {
  const raw = asRecord(value);
  if (!raw.typeKey || typeof raw.typeKey !== "string") return null;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : randomId("tower_history", Math.random),
    typeKey: raw.typeKey,
    title: typeof raw.title === "string" ? raw.title : raw.typeKey,
    phase: raw.phase === "post" ? "post" : "pre",
    floor: Math.max(1, Math.floor(Number(raw.floor) || 1)),
    choice: typeof raw.choice === "string" ? raw.choice : "",
    message: typeof raw.message === "string" ? raw.message : "",
    resolvedAt: typeof raw.resolvedAt === "string" ? raw.resolvedAt : new Date().toISOString(),
  };
}

export function ensureTowerEventState(state: Pick<GameState, "pendingTowerEvent" | "plannedTowerPostEvent" | "towerBattleEffects" | "towerEventHistory">): void {
  state.pendingTowerEvent = state.pendingTowerEvent ?? null;
  state.plannedTowerPostEvent = state.plannedTowerPostEvent ?? null;
  state.towerBattleEffects = Array.isArray(state.towerBattleEffects) ? state.towerBattleEffects : [];
  state.towerEventHistory = Array.isArray(state.towerEventHistory) ? state.towerEventHistory : [];
}

export function normalizeTowerEventState(
  state: Pick<GameState, "pendingTowerEvent" | "plannedTowerPostEvent" | "towerBattleEffects" | "towerEventHistory">,
): void {
  ensureTowerEventState(state);
  state.pendingTowerEvent = normalizeTowerEventInstance(state.pendingTowerEvent);
  state.plannedTowerPostEvent = normalizeTowerEventInstance(state.plannedTowerPostEvent);
  state.towerBattleEffects = state.towerBattleEffects
    .map(normalizeTowerBattleEffect)
    .filter((effect): effect is TowerBattleEffect => Boolean(effect));
  state.towerEventHistory = state.towerEventHistory
    .map(normalizeTowerEventHistoryEntry)
    .filter((entry): entry is TowerEventHistoryEntry => Boolean(entry))
    .slice(0, MAX_TOWER_EVENT_HISTORY_ITEMS);
}

export function createTowerEvent(
  typeKey: TowerEventTypeKey | string,
  phase: TowerEventPhase,
  floorNumber: number,
  floorTitle = "",
  random: RandomSource = Math.random,
): TowerEventInstance {
  return {
    id: randomId("tower_event", random),
    typeKey,
    phase,
    floor: floorNumber,
    floorTitle,
    createdAt: new Date().toISOString(),
  };
}

export function getTowerEventDefinition(typeKey: string): TowerEventDefinition | null {
  return TOWER_EVENT_DEFINITIONS[typeKey as TowerEventTypeKey] ?? null;
}

export function getTowerEventChoice(definition: TowerEventDefinition | null, choiceId: string): TowerEventChoice | null {
  return definition?.choices.find((choice) => choice.id === choiceId) ?? null;
}

export function getTowerEventPhaseLabel(phase: TowerEventPhase | string): string {
  return phase === "post" ? "Depois do combate" : "Antes do combate";
}

export function canChooseTowerEventOption(
  state: GameState,
  event: TowerEventInstance | null | undefined,
  choiceId: string,
): { ok: boolean; message?: string } {
  const definition = getTowerEventDefinition(event?.typeKey ?? "");
  const choice = getTowerEventChoice(definition, choiceId);

  if (!choice) return { ok: false, message: "Escolha invalida." };
  if (!choice.cost) return { ok: true };

  const currentAmount = getResourceAmount(state, choice.cost.resource);
  if (currentAmount < choice.cost.amount) {
    return {
      ok: false,
      message: `Requer ${choice.cost.amount} ${getTowerEventResourceName(choice.cost.resource)}.`,
    };
  }

  return { ok: true };
}

function addTowerBattleEffect(
  state: Pick<GameState, "towerBattleEffects">,
  effect: Omit<TowerBattleEffect, "id" | "scope" | "createdAt"> & { scope?: string },
  random: RandomSource = Math.random,
): void {
  ensureTowerEventState(state as GameState);
  state.towerBattleEffects.push({
    id: randomId("tower_effect", random),
    scope: effect.scope ?? "nextBattle",
    createdAt: new Date().toISOString(),
    label: effect.label,
    description: effect.description,
    modifiers: effect.modifiers,
  });
}

function clearInitialDamageEffects(state: Pick<GameState, "towerBattleEffects">): number {
  ensureTowerEventState(state as GameState);
  const before = state.towerBattleEffects.length;
  state.towerBattleEffects = state.towerBattleEffects.filter(
    (effect) => !(effect.modifiers && effect.modifiers.initialDamagePct && effect.modifiers.initialDamagePct > 0),
  );
  return before - state.towerBattleEffects.length;
}

function recordTowerEventHistory(
  state: Pick<GameState, "towerEventHistory">,
  event: TowerEventInstance,
  choice: TowerEventChoice,
  message: string,
): void {
  ensureTowerEventState(state as GameState);
  const definition = getTowerEventDefinition(event.typeKey);

  state.towerEventHistory.unshift({
    id: event.id,
    typeKey: event.typeKey,
    title: definition ? definition.title : event.typeKey,
    phase: event.phase,
    floor: event.floor,
    choice: choice.label,
    message,
    resolvedAt: new Date().toISOString(),
  });

  state.towerEventHistory = state.towerEventHistory.slice(0, MAX_TOWER_EVENT_HISTORY_ITEMS);
}

function grantGold(state: GameState, amount: number): string {
  addResource(state, "gold", amount);
  return `+${amount} ouro`;
}

function grantCrystals(state: GameState, amount: number): string {
  addResource(state, "crystals", amount);
  return `+${amount} cristais`;
}

function grantFragments(state: GameState, amount: number): string {
  addResource(state, "fragments", amount);
  return `+${amount} fragmentos`;
}

function grantEchoFragments(state: GameState, amount: number): string {
  addResource(state, "echoFragments", amount);
  return `+${amount} fragmentos de eco`;
}

function grantHeroContract(state: GameState, amount: number): string {
  addResource(state, "heroContracts", amount);
  return `+${amount} contrato(s) de heroi`;
}

function grantConsumableReward(state: GameState, consumableId: string, amount: number): string {
  addConsumable(state, consumableId, amount);
  const definition = getConsumableDefinition(consumableId);
  return `+${amount} ${definition?.name ?? consumableId}`;
}

export function grantTowerEventEquipment(
  state: GameState,
  floorNumber: number,
  rarityOverride?: number,
  random: RandomSource = Math.random,
) {
  const item = generateEquipment({ floorNumber: Math.max(1, floorNumber), random });
  const withFloor = { ...item, floorNumber: Math.max(1, floorNumber), ...(rarityOverride ? { rarity: rarityOverride } : {}) };
  const normalizedItem = normalizeEquipmentItem(withFloor);
  addEquipmentToInventory(state, normalizedItem);
  return normalizedItem;
}

function grantHero(state: GameState, rarity: number, random: RandomSource = Math.random) {
  const hero = generateHero({ rarity, random });
  state.heroes.push(hero);
  return hero;
}

function appendMoraleChange(state: GameState, message: string, amount: number, reason: string): string {
  if (amount === 0) return message;
  const moraleMessage = adjustFormationMorale(state, amount, reason);
  return moraleMessage ? `${message} ${moraleMessage}` : message;
}

function resolveHealingFountain(state: GameState, event: TowerEventInstance, choiceId: string, random: RandomSource): string {
  if (choiceId === "carefulDrink") {
    const cleared = clearInitialDamageEffects(state);
    addTowerBattleEffect(state, {
      label: "Agua serena",
      description: "+10 energia inicial e curas +8% na proxima luta.",
      modifiers: { initialEnergyBonus: 10, healingDoneMultiplier: 1.08 },
    }, random);

    const message =
      cleared > 0
        ? "A fonte fechou ferimentos recentes e fortaleceu a equipe para a proxima luta."
        : "A equipe bebeu com cuidado. A proxima luta comeca com energia extra.";
    return appendMoraleChange(state, message, 2, "A fonte acalmou a equipe.");
  }

  if (random() < 0.72) {
    clearInitialDamageEffects(state);
    addTowerBattleEffect(state, {
      label: "Corrente revigorante",
      description: "ATK +12%, +18 energia inicial e curas +12% na proxima luta.",
      modifiers: { atkMultiplier: 1.12, initialEnergyBonus: 18, healingDoneMultiplier: 1.12 },
    }, random);
    return appendMoraleChange(state, "A corrente aceitou a equipe. Um vigor azul envolve os herois.", 4, "A bencao elevou o animo.");
  }

  addTowerBattleEffect(state, {
    label: "Agua envenenada",
    description: "A equipe entra com 12% de dano na proxima luta.",
    modifiers: { initialDamagePct: 0.12 },
  }, random);
  return appendMoraleChange(state, "A fonte estava corrompida. A equipe segue ferida para o proximo combate.", -4, "A corrupcao abalou a equipe.");
}

function resolveMysteryChest(state: GameState, event: TowerEventInstance, choiceId: string, random: RandomSource): string {
  const floorScale = getFloorEventScale(event.floor);
  const roll = random();

  if (choiceId === "openCarefully") {
    if (roll < 0.45) {
      return appendMoraleChange(state, `O bau continha moedas antigas: ${grantGold(state, 55 + floorScale * 11)}.`, 1, "O achado animou a equipe.");
    }

    if (roll < 0.7) {
      return appendMoraleChange(
        state,
        `Cristais cairam do lacre quebrado: ${grantCrystals(state, 8 + Math.floor(floorScale * 1.4))}.`,
        1,
        "O achado animou a equipe.",
      );
    }

    if (roll < 0.84) {
      const item = grantTowerEventEquipment(state, event.floor, undefined, random);
      return appendMoraleChange(state, `Equipamento encontrado: ${item.name}.`, 1, "O achado animou a equipe.");
    }

    if (roll < 0.9) {
      return appendMoraleChange(state, `Um eco raro vibrou no fundo do bau: ${grantEchoFragments(state, 1)}.`, 2, "O achado animou a equipe.");
    }

    if (roll < 0.94) {
      return appendMoraleChange(state, `O bau guardava um juramento selado: ${grantHeroContract(state, 1)}.`, 2, "O achado animou a equipe.");
    }

    if (roll < 0.97) {
      return appendMoraleChange(
        state,
        `Suprimentos estavam escondidos no fundo: ${grantConsumableReward(state, getRandomConsumableId(random), 1)}.`,
        1,
        "O achado animou a equipe.",
      );
    }

    addTowerBattleEffect(state, {
      label: "Dardos ocultos",
      description: "A equipe entra com 8% de dano na proxima luta.",
      modifiers: { initialDamagePct: 0.08 },
    }, random);
    return appendMoraleChange(state, "O bau disparou dardos ocultos. A equipe foi ferida.", -3, "A armadilha reduziu a confianca.");
  }

  if (roll < 0.35) {
    const item = grantTowerEventEquipment(state, event.floor + 2, undefined, random);
    return appendMoraleChange(state, `O selo se partiu e revelou equipamento melhor: ${item.name}.`, 2, "A recompensa fortaleceu a confianca.");
  }

  if (roll < 0.65) {
    const gold = 85 + floorScale * 15;
    const crystals = 10 + Math.floor(floorScale * 1.8);
    addResource(state, "gold", gold);
    addResource(state, "crystals", crystals);
    return appendMoraleChange(state, `O bau despejou riqueza instavel: +${gold} ouro e +${crystals} cristais.`, 2, "A recompensa fortaleceu a confianca.");
  }

  if (roll < 0.72) {
    return appendMoraleChange(state, `O selo revelou um nucleo de eco intacto: ${grantEchoFragments(state, 1)}.`, 2, "A recompensa fortaleceu a confianca.");
  }

  if (roll < 0.77) {
    return appendMoraleChange(state, `O selo revelou um contrato antigo: ${grantHeroContract(state, 1)}.`, 2, "A recompensa fortaleceu a confianca.");
  }

  addTowerBattleEffect(state, {
    label: "Explosao do selo",
    description: "A equipe entra com 14% de dano e DEF -8% na proxima luta.",
    modifiers: { initialDamagePct: 0.14, defMultiplier: 0.92 },
  }, random);
  return appendMoraleChange(state, "O selo explodiu. A recompensa virou uma armadilha.", -4, "A explosao abalou a equipe.");
}

function resolveLostMerchant(state: GameState, event: TowerEventInstance, choice: TowerEventChoice, random: RandomSource): string {
  if (choice.id === "buyPotion") {
    grantConsumableReward(state, "small_healing_potion", 1);
    clearInitialDamageEffects(state);
    addTowerBattleEffect(state, {
      label: "Pocao turva",
      description: "HP maximo +6% e curas +12% na proxima luta.",
      modifiers: { maxHpMultiplier: 1.06, healingDoneMultiplier: 1.12 },
    }, random);
    return appendMoraleChange(state, "A pocao tem gosto pessimo, mas estabiliza a equipe. Uma pocao pequena foi guardada.", 2, "Os suprimentos trouxeram alivio.");
  }

  if (choice.id === "buyEquipment") {
    const item = grantTowerEventEquipment(state, Math.max(1, event.floor - 1), 1, random);
    return appendMoraleChange(state, `O mercador entregou ${item.name}.`, 1, "O novo equipamento animou a equipe.");
  }

  if (choice.id === "buyTonic") {
    grantConsumableReward(state, "focus_scroll", 1);
    addTowerBattleEffect(state, {
      label: "Tonico de combate",
      description: "ATK +10% e SPD +8% na proxima luta.",
      modifiers: { atkMultiplier: 1.1, spdMultiplier: 1.08 },
    }, random);
    return appendMoraleChange(state, "O tonico aquece o sangue da equipe. A proxima luta sera mais agressiva.", 1, "A preparacao trouxe foco.");
  }

  if (random() < 0.12) {
    return `O mercador respeitou a prudencia da equipe e entregou um contato antigo: ${grantHeroContract(state, 1)}.`;
  }

  return "A equipe recusou a oferta e guardou o ouro.";
}

function resolveDarkAltar(state: GameState, event: TowerEventInstance, choiceId: string, random: RandomSource): string {
  if (choiceId === "bloodPact") {
    addTowerBattleEffect(state, {
      label: "Pacto sombrio",
      description: "ATK +20%, mas HP maximo -10% na proxima luta.",
      modifiers: { atkMultiplier: 1.2, maxHpMultiplier: 0.9 },
    }, random);
    return appendMoraleChange(state, "O altar aceitou sangue. Poder bruto acompanha a equipe.", -5, "O pacto cobrou um peso emocional.");
  }

  if (choiceId === "consumeAshes") {
    addTowerBattleEffect(state, {
      label: "Cinzas famintas",
      description: "ATK +25%, mas 8% de dano inicial e dano recebido +10%.",
      modifiers: { atkMultiplier: 1.25, initialDamagePct: 0.08, playerDamageTakenMultiplier: 1.1 },
    }, random);
    return appendMoraleChange(state, "As cinzas queimam por dentro. A equipe ganhou forca, mas ficou vulneravel.", -7, "As cinzas perturbaram a equipe.");
  }

  const fragments = 8 + Math.floor(getFloorEventScale(event.floor) * 1.5);
  const echoBonus = random() < 0.25 ? ` ${grantEchoFragments(state, 1)}.` : "";
  return appendMoraleChange(state, `O circulo foi quebrado sem pacto. ${grantFragments(state, fragments)}.${echoBonus}`, 2, "Recusar o altar firmou a vontade.");
}

function resolvePrisoner(state: GameState, event: TowerEventInstance, choiceId: string, random: RandomSource): string {
  const roll = random();

  if (choiceId === "freePrisoner") {
    if (roll < 0.55) {
      const hero = grantHero(state, random() < 0.22 ? 2 : 1, random);
      return appendMoraleChange(state, `${hero.name} se juntou a equipe.`, 3, "Salvar o prisioneiro inspirou a equipe.");
    }

    if (roll < 0.75) {
      const gold = 45 + getFloorEventScale(event.floor) * 9;
      return appendMoraleChange(state, `O prisioneiro fugiu, mas deixou uma bolsa: ${grantGold(state, gold)}.`, 1, "A equipe aceitou o pequeno ganho.");
    }

    addTowerBattleEffect(state, {
      label: "Emboscada do falso prisioneiro",
      description: "A equipe entra com 10% de dano e dano recebido +6% na proxima luta.",
      modifiers: { initialDamagePct: 0.1, playerDamageTakenMultiplier: 1.06 },
    }, random);
    return appendMoraleChange(state, "Era uma emboscada. A equipe escapou, mas sofreu ferimentos.", -5, "A traicao abalou a equipe.");
  }

  if (roll < 0.42) {
    const hero = grantHero(state, random() < 0.45 ? 2 : 1, random);
    return appendMoraleChange(state, `${hero.name} aceitou o juramento e foi recrutado.`, 2, "O juramento trouxe esperanca.");
  }

  if (roll < 0.62) {
    const crystals = 6 + Math.floor(getFloorEventScale(event.floor) * 1.2);
    return appendMoraleChange(state, `O prisioneiro comprou a liberdade com ${grantCrystals(state, crystals)}.`, 1, "A equipe aceitou o acordo.");
  }

  addTowerBattleEffect(state, {
    label: "Traicao na cela",
    description: "A equipe entra com 14% de dano na proxima luta.",
    modifiers: { initialDamagePct: 0.14 },
  }, random);
  return appendMoraleChange(state, "O juramento era falso. A cela escondia uma emboscada.", -6, "A emboscada quebrou a confianca.");
}

function resolveTrap(state: GameState, event: TowerEventInstance, choiceId: string, random: RandomSource): string {
  if (choiceId === "disarmTrap") {
    if (random() < 0.6) {
      const fragments = 6 + Math.floor(getFloorEventScale(event.floor));
      return appendMoraleChange(state, `A armadilha foi desmontada. ${grantFragments(state, fragments)}.`, 2, "A precisao da equipe elevou a moral.");
    }

    addTowerBattleEffect(state, {
      label: "Falha ao desarmar",
      description: "A equipe entra com 10% de dano na proxima luta.",
      modifiers: { initialDamagePct: 0.1 },
    }, random);
    return appendMoraleChange(state, "O mecanismo disparou durante a tentativa. A equipe sofreu dano.", -4, "A falha abalou a equipe.");
  }

  if (choiceId === "rushThrough") {
    addTowerBattleEffect(state, {
      label: "Corrida pela armadilha",
      description: "A equipe entra com 8% de dano, mas SPD +12% na proxima luta.",
      modifiers: { initialDamagePct: 0.08, spdMultiplier: 1.12 },
    }, random);
    return appendMoraleChange(state, "A equipe atravessou a zona letal correndo. Houve ferimentos, mas todos estao alertas.", -2, "A corrida deixou a equipe tensa.");
  }

  addTowerBattleEffect(state, {
    label: "Impacto bloqueado",
    description: "A equipe entra com 5% de dano e DEF +12% na proxima luta.",
    modifiers: { initialDamagePct: 0.05, defMultiplier: 1.12 },
  }, random);
  return appendMoraleChange(state, "A linha de frente conteve o impacto e reorganizou a defesa.", 1, "A defesa bem sucedida conteve o medo.");
}

function resolveEventEffect(state: GameState, event: TowerEventInstance, choice: TowerEventChoice, random: RandomSource): string {
  if (event.typeKey === "healingFountain") return resolveHealingFountain(state, event, choice.id, random);
  if (event.typeKey === "mysteryChest") return resolveMysteryChest(state, event, choice.id, random);
  if (event.typeKey === "lostMerchant") return resolveLostMerchant(state, event, choice, random);
  if (event.typeKey === "darkAltar") return resolveDarkAltar(state, event, choice.id, random);
  if (event.typeKey === "prisoner") return resolvePrisoner(state, event, choice.id, random);
  if (event.typeKey === "trap") return resolveTrap(state, event, choice.id, random);
  return "O evento se dissipou sem efeito.";
}

function spendChoiceCost(state: GameState, choice: TowerEventChoice): boolean {
  if (!choice.cost) return true;
  return spendResource(state, choice.cost.resource, choice.cost.amount);
}

export function resolveTowerEventChoice(
  state: GameState,
  choiceId: string,
  random: RandomSource = Math.random,
): TowerEventChoiceResult {
  ensureTowerEventState(state);

  const event = state.pendingTowerEvent;
  const definition = getTowerEventDefinition(event?.typeKey ?? "");
  const choice = getTowerEventChoice(definition, choiceId);

  if (!event || !definition || !choice) {
    return { ok: false, message: "Evento da torre nao encontrado." };
  }

  const availability = canChooseTowerEventOption(state, event, choiceId);
  if (!availability.ok) {
    return { ok: false, message: availability.message ?? "Escolha indisponivel." };
  }

  if (!spendChoiceCost(state, choice)) {
    return { ok: false, message: "Recursos insuficientes para essa escolha." };
  }

  const message = resolveEventEffect(state, event, choice, random);
  const shouldStartBattle = event.phase === "pre";
  const dangerousEvent = event.typeKey === "trap" || event.typeKey === "darkAltar";

  recordTowerEventHistory(state, event, choice, message);
  recordTowerEventDiscovery(state, event, choice, message);
  if (dangerousEvent) {
    recordDangerousEventAffinity(state);
  }
  state.pendingTowerEvent = null;

  return {
    ok: true,
    startBattle: shouldStartBattle,
    message,
  };
}

export function planTowerEventForAttempt(
  state: GameState,
  context: TowerEventPlanContext,
  random: RandomSource = Math.random,
): { phase: TowerEventPhase; message?: string } | null {
  ensureTowerEventState(state);

  if (state.pendingTowerEvent || state.plannedTowerPostEvent) return null;

  const difficultyMultiplier = getDifficultyEventChanceMultiplier(context.difficultyMode);
  const eventChance = Math.min(0.85, TOWER_EVENT_CHANCE * difficultyMultiplier);
  if (random() >= eventChance) return null;

  const phase: TowerEventPhase = context.isBoss || random() < 0.42 ? "post" : "pre";
  const fallbackEventKeys = phase === "post" ? POST_TOWER_EVENT_KEYS : PRE_TOWER_EVENT_KEYS;
  const eventKeys = getChapterEventKeys(context.floorNumber, phase, fallbackEventKeys);
  const event = createTowerEvent(pickRandom(eventKeys, random), phase, context.floorNumber, context.floorData.title ?? "", random);
  const definition = getTowerEventDefinition(event.typeKey);

  if (phase === "post") {
    state.plannedTowerPostEvent = event;
    return { phase };
  }

  state.pendingTowerEvent = event;
  return {
    phase,
    message: `${definition?.title ?? event.typeKey} apareceu antes do combate do andar ${context.floorNumber}.`,
  };
}

export function activatePlannedTowerPostEvent(state: GameState, floorNumber: number): boolean {
  ensureTowerEventState(state);

  const event = state.plannedTowerPostEvent;
  if (!event || event.floor !== floorNumber) {
    state.plannedTowerPostEvent = null;
    return false;
  }

  state.pendingTowerEvent = event;
  state.plannedTowerPostEvent = null;
  return true;
}

export function clearPlannedTowerPostEvent(state: Pick<GameState, "plannedTowerPostEvent" | "towerBattleEffects" | "towerEventHistory" | "pendingTowerEvent">): void {
  ensureTowerEventState(state as GameState);
  state.plannedTowerPostEvent = null;
}

function multiplyStat(unit: TowerEffectBattleUnit, statKey: string, multiplier?: number): void {
  if (!multiplier || multiplier === 1) return;
  unit.stats[statKey] = Math.max(1, Math.round((unit.stats[statKey] || 1) * multiplier));
}

function applyEffectToTeam(effect: TowerBattleEffect, playerTeam: TowerEffectBattleUnit[], floorModifiers: FloorModifiers): void {
  const modifiers = effect.modifiers || {};

  if (modifiers.healingDoneMultiplier) {
    floorModifiers.healingDoneMultiplier *= modifiers.healingDoneMultiplier;
  }

  if (modifiers.playerDamageTakenMultiplier) {
    floorModifiers.playerDamageTakenMultiplier *= modifiers.playerDamageTakenMultiplier;
  }

  if (modifiers.injuryChanceMultiplier) {
    floorModifiers.injuryChanceMultiplier = (floorModifiers.injuryChanceMultiplier || 1) * modifiers.injuryChanceMultiplier;
  }

  playerTeam.forEach((unit) => {
    if (modifiers.maxHpMultiplier) {
      unit.maxHp = Math.max(1, Math.round(unit.maxHp * modifiers.maxHpMultiplier));
      unit.stats.hp = unit.maxHp;
      unit.hp = Math.min(unit.hp, unit.maxHp);
    }

    multiplyStat(unit, "atk", modifiers.atkMultiplier);
    multiplyStat(unit, "def", modifiers.defMultiplier);
    multiplyStat(unit, "spd", modifiers.spdMultiplier);
    multiplyStat(unit, "focus", modifiers.focusMultiplier);
    multiplyStat(unit, "luck", modifiers.luckMultiplier);

    if (modifiers.initialDamagePct) {
      const damage = Math.max(1, Math.round(unit.maxHp * modifiers.initialDamagePct));
      unit.hp = Math.max(1, unit.hp - damage);
    }

    if (modifiers.initialEnergyBonus) {
      unit.energy = Math.max(0, Math.min(BATTLE_MAX_UNIT_ENERGY, (unit.energy || 0) + modifiers.initialEnergyBonus));
    }
  });
}

export function applyAndConsumeTowerBattleEffects(
  state: Pick<GameState, "towerBattleEffects">,
  playerTeam: TowerEffectBattleUnit[],
  floorModifiers: FloorModifiers,
): string[] {
  ensureTowerEventState(state as GameState);

  const effects = state.towerBattleEffects.filter((effect) => effect.scope === "nextBattle");
  if (effects.length === 0) return [];

  effects.forEach((effect) => applyEffectToTeam(effect, playerTeam, floorModifiers));
  state.towerBattleEffects = state.towerBattleEffects.filter((effect) => effect.scope !== "nextBattle");

  return effects.map((effect) => `Evento ativo: ${effect.label}. ${effect.description}`);
}

export type { TowerEventPlanContext, TowerEventChoiceResult, TowerEffectBattleUnit, FloorModifiers };
