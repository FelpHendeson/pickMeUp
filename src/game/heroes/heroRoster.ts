import type { GameState, Hero, HeroClassKey } from "../types";
import { generateHero, type GenerateHeroOptions } from "./heroFactory";

export type HeroDefinition = {
  definitionId: string;
  name: string;
  initialRarity: number;
  classKey: HeroClassKey;
  traitKey: string;
  origin: string;
  background: string;
  personality: string;
  potentialTags: readonly string[];
  roleTags: readonly string[];
  hiddenAptitudeTags: readonly string[];
};

export type CreateHeroFromDefinitionOptions = Pick<
  GenerateHeroOptions,
  "id" | "morale" | "random" | "recruitmentTag"
>;

export const HERO_ROSTER = [
  {
    definitionId: "darian_cinder_oath",
    name: "Darian do Juramento de Cinza",
    initialRarity: 3,
    classKey: "warrior",
    traitKey: "brave",
    origin: "Fortaleza de Caldris",
    background: "Antigo sentinela que atravessou uma brecha da Torre para salvar sua companhia.",
    personality: "Direto, protetor e incapaz de abandonar quem luta ao seu lado.",
    potentialTags: ["lideranca", "linha-de-frente"],
    roleTags: ["combate", "vigilancia"],
    hiddenAptitudeTags: ["vice-mestre", "instrutor"],
  },
  {
    definitionId: "elira_stone_vigil",
    name: "Elira da Vigilia de Pedra",
    initialRarity: 2,
    classKey: "guardian",
    traitKey: "loyal",
    origin: "Pedreiras de Orthea",
    background: "Construiu abrigos para peregrinos antes de aprender a sustentar escudos em batalha.",
    personality: "Paciente, pratica e atenta ao cansaco dos outros.",
    potentialTags: ["resistencia", "protecao"],
    roleTags: ["combate", "construcao", "vigilancia"],
    hiddenAptitudeTags: ["administracao", "fortificacao"],
  },
  {
    definitionId: "tavia_hollow_trail",
    name: "Tavia do Rastro Oco",
    initialRarity: 2,
    classKey: "archer",
    traitKey: "cautious",
    origin: "Bosque de Vespera",
    background: "Mapeava trilhas que desapareciam ao anoitecer e aprendeu a reconhecer ecos falsos.",
    personality: "Reservada, observadora e inquieta quando fica tempo demais no mesmo lugar.",
    potentialTags: ["precisao", "percepcao"],
    roleTags: ["combate", "exploracao", "expedicao"],
    hiddenAptitudeTags: ["cartografia", "rastreamento"],
  },
  {
    definitionId: "orven_ash_eye",
    name: "Orven Olho de Fuligem",
    initialRarity: 1,
    classKey: "archer",
    traitKey: "ambitious",
    origin: "Fornos de Rask",
    background: "Um carregador de carvao que escondia sua pontaria para evitar o recrutamento forcado.",
    personality: "Discreto, competitivo e muito mais atento do que aparenta.",
    potentialTags: ["crescimento-oculto", "precisao"],
    roleTags: ["combate", "coleta", "trabalho"],
    hiddenAptitudeTags: ["atirador-excepcional", "mineracao"],
  },
  {
    definitionId: "selka_broken_rune",
    name: "Selka da Runa Partida",
    initialRarity: 3,
    classKey: "mage",
    traitKey: "unstable",
    origin: "Arquivo Submerso de Lume",
    background: "Sobreviveu ao colapso de um circulo arcano e carrega fragmentos da formula na memoria.",
    personality: "Brilhante, impaciente e fascinada por riscos que ainda nao compreende.",
    potentialTags: ["poder-arcano", "pesquisa"],
    roleTags: ["combate", "pesquisa", "oficina-arcana"],
    hiddenAptitudeTags: ["sintese", "runas"],
  },
  {
    definitionId: "corin_deep_lamp",
    name: "Corin da Lamparina Profunda",
    initialRarity: 2,
    classKey: "mage",
    traitKey: "cautious",
    origin: "Observatorio de Nereth",
    background: "Catalogava estrelas invisiveis e percebeu que algumas respondiam aos movimentos da Torre.",
    personality: "Metodico, gentil e propenso a esquecer o descanso durante uma descoberta.",
    potentialTags: ["foco", "conhecimento"],
    roleTags: ["pesquisa", "biblioteca", "combate"],
    hiddenAptitudeTags: ["analise-de-ecos", "mentoria"],
  },
  {
    definitionId: "mirel_white_bell",
    name: "Mirel do Sino Branco",
    initialRarity: 3,
    classKey: "priest",
    traitKey: "loyal",
    origin: "Hospicio de Santa Bruma",
    background: "Manteve uma enfermaria funcionando durante uma estacao inteira de ecos hostis.",
    personality: "Serena, firme e pouco tolerante com descuido evitavel.",
    potentialTags: ["cura", "disciplina"],
    roleTags: ["suporte", "enfermaria", "combate"],
    hiddenAptitudeTags: ["gestao-de-crise", "conselheira"],
  },
  {
    definitionId: "aven_quiet_grace",
    name: "Aven da Graca Silenciosa",
    initialRarity: 1,
    classKey: "priest",
    traitKey: "brave",
    origin: "Aldeia das Velas Baixas",
    background: "Era ajudante de cozinha e aprendeu ritos de cura observando viajantes feridos.",
    personality: "Timido, persistente e sempre o primeiro a oferecer ajuda.",
    potentialTags: ["crescimento-oculto", "suporte"],
    roleTags: ["cozinha", "enfermaria", "combate"],
    hiddenAptitudeTags: ["cura-excepcional", "moral"],
  },
  {
    definitionId: "veska_night_needle",
    name: "Veska Agulha da Noite",
    initialRarity: 3,
    classKey: "rogue",
    traitKey: "ambitious",
    origin: "Mercado Velado de Surn",
    background: "Recuperava artefatos roubados sem deixar rastros e passou a cacar reliquias da Torre.",
    personality: "Sagaz, provocadora e leal apenas depois de confiar de verdade.",
    potentialTags: ["velocidade", "infiltracao"],
    roleTags: ["combate", "exploracao", "expedicao"],
    hiddenAptitudeTags: ["negociacao", "desarme"],
  },
  {
    definitionId: "nilo_ember_key",
    name: "Nilo da Chave de Brasa",
    initialRarity: 2,
    classKey: "rogue",
    traitKey: "brave",
    origin: "Ruinas de Aster",
    background: "Cresceu abrindo passagens soterradas para equipes de resgate e saqueadores honestos.",
    personality: "Curioso, sociavel e incapaz de ignorar uma porta fechada.",
    potentialTags: ["sorte", "mobilidade"],
    roleTags: ["exploracao", "coleta", "combate"],
    hiddenAptitudeTags: ["mecanismos", "arqueologia"],
  },
  {
    definitionId: "boren_forge_spark",
    name: "Boren Faisca da Forja",
    initialRarity: 1,
    classKey: "guardian",
    traitKey: "cautious",
    origin: "Distrito Ferreiro de Karst",
    background: "Aprendiz de ferreiro que usava o proprio escudo para testar ligas experimentais.",
    personality: "Trabalhador, teimoso e orgulhoso de cada reparo bem-feito.",
    potentialTags: ["crescimento-oculto", "resistencia"],
    roleTags: ["oficina", "trabalho", "combate"],
    hiddenAptitudeTags: ["forja", "melhoria-de-equipamento"],
  },
  {
    definitionId: "lysa_echo_ledger",
    name: "Lysa do Livro de Ecos",
    initialRarity: 1,
    classKey: "warrior",
    traitKey: "loyal",
    origin: "Entreposto de Valemor",
    background: "Escrituraria de caravanas que organizou a defesa de um entreposto durante uma invasao.",
    personality: "Organizada, exigente e surpreendentemente corajosa sob pressao.",
    potentialTags: ["crescimento-oculto", "lideranca"],
    roleTags: ["administracao", "logistica", "combate"],
    hiddenAptitudeTags: ["vice-mestre", "planejamento"],
  },
] as const satisfies readonly HeroDefinition[];

const HERO_DEFINITIONS_BY_ID = new Map<string, HeroDefinition>(
  HERO_ROSTER.map((definition) => [definition.definitionId, definition]),
);

export function getHeroDefinitionById(definitionId: unknown): HeroDefinition | null {
  return typeof definitionId === "string" ? (HERO_DEFINITIONS_BY_ID.get(definitionId) ?? null) : null;
}

export function isHeroFromRoster(hero: Pick<Hero, "definitionId"> | null | undefined): boolean {
  return Boolean(hero?.definitionId && getHeroDefinitionById(hero.definitionId));
}

export function isLegacyHero(hero: Pick<Hero, "definitionId"> | null | undefined): boolean {
  return !isHeroFromRoster(hero);
}

export function getOwnedHeroDefinitionIds(state: Pick<GameState, "heroes">): Set<string> {
  return new Set(
    state.heroes
      .map((hero) => hero.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId && getHeroDefinitionById(definitionId))),
  );
}

export function getAvailableHeroDefinitions(state: Pick<GameState, "heroes">): HeroDefinition[] {
  const ownedDefinitionIds = getOwnedHeroDefinitionIds(state);
  return HERO_ROSTER.filter((definition) => !ownedDefinitionIds.has(definition.definitionId));
}

export function createHeroFromDefinition(
  definition: HeroDefinition,
  options: CreateHeroFromDefinitionOptions = {},
): Hero {
  return generateHero({
    ...options,
    definitionId: definition.definitionId,
    name: definition.name,
    rarity: definition.initialRarity,
    classKey: definition.classKey,
    traitKey: definition.traitKey,
  });
}
