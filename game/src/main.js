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

  function handleResetAction() {
    const firstConfirmation = global.confirm(
      "Resetar todo o progresso local? Essa acao apaga o save deste navegador e nao pode ser desfeita sem um backup exportado."
    );
    if (!firstConfirmation) return;

    const secondConfirmation = global.confirm("Confirmar reset definitivo do save? Esta acao e irreversivel.");
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
      renderTransientMessage("Campo de importacao nao encontrado.");
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

  function getBattleMessage(result, repeatFloor) {
    if (result.result !== "victory") {
      return repeatFloor ? `Repeticao do andar ${repeatFloor} perdida.` : "Combate perdido.";
    }

    return repeatFloor ? `Andar ${repeatFloor} repetido. Recompensas aplicadas.` : "Combate vencido. Recompensas aplicadas.";
  }

  function handleBattleAction(options) {
    const repeatFloor = options && options.repeatFloor;
    const result = Echoes.runTowerBattle(state, options);

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

    Echoes.setTab("battle");
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

    const battleResult = Echoes.runTowerBattle(state, { skipEventRoll: true });

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

    Echoes.setTab("battle");
    saveAndRender(`${eventResult.message} ${getBattleMessage(battleResult)}`);
  }

  function getEquipmentSelectValue(heroId, slot) {
    const selects = Array.from(document.querySelectorAll("[data-equipment-select]"));
    const select = selects.find((item) => item.dataset.heroId === heroId && item.dataset.equipmentSelect === slot);
    return select ? select.value : "";
  }

  function handleEquipItemAction(target) {
    const equipmentId = getEquipmentSelectValue(target.dataset.heroId, target.dataset.slot);

    if (!equipmentId) {
      renderTransientMessage("Escolha um equipamento para esse slot.");
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
      renderTransientMessage("Especializacao invalida.");
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

  function getSelectedExpeditionHeroIds(expeditionId) {
    const choices = Array.from(document.querySelectorAll(`[data-expedition-choice="${expeditionId}"]`));
    return choices.filter((choice) => choice.checked && !choice.disabled).map((choice) => choice.value);
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
    if (!choice.checked) return;

    const selectedHeroIds = getSelectedExpeditionHeroIds(choice.dataset.expeditionChoice);
    if (selectedHeroIds.length <= Echoes.CONFIG.maxExpeditionHeroes) return;

    choice.checked = false;
    Echoes.setMessage(`Cada expedicao aceita no maximo ${Echoes.CONFIG.maxExpeditionHeroes} herois.`);
    renderTimedState();
  }

  function handleAction(target) {
    const action = target.dataset.action;

    if (action === "save") return handleSaveAction();
    if (action === "reset") return handleResetAction();
    if (action === "exportSave") return handleExportSaveAction();
    if (action === "importSave") return handleImportSaveAction();
    if (action === "summon") return handleSummonAction(target);
    if (action === "addFormation") return handleFormationAction(target, true);
    if (action === "removeFormation") return handleFormationAction(target, false);
    if (action === "battle") return handleBattleAction();
    if (action === "repeatBattle") return handleBattleAction({ repeatFloor: Number(target.dataset.repeatFloor) });
    if (action === "towerEventChoice") return handleTowerEventChoiceAction(target);
    if (action === "equipItem") return handleEquipItemAction(target);
    if (action === "unequipItem") return handleUnequipItemAction(target);
    if (action === "chooseSpecialization") return handleChooseSpecializationAction(target);
    if (action === "claimDailyMission") return handleClaimDailyMissionAction(target);
    if (action === "claimAchievement") return handleClaimAchievementAction(target);
    if (action === "clearChapterCompletion") return handleClearChapterCompletionAction();
    if (action === "treatInjuries") return handleTreatInjuriesAction(target);
    if (action === "startExpedition") return handleStartExpeditionAction(target);
    if (action === "collectExpedition") return handleCollectExpeditionAction(target);
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

  function renderTimedState() {
    if (Echoes.UI.currentTab !== "expeditions") {
      Echoes.render(state);
      return;
    }

    const selections = captureExpeditionSelections();
    const scrollState = captureExpeditionScrollState();
    Echoes.render(state);
    restoreExpeditionSelections(selections);
    restoreExpeditionScrollState(scrollState);
  }

  function refreshTimedState() {
    const gained = Echoes.regenerateEnergy(state);
    const shouldRefreshCountdown = Echoes.UI.currentTab === "expeditions" && state.activeExpeditions.length > 0;

    if (gained > 0) {
      state = Echoes.saveGameState(state);
      if (Echoes.UI.currentTab !== "battle") {
        renderTimedState();
      }
      return;
    }

    if (shouldRefreshCountdown) {
      renderTimedState();
    }
  }

  function init() {
    state = Echoes.loadGameState();
    state = Echoes.saveGameState(state);
    bindEvents();
    Echoes.render(state);

    setInterval(refreshTimedState, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
