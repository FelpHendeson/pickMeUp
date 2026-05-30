(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  let state = null;

  function saveAndRender(message) {
    if (message) {
      Echoes.setMessage(message);
    }

    state = Echoes.saveGameState(state);
    Echoes.render(state);
  }

  function renderTransientMessage(message) {
    Echoes.setMessage(message);
    Echoes.render(state);
  }

  function handleSaveAction() {
    saveAndRender("Jogo salvo no navegador.");
  }

  function handleNarrativeAction(target, skipped) {
    const result = Echoes.markNarrativeSceneSeen(state, target.dataset.sceneId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setMessage(skipped ? "Cena pulada." : "");
    state = Echoes.saveGameState(state);
    Echoes.render(state);
  }

  function handleResetAction() {
    const firstConfirmation = global.confirm(
      "Resetar todo o progresso local? Essa ação apaga o save deste navegador e não pode ser desfeita sem um backup exportado."
    );
    if (!firstConfirmation) return;

    const secondConfirmation = global.confirm("Confirmar reset definitivo do save? Esta ação e irreversível.");
    if (!secondConfirmation) return;

    state = Echoes.resetGameState();
    Echoes.setTab("settings");
    saveAndRender("Progresso resetado.");
  }

  function downloadTextFile(fileName, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportSaveAction() {
    state = Echoes.saveGameState(state);
    downloadTextFile(Echoes.EXPORT_FILE_NAME, JSON.stringify(state, null, 2));
    Echoes.setTab("settings");
    Echoes.setMessage("Save exportado como ascensao-dos-ecos-save.json.");
    Echoes.render(state);
  }

  function handleImportSaveAction() {
    const input = document.querySelector("[data-save-import]");
    if (!input) {
      renderTransientMessage("Campo de importação não encontrado.");
      return;
    }

    input.click();
  }

  function handleSaveImportChange(input) {
    const file = input.files && input.files[0];
    input.value = "";

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      renderTransientMessage("Arquivo invalido: selecione um JSON.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = Echoes.parseImportedSaveText(String(reader.result || ""));
      if (!result.ok) {
        renderTransientMessage(result.message);
        return;
      }

      const imported = result.state;
      const confirmed = global.confirm(
        `Importar este save e sobrescrever o progresso atual?\n\nAndar: ${imported.towerFloor}\nHerois: ${imported.heroes.length}\nVersao: ${imported.saveVersion}`
      );

      if (!confirmed) return;

      state = Echoes.saveGameState(imported);
      Echoes.setTab("settings");
      Echoes.setMessage("Save importado com sucesso.");
      Echoes.render(state);
    };

    reader.onerror = () => {
      renderTransientMessage("Nao foi possivel ler o arquivo de save.");
    };

    reader.readAsText(file);
  }

  function handleOpenHeroContractAction() {
    const result = Echoes.startContractRecruitment(state);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("summon");
    saveAndRender(result.message);
  }

  function handleChooseRecruitmentHeroAction(target) {
    const result = Echoes.chooseRecruitmentHero(state, target.dataset.heroId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("heroes");
    saveAndRender(result.message);
  }

  function handleSummonAction(target) {
    const result = Echoes.summonHero(state, target.dataset.summonType);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    if (Echoes.recordMissionProgress) {
      Echoes.recordMissionProgress(state, "summons", 1);
    }

    Echoes.setTab("summon");
    saveAndRender(result.message);
  }

  function handleFormationAction(target, shouldAdd) {
    const result = shouldAdd
      ? Echoes.addHeroToFormation(state, target.dataset.heroId)
      : Echoes.removeHeroFromFormation(state, target.dataset.heroId);

    saveAndRender(result.message);
  }

  function handleSaveTowerPresetAction(target) {
    const result = Echoes.saveTowerPresetFromFormation(state, Number(target.dataset.presetIndex));
    saveAndRender(result.message);
  }

  function handleApplyTowerPresetAction(target) {
    const result = Echoes.applyTowerPresetToFormation(state, Number(target.dataset.presetIndex));
    saveAndRender(result.message);
  }

  function handleClearTeamPresetAction(target) {
    const result = Echoes.clearTeamPreset(state, target.dataset.presetType, Number(target.dataset.presetIndex));
    saveAndRender(result.message);
  }

  function handleSaveExpeditionPresetFromFormationAction(target) {
    const result = Echoes.saveExpeditionPresetFromFormation(state, Number(target.dataset.presetIndex));
    saveAndRender(result.message);
  }

  function handleTeamPresetSelectChange(select) {
    const result = Echoes.setTeamPresetHero(
      state,
      select.dataset.presetType,
      Number(select.dataset.presetIndex),
      Number(select.dataset.presetSlot),
      select.value
    );

    saveAndRender(result.message);
  }

  function handleHeroListControlChange(control) {
    Echoes.setHeroListOption(control.dataset.heroListControl, control.value);
    Echoes.render(state);
  }

  function getBattleMessage(result, repeatFloor) {
    if (result.result !== "victory") {
      return repeatFloor ? `Repeticao do andar ${repeatFloor} perdida.` : "Combate perdido.";
    }

    return repeatFloor ? `Andar ${repeatFloor} repetido. Recompensas aplicadas.` : "Combate vencido. Recompensas aplicadas.";
  }

  function handleBattleAction(options) {
    const repeatFloor = options && options.repeatFloor;
    const floorNumber = repeatFloor ? Number(repeatFloor) : state.towerFloor;
    const difficultyMode = Echoes.normalizeTowerDifficultyMode
      ? Echoes.normalizeTowerDifficultyMode(options && options.difficultyMode)
      : "normal";

    if (difficultyMode === "hardcore") {
      const confirmed = global.confirm(
        "Iniciar este combate no modo Hardcore?\n\nInimigos ficam muito mais fortes e herois que cairem podem morrer permanentemente. Essa perda não acontece nos modos Normal ou Desafio."
      );
      if (!confirmed) return;
    }

    if (!repeatFloor && Echoes.queueBossBeforeNarrative && Echoes.queueBossBeforeNarrative(state, floorNumber)) {
      Echoes.setTab("tower");
      saveAndRender("Uma cena apareceu antes do chefe.");
      return;
    }

    const result = Echoes.runTowerBattle(state, Object.assign({}, options || {}, { difficultyMode }));

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    if (result.event) {
      Echoes.setTab("tower");
      saveAndRender(result.message);
      return;
    }

    if (state.pendingTowerEvent && state.pendingTowerEvent.phase === "post") {
      Echoes.setTab("tower");
      saveAndRender("Um evento apareceu depois do combate. Escolha como resolver.");
      return;
    }

    Echoes.setTab("battleResult");
    saveAndRender(getBattleMessage(result, repeatFloor));
  }

  function handleTowerEventChoiceAction(target) {
    const eventResult = Echoes.resolveTowerEventChoice(state, target.dataset.eventChoice);

    if (!eventResult.ok) {
      renderTransientMessage(eventResult.message);
      return;
    }

    if (!eventResult.startBattle) {
      Echoes.setTab("tower");
      saveAndRender(eventResult.message);
      return;
    }

    if (state.pendingTowerDifficultyMode === "hardcore") {
      const confirmed = global.confirm(
        "Confirmar inicio do combate Hardcore apos o evento? Herois que cairem ainda podem morrer permanentemente."
      );
      if (!confirmed) {
        state.pendingTowerDifficultyMode = null;
        Echoes.setTab("tower");
        saveAndRender(eventResult.message);
        return;
      }
    }

    const battleResult = Echoes.runTowerBattle(state, {
      skipEventRoll: true,
      difficultyMode: state.pendingTowerDifficultyMode || "normal",
    });

    if (!battleResult.ok) {
      Echoes.setTab("tower");
      saveAndRender(`${eventResult.message} ${battleResult.message}`);
      return;
    }

    if (state.pendingTowerEvent && state.pendingTowerEvent.phase === "post") {
      Echoes.setTab("tower");
      saveAndRender(`${eventResult.message} Depois do combate, outro evento apareceu.`);
      return;
    }

    Echoes.setTab("battleResult");
    saveAndRender(`${eventResult.message} ${getBattleMessage(battleResult)}`);
  }

  function getEquipmentSelectValue(heroId, slot) {
    const selects = Array.from(document.querySelectorAll("[data-equipment-select]"));
    const select = selects.find((item) => item.dataset.heroId === heroId && item.dataset.equipmentSelect === slot);
    return select ? select.value : "";
  }

  function handleOpenEquipmentModalAction(target) {
    const heroId = target.dataset.heroId;
    if (!heroId) return;

    Echoes.UI.activeEquipmentModalHeroId = heroId;
    Echoes.render(state);
  }

  function handleCloseEquipmentModalAction(target) {
    const heroId = target.dataset.heroId || target.closest("[data-hero-equipment-modal]")?.getAttribute("data-hero-equipment-modal");
    if (!heroId) return;

    if (Echoes.UI.activeEquipmentModalHeroId === heroId) {
      Echoes.UI.activeEquipmentModalHeroId = null;
    }

    Echoes.render(state);
  }

  function getConsumableTargetHeroId(consumableId) {
    const select = document.querySelector(`[data-consumable-target="${consumableId}"]`);
    return select ? select.value : "";
  }

  function handleUseConsumableAction(target) {
    const consumableId = target.dataset.consumableId;
    const heroId = getConsumableTargetHeroId(consumableId);
    const result = Echoes.useConsumable(state, consumableId, heroId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("inventory");
    saveAndRender(result.message);
  }

  function handleEquipItemAction(target) {
    const equipmentId = target.dataset.equipmentId || getEquipmentSelectValue(target.dataset.heroId, target.dataset.slot);

    if (!equipmentId) {
      renderTransientMessage("Escolha um equipamento para esse heroi.");
      return;
    }

    const result = Echoes.equipItem(state, target.dataset.heroId, equipmentId);
    if (result.ok && Echoes.recordMissionProgress) {
      Echoes.recordMissionProgress(state, "itemsEquipped", 1);
    }
    saveAndRender(result.message);
  }

  function handleUnequipItemAction(target) {
    const result = Echoes.unequipItem(state, target.dataset.heroId, target.dataset.slot);
    saveAndRender(result.message);
  }

  function handleChooseSpecializationAction(target) {
    const hero = Echoes.findHero(state, target.dataset.heroId);
    const specialization = hero && Echoes.getSpecializationByKey
      ? Echoes.getSpecializationByKey(hero.classKey, target.dataset.specializationKey)
      : null;

    if (!hero || !specialization) {
      renderTransientMessage("Especialização invalida.");
      return;
    }

    const confirmed = global.confirm(
      `Escolher ${specialization.name} para ${hero.name}?\n\n${specialization.passiveName}: ${specialization.description}\n\nEsta escolha sera permanente por enquanto.`
    );

    if (!confirmed) return;

    const result = Echoes.chooseHeroSpecialization(state, hero.id, specialization.key);
    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("heroes");
    saveAndRender(result.message);
  }

  function handleClaimDailyMissionAction(target) {
    const result = Echoes.claimDailyMissionReward(state, target.dataset.missionId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("missions");
    saveAndRender(result.message);
  }

  function handleClaimAchievementAction(target) {
    const result = Echoes.claimAchievementReward(state, target.dataset.achievementId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("missions");
    saveAndRender(result.message);
  }

  function handleUpgradeRelicAction(target) {
    const result = Echoes.upgradeRelic(state, target.dataset.relicId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("relics");
    saveAndRender(result.message);
  }

  function handleTreatInjuriesAction(target) {
    const result = Echoes.treatHeroInjuries(state, target.dataset.heroId, target.dataset.treatmentResource);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    Echoes.setTab("base");
    saveAndRender(result.message);
  }

  function handleClearChapterCompletionAction() {
    state.lastChapterCompletion = null;
    Echoes.setTab("tower");
    saveAndRender("Campanha atualizada.");
  }

  function applyPreferenceChanges(message) {
    if (Echoes.applyPreferences) {
      Echoes.applyPreferences();
    }
    if (Echoes.applyBattlePreferences) {
      Echoes.applyBattlePreferences();
    }

    Echoes.setTab("settings");
    Echoes.setMessage(message || "Preferencias salvas.");
    Echoes.render(state);
  }

  function parsePreferenceValue(target) {
    if (target.type === "checkbox") return Boolean(target.checked);
    if (target.type === "range") return Number(target.value);
    return target.dataset.prefValue;
  }

  function handleSetPreferenceAction(target) {
    const result = Echoes.updatePreference(target.dataset.prefPath, target.dataset.prefValue);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    applyPreferenceChanges(result.message);
  }

  function handlePreferenceInputChange(input) {
    const result = Echoes.updatePreference(input.dataset.prefPath, parsePreferenceValue(input));

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    applyPreferenceChanges(result.message);
  }

  function handleResetPreferencesAction() {
    Echoes.resetPreferences();
    applyPreferenceChanges("Preferencias restauradas.");
  }

  function getSelectedExpeditionHeroIds(expeditionId) {
    const choices = Array.from(document.querySelectorAll(`[data-expedition-choice="${expeditionId}"]`));
    return choices.filter((choice) => choice.checked && !choice.disabled).map((choice) => choice.value);
  }

  function updateExpeditionManualPower(expeditionId) {
    const powerEl = document.querySelector("[data-expedition-manual-power]");
    if (!powerEl) return;

    const heroIds = getSelectedExpeditionHeroIds(expeditionId);
    const power = heroIds.reduce((total, heroId) => {
      const hero = Echoes.findHero(state, heroId);
      return total + (hero ? Echoes.getHeroPower(hero, state) : 0);
    }, 0);

    powerEl.textContent = Echoes.formatNumber ? Echoes.formatNumber(power) : String(power);
  }

  function renderExpeditionModalWithPreservation(nextTab) {
    const expeditionId = Echoes.UI.expeditionModal.expeditionId;
    const selections = expeditionId ? { [expeditionId]: new Set(getSelectedExpeditionHeroIds(expeditionId)) } : {};
    const scrollState = captureExpeditionScrollState();

    if (nextTab) {
      Echoes.setExpeditionModalTab(nextTab);
    }

    Echoes.render(state);
    restoreExpeditionSelections(selections);
    restoreExpeditionScrollState(scrollState);

    if (expeditionId) {
      updateExpeditionManualPower(expeditionId);
    }
  }

  function handleOpenExpeditionModalAction(target) {
    Echoes.openExpeditionModal(target.dataset.expeditionId);
    Echoes.render(state);
  }

  function handleCloseExpeditionModalAction() {
    Echoes.closeExpeditionModal();
    Echoes.render(state);
  }

  function handleSetExpeditionModalTabAction(target) {
    renderExpeditionModalWithPreservation(target.dataset.modalTab);
  }

  function handleStartExpeditionAction(target) {
    const heroIds = getSelectedExpeditionHeroIds(target.dataset.expeditionId);
    const result = Echoes.startExpedition(state, target.dataset.expeditionId, heroIds);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    if (Echoes.recordMissionProgress) {
      Echoes.recordMissionProgress(state, "expeditionsStarted", 1);
    }

    Echoes.closeExpeditionModal();
    Echoes.setTab("expeditions");
    saveAndRender(result.message);
  }

  function handleSelectExpeditionPresetAction(target) {
    const expeditionId = target.dataset.expeditionId;
    const presetIndex = Number(target.dataset.presetIndex);
    const heroIds = Echoes.getTeamPresetHeroIds(state, "expedition", presetIndex);

    if (heroIds.length === 0) {
      renderTransientMessage("Esse time de expedicao ainda esta vazio.");
      return;
    }

    const busyHero = heroIds.find((heroId) => Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, heroId));
    if (busyHero) {
      const hero = Echoes.findHero(state, busyHero);
      renderTransientMessage(`${hero ? hero.name : "Um heroi"} ja esta em expedicao.`);
      return;
    }

    renderExpeditionModalWithPreservation("manual");

    const choices = Array.from(document.querySelectorAll(`[data-expedition-choice="${expeditionId}"]`));
    choices.forEach((choice) => {
      choice.checked = heroIds.includes(choice.value) && !choice.disabled;
    });

    updateExpeditionManualPower(expeditionId);

    const preset = Echoes.getTeamPreset(state, "expedition", presetIndex);
    Echoes.setMessage(`${preset ? preset.name : "Time"} selecionado para expedicao.`);
    Echoes.syncNoticeMessage();
  }

  function handleStartExpeditionPresetAction(target) {
    const presetIndex = Number(target.dataset.presetIndex);
    const heroIds = Echoes.getTeamPresetHeroIds(state, "expedition", presetIndex);
    const result = Echoes.startExpedition(state, target.dataset.expeditionId, heroIds);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    if (Echoes.recordMissionProgress) {
      Echoes.recordMissionProgress(state, "expeditionsStarted", 1);
    }

    Echoes.closeExpeditionModal();
    Echoes.setTab("expeditions");
    saveAndRender(result.message);
  }

  function handleCollectExpeditionAction(target) {
    const result = Echoes.collectExpedition(state, target.dataset.expeditionId);

    if (!result.ok) {
      renderTransientMessage(result.message);
      return;
    }

    if (Echoes.recordMissionProgress) {
      Echoes.recordMissionProgress(state, "expeditionsCollected", 1);
    }

    Echoes.setTab("expeditions");
    saveAndRender(result.message);
  }

  function handleExpeditionChoiceChange(choice) {
    const expeditionId = choice.dataset.expeditionChoice;

    if (choice.checked) {
      const selectedHeroIds = getSelectedExpeditionHeroIds(expeditionId);
      if (selectedHeroIds.length > Echoes.CONFIG.maxExpeditionHeroes) {
        choice.checked = false;
        Echoes.setMessage(`Cada expedicao aceita no maximo ${Echoes.CONFIG.maxExpeditionHeroes} herois.`);
        Echoes.syncNoticeMessage();
        return;
      }
    }

    updateExpeditionManualPower(expeditionId);
  }

  function handleAction(target) {
    const action = target.dataset.action;

    if (action === "continueTower") {
      Echoes.setTab("tower");
      Echoes.render(state);
      return;
    }

    if (action === "viewBattleReplay") {
      Echoes.setTab("battle");
      Echoes.render(state);
      return;
    }

    if (action === "save") return handleSaveAction();
    if (action === "continueNarrative") return handleNarrativeAction(target, false);
    if (action === "skipNarrative") return handleNarrativeAction(target, true);
    if (action === "reset") return handleResetAction();
    if (action === "exportSave") return handleExportSaveAction();
    if (action === "importSave") return handleImportSaveAction();
    if (action === "setPreference") return handleSetPreferenceAction(target);
    if (action === "resetPreferences") return handleResetPreferencesAction();
    if (action === "openHeroContract") return handleOpenHeroContractAction();
    if (action === "chooseRecruitmentHero") return handleChooseRecruitmentHeroAction(target);
    if (action === "summon") return handleSummonAction(target);
    if (action === "addFormation") return handleFormationAction(target, true);
    if (action === "removeFormation") return handleFormationAction(target, false);
    if (action === "saveTowerPreset") return handleSaveTowerPresetAction(target);
    if (action === "applyTowerPreset") return handleApplyTowerPresetAction(target);
    if (action === "clearTeamPreset") return handleClearTeamPresetAction(target);
    if (action === "saveExpeditionPresetFromFormation") return handleSaveExpeditionPresetFromFormationAction(target);
    if (action === "battle") return handleBattleAction({ difficultyMode: target.dataset.difficultyMode });
    if (action === "repeatBattle") {
      return handleBattleAction({ repeatFloor: Number(target.dataset.repeatFloor), difficultyMode: target.dataset.difficultyMode });
    }
    if (action === "towerEventChoice") return handleTowerEventChoiceAction(target);
    if (action === "useConsumable") return handleUseConsumableAction(target);
    if (action === "openEquipmentModal") return handleOpenEquipmentModalAction(target);
    if (action === "closeEquipmentModal") return handleCloseEquipmentModalAction(target);
    if (action === "equipItem") return handleEquipItemAction(target);
    if (action === "unequipItem") return handleUnequipItemAction(target);
    if (action === "chooseSpecialization") return handleChooseSpecializationAction(target);
    if (action === "claimDailyMission") return handleClaimDailyMissionAction(target);
    if (action === "claimAchievement") return handleClaimAchievementAction(target);
    if (action === "upgradeRelic") return handleUpgradeRelicAction(target);
    if (action === "clearChapterCompletion") return handleClearChapterCompletionAction();
    if (action === "treatInjuries") return handleTreatInjuriesAction(target);
    if (action === "selectExpeditionPreset") return handleSelectExpeditionPresetAction(target);
    if (action === "startExpeditionPreset") return handleStartExpeditionPresetAction(target);
    if (action === "startExpedition") return handleStartExpeditionAction(target);
    if (action === "collectExpedition") return handleCollectExpeditionAction(target);
    if (action === "openExpeditionModal") return handleOpenExpeditionModalAction(target);
    if (action === "closeExpeditionModal") return handleCloseExpeditionModalAction(target);
    if (action === "setExpeditionModalTab") return handleSetExpeditionModalTabAction(target);
    if (action === "scrollToAnchor") {
      const anchor = document.getElementById(target.dataset.anchor);
      if (anchor) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (action === "setBattleSpeed") {
      Echoes.setBattleSpeed(target.dataset.speed);
      Echoes.render(state);
      return;
    }

    if (action === "clearMessage") {
      Echoes.setMessage("");
      Echoes.render(state);
    }
  }

  function handleTabClick(button) {
    Echoes.setTab(button.dataset.tab);
    Echoes.render(state);
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const tabButton = event.target.closest("[data-tab]");
      if (tabButton) {
        handleTabClick(tabButton);
        return;
      }

      const actionTarget = event.target.closest("[data-action]");
      if (actionTarget) {
        handleAction(actionTarget);
      }
    });

    document.addEventListener("change", (event) => {
      const preferenceInput = event.target.closest("[data-preference-input]");
      if (preferenceInput) {
        handlePreferenceInputChange(preferenceInput);
        return;
      }

      const heroListControl = event.target.closest("[data-hero-list-control]");
      if (heroListControl) {
        handleHeroListControlChange(heroListControl);
        return;
      }

      const teamPresetSelect = event.target.closest("[data-team-preset-select]");
      if (teamPresetSelect) {
        handleTeamPresetSelectChange(teamPresetSelect);
        return;
      }

      const saveImport = event.target.closest("[data-save-import]");
      if (saveImport) {
        handleSaveImportChange(saveImport);
        return;
      }

      const expeditionChoice = event.target.closest("[data-expedition-choice]");
      if (expeditionChoice) {
        handleExpeditionChoiceChange(expeditionChoice);
      }
    });
  }

  function captureExpeditionSelections() {
    const selections = {};
    const choices = Array.from(document.querySelectorAll("[data-expedition-choice]"));

    choices.forEach((choice) => {
      if (!choice.checked) return;

      const expeditionId = choice.dataset.expeditionChoice;
      selections[expeditionId] = selections[expeditionId] || new Set();
      selections[expeditionId].add(choice.value);
    });

    return selections;
  }

  function restoreExpeditionSelections(selections) {
    const choices = Array.from(document.querySelectorAll("[data-expedition-choice]"));

    choices.forEach((choice) => {
      const selectedHeroIds = selections[choice.dataset.expeditionChoice];
      choice.checked = Boolean(selectedHeroIds && selectedHeroIds.has(choice.value) && !choice.disabled);
    });
  }

  function captureExpeditionScrollState() {
    const scrollState = {
      pageX: typeof global.scrollX === "number" ? global.scrollX : 0,
      pageY: typeof global.scrollY === "number" ? global.scrollY : 0,
      lists: {},
    };

    Array.from(document.querySelectorAll("[data-expedition-list]")).forEach((list) => {
      scrollState.lists[list.dataset.expeditionList] = list.scrollTop;
    });

    return scrollState;
  }

  function restoreExpeditionScrollState(scrollState) {
    Array.from(document.querySelectorAll("[data-expedition-list]")).forEach((list) => {
      const savedScrollTop = scrollState.lists[list.dataset.expeditionList];
      if (Number.isFinite(savedScrollTop)) {
        list.scrollTop = savedScrollTop;
      }
    });

    if (typeof global.scrollTo === "function") {
      global.scrollTo(scrollState.pageX, scrollState.pageY);
    }
  }


  function updateExpeditionTabBadge() {
    const ready = state.activeExpeditions.filter((entry) => Echoes.isExpeditionComplete(entry)).length;
    const badge = document.querySelector('.tab-button[data-tab="expeditions"] .tab-badge');

    if (!badge) return;

    badge.textContent = ready > 9 ? "9+" : String(ready);
    badge.hidden = ready <= 0;
    badge.setAttribute("aria-hidden", ready <= 0 ? "true" : "false");
  }

  function ensureExpeditionCollectButton(card, definitionId) {
    if (card.querySelector("[data-expedition-collect]")) return;

    const actions = card.querySelector(".expedition-summary-actions");
    const buttonRow = actions || document.createElement("div");

    if (!actions) {
      buttonRow.className = "button-row expedition-summary-actions";
      card.appendChild(buttonRow);
    }

    buttonRow.innerHTML = `
      <button
        type="button"
        data-action="collectExpedition"
        data-expedition-collect
        data-expedition-id="${definitionId}"
      >
        Coletar
      </button>
    `;
  }

  function updateExpeditionCountdowns() {
    if (Echoes.UI.currentTab !== "expeditions") return;

    (Echoes.EXPEDITION_DEFINITIONS || []).forEach((definition) => {
      const activeExpedition = Echoes.getActiveExpedition(state, definition.id);
      if (!activeExpedition) return;

      const card = document.querySelector(`[data-expedition-card="${definition.id}"]`);
      const container = document.querySelector(`[data-expedition-active="${definition.id}"]`);
      if (!container) return;

      const remainingMs = Echoes.getExpeditionRemainingMs(activeExpedition);
      const isComplete = Echoes.isExpeditionComplete(activeExpedition);
      const durationMs = Echoes.getExpeditionDurationMs
        ? Echoes.getExpeditionDurationMs(state, definition)
        : definition.durationMs;
      const progressValue = isComplete ? durationMs : Math.max(0, durationMs - remainingMs);

      const remainingEl = container.querySelector("[data-expedition-remaining]");
      if (remainingEl) {
        remainingEl.textContent = isComplete ? "Pronta" : Echoes.formatDuration(remainingMs);
      }

      const progressEl = container.querySelector("[data-expedition-progress]");
      if (progressEl) {
        progressEl.max = durationMs;
        progressEl.value = progressValue;
      }

      container.classList.toggle("is-ready", isComplete);

      if (card) {
        card.classList.remove("status-active", "status-ready", "status-available");
        card.classList.add(isComplete ? "status-ready" : "status-active");

        const statusBadge = card.querySelector("[data-expedition-status]");
        if (statusBadge) {
          statusBadge.textContent = isComplete ? "Pronta" : "Em andamento";
        }

        if (isComplete) {
          ensureExpeditionCollectButton(card, definition.id);
        }
      }

      const collectBtn = card ? card.querySelector("[data-expedition-collect]") : null;
      if (collectBtn) {
        collectBtn.disabled = !isComplete;
      }
    });

    updateExpeditionTabBadge();
  }

  function refreshTimedState() {
    const gained = Echoes.regenerateEnergy(state);
    const onExpeditionsTab = Echoes.UI.currentTab === "expeditions";

    if (onExpeditionsTab) {
      if (gained > 0) {
        state = Echoes.saveGameState(state);
        if (Echoes.updateLiveHud) {
          Echoes.updateLiveHud(state);
        }
      }

      if (state.activeExpeditions.length > 0) {
        updateExpeditionCountdowns();
      }

      return;
    }

    if (gained > 0) {
      state = Echoes.saveGameState(state);
      if (Echoes.UI.currentTab !== "battle") {
        Echoes.render(state);
      }
    }
  }

  function init() {
    state = Echoes.loadGameState();
    if (Echoes.ensureIntroNarrative) {
      Echoes.ensureIntroNarrative(state);
    }
    if (Echoes.queueChapterStartNarrative) {
      Echoes.queueChapterStartNarrative(state, state.towerFloor);
    }
    state = Echoes.saveGameState(state);
    if (Echoes.applyPreferences) {
      Echoes.applyPreferences();
    }
    if (Echoes.applyBattlePreferences) {
      Echoes.applyBattlePreferences();
    }
    bindEvents();
    Echoes.render(state);

    setInterval(refreshTimedState, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
