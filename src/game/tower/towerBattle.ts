import { applyAffinityBattleStartBonuses, recordBattleAffinity } from "../affinity";
import { addBattleEvent, createBattleResult, createPlayerTeam, runAutoBattle } from "../battle";
import { GAME_CONFIG } from "../config";
import {
  applyDifficultyToBattleModifiers,
  getTowerDifficultyMode,
  normalizeTowerDifficultyMode,
  recordTowerDifficultyVictory,
  resolveHardcoreDeaths,
} from "../difficulty";
import { getHeroExpedition, isHeroOnExpedition } from "../expeditions";
import { findHero, getFormationHeroes } from "../formation";
import { applyBattleMoraleChanges, resolveBattleInjuries } from "../hero-status";
import { getLibraryEnemyView, recordEnemyBattleResult, recordEnemyEncounter } from "../library";
import {
  ACHIEVEMENT_DEFINITIONS,
  DAILY_MISSION_DEFINITIONS,
  getAchievementProgress,
  getDailyMissionProgress,
  isAchievementComplete,
  isDailyMissionComplete,
  recordMissionProgress,
} from "../missions";
import { grantTowerVictoryRewards } from "../rewards";
import { canSpendResource, spendResource } from "../state/resources";
import {
  activatePlannedTowerPostEvent,
  applyAndConsumeTowerBattleEffects,
  clearPlannedTowerPostEvent,
  planTowerEventForAttempt,
} from "../tower-events";
import { getActiveWeeklyEventSummary } from "../weekly-events";
import {
  canRepeatTowerFloor,
  getFloorModifierSummary,
  getFloorModifierValues,
  getTowerChapterByFloor,
  type TowerModifierValues,
} from "./chapters";
import { createEnemiesForFloor, getFloorData, isBossFloor, type TowerFloor } from "./floors";
import type { AutoBattleResult, BattleResult, BattleUnit, GameState, Hero } from "../types";
import type { EnemyUnit } from "./enemies";

export type RunTowerBattleOptions = {
  repeatFloor?: number;
  difficultyMode?: string;
  skipEventRoll?: boolean;
};

export type RunTowerBattleResult =
  | { ok: false; message: string }
  | { ok: true; event: true; phase: "pre" | "post"; message: string }
  | { ok: true; narrative: true; message: string }
  | { ok: true; battle: BattleResult; rawBattle: AutoBattleResult };

function toBattleUnits(enemies: EnemyUnit[]): BattleUnit[] {
  return enemies.map((enemy) => ({
    ...enemy,
    statuses: Object.fromEntries(
      Object.entries(enemy.statuses || {}).map(([key, value]) => [key, Number(value) || 0]),
    ),
  }));
}

function appendAutoBattleEvent(battle: AutoBattleResult, type: string, message: string): void {
  addBattleEvent(
    {
      playerTeam: battle.playerTeam,
      enemyTeam: battle.enemyTeam,
      log: battle.log,
      events: battle.events,
      round: battle.round ?? battle.rounds ?? 0,
      modifiers: {},
      performance: battle.performance,
    },
    type,
    message,
  );
}

export function validateTowerBattleStart(
  state: GameState,
  floorData: TowerFloor | null,
  formationHeroes: Hero[],
): { ok: boolean; message?: string } {
  if (!floorData) return { ok: false, message: "A torre atual ja foi concluida." };
  if (formationHeroes.length === 0) return { ok: false, message: "Monte uma formacao antes de iniciar combate." };

  const busyHero = formationHeroes.find((hero) => isHeroOnExpedition(state, hero.id));
  if (busyHero) {
    const expedition = getHeroExpedition(state, busyHero.id);
    return { ok: false, message: `${busyHero.name} esta em expedicao${expedition ? `: ${expedition.name}` : ""}.` };
  }

  if (!canSpendResource(state, "energy", GAME_CONFIG.towerEnergyCost)) {
    return { ok: false, message: "Energia insuficiente para tentar a torre." };
  }

  if (state.pendingTowerEvent) {
    return { ok: false, message: "Resolva o evento pendente da torre antes de continuar." };
  }

  return { ok: true };
}

function buildTowerBattleIntro(
  floorNumber: number,
  floorData: TowerFloor,
  playerTeam: BattleUnit[],
  enemyTeam: BattleUnit[],
  isRepeat: boolean,
  difficultyMode: string,
): string[] {
  const difficulty = getTowerDifficultyMode(difficultyMode);
  const intro = [
    `${isRepeat ? "Repeticao do andar" : "Andar"} ${floorNumber}: ${floorData.title}.`,
    `Equipe entrou com ${playerTeam.length} heroi(s). Inimigos: ${enemyTeam.map((enemy) => enemy.name).join(", ")}.`,
  ];
  const modifierSummary = getFloorModifierSummary(floorData);
  if (modifierSummary) intro.push(`Modificadores: ${modifierSummary}.`);
  if (difficulty.id !== "normal") {
    intro.push(
      `Modo ${difficulty.name}: inimigos ${Math.round(difficulty.enemyPowerMultiplier * 100)}%, recompensas ${Math.round(difficulty.rewardMultiplier * 100)}%.`,
    );
  }
  intro.push(`Evento semanal ativo: ${getActiveWeeklyEventSummary()}.`);
  return intro;
}

function applyPreBattleFloorModifiers(playerTeam: BattleUnit[], floorModifiers: TowerModifierValues): void {
  if (floorModifiers.playerInitialEnergyPenalty <= 0) return;
  playerTeam.forEach((unit) => {
    unit.energy = Math.max(0, unit.energy - floorModifiers.playerInitialEnergyPenalty);
  });
}

function persistPlayerHpAfterBattle(state: GameState, playerTeam: BattleUnit[]): void {
  playerTeam.forEach((unit) => {
    const hero = unit.sourceId ? findHero(state, unit.sourceId) : null;
    if (!hero) return;
    hero.currentHp = Math.max(1, Math.min(unit.maxHp, Math.round(unit.hp)));
  });
}

function enrichBattleResult(
  state: GameState,
  battleResult: BattleResult,
  context: {
    floorNumber: number;
    floorData: TowerFloor;
    enemyTeam: BattleUnit[];
    difficultyMode: string;
    rawBattle: AutoBattleResult;
  },
): BattleResult {
  const chapter = getTowerChapterByFloor(context.floorNumber);
  const difficulty = getTowerDifficultyMode(context.difficultyMode);
  const modifierSummary = getFloorModifierSummary(context.floorData);

  battleResult.summary = {
    chapterId: chapter.id,
    chapterName: chapter.name,
    chapterNumber: chapter.number,
    difficultyId: difficulty.id,
    difficultyName: difficulty.name,
    enemyNames: context.enemyTeam.map((enemy) => enemy.name),
    modifiers: modifierSummary ? modifierSummary.split(" | ") : [],
    weeklyEvent: getActiveWeeklyEventSummary(),
    isBoss: isBossFloor(context.floorNumber),
  };

  battleResult.rewards = context.rawBattle.rewards || battleResult.rewards;
  battleResult.progression = {
    heroXp: context.rawBattle.progression?.heroXp || [],
    levelUps: context.rawBattle.progression?.levelUps || [],
    specializationsAvailable: context.rawBattle.progression?.specializationsAvailable || [],
    missionUpdates: DAILY_MISSION_DEFINITIONS.map((mission) => ({
      id: mission.id,
      title: mission.title,
      progress: getDailyMissionProgress(state, mission),
      target: mission.target,
      complete: isDailyMissionComplete(state, mission),
    })).filter((mission) => mission.progress > 0),
    achievementsAvailable: ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      progress: getAchievementProgress(state, achievement),
      target: achievement.target,
      complete: isAchievementComplete(state, achievement),
      claimed: Boolean(state.achievements[achievement.id]?.claimed),
    })).filter((achievement) => achievement.complete && !achievement.claimed),
    libraryUpdates: context.enemyTeam
      .filter((enemy, index, list) => enemy.enemyKey && list.findIndex((item) => item.enemyKey === enemy.enemyKey) === index)
      .map((enemy) => {
        const view = getLibraryEnemyView(state, enemy.enemyKey!);
        return {
          enemyKey: enemy.enemyKey,
          name: view.name,
          defeated: view.defeated,
          detailsUnlocked: view.detailsUnlocked,
        };
      }),
  };

  return battleResult;
}

export function runTowerBattle(state: GameState, options: RunTowerBattleOptions = {}): RunTowerBattleResult {
  const repeatFloor = options.repeatFloor;
  const isRepeat = Number.isInteger(repeatFloor);
  const floorNumber = isRepeat ? Number(repeatFloor) : state.towerFloor;
  const floorData = getFloorData(floorNumber);
  const formationHeroes = getFormationHeroes(state).filter((hero): hero is Hero => Boolean(hero));
  const difficultyMode = normalizeTowerDifficultyMode(options.difficultyMode ?? state.pendingTowerDifficultyMode ?? "normal");

  if (isRepeat && !canRepeatTowerFloor(state, floorNumber)) {
    return { ok: false, message: "Esse andar ainda nao foi vencido e nao pode ser repetido." };
  }

  const validation = validateTowerBattleStart(state, floorData, formationHeroes);
  if (!validation.ok) return { ok: false, message: validation.message || "Combate indisponivel." };

  if (!isRepeat && !options.skipEventRoll) {
    state.pendingTowerDifficultyMode = difficultyMode;
    const plannedEvent = planTowerEventForAttempt(state, {
      floorNumber,
      floorData: floorData!,
      isBoss: isBossFloor(floorNumber),
      difficultyMode,
    });

    if (plannedEvent?.phase === "pre") {
      return {
        ok: true,
        event: true,
        phase: "pre",
        message: plannedEvent.message || "Um evento apareceu antes do combate.",
      };
    }
  }

  spendResource(state, "energy", GAME_CONFIG.towerEnergyCost);
  state.lastEnergyAt = Date.now();
  state.pendingTowerDifficultyMode = null;

  const floorModifiers = applyDifficultyToBattleModifiers(getFloorModifierValues(floorData), difficultyMode);
  const injuryAndDeathModifiers = floorModifiers as TowerModifierValues & {
    injuryChanceMultiplier?: number;
    permanentDeathChance?: number;
  };
  const playerTeam = createPlayerTeam(formationHeroes, state);
  const rawEnemies = createEnemiesForFloor(floorNumber, { difficultyMode });
  const enemyTeam = toBattleUnits(rawEnemies);
  const introLines = buildTowerBattleIntro(floorNumber, floorData!, playerTeam, enemyTeam, isRepeat, difficultyMode);

  recordEnemyEncounter(state, rawEnemies, floorNumber);
  applyPreBattleFloorModifiers(playerTeam, floorModifiers);
  introLines.push(...applyAffinityBattleStartBonuses(state, playerTeam));
  introLines.push(...applyAndConsumeTowerBattleEffects(state, playerTeam, floorModifiers));

  const battle = runAutoBattle(playerTeam, enemyTeam, introLines, floorModifiers);

  if (battle.result === "victory") {
    appendAutoBattleEvent(battle, "victory", `Equipe ${isRepeat ? "repetiu e venceu" : "venceu"} o andar ${floorNumber}.`);
    recordMissionProgress(state, "towerVictories", 1);
    recordTowerDifficultyVictory(state, difficultyMode);

    if (isBossFloor(floorNumber) && playerTeam.every((unit) => unit.hp > 0)) {
      recordMissionProgress(state, "bossNoCasualtyWins", 1);
      appendAutoBattleEvent(battle, "reward", "Conquista possivel: chefe vencido sem herois caidos.");
    }

    grantTowerVictoryRewards(
      state,
      floorNumber,
      playerTeam.map((unit) => unit.sourceId).filter((heroId): heroId is string => Boolean(heroId)),
      battle.log,
      battle,
      { advanceFloor: !isRepeat, difficultyMode },
      (type, message) => appendAutoBattleEvent(battle, type, message),
    );

    if (!isRepeat && activatePlannedTowerPostEvent(state, floorNumber)) {
      appendAutoBattleEvent(battle, "info", "Um evento surgiu depois do combate. Volte para a Torre para decidir.");
    }
  } else {
    appendAutoBattleEvent(
      battle,
      "defeat",
      `Equipe foi derrotada ${isRepeat ? "ao repetir" : "no"} andar ${floorNumber}. O andar permanece disponivel.`,
    );
    clearPlannedTowerPostEvent(state);
  }

  resolveHardcoreDeaths(state, playerTeam, { floor: floorNumber, ...battle }, injuryAndDeathModifiers, (message) =>
    appendAutoBattleEvent(battle, "death", message),
  );
  resolveBattleInjuries(
    state,
    playerTeam,
    battle.result,
    (message) => appendAutoBattleEvent(battle, "injury", message),
    injuryAndDeathModifiers,
  );
  applyBattleMoraleChanges(state, playerTeam, battle.result, (message) => appendAutoBattleEvent(battle, "morale", message));
  recordBattleAffinity(state, playerTeam, battle.result, isBossFloor(floorNumber));
  recordEnemyBattleResult(state, rawEnemies, battle.result, floorNumber);
  persistPlayerHpAfterBattle(state, playerTeam);

  const battleResult = createBattleResult(
    battle.result,
    floorNumber,
    battle.rounds,
    playerTeam,
    enemyTeam,
    battle.log,
    battle.events,
    battle.performance,
  );

  enrichBattleResult(state, battleResult, {
    floorNumber,
    floorData: floorData!,
    enemyTeam,
    difficultyMode,
    rawBattle: battle,
  });

  state.lastBattle = battleResult;

  if (!isRepeat && state.pendingTowerEvent?.phase === "post") {
    return {
      ok: true,
      event: true,
      phase: "post",
      message: "Um evento apareceu depois do combate. Escolha como resolver.",
    };
  }

  return { ok: true, battle: battleResult, rawBattle: battle };
}
