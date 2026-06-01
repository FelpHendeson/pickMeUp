export { CONTRACT_CHOICE_COUNT, VETERAN_TEMPLATES } from "./definitions";
export {
  chooseRecruitmentHero,
  createContractHeroOption,
  createVeteranHeroOption,
  normalizeRecruitmentState,
  rollContractRarity,
  setPendingRecruitmentChoice,
  startContractRecruitment,
  startVeteranRecruitment,
} from "./recruitmentRules";
export type { ChooseRecruitmentResult, RecruitmentResult } from "./recruitmentRules";
