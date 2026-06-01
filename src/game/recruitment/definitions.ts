import type { GenerateHeroOptions } from "../heroes";

export const CONTRACT_CHOICE_COUNT = 3;

export const VETERAN_TEMPLATES: Record<string, Array<Pick<GenerateHeroOptions, "name" | "classKey" | "traitKey">>> = {
  awakening_ruins: [
    { name: "Arel das Runas Partidas", classKey: "guardian", traitKey: "loyal" },
    { name: "Runa do Atrio Antigo", classKey: "warrior", traitKey: "cautious" },
  ],
  bestial_forest: [
    { name: "Talia da Mata Faminta", classKey: "archer", traitKey: "brave" },
    { name: "Varek dos Rastros Negros", classKey: "rogue", traitKey: "ambitious" },
  ],
  spectral_crypt: [
    { name: "Iria do Tumulo Claro", classKey: "priest", traitKey: "loyal" },
    { name: "Soren da Marca Fria", classKey: "mage", traitKey: "ambitious" },
  ],
  infernal_abyss: [
    { name: "Marek da Corrente Rubra", classKey: "warrior", traitKey: "unstable" },
    { name: "Hedra da Cinza Negra", classKey: "mage", traitKey: "brave" },
  ],
};
