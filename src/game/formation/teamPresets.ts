import { GAME_CONFIG, type TeamPresetType } from "../config";
import { isHeroOnExpedition } from "../expeditions";
import { getHeroPowerWithEquipment } from "../equipment";
import type { GameState, Hero, TeamPreset } from "../types";

export type TeamPresetActionResult = { ok: true; message: string } | { ok: false; message: string };

function findHero(state: Pick<GameState, "heroes">, heroId: string | null | undefined): Hero | null {
  if (!heroId) return null;
  return state.heroes.find((hero) => hero.id === heroId) ?? null;
}

function getPresetRules(type: TeamPresetType): { size: number; count: number } | null {
  if (type === "tower") {
    return { size: GAME_CONFIG.maxFormationSize, count: GAME_CONFIG.maxTowerTeamPresets };
  }
  if (type === "expedition") {
    return { size: GAME_CONFIG.maxExpeditionHeroes, count: GAME_CONFIG.maxExpeditionTeamPresets };
  }
  return null;
}

export function getTeamPresets(state: Pick<GameState, "teamPresets">, type: TeamPresetType): TeamPreset[] {
  const rules = getPresetRules(type);
  if (!rules) return [];
  return Array.isArray(state.teamPresets[type]) ? state.teamPresets[type].slice(0, rules.count) : [];
}

export function getTeamPreset(state: Pick<GameState, "teamPresets">, type: TeamPresetType, presetIndex: number): TeamPreset | null {
  const index = Number(presetIndex);
  const presets = getTeamPresets(state, type);
  return Number.isInteger(index) && index >= 0 && index < presets.length ? presets[index] : null;
}

export function getTeamPresetHeroIds(state: Pick<GameState, "teamPresets" | "heroes">, type: TeamPresetType, presetIndex: number): string[] {
  const preset = getTeamPreset(state, type, presetIndex);
  if (!preset || !Array.isArray(preset.heroIds)) return [];
  return preset.heroIds.filter((heroId): heroId is string => Boolean(heroId) && Boolean(findHero(state, heroId)));
}

export function getTeamPresetHeroes(state: Pick<GameState, "teamPresets" | "heroes">, type: TeamPresetType, presetIndex: number) {
  const preset = getTeamPreset(state, type, presetIndex);
  if (!preset || !Array.isArray(preset.heroIds)) return [];
  return preset.heroIds.map((heroId) => (heroId ? findHero(state, heroId) : null));
}

export function getTeamPresetPower(state: GameState, type: TeamPresetType, presetIndex: number): number {
  return getTeamPresetHeroIds(state, type, presetIndex).reduce((total, heroId) => {
    const hero = findHero(state, heroId);
    return total + (hero ? getHeroPowerWithEquipment(state, hero) : 0);
  }, 0);
}

export function getTeamPresetBusyHeroes(state: GameState, type: TeamPresetType, presetIndex: number) {
  return getTeamPresetHeroIds(state, type, presetIndex)
    .map((heroId) => findHero(state, heroId))
    .filter((hero): hero is NonNullable<typeof hero> => Boolean(hero && isHeroOnExpedition(state, hero.id)));
}

export function setTeamPresetHero(
  state: GameState,
  type: TeamPresetType,
  presetIndex: number,
  slotIndex: number,
  heroId: string | null,
): TeamPresetActionResult {
  const preset = getTeamPreset(state, type, presetIndex);
  const rules = getPresetRules(type);
  const slot = Number(slotIndex);

  if (!preset || !rules || !Number.isInteger(slot) || slot < 0 || slot >= rules.size) {
    return { ok: false, message: "Time salvo invalido." };
  }

  if (!heroId) {
    preset.heroIds[slot] = null;
    return { ok: true, message: `${preset.name}: slot limpo.` };
  }

  const hero = findHero(state, heroId);
  if (!hero) return { ok: false, message: "Heroi nao encontrado." };

  const duplicateSlot = preset.heroIds.findIndex((savedHeroId, index) => savedHeroId === heroId && index !== slot);
  if (duplicateSlot !== -1) return { ok: false, message: `${hero.name} ja esta nesse time salvo.` };

  preset.heroIds[slot] = heroId;
  return { ok: true, message: `${hero.name} definido em ${preset.name}.` };
}

export function clearTeamPreset(state: GameState, type: TeamPresetType, presetIndex: number): TeamPresetActionResult {
  const preset = getTeamPreset(state, type, presetIndex);
  const rules = getPresetRules(type);
  if (!preset || !rules) return { ok: false, message: "Time salvo invalido." };

  preset.heroIds = Array<string | null>(rules.size).fill(null);
  return { ok: true, message: `${preset.name} limpo.` };
}

export function saveTowerPresetFromFormation(state: GameState, presetIndex: number): TeamPresetActionResult {
  const preset = getTeamPreset(state, "tower", presetIndex);
  if (!preset) return { ok: false, message: "Time de torre invalido." };

  const heroIds = state.formation.slice(0, GAME_CONFIG.maxFormationSize);
  if (!heroIds.some(Boolean)) return { ok: false, message: "Monte a formacao antes de salvar um time de torre." };

  preset.heroIds = heroIds.concat(Array<string | null>(GAME_CONFIG.maxFormationSize).fill(null)).slice(0, GAME_CONFIG.maxFormationSize);
  return { ok: true, message: `${preset.name} salvo com a formacao atual.` };
}

export function applyTowerPresetToFormation(state: GameState, presetIndex: number): TeamPresetActionResult {
  const preset = getTeamPreset(state, "tower", presetIndex);
  if (!preset) return { ok: false, message: "Time de torre invalido." };

  const heroIds = getTeamPresetHeroIds(state, "tower", presetIndex);
  if (heroIds.length === 0) return { ok: false, message: `${preset.name} ainda nao tem herois.` };

  state.formation = preset.heroIds.concat(Array<string | null>(GAME_CONFIG.maxFormationSize).fill(null)).slice(0, GAME_CONFIG.maxFormationSize);

  const busyHeroes = getTeamPresetBusyHeroes(state, "tower", presetIndex);
  if (busyHeroes.length > 0) {
    return {
      ok: true,
      message: `${preset.name} aplicado, mas ${busyHeroes[0].name} esta em expedicao e nao pode lutar agora.`,
    };
  }

  return { ok: true, message: `${preset.name} aplicado a formacao.` };
}

export function saveExpeditionPresetFromFormation(state: GameState, presetIndex: number): TeamPresetActionResult {
  const preset = getTeamPreset(state, "expedition", presetIndex);
  if (!preset) return { ok: false, message: "Time de expedicao invalido." };

  const heroIds = state.formation.filter(Boolean).slice(0, GAME_CONFIG.maxExpeditionHeroes) as string[];
  if (heroIds.length === 0) return { ok: false, message: "Monte a formacao antes de capturar herois para expedicao." };

  preset.heroIds = [...heroIds, ...Array<string | null>(GAME_CONFIG.maxExpeditionHeroes).fill(null)].slice(
    0,
    GAME_CONFIG.maxExpeditionHeroes,
  );
  return { ok: true, message: `${preset.name} salvo com ${heroIds.length} heroi(s) da formacao.` };
}

export function applyExpeditionPresetToExpeditionSelection(
  state: GameState,
  presetIndex: number,
): { ok: true; heroIds: string[]; message: string } | { ok: false; message: string } {
  const preset = getTeamPreset(state, "expedition", presetIndex);
  if (!preset) return { ok: false, message: "Time de expedicao invalido." };

  const heroIds = getTeamPresetHeroIds(state, "expedition", presetIndex);
  if (heroIds.length === 0) return { ok: false, message: `${preset.name} ainda nao tem herois.` };

  const busyHero = heroIds.find((heroId) => isHeroOnExpedition(state, heroId));
  if (busyHero) {
    const hero = findHero(state, busyHero);
    return { ok: false, message: `${hero?.name || "Um heroi"} deste preset esta em expedicao.` };
  }

  return { ok: true, heroIds, message: `${preset.name} pronto para envio (${heroIds.length} heroi(s)).` };
}
