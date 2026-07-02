import { GAME_CONFIG } from "../config";

export type TowerMilestoneType = "normal" | "block-test" | "chapter-boss";

export type TowerMilestoneInfo = {
  floor: number;
  type: TowerMilestoneType;
  title: string;
  description: string;
  warning: string;
  preparationHint: string;
  enemyPowerMultiplier: number;
  rewardMultiplier: number;
};

const BLOCK_TEST_FLOORS = [5, 15, 25, 35] as const;
const CHAPTER_BOSS_FLOORS = [10, 20, 30, 40] as const;

const MILESTONE_DEFINITIONS: Record<number, Omit<TowerMilestoneInfo, "floor">> = {
  5: {
    type: "block-test",
    title: "Prova do Primeiro Eco",
    description: "O primeiro ciclo termina com uma patrulha reforcada da Torre.",
    warning: "Salto de dificuldade: este andar testa se o Lobby esta preparado.",
    preparationHint: "Revise formacao, vida, moral e equipamentos antes de avancar.",
    enemyPowerMultiplier: 1.1,
    rewardMultiplier: 1.08,
  },
  10: {
    type: "chapter-boss",
    title: "Nucleo do Golem",
    description: "O Golem Antigo protege a passagem para a proxima regiao.",
    warning: "Chefe de capitulo: a ameaca e muito maior que nos andares anteriores.",
    preparationHint: "Entre com a linha de frente recuperada e dano suficiente para uma luta longa.",
    enemyPowerMultiplier: 1.18,
    rewardMultiplier: 1.15,
  },
  15: {
    type: "block-test",
    title: "Ruptura do Segundo Ciclo",
    description: "A Forja Fraturada concentra as feras mais resistentes da regiao.",
    warning: "Salto de dificuldade: o segundo ciclo exige uma composicao mais consistente.",
    preparationHint: "Confira cura, defesa da frente e afinidade dos herois escalados.",
    enemyPowerMultiplier: 1.1,
    rewardMultiplier: 1.08,
  },
  20: {
    type: "chapter-boss",
    title: "Trono do Oraculo",
    description: "O Oraculo Estilhacado encerra a rota da Floresta Bestial.",
    warning: "Chefe de capitulo: marcas e suporte inimigo ampliam o risco deste andar.",
    preparationHint: "Leve dano focado e recursos para sustentar herois marcados.",
    enemyPowerMultiplier: 1.18,
    rewardMultiplier: 1.15,
  },
  25: {
    type: "block-test",
    title: "Julgamento das Sombras",
    description: "As elites da Cripta medem a resistencia da equipe antes do Eclipse.",
    warning: "Salto de dificuldade: as sombras punem equipes desgastadas ou lentas.",
    preparationHint: "Trate ferimentos e revise velocidade, protecao e energia inicial.",
    enemyPowerMultiplier: 1.1,
    rewardMultiplier: 1.08,
  },
  30: {
    type: "chapter-boss",
    title: "Coroa do Eclipse",
    description: "O Avatar do Eclipse domina o fim da Cripta Espectral.",
    warning: "Chefe de capitulo: dreno de energia e dano em area elevam a ameaca.",
    preparationHint: "Prepare sustentacao, controle de energia e herois sem ferimentos graves.",
    enemyPowerMultiplier: 1.18,
    rewardMultiplier: 1.15,
  },
  35: {
    type: "block-test",
    title: "Portao do Abismo",
    description: "Cavaleiros acorrentados guardam o acesso ao nucleo infernal.",
    warning: "Salto de dificuldade: o Abismo exige uma equipe madura e bem equipada.",
    preparationHint: "Compare poder, equipamentos e moral antes de atravessar o portao.",
    enemyPowerMultiplier: 1.1,
    rewardMultiplier: 1.08,
  },
  40: {
    type: "chapter-boss",
    title: "Garganta da Serpente",
    description: "A Serpente Abissal e a prova final da Torre na Alpha atual.",
    warning: "Chefe final: a maior ameaca da campanha espera neste andar.",
    preparationHint: "Use sua melhor formacao, recupere a equipe e confirme todos os equipamentos.",
    enemyPowerMultiplier: 1.18,
    rewardMultiplier: 1.15,
  },
};

export function isTowerBlockTestFloor(floorNumber: number): boolean {
  return BLOCK_TEST_FLOORS.includes(floorNumber as (typeof BLOCK_TEST_FLOORS)[number]);
}

export function isTowerChapterBossFloor(floorNumber: number): boolean {
  return CHAPTER_BOSS_FLOORS.includes(floorNumber as (typeof CHAPTER_BOSS_FLOORS)[number]);
}

export function isTowerMilestoneFloor(floorNumber: number): boolean {
  return isTowerBlockTestFloor(floorNumber) || isTowerChapterBossFloor(floorNumber);
}

export function getTowerBlockIndex(floorNumber: number): number | null {
  if (!Number.isInteger(floorNumber) || floorNumber < 1 || floorNumber > GAME_CONFIG.towerMaxFloor) return null;
  return Math.ceil(floorNumber / 5);
}

export function getTowerMilestoneInfo(floorNumber: number): TowerMilestoneInfo {
  const milestone = MILESTONE_DEFINITIONS[floorNumber];
  if (milestone) return { floor: floorNumber, ...milestone };

  return {
    floor: floorNumber,
    type: "normal",
    title: "Andar regular",
    description: "A ameaca segue a progressao normal desta regiao.",
    warning: "Sem salto adicional de dificuldade neste andar.",
    preparationHint: "Mantenha a equipe em condicoes para o proximo marco.",
    enemyPowerMultiplier: 1,
    rewardMultiplier: 1,
  };
}

export function getTowerDifficultyJumpLabel(floorNumber: number): string {
  const milestone = getTowerMilestoneInfo(floorNumber);
  if (milestone.type === "block-test") return "Teste de bloco: ameaca +10%";
  if (milestone.type === "chapter-boss") return "Chefe de capitulo: ameaca +18%";
  return "Progressao regular";
}
