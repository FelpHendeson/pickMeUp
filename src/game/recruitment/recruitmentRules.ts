import { addResource, spendResource } from "../state/resources";
import { generateHero, normalizeHero, type RandomSource } from "../heroes";
import type { GameState, Hero, RecruitmentChoice } from "../types";
import type { TowerChapter } from "../tower";
import { CONTRACT_CHOICE_COUNT, VETERAN_TEMPLATES } from "./definitions";

export type RecruitmentResult =
  | { ok: true; choice: RecruitmentChoice; message: string }
  | { ok: false; message: string };

export type ChooseRecruitmentResult =
  | { ok: true; hero: Hero; message: string }
  | { ok: false; message: string };

function createRecruitmentChoiceId(random: RandomSource = Math.random): string {
  return `recruit_${Date.now().toString(36)}_${random().toString(36).slice(2, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function rollContractRarity(random: RandomSource = Math.random): number {
  const roll = random();
  if (roll < 0.08) return 4;
  if (roll < 0.38) return 3;
  if (roll < 0.78) return 2;
  return 1;
}

export function createContractHeroOption(random: RandomSource = Math.random): Hero {
  return generateHero({ rarity: rollContractRarity(random), random });
}

export function createVeteranHeroOption(chapter?: Pick<TowerChapter, "id" | "name"> | null, random: RandomSource = Math.random): Hero {
  const templates = VETERAN_TEMPLATES[chapter?.id || ""] || VETERAN_TEMPLATES.awakening_ruins;
  const template = templates[Math.floor(random() * templates.length)] || templates[0];

  return generateHero({
    rarity: random() < 0.18 ? 4 : 3,
    classKey: template.classKey,
    traitKey: template.traitKey,
    name: template.name,
    recruitmentTag: chapter?.name || "Veterano da Torre",
    random,
  });
}

export function normalizeRecruitmentState(state: GameState): RecruitmentChoice | null {
  state.heroContracts = Math.max(0, Math.floor(Number(state.heroContracts) || 0));
  const rawChoice = asRecord(state.pendingRecruitmentChoice);

  if (!state.pendingRecruitmentChoice || !Array.isArray(rawChoice.options) || rawChoice.options.length === 0) {
    state.pendingRecruitmentChoice = null;
    return null;
  }

  state.pendingRecruitmentChoice = {
    id: typeof rawChoice.id === "string" && rawChoice.id ? rawChoice.id : createRecruitmentChoiceId(),
    source: typeof rawChoice.source === "string" ? rawChoice.source : "contract",
    title: typeof rawChoice.title === "string" ? rawChoice.title : "Escolha de heroi",
    description:
      typeof rawChoice.description === "string"
        ? rawChoice.description
        : "Escolha um dos herois disponiveis. Os demais seguirao outro caminho.",
    options: rawChoice.options.slice(0, CONTRACT_CHOICE_COUNT).map(normalizeHero),
    createdAt: typeof rawChoice.createdAt === "string" ? rawChoice.createdAt : new Date().toISOString(),
  };

  return state.pendingRecruitmentChoice;
}

export function setPendingRecruitmentChoice(
  state: GameState,
  source: string,
  options: Hero[],
  details: Partial<Pick<RecruitmentChoice, "title" | "description">> = {},
): RecruitmentChoice {
  state.pendingRecruitmentChoice = {
    id: createRecruitmentChoiceId(),
    source,
    title: details.title || "Escolha de heroi",
    description: details.description || "Escolha um dos herois disponiveis. Os demais seguirao outro caminho.",
    options: options.map(normalizeHero),
    createdAt: new Date().toISOString(),
  };

  return state.pendingRecruitmentChoice;
}

export function startContractRecruitment(state: GameState, random: RandomSource = Math.random): RecruitmentResult {
  normalizeRecruitmentState(state);

  if (state.pendingRecruitmentChoice) return { ok: false, message: "Ja existe uma escolha de recrutamento pendente." };
  if (!spendResource(state, "heroContracts", 1)) return { ok: false, message: "Voce nao possui Contrato de Heroi." };

  const options = Array.from({ length: CONTRACT_CHOICE_COUNT }, () => createContractHeroOption(random));
  const choice = setPendingRecruitmentChoice(state, "contract", options, {
    title: "Contrato de Heroi",
    description: "O contrato revelou tres candidatos. Escolha apenas um para entrar no seu grupo.",
  });

  return { ok: true, choice, message: "Contrato aberto. Escolha um dos tres herois." };
}

export function startVeteranRecruitment(
  state: GameState,
  chapter?: Pick<TowerChapter, "id" | "name"> | null,
  random: RandomSource = Math.random,
): RecruitmentResult {
  normalizeRecruitmentState(state);

  if (state.pendingRecruitmentChoice) {
    addResource(state, "heroContracts", 1);
    return { ok: false, message: "Um veterano apareceu, mas virou contrato porque ja havia uma escolha pendente." };
  }

  const veteran = createVeteranHeroOption(chapter, random);
  const options = [veteran, createContractHeroOption(random), createContractHeroOption(random)];
  const choice = setPendingRecruitmentChoice(state, "veteran", options, {
    title: "Veterano da Torre",
    description: `${veteran.name} respondeu ao eco de ${chapter?.name || "um chefe"}. Escolha um heroi para recrutar.`,
  });

  return { ok: true, choice, message: "Um veterano da torre esta disponivel para recrutamento." };
}

export function chooseRecruitmentHero(state: GameState, heroId: string): ChooseRecruitmentResult {
  const choice = normalizeRecruitmentState(state);
  if (!choice) return { ok: false, message: "Nao ha escolha de recrutamento pendente." };

  const selected = choice.options.find((hero) => hero.id === heroId);
  if (!selected) return { ok: false, message: "Heroi invalido para este recrutamento." };

  const hero = normalizeHero(selected);
  state.heroes.push(hero);
  state.pendingRecruitmentChoice = null;

  return { ok: true, hero, message: `${hero.name} entrou para a equipe.` };
}
