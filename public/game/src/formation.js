(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  function findHero(state, heroId) {
    return state.heroes.find((hero) => hero.id === heroId) || null;
  }

  function isHeroInFormation(state, heroId) {
    return state.formation.includes(heroId);
  }

  function getPresetRules(type) {
    if (type === "tower") {
      return { size: Echoes.CONFIG.maxFormationSize, count: Echoes.CONFIG.maxTowerTeamPresets };
    }

    if (type === "expedition") {
      return { size: Echoes.CONFIG.maxExpeditionHeroes, count: Echoes.CONFIG.maxExpeditionTeamPresets };
    }

    return null;
  }

  function ensureTeamPresets(state) {
    const validHeroIds = new Set((state.heroes || []).map((hero) => hero.id));

    state.teamPresets = Echoes.normalizeTeamPresets
      ? Echoes.normalizeTeamPresets(state.teamPresets, validHeroIds)
      : state.teamPresets;

    return state.teamPresets;
  }

  function getTeamPresets(state, type) {
    const rules = getPresetRules(type);
    if (!rules) return [];

    const presets = ensureTeamPresets(state);
    return Array.isArray(presets[type]) ? presets[type].slice(0, rules.count) : [];
  }

  function getTeamPreset(state, type, presetIndex) {
    const index = Number(presetIndex);
    const presets = getTeamPresets(state, type);

    return Number.isInteger(index) && index >= 0 && index < presets.length ? presets[index] : null;
  }

  function getTeamPresetHeroIds(state, type, presetIndex) {
    const preset = getTeamPreset(state, type, presetIndex);
    if (!preset || !Array.isArray(preset.heroIds)) return [];

    return preset.heroIds.filter((heroId) => Boolean(heroId) && findHero(state, heroId));
  }

  function getTeamPresetHeroes(state, type, presetIndex) {
    const preset = getTeamPreset(state, type, presetIndex);
    if (!preset || !Array.isArray(preset.heroIds)) return [];

    return preset.heroIds.map((heroId) => (heroId ? findHero(state, heroId) : null));
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

  function getTeamPresetPower(state, type, presetIndex) {
    return getTeamPresetHeroIds(state, type, presetIndex).reduce((total, heroId) => {
      const hero = findHero(state, heroId);
      return total + (hero ? Echoes.getHeroPower(hero, state) : 0);
    }, 0);
  }

  function getTeamPresetBusyHeroes(state, type, presetIndex) {
    return getTeamPresetHeroIds(state, type, presetIndex)
      .map((heroId) => findHero(state, heroId))
      .filter((hero) => hero && Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id));
  }

  function setTeamPresetHero(state, type, presetIndex, slotIndex, heroId) {
    const preset = getTeamPreset(state, type, presetIndex);
    const rules = getPresetRules(type);
    const slot = Number(slotIndex);

    if (!preset || !rules || !Number.isInteger(slot) || slot < 0 || slot >= rules.size) {
      return { ok: false, message: "Time salvo invalido." };
    }

    if (!heroId) {
      preset.heroIds[slot] = null;
      return { ok: true, message: `${preset.name}: slot limpo.` };
    }

    const hero = findHero(state, heroId);
    if (!hero) {
      return { ok: false, message: "Heroi nao encontrado." };
    }

    const duplicateSlot = preset.heroIds.findIndex((savedHeroId, index) => savedHeroId === heroId && index !== slot);
    if (duplicateSlot !== -1) {
      return { ok: false, message: `${hero.name} ja esta nesse time salvo.` };
    }

    preset.heroIds[slot] = heroId;
    return { ok: true, message: `${hero.name} definido em ${preset.name}.` };
  }

  function clearTeamPreset(state, type, presetIndex) {
    const preset = getTeamPreset(state, type, presetIndex);
    const rules = getPresetRules(type);

    if (!preset || !rules) {
      return { ok: false, message: "Time salvo invalido." };
    }

    preset.heroIds = Array(rules.size).fill(null);
    return { ok: true, message: `${preset.name} limpo.` };
  }

  function saveTowerPresetFromFormation(state, presetIndex) {
    const preset = getTeamPreset(state, "tower", presetIndex);
    if (!preset) {
      return { ok: false, message: "Time de torre invalido." };
    }

    const heroIds = state.formation.slice(0, Echoes.CONFIG.maxFormationSize);
    if (!heroIds.some(Boolean)) {
      return { ok: false, message: "Monte a formacao antes de salvar um time de torre." };
    }

    preset.heroIds = heroIds.concat(Array(Echoes.CONFIG.maxFormationSize).fill(null)).slice(0, Echoes.CONFIG.maxFormationSize);
    return { ok: true, message: `${preset.name} salvo com a formacao atual.` };
  }

  function applyTowerPresetToFormation(state, presetIndex) {
    const preset = getTeamPreset(state, "tower", presetIndex);
    if (!preset) {
      return { ok: false, message: "Time de torre invalido." };
    }

    const heroIds = getTeamPresetHeroIds(state, "tower", presetIndex);
    if (heroIds.length === 0) {
      return { ok: false, message: `${preset.name} ainda nao tem herois.` };
    }

    state.formation = preset.heroIds.concat(Array(Echoes.CONFIG.maxFormationSize).fill(null)).slice(0, Echoes.CONFIG.maxFormationSize);

    const busyHeroes = getTeamPresetBusyHeroes(state, "tower", presetIndex);
    if (busyHeroes.length > 0) {
      return {
        ok: true,
        message: `${preset.name} aplicado, mas ${busyHeroes[0].name} esta em expedicao e nao pode lutar agora.`,
      };
    }

    return { ok: true, message: `${preset.name} aplicado a formacao.` };
  }

  function saveExpeditionPresetFromFormation(state, presetIndex) {
    const preset = getTeamPreset(state, "expedition", presetIndex);
    if (!preset) {
      return { ok: false, message: "Time de expedicao invalido." };
    }

    const heroIds = state.formation.filter(Boolean).slice(0, Echoes.CONFIG.maxExpeditionHeroes);
    if (heroIds.length === 0) {
      return { ok: false, message: "Monte a formacao antes de capturar herois para expedicao." };
    }

    preset.heroIds = heroIds.concat(Array(Echoes.CONFIG.maxExpeditionHeroes).fill(null)).slice(0, Echoes.CONFIG.maxExpeditionHeroes);
    return { ok: true, message: `${preset.name} salvo com ${heroIds.length} heroi(s) da formacao.` };
  }

  Echoes.findHero = findHero;
  Echoes.isHeroInFormation = isHeroInFormation;
  Echoes.getTeamPresets = getTeamPresets;
  Echoes.getTeamPreset = getTeamPreset;
  Echoes.getTeamPresetHeroIds = getTeamPresetHeroIds;
  Echoes.getTeamPresetHeroes = getTeamPresetHeroes;
  Echoes.getFormationHeroes = getFormationHeroes;
  Echoes.addHeroToFormation = addHeroToFormation;
  Echoes.removeHeroFromFormation = removeHeroFromFormation;
  Echoes.getFormationPower = getFormationPower;
  Echoes.getTeamPresetPower = getTeamPresetPower;
  Echoes.getTeamPresetBusyHeroes = getTeamPresetBusyHeroes;
  Echoes.setTeamPresetHero = setTeamPresetHero;
  Echoes.clearTeamPreset = clearTeamPreset;
  Echoes.saveTowerPresetFromFormation = saveTowerPresetFromFormation;
  Echoes.applyTowerPresetToFormation = applyTowerPresetToFormation;
  Echoes.saveExpeditionPresetFromFormation = saveExpeditionPresetFromFormation;
})(window);
