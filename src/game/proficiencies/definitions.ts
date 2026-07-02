import type { HeroClassKey } from "../types";
import type { TrainingFocus } from "../training/definitions";

export type ProficiencyKey =
  | "swordplay"
  | "shieldwork"
  | "archery"
  | "daggerwork"
  | "arcaneControl"
  | "healingArts"
  | "fieldcraft"
  | "survival"
  | "discipline"
  | "leadership"
  | "tactics"
  | "workshop";

export type ProficiencyRank = "unknown" | "novice" | "practiced" | "competent" | "refined";

export type ProficiencyDefinition = {
  key: ProficiencyKey;
  label: string;
  description: string;
  relatedTrainingFocuses: TrainingFocus[];
  recommendedClassKeys: string[];
  discoveryHint: string;
};

export type ProficiencyRankThreshold = {
  rank: ProficiencyRank;
  minXp: number;
};

// Ranks por XP acumulado, alinhados ao ritmo lento do treino tecnico.
export const PROFICIENCY_RANK_THRESHOLDS: readonly ProficiencyRankThreshold[] = [
  { rank: "unknown", minXp: 0 },
  { rank: "novice", minXp: 1 },
  { rank: "practiced", minXp: 20 },
  { rank: "competent", minXp: 60 },
  { rank: "refined", minXp: 120 },
];

export const PROFICIENCY_CONFIG = {
  maxXp: 240,
  // Fracao do XP de treino que alimenta proficiencia (mantida lenta).
  primaryDivisor: 2,
  secondaryDivisor: 6,
  readinessBonusPerHeroCap: 3,
  readinessBonusPerRank: {
    unknown: 0,
    novice: 0.25,
    practiced: 0.5,
    competent: 1,
    refined: 1.5,
  } as Record<ProficiencyRank, number>,
} as const;

const RANK_ORDER: readonly ProficiencyRank[] = ["unknown", "novice", "practiced", "competent", "refined"];

export const PROFICIENCY_DEFINITIONS: readonly ProficiencyDefinition[] = [
  {
    key: "swordplay",
    label: "Combate com Lâmina",
    description: "Domínio de cortes, guarda ofensiva e cadência com armas de gume.",
    relatedTrainingFocuses: ["damage"],
    recommendedClassKeys: ["warrior"],
    discoveryHint: "Há indícios de familiaridade com o fio da lâmina.",
  },
  {
    key: "shieldwork",
    label: "Defesa com Escudo",
    description: "Leitura defensiva, bloqueio e proteção de aliados na linha.",
    relatedTrainingFocuses: ["frontline", "defense"],
    recommendedClassKeys: ["guardian", "warrior"],
    discoveryHint: "Postura sugere talento para sustentar a linha de frente.",
  },
  {
    key: "archery",
    label: "Arquearia",
    description: "Precisão à distância, controle de respiração e leitura de alvo.",
    relatedTrainingFocuses: ["damage"],
    recommendedClassKeys: ["archer"],
    discoveryHint: "O olhar treinado revela vocação para tiros precisos.",
  },
  {
    key: "daggerwork",
    label: "Adagas e Lâminas Curtas",
    description: "Golpes rápidos, aberturas e economia de movimento em curta distância.",
    relatedTrainingFocuses: ["damage", "mobility"],
    recommendedClassKeys: ["rogue"],
    discoveryHint: "Reflexos rápidos indicam prática com lâminas curtas.",
  },
  {
    key: "arcaneControl",
    label: "Controle Arcano",
    description: "Canalização estável de eco, contenção e leitura de oscilações.",
    relatedTrainingFocuses: ["arcane", "damage"],
    recommendedClassKeys: ["mage"],
    discoveryHint: "Sensibilidade a ecos sugere potencial arcano latente.",
  },
  {
    key: "healingArts",
    label: "Artes de Cura",
    description: "Leitura de desgaste, cuidado oportuno e apoio à recuperação.",
    relatedTrainingFocuses: ["support"],
    recommendedClassKeys: ["priest"],
    discoveryHint: "Atenção ao bem-estar alheio aponta para artes de cura.",
  },
  {
    key: "fieldcraft",
    label: "Campo e Trilha",
    description: "Reconhecimento de terreno, movimentação e leitura de rotas.",
    relatedTrainingFocuses: ["mobility", "survival"],
    recommendedClassKeys: ["archer", "rogue"],
    discoveryHint: "O modo de observar o ambiente revela tino de exploração.",
  },
  {
    key: "survival",
    label: "Sobrevivência",
    description: "Condicionamento, recuperação e resistência ao desgaste prolongado.",
    relatedTrainingFocuses: ["defense", "mobility", "survival"],
    recommendedClassKeys: [],
    discoveryHint: "Resistência incomum sugere instinto de sobrevivência.",
  },
  {
    key: "discipline",
    label: "Disciplina",
    description: "Foco constante, domínio emocional e constância sob pressão.",
    relatedTrainingFocuses: ["frontline", "defense", "support", "discipline"],
    recommendedClassKeys: [],
    discoveryHint: "A postura firme insinua disciplina bem trabalhada.",
  },
  {
    key: "leadership",
    label: "Liderança",
    description: "Coordenação da equipe, presença e capacidade de reunir esforços.",
    relatedTrainingFocuses: ["support", "discipline"],
    recommendedClassKeys: [],
    discoveryHint: "Outros parecem responder à sua presença; talvez liderança.",
  },
  {
    key: "tactics",
    label: "Tática",
    description: "Leitura de combate, antecipação e organização de posicionamento.",
    relatedTrainingFocuses: ["frontline", "arcane"],
    recommendedClassKeys: [],
    discoveryHint: "O raciocínio de campo aponta para vocação tática.",
  },
  {
    key: "workshop",
    label: "Oficina",
    description: "Cuidado com equipamento, ajustes e manutenção prática de itens.",
    relatedTrainingFocuses: [],
    recommendedClassKeys: [],
    discoveryHint: "As mãos calejadas sugerem familiaridade com a oficina.",
  },
];

export type LightTechniqueDefinition = {
  key: string;
  name: string;
  description: string;
  sourceProficiency: ProficiencyKey;
  requiredRank: ProficiencyRank;
};

// Tecnicas leves puramente descritivas: desbloqueiam por rank, sem efeito de combate.
export const LIGHT_TECHNIQUE_DEFINITIONS: readonly LightTechniqueDefinition[] = [
  {
    key: "steady_guard",
    name: "Guarda Estável",
    description: "Demonstra melhor leitura defensiva em formações de linha.",
    sourceProficiency: "shieldwork",
    requiredRank: "practiced",
  },
  {
    key: "line_stance",
    name: "Postura de Linha",
    description: "Mantém a posição da linha de frente com mais firmeza.",
    sourceProficiency: "shieldwork",
    requiredRank: "competent",
  },
  {
    key: "blade_flow",
    name: "Fluxo de Lâmina",
    description: "Encadeia golpes com mais naturalidade durante o treino.",
    sourceProficiency: "swordplay",
    requiredRank: "practiced",
  },
  {
    key: "calm_aim",
    name: "Mira Calma",
    description: "Mantém a precisão mesmo sob pressão.",
    sourceProficiency: "archery",
    requiredRank: "practiced",
  },
  {
    key: "quick_step",
    name: "Passo Rápido",
    description: "Reposiciona-se com reflexos mais afiados.",
    sourceProficiency: "daggerwork",
    requiredRank: "practiced",
  },
  {
    key: "arcane_pulse",
    name: "Pulso Arcano",
    description: "Controla melhor oscilações de eco durante a preparação.",
    sourceProficiency: "arcaneControl",
    requiredRank: "practiced",
  },
  {
    key: "first_aid",
    name: "Primeiros Socorros",
    description: "Entende melhor os sinais de desgaste da equipe.",
    sourceProficiency: "healingArts",
    requiredRank: "practiced",
  },
  {
    key: "field_reading",
    name: "Leitura de Terreno",
    description: "Reconhece rotas e riscos do ambiente com mais rapidez.",
    sourceProficiency: "fieldcraft",
    requiredRank: "practiced",
  },
  {
    key: "enduring_body",
    name: "Corpo Resistente",
    description: "Recupera-se do desgaste com mais constância.",
    sourceProficiency: "survival",
    requiredRank: "practiced",
  },
  {
    key: "focused_mind",
    name: "Mente Focada",
    description: "Mantém a concentração diante de decisões difíceis.",
    sourceProficiency: "discipline",
    requiredRank: "practiced",
  },
  {
    key: "rally_voice",
    name: "Voz de Comando",
    description: "Reúne o esforço da equipe com mais naturalidade.",
    sourceProficiency: "leadership",
    requiredRank: "competent",
  },
  {
    key: "battle_plan",
    name: "Plano de Batalha",
    description: "Antecipa posicionamentos com leitura tática apurada.",
    sourceProficiency: "tactics",
    requiredRank: "competent",
  },
  {
    key: "tempered_gear",
    name: "Equipamento Afinado",
    description: "Cuida do próprio equipamento com mais esmero.",
    sourceProficiency: "workshop",
    requiredRank: "practiced",
  },
];

const PROFICIENCY_KEY_SET = new Set<ProficiencyKey>(PROFICIENCY_DEFINITIONS.map((definition) => definition.key));

const PROFICIENCY_BY_KEY = new Map<ProficiencyKey, ProficiencyDefinition>(
  PROFICIENCY_DEFINITIONS.map((definition) => [definition.key, definition]),
);

// Foco de treino -> proficiencia principal e secundaria.
// A principal do foco "damage" depende da classe (arma do heroi).
const WEAPON_PROFICIENCY_BY_CLASS: Record<HeroClassKey, ProficiencyKey> = {
  warrior: "swordplay",
  guardian: "shieldwork",
  archer: "archery",
  rogue: "daggerwork",
  mage: "arcaneControl",
  priest: "healingArts",
};

type FocusProficiencyPlan = {
  primary: ProficiencyKey | "weapon";
  secondary: ProficiencyKey | null;
};

const FOCUS_PROFICIENCY_PLAN: Record<TrainingFocus, FocusProficiencyPlan> = {
  frontline: { primary: "shieldwork", secondary: "discipline" },
  damage: { primary: "weapon", secondary: "tactics" },
  defense: { primary: "shieldwork", secondary: "survival" },
  support: { primary: "healingArts", secondary: "leadership" },
  mobility: { primary: "daggerwork", secondary: "fieldcraft" },
  arcane: { primary: "arcaneControl", secondary: "tactics" },
  discipline: { primary: "discipline", secondary: "leadership" },
  survival: { primary: "survival", secondary: "fieldcraft" },
};

export function isValidProficiencyKey(value: unknown): value is ProficiencyKey {
  return typeof value === "string" && PROFICIENCY_KEY_SET.has(value as ProficiencyKey);
}

export function getProficiencyDefinitions(): ProficiencyDefinition[] {
  return PROFICIENCY_DEFINITIONS.map((definition) => ({
    ...definition,
    relatedTrainingFocuses: [...definition.relatedTrainingFocuses],
    recommendedClassKeys: [...definition.recommendedClassKeys],
  }));
}

export function getProficiencyDefinition(key: unknown): ProficiencyDefinition | null {
  return isValidProficiencyKey(key) ? (PROFICIENCY_BY_KEY.get(key) ?? null) : null;
}

export function getWeaponProficiencyForClass(classKey: unknown): ProficiencyKey {
  return (typeof classKey === "string" && WEAPON_PROFICIENCY_BY_CLASS[classKey as HeroClassKey]) || "swordplay";
}

export function getRankForXp(xp: unknown): ProficiencyRank {
  const normalized = Math.max(0, Math.floor(Number(xp) || 0));
  let rank: ProficiencyRank = "unknown";
  for (const threshold of PROFICIENCY_RANK_THRESHOLDS) {
    if (normalized >= threshold.minXp) rank = threshold.rank;
  }
  return rank;
}

export function getRankIndex(rank: ProficiencyRank): number {
  const index = RANK_ORDER.indexOf(rank);
  return index < 0 ? 0 : index;
}

export function getRankLabel(rank: ProficiencyRank): string {
  switch (rank) {
    case "novice":
      return "Novato";
    case "practiced":
      return "Praticado";
    case "competent":
      return "Competente";
    case "refined":
      return "Refinado";
    default:
      return "Não revelado";
  }
}

export function getNextRankThreshold(xp: unknown): ProficiencyRankThreshold | null {
  const normalized = Math.max(0, Math.floor(Number(xp) || 0));
  for (const threshold of PROFICIENCY_RANK_THRESHOLDS) {
    if (normalized < threshold.minXp) return threshold;
  }
  return null;
}

export function resolveFocusProficiencyPlan(
  focus: TrainingFocus,
  classKey: unknown,
): { primary: ProficiencyKey; secondary: ProficiencyKey | null } {
  const plan = FOCUS_PROFICIENCY_PLAN[focus];
  if (!plan) {
    return { primary: getWeaponProficiencyForClass(classKey), secondary: null };
  }
  const primary = plan.primary === "weapon" ? getWeaponProficiencyForClass(classKey) : plan.primary;
  const secondary = plan.secondary && plan.secondary !== primary ? plan.secondary : null;
  return { primary, secondary };
}
