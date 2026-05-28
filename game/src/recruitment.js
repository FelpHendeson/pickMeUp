(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const CONTRACT_CHOICE_COUNT = 3;

  const VETERAN_TEMPLATES = {
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

  function normalizeRecruitmentState(state) {
    state.heroContracts = Math.max(0, Math.floor(Number(state.heroContracts) || 0));
    state.pendingRecruitmentChoice =
      state.pendingRecruitmentChoice && typeof state.pendingRecruitmentChoice === "object" ? state.pendingRecruitmentChoice : null;

    if (!state.pendingRecruitmentChoice) return null;

    const choice = state.pendingRecruitmentChoice;
    if (!Array.isArray(choice.options) || choice.options.length === 0) {
      state.pendingRecruitmentChoice = null;
      return null;
    }

    choice.options = choice.options.slice(0, CONTRACT_CHOICE_COUNT).map((hero) => Echoes.normalizeHero(hero));
    choice.id = choice.id || createRecruitmentChoiceId();
    choice.source = typeof choice.source === "string" ? choice.source : "contract";
    choice.title = typeof choice.title === "string" ? choice.title : "Escolha de heroi";
    choice.description =
      typeof choice.description === "string"
        ? choice.description
        : "Escolha um dos herois disponiveis. Os demais seguirao outro caminho.";
    choice.createdAt = typeof choice.createdAt === "string" ? choice.createdAt : new Date().toISOString();

    return choice;
  }

  function createRecruitmentChoiceId() {
    return `recruit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function rollContractRarity() {
    const roll = Math.random();
    if (roll < 0.08) return 4;
    if (roll < 0.38) return 3;
    if (roll < 0.78) return 2;
    return 1;
  }

  function createContractHeroOption() {
    return Echoes.generateHero({ rarity: rollContractRarity() });
  }

  function createVeteranHeroOption(chapter) {
    const templates = VETERAN_TEMPLATES[chapter && chapter.id] || VETERAN_TEMPLATES.awakening_ruins;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return Echoes.generateHero({
      rarity: Math.random() < 0.18 ? 4 : 3,
      classKey: template.classKey,
      traitKey: template.traitKey,
      name: template.name,
      recruitmentTag: chapter ? chapter.name : "Veterano da Torre",
    });
  }

  function getFutureSpecializationHint(hero) {
    if (!Echoes.getClassSpecializations) return "";
    const specializations = Echoes.getClassSpecializations(hero.classKey);
    if (!specializations || specializations.length === 0) return "";
    return specializations.map((specialization) => specialization.name).join(" ou ");
  }

  function setPendingRecruitmentChoice(state, source, options, details) {
    state.pendingRecruitmentChoice = {
      id: createRecruitmentChoiceId(),
      source,
      title: details && details.title ? details.title : "Escolha de heroi",
      description:
        details && details.description
          ? details.description
          : "Escolha um dos herois disponiveis. Os demais seguirao outro caminho.",
      options: options.map((hero) => Echoes.normalizeHero(hero)),
      createdAt: new Date().toISOString(),
    };

    return state.pendingRecruitmentChoice;
  }

  function startContractRecruitment(state) {
    normalizeRecruitmentState(state);

    if (state.pendingRecruitmentChoice) {
      return { ok: false, message: "Ja existe uma escolha de recrutamento pendente." };
    }

    if (!Echoes.spendResource(state, "heroContracts", 1)) {
      return { ok: false, message: "Voce nao possui Contrato de Heroi." };
    }

    const options = Array.from({ length: CONTRACT_CHOICE_COUNT }, createContractHeroOption);
    const choice = setPendingRecruitmentChoice(state, "contract", options, {
      title: "Contrato de Heroi",
      description: "O contrato revelou tres candidatos. Escolha apenas um para entrar no seu grupo.",
    });

    return { ok: true, choice, message: "Contrato aberto. Escolha um dos tres herois." };
  }

  function startVeteranRecruitment(state, chapter) {
    normalizeRecruitmentState(state);

    if (state.pendingRecruitmentChoice) {
      Echoes.addResource(state, "heroContracts", 1);
      return { ok: false, message: "Um veterano apareceu, mas virou contrato porque ja havia uma escolha pendente." };
    }

    const veteran = createVeteranHeroOption(chapter);
    const options = [veteran, createContractHeroOption(), createContractHeroOption()];
    const choice = setPendingRecruitmentChoice(state, "veteran", options, {
      title: "Veterano da Torre",
      description: `${veteran.name} respondeu ao eco de ${chapter ? chapter.name : "um chefe"}. Escolha um heroi para recrutar.`,
    });

    return { ok: true, choice, message: "Um veterano da torre esta disponivel para recrutamento." };
  }

  function chooseRecruitmentHero(state, heroId) {
    const choice = normalizeRecruitmentState(state);
    if (!choice) return { ok: false, message: "Nao ha escolha de recrutamento pendente." };

    const selected = choice.options.find((hero) => hero.id === heroId);
    if (!selected) return { ok: false, message: "Heroi invalido para este recrutamento." };

    state.heroes.push(Echoes.normalizeHero(selected));
    state.pendingRecruitmentChoice = null;

    return {
      ok: true,
      hero: selected,
      message: `${selected.name} entrou para a equipe.`,
    };
  }

  Echoes.normalizeRecruitmentState = normalizeRecruitmentState;
  Echoes.startContractRecruitment = startContractRecruitment;
  Echoes.startVeteranRecruitment = startVeteranRecruitment;
  Echoes.chooseRecruitmentHero = chooseRecruitmentHero;
  Echoes.getFutureSpecializationHint = getFutureSpecializationHint;
})(window);
