(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  function findHero(state, heroId) {
    return state.heroes.find((hero) => hero.id === heroId) || null;
  }

  function isHeroInFormation(state, heroId) {
    return state.formation.includes(heroId);
  }

  function getFormationHeroes(state) {
    return state.formation.map((heroId) => (heroId ? findHero(state, heroId) : null));
  }

  function addHeroToFormation(state, heroId) {
    const hero = findHero(state, heroId);

    if (!hero) {
      return { ok: false, message: "Heroi nao encontrado." };
    }

    if (isHeroInFormation(state, heroId)) {
      return { ok: false, message: "Esse heroi ja esta na formacao." };
    }

    const emptySlot = state.formation.findIndex((slot) => slot === null);
    if (emptySlot === -1) {
      return { ok: false, message: "A formacao ja tem 5 herois." };
    }

    state.formation[emptySlot] = heroId;
    if (Echoes.hasHeroInjuries && Echoes.hasHeroInjuries(hero)) {
      return {
        ok: true,
        message: `Heroi adicionado a formacao. Aviso: ${hero.name} esta ferido (${Echoes.getHeroInjurySummary(hero)}).`,
        slot: emptySlot,
      };
    }

    return { ok: true, message: "Heroi adicionado a formacao.", slot: emptySlot };
  }

  function removeHeroFromFormation(state, heroId) {
    const slot = state.formation.findIndex((slotHeroId) => slotHeroId === heroId);
    if (slot === -1) {
      return { ok: false, message: "Esse heroi nao esta na formacao." };
    }

    state.formation[slot] = null;
    return { ok: true, message: "Heroi removido da formacao.", slot };
  }

  function getFormationPower(state) {
    return getFormationHeroes(state).reduce((total, hero) => {
      return total + (hero ? Echoes.getHeroPower(hero, state) : 0);
    }, 0);
  }

  Echoes.findHero = findHero;
  Echoes.isHeroInFormation = isHeroInFormation;
  Echoes.getFormationHeroes = getFormationHeroes;
  Echoes.addHeroToFormation = addHeroToFormation;
  Echoes.removeHeroFromFormation = removeHeroFromFormation;
  Echoes.getFormationPower = getFormationPower;
})(window);
