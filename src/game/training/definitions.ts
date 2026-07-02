import type { HeroClassKey } from "../types";

export type TrainingFocus =
  | "frontline"
  | "damage"
  | "defense"
  | "support"
  | "mobility"
  | "arcane"
  | "discipline"
  | "survival";

export type TrainingFocusDefinition = {
  focus: TrainingFocus;
  label: string;
  description: string;
  recommendedClassKeys: string[];
  readinessHint: string;
};

// Progresso tecnico controlado. Estes numeros mantem o treino lento e seguro,
// evitando que o Campo de Treino vire farm de atributos brutos.
export const TRAINING_CONFIG = {
  xpPerLevel: 30,
  maxLevel: 10,
  blockMs: 10 * 60 * 1000,
  maxBlocksPerCall: 6,
  xpPerBlock: 1,
  minMoraleToTrain: 40,
  criticalHpRatio: 0.45,
  readinessBonusPerLevel: 0.5,
  readinessBonusCap: 4,
} as const;

export const TRAINING_FOCUS_DEFINITIONS: readonly TrainingFocusDefinition[] = [
  {
    focus: "frontline",
    label: "Linha de Frente",
    description: "Aprimora a leitura de posicionamento e a proteção de aliados na dianteira.",
    recommendedClassKeys: ["warrior", "guardian"],
    readinessHint: "Sustenta a linha de frente e absorve pressão pela equipe na Torre.",
  },
  {
    focus: "damage",
    label: "Dano",
    description: "Refina a cadência ofensiva e a busca por aberturas no inimigo.",
    recommendedClassKeys: ["archer", "rogue", "mage"],
    readinessHint: "Aumenta a eficiência ofensiva percebida no combate da Torre.",
  },
  {
    focus: "defense",
    label: "Defesa",
    description: "Trabalha guarda, bloqueio e economia de esforço sob ataque.",
    recommendedClassKeys: ["guardian", "warrior"],
    readinessHint: "Reforça a resistência e a guarda diante de ameaças pesadas.",
  },
  {
    focus: "support",
    label: "Suporte",
    description: "Desenvolve leitura da equipe, cura oportuna e coordenação.",
    recommendedClassKeys: ["priest"],
    readinessHint: "Melhora o apoio, a cura e a sustentação da equipe.",
  },
  {
    focus: "mobility",
    label: "Mobilidade",
    description: "Aprimora reflexos, reposicionamento e velocidade de reação.",
    recommendedClassKeys: ["rogue", "archer"],
    readinessHint: "Refina reflexos e reposicionamento durante a subida.",
  },
  {
    focus: "arcane",
    label: "Arcano",
    description: "Aprofunda controle arcano, canalização e leitura de ecos.",
    recommendedClassKeys: ["mage"],
    readinessHint: "Aprofunda o controle arcano e a leitura de ecos.",
  },
  {
    focus: "discipline",
    label: "Disciplina",
    description: "Fortalece foco, constância e domínio emocional sob pressão.",
    recommendedClassKeys: [],
    readinessHint: "Fortalece foco e disciplina para decisões difíceis.",
  },
  {
    focus: "survival",
    label: "Sobrevivência",
    description: "Desenvolve recuperação, condicionamento e leitura de riscos.",
    recommendedClassKeys: [],
    readinessHint: "Desenvolve resistência e recuperação após o desgaste.",
  },
];

const TRAINING_FOCUS_SET = new Set<TrainingFocus>(
  TRAINING_FOCUS_DEFINITIONS.map((definition) => definition.focus),
);

const TRAINING_FOCUS_BY_KEY = new Map<TrainingFocus, TrainingFocusDefinition>(
  TRAINING_FOCUS_DEFINITIONS.map((definition) => [definition.focus, definition]),
);

// Foco recomendado por classe de combate. Classes com duas vocacoes recebem
// uma escolha padrao estavel; o jogador pode trocar depois.
const RECOMMENDED_FOCUS_BY_CLASS: Record<HeroClassKey, TrainingFocus> = {
  warrior: "frontline",
  guardian: "defense",
  archer: "damage",
  rogue: "mobility",
  mage: "arcane",
  priest: "support",
};

export const DEFAULT_TRAINING_FOCUS: TrainingFocus = "discipline";

export function isValidTrainingFocus(value: unknown): value is TrainingFocus {
  return typeof value === "string" && TRAINING_FOCUS_SET.has(value as TrainingFocus);
}

export function getTrainingFocusDefinitions(): TrainingFocusDefinition[] {
  return TRAINING_FOCUS_DEFINITIONS.map((definition) => ({
    ...definition,
    recommendedClassKeys: [...definition.recommendedClassKeys],
  }));
}

export function getTrainingFocusDefinition(focus: unknown): TrainingFocusDefinition | null {
  return isValidTrainingFocus(focus) ? (TRAINING_FOCUS_BY_KEY.get(focus) ?? null) : null;
}

export function getRecommendedTrainingFocusForClass(classKey: unknown): TrainingFocus {
  return (
    (typeof classKey === "string" && RECOMMENDED_FOCUS_BY_CLASS[classKey as HeroClassKey]) ||
    DEFAULT_TRAINING_FOCUS
  );
}
