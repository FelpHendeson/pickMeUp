(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const UI = {
    currentTab: "base",
    message: "",
    heroList: {
      sortBy: "power",
      classKey: "all",
      status: "all",
    },
  };

  const escapeHtml = Echoes.escapeHtml;
  const formatNumber = Echoes.formatNumber;

  function getResourceItems(state) {
    const maxFloor = Echoes.CONFIG.towerMaxFloor;
    const consumableTotal = Object.values(state.consumables || {}).reduce((total, amount) => total + (Number(amount) || 0), 0);
    return [
      ["Conta", `Nv. ${state.accountLevel}`],
      ["Andar", state.towerFloor > maxFloor ? `${maxFloor}/${maxFloor}` : state.towerFloor],
      ["Ouro", formatNumber(state.resources.gold)],
      ["Cristais", formatNumber(state.resources.crystals)],
      ["Essencia", formatNumber(state.resources.essence)],
      ["Fragmentos", formatNumber(state.resources.fragments)],
      ["Frag. Eco", formatNumber(state.echoFragments || 0)],
      ["Contratos", formatNumber(state.heroContracts || 0)],
      ["Consum.", formatNumber(consumableTotal)],
      ["Energia", `${state.resources.energy}/${state.resources.maxEnergy}`],
      ["Equip.", state.inventory.length],
      ["Feridos", Echoes.getInjuredHeroes ? Echoes.getInjuredHeroes(state).length : 0],
      ["Exped.", state.activeExpeditions.length],
      ["Missões", Echoes.getClaimableMissionCount ? Echoes.getClaimableMissionCount(state) : 0],
    ];
  }

  function renderResourceBar(state) {
    const resourceBar = document.getElementById("resourceBar");
    resourceBar.innerHTML = getResourceItems(state)
      .map(
        ([label, value]) => `
          <div class="resource-pill">
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `
      )
      .join("");
  }

  function renderSaveStatus(state) {
    const saveStatus = document.getElementById("saveStatus");
    if (!state.lastSavedAt) {
      saveStatus.textContent = "Save local pronto";
      return;
    }

    const savedAt = new Date(state.lastSavedAt);
    saveStatus.textContent = `Salvo ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function renderMessage() {
    if (!UI.message) return "";
    const text = UI.message;
    const tone = /erro|inval|insuficiente|perdid|derrot|falha|bloquead/i.test(text)
      ? "error"
      : /conquista|missao|recompensa|cristais|ouro|essencia|fragmentos|salvo|concluida|venceu|respond(eu|eu)|equipado/i.test(text)
        ? "success"
        : "info";

    return `<div class="notice notice-${tone}" role="status">${escapeHtml(text)}</div>`;
  }

  function renderNarrativeScene(state) {
    const scene = Echoes.getPendingNarrativeScene ? Echoes.getPendingNarrativeScene(state) : null;
    if (!scene) return "";

    return `
      <section class="narrative-backdrop" role="dialog" aria-modal="true" aria-labelledby="narrativeTitle">
        <article class="narrative-card">
          <p class="eyebrow">Cena</p>
          <h2 id="narrativeTitle">${escapeHtml(scene.title)}</h2>
          <p>${escapeHtml(scene.text)}</p>
          <div class="button-row">
            <button type="button" data-action="continueNarrative" data-scene-id="${scene.id}">Continuar</button>
            <button type="button" class="secondary" data-action="skipNarrative" data-scene-id="${scene.id}">Pular</button>
          </div>
        </article>
      </section>
    `;
  }

  function renderRoomCard(title, level, description) {
    const levelText = level > 0 ? `Nivel ${level}` : "Bloqueada";
    return `
      <article class="card room-card ${level > 0 ? "" : "locked"}">
        <div>
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
        <strong>${levelText}</strong>
      </article>
    `;
  }

  function renderInjuryList(hero, compact) {
    if (!Echoes.getHeroActiveInjuries) return "";

    const injuries = Echoes.getHeroActiveInjuries(hero);
    if (injuries.length === 0) return "";

    return `
      <div class="injury-list ${compact ? "compact" : ""}">
        ${compact ? "" : `<h4>Ferimentos</h4>`}
        ${injuries
          .map((injury) => {
            const definition = Echoes.getInjuryDefinition(injury.typeKey);
            return `
              <span class="injury-pill">
                <strong>${escapeHtml(definition.name)}</strong>
                <em>${escapeHtml(definition.description)} | ${injury.remainingBattles} batalha${injury.remainingBattles === 1 ? "" : "s"}</em>
              </span>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderMoraleBadge(hero) {
    if (!Echoes.getHeroMoraleState) return "";

    const moraleState = Echoes.getHeroMoraleState(hero);
    const morale = Number.isFinite(hero.morale) ? hero.morale : 80;

    return `<span class="morale-badge morale-${moraleState.tone}">Moral ${morale}/100 | ${moraleState.label}</span>`;
  }

  function renderSpecializationBadge(hero) {
    if (!Echoes.getHeroSpecialization) return "";

    const specialization = Echoes.getHeroSpecialization(hero);
    if (specialization) {
      return `<span class="specialization-badge">${escapeHtml(specialization.name)} | ${escapeHtml(specialization.passiveName)}</span>`;
    }

    if (hero.level >= Echoes.SPECIALIZATION_LEVEL) {
      return `<span class="specialization-badge pending">Especialização disponivel</span>`;
    }

    return `<span class="specialization-badge locked">Especialização no nivel ${Echoes.SPECIALIZATION_LEVEL}</span>`;
  }

  function renderInfirmaryPatient(hero, state) {
    const goldCost = Echoes.getHeroInjuryTreatmentCost(hero, "gold");
    const essenceCost = Echoes.getHeroInjuryTreatmentCost(hero, "essence");
    const canPayGold = Echoes.canSpendResource(state, "gold", goldCost);
    const canPayEssence = Echoes.canSpendResource(state, "essence", essenceCost);

    return `
      <article class="card infirmary-patient">
        <div>
          <h3>${escapeHtml(hero.name)}</h3>
          ${renderInjuryList(hero, false)}
        </div>
        <div class="button-row">
          <button
            type="button"
            data-action="treatInjuries"
            data-hero-id="${hero.id}"
            data-treatment-resource="gold"
            ${canPayGold ? "" : "disabled"}
          >
            Curar por ${goldCost} ouro
          </button>
          <button
            type="button"
            class="secondary"
            data-action="treatInjuries"
            data-hero-id="${hero.id}"
            data-treatment-resource="essence"
            ${canPayEssence ? "" : "disabled"}
          >
            Curar por ${essenceCost} essencia
          </button>
        </div>
      </article>
    `;
  }

  function renderInfirmary(state) {
    const injuredHeroes = Echoes.getInjuredHeroes ? Echoes.getInjuredHeroes(state) : [];

    return `
      <article class="panel wide infirmary-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Enfermaria</p>
            <h2>Tratamento de ferimentos</h2>
          </div>
          <strong>${injuredHeroes.length} ferido(s)</strong>
        </div>
        <p class="muted">Herois derrotados podem voltar com penalidades por 3 batalhas. Trate ferimentos usando ouro ou essencia.</p>
        ${
          injuredHeroes.length === 0
            ? `<p class="muted">Nenhum heroi precisa de tratamento agora.</p>`
            : `<div class="card-grid infirmary-grid">${injuredHeroes.map((hero) => renderInfirmaryPatient(hero, state)).join("")}</div>`
        }
      </article>
    `;
  }

  function renderWeeklyEventBanner() {
    if (!Echoes.getActiveWeeklyEvent) return "";

    const event = Echoes.getActiveWeeklyEvent();

    return `
      <article class="panel wide weekly-event-banner tone-${event.tone}">
        <div class="weekly-event-content">
          <div>
            <p class="eyebrow">Evento semanal | Semana ${event.weekNumber}</p>
            <h2>${escapeHtml(event.name)}</h2>
            <p class="muted">${escapeHtml(event.summary)}</p>
          </div>
          <div class="weekly-event-effects">
            ${event.effects.map((effect) => `<span>${escapeHtml(effect)}</span>`).join("")}
          </div>
        </div>
      </article>
    `;
  }

  function renderBase(state) {
    const formationPower = Echoes.getFormationPower(state);
    const accountNext = Echoes.getAccountXpForNextLevel(state.accountLevel);

    return `
      <section class="panel-grid">
        ${renderWeeklyEventBanner()}
        <article class="panel focus-panel">
          <p class="eyebrow">Comando</p>
          <h2>Base dimensional</h2>
          <p class="muted">Gerencie recursos, invoque herois e avance pela torre inicial de ${Echoes.CONFIG.towerMaxFloor} andares.</p>
          <div class="summary-grid">
            <div><span>Poder da equipe</span><strong>${formatNumber(formationPower)}</strong></div>
            <div><span>Herois</span><strong>${state.heroes.length}</strong></div>
            <div><span>XP da conta</span><strong>${state.accountXp}/${accountNext}</strong></div>
          </div>
          <div class="button-row">
            <button type="button" data-action="save">Salvar jogo</button>
          </div>
        </article>
        <section class="room-grid">
          ${renderRoomCard("Portal de Invocação", state.baseRooms.summonPortal, "Recruta novos herois com ouro ou cristais.")}
          ${renderRoomCard("Quartel", state.baseRooms.barracks, "Organiza a lista de herois e a equipe ativa.")}
          ${renderRoomCard("Campo de Treino", state.baseRooms.trainingGround, "Base para progressao futura de XP passivo.")}
          ${renderRoomCard("Enfermaria", state.baseRooms.infirmary, "Trata ferimentos de herois derrotados na torre.")}
          ${renderRoomCard("Oficina", state.baseRooms.workshop, "Desbloqueia ao vencer o andar 10.")}
          ${renderRoomCard("Conselho de Missões", state.baseRooms.missionBoard, "Preparado para expedicoes em versoes futuras.")}
        </section>
        ${renderInfirmary(state)}
      </section>
    `;
  }

  function renderHeroActionButton(hero, inFormation, state) {
    const expedition = state && Echoes.getHeroExpedition ? Echoes.getHeroExpedition(state, hero.id) : null;
    if (inFormation) {
      return `<button type="button" class="secondary" data-action="removeFormation" data-hero-id="${hero.id}">Remover da formação</button>`;
    }

    if (expedition) {
      return `<button type="button" class="secondary" disabled>Em expedicao</button>`;
    }

    return `<button type="button" data-action="addFormation" data-hero-id="${hero.id}">Adicionar a formação</button>`;
  }

  function renderHeroStatGrid(hero, state) {
    const stats = Echoes.getHeroEffectiveStats(state, hero);
    const baseStats = hero.stats || {};
    const showDetailedNumbers = Echoes.shouldShowDetailedNumbers ? Echoes.shouldShowDetailedNumbers() : true;

    function renderStat(statKey) {
      const bonus = stats[statKey] - (baseStats[statKey] || 0);
      return `
        <span>
          ${statKey.toUpperCase()} <strong>${stats[statKey]}</strong>
          ${showDetailedNumbers && bonus !== 0 ? `<em class="${bonus > 0 ? "positive" : "negative"}">${bonus > 0 ? "+" : ""}${bonus}</em>` : ""}
        </span>
      `;
    }

    return `
      <div class="stat-grid">
        ${renderStat("hp")}
        ${renderStat("atk")}
        ${renderStat("def")}
        ${renderStat("spd")}
        ${renderStat("focus")}
        ${renderStat("luck")}
      </div>
      <p class="trait">${hero.traitName}: ${hero.traitDescription}</p>
    `;
  }

  function renderEquipmentOptions(state, slot, currentItemId) {
    const items = state.inventory.filter((item) => item.type === slot);

    if (items.length === 0) {
      return `<option value="">Sem itens disponiveis</option>`;
    }

    return [`<option value="">Escolher ${Echoes.getEquipmentTypeName(slot).toLowerCase()}</option>`]
      .concat(
        items.map((item) => {
          const owner = Echoes.findEquipmentOwner(state, item.id);
          const ownerText = owner ? ` - equipado: ${owner.name}` : "";
          const selected = item.id === currentItemId ? "selected" : "";

          return `<option value="${item.id}" ${selected}>${item.rarity}â˜… ${escapeHtml(item.name)} (${Echoes.getEquipmentBonusLabel(item)}${escapeHtml(ownerText)})</option>`;
        })
      )
      .join("");
  }

  function renderHeroEquipmentControls(hero, state) {
    Echoes.normalizeHeroEquipmentSlots(hero);

    return `
      <div class="equipment-controls">
        <h4>Equipamentos</h4>
        ${Echoes.EQUIPMENT_SLOTS.map((slot) => {
          const equippedItem = hero.equipment[slot] ? Echoes.findEquipment(state, hero.equipment[slot]) : null;
          return `
            <div class="equipment-row">
              <div>
                <strong>${Echoes.getEquipmentTypeName(slot)}</strong>
                <span>${equippedItem ? `${escapeHtml(equippedItem.name)} | ${Echoes.getEquipmentBonusLabel(equippedItem)}` : "Vazio"}</span>
              </div>
              <select data-equipment-select="${slot}" data-hero-id="${hero.id}">
                ${renderEquipmentOptions(state, slot, equippedItem && equippedItem.id)}
              </select>
              <button type="button" class="secondary" data-action="equipItem" data-hero-id="${hero.id}" data-slot="${slot}">Equipar</button>
              ${
                equippedItem
                  ? `<button type="button" class="secondary" data-action="unequipItem" data-hero-id="${hero.id}" data-slot="${slot}">Remover</button>`
                  : ""
              }
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function getClassBadgeLabel(hero) {
    return hero.className || "Classe";
  }

  function renderHeroStateBadges(hero, inFormation, expedition) {
    const badges = [];

    if (inFormation) badges.push(`<span class="state-badge formation">Na formação</span>`);
    if (expedition) badges.push(`<span class="state-badge expedition">Em expedicao</span>`);
    if (Echoes.hasHeroInjuries && Echoes.hasHeroInjuries(hero)) badges.push(`<span class="state-badge injured">Ferido</span>`);

    return badges.length > 0 ? `<div class="hero-state-row">${badges.join("")}</div>` : "";
  }

  function renderSpecializationControls(hero) {
    if (!Echoes.getClassSpecializations || !Echoes.canHeroSpecialize) return "";

    const chosen = Echoes.getHeroSpecialization ? Echoes.getHeroSpecialization(hero) : null;
    if (chosen) {
      return `
        <div class="specialization-panel chosen">
          <h4>Especialização</h4>
          <strong>${escapeHtml(chosen.name)} - ${escapeHtml(chosen.passiveName)}</strong>
          <p>${escapeHtml(chosen.description)}</p>
        </div>
      `;
    }

    if (!Echoes.canHeroSpecialize(hero)) return "";

    return `
      <div class="specialization-panel">
        <h4>Escolher especialização</h4>
        <p>Escolha permanente para definir a progressao deste heroi.</p>
        <div class="specialization-options">
          ${Echoes.getClassSpecializations(hero.classKey)
            .map(
              (specialization) => `
                <article>
                  <strong>${escapeHtml(specialization.name)}</strong>
                  <span>${escapeHtml(specialization.passiveName)}: ${escapeHtml(specialization.description)}</span>
                  <button
                    type="button"
                    class="secondary"
                    data-action="chooseSpecialization"
                    data-hero-id="${hero.id}"
                    data-specialization-key="${specialization.key}"
                  >
                    Escolher ${escapeHtml(specialization.name)}
                  </button>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }


  function renderHeroAffinityList(hero, state, compact) {
    if (compact || !state || !Echoes.getHeroAffinitySummaries) return "";

    const affinities = Echoes.getHeroAffinitySummaries(state, hero.id).slice(0, 3);
    if (affinities.length === 0) {
      return '<div class="affinity-list"><h4>Afinidades</h4><p class="muted">Ainda sem vinculos relevantes.</p></div>';
    }

    return (
      '<div class="affinity-list">' +
        '<h4>Afinidades</h4>' +
        affinities.map((affinity) => {
          const progress = affinity.nextXp ? affinity.xp + '/' + affinity.nextXp : 'Max';
          return '<span class="affinity-pill"><strong>' + escapeHtml(affinity.ally.name) + ' | ' + escapeHtml(affinity.label) + '</strong><em>' + escapeHtml(affinity.bonusText) + ' | ' + progress + '</em></span>';
        }).join('') +
      '</div>'
    );
  }

  function renderHeroCard(hero, options) {
    const inFormation = options && options.inFormation;
    const compact = options && options.compact;
    const state = options && options.state;
    const xpNext = Echoes.getHeroXpForNextLevel(hero.level);
    const power = state ? Echoes.getHeroPower(hero, state) : Echoes.getHeroPower(hero);
    const expedition = state && Echoes.getHeroExpedition(state, hero.id);
    const injuredClass = Echoes.hasHeroInjuries && Echoes.hasHeroInjuries(hero) ? "injured" : "";
    const moraleState = Echoes.getHeroMoraleState ? Echoes.getHeroMoraleState(hero) : null;
    const moraleClass = moraleState ? `morale-${moraleState.tone}` : "";
    const formationClass = inFormation ? "in-formation" : "";
    const expeditionClass = expedition ? "on-expedition" : "";

    return `
      <article class="card hero-card rarity-${hero.rarity} class-${hero.classKey} ${injuredClass} ${moraleClass} ${formationClass} ${expeditionClass}">
        <div class="hero-topline">
          <div>
            <h3>${escapeHtml(hero.name)}</h3>
            <p class="stars">${Echoes.getRarityStars(hero.rarity)}</p>
          </div>
          <span class="class-badge class-${hero.classKey}">${escapeHtml(getClassBadgeLabel(hero))}</span>
        </div>
        ${renderHeroStateBadges(hero, inFormation, expedition)}
        <div class="stat-line">
          <span>Nv. ${hero.level}/${hero.maxLevel}</span>
          <span>XP ${hero.xp}/${xpNext}</span>
          <span>Poder ${power}</span>
          ${renderMoraleBadge(hero)}
          ${renderSpecializationBadge(hero)}
          ${expedition ? `<span>Expedicao: ${expedition.name}</span>` : ""}
        </div>
        ${renderInjuryList(hero, compact)}
        ${renderHeroAffinityList(hero, state, compact)}
        ${
          compact
            ? ""
            : `${renderHeroStatGrid(hero, state)}${renderSpecializationControls(hero)}${renderHeroEquipmentControls(hero, state)}`
        }
        <div class="button-row">
          ${renderHeroActionButton(hero, inFormation, state)}
        </div>
      </article>
    `;
  }

  function setHeroListOption(key, value) {
    const allowedSorts = ["power", "rarity", "level", "name", "class"];
    const allowedStatuses = ["all", "available", "formation", "expedition", "injured"];
    const classKeys = ["all"].concat(Object.keys(Echoes.HERO_CLASSES || {}));

    if (key === "sortBy" && allowedSorts.includes(value)) UI.heroList.sortBy = value;
    if (key === "classKey" && classKeys.includes(value)) UI.heroList.classKey = value;
    if (key === "status" && allowedStatuses.includes(value)) UI.heroList.status = value;
  }

  function renderSelectOption(value, label, currentValue) {
    return `<option value="${value}" ${value === currentValue ? "selected" : ""}>${label}</option>`;
  }

  function renderHeroListControls(resultCount, totalCount) {
    const classOptions = [`<option value="all" ${UI.heroList.classKey === "all" ? "selected" : ""}>Todas as classes</option>`]
      .concat(
        Object.entries(Echoes.HERO_CLASSES || {}).map(([classKey, definition]) =>
          renderSelectOption(classKey, definition.name, UI.heroList.classKey)
        )
      )
      .join("");

    return `
      <div class="list-toolbar">
        <label class="control-field">
          <span>Ordenar</span>
          <select data-hero-list-control="sortBy">
            ${renderSelectOption("power", "Poder", UI.heroList.sortBy)}
            ${renderSelectOption("rarity", "Raridade", UI.heroList.sortBy)}
            ${renderSelectOption("level", "Nivel", UI.heroList.sortBy)}
            ${renderSelectOption("name", "Nome", UI.heroList.sortBy)}
            ${renderSelectOption("class", "Classe", UI.heroList.sortBy)}
          </select>
        </label>
        <label class="control-field">
          <span>Classe</span>
          <select data-hero-list-control="classKey">
            ${classOptions}
          </select>
        </label>
        <label class="control-field">
          <span>Status</span>
          <select data-hero-list-control="status">
            ${renderSelectOption("all", "Todos", UI.heroList.status)}
            ${renderSelectOption("available", "Disponiveis", UI.heroList.status)}
            ${renderSelectOption("formation", "Na formação", UI.heroList.status)}
            ${renderSelectOption("expedition", "Em expedicao", UI.heroList.status)}
            ${renderSelectOption("injured", "Feridos", UI.heroList.status)}
          </select>
        </label>
        <strong>${resultCount}/${totalCount} exibido(s)</strong>
      </div>
    `;
  }

  function heroMatchesStatus(hero, state, status) {
    if (status === "all") return true;
    if (status === "available") {
      return (
        !Echoes.isHeroInFormation(state, hero.id) &&
        !(Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id)) &&
        !(Echoes.hasHeroInjuries && Echoes.hasHeroInjuries(hero))
      );
    }
    if (status === "formation") return Echoes.isHeroInFormation(state, hero.id);
    if (status === "expedition") return Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id);
    if (status === "injured") return Echoes.hasHeroInjuries && Echoes.hasHeroInjuries(hero);
    return true;
  }

  function getHeroesForDisplay(heroes, state, options) {
    const filters = options || UI.heroList;
    const classKey = filters.classKey || "all";
    const status = filters.status || "all";

    return sortHeroesForDisplay(
      heroes.filter((hero) => (classKey === "all" || hero.classKey === classKey) && heroMatchesStatus(hero, state, status)),
      state,
      filters.sortBy
    );
  }

  function renderHeroes(state) {
    if (state.heroes.length === 0) {
      return `
        <section class="panel-grid">
          <h2>Herois</h2>
          <p class="muted">Nenhum heroi recrutado ainda. Va ate Invocação para chamar a primeira equipe.</p>
        </section>
      `;
    }

    const sortedHeroes = getHeroesForDisplay(state.heroes, state);

    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Quartel</p>
            <h2>Lista de herois</h2>
          </div>
          <strong>${state.heroes.length} recrutado(s)</strong>
        </div>
        ${renderHeroListControls(sortedHeroes.length, state.heroes.length)}
        <div class="card-grid">
          ${
            sortedHeroes.length === 0
              ? `<p class="muted">Nenhum heroi corresponde aos filtros atuais.</p>`
              : sortedHeroes.map((hero) => renderHeroCard(hero, { inFormation: Echoes.isHeroInFormation(state, hero.id), state })).join("")
          }
        </div>
      </section>
    `;
  }

  function sortHeroesForDisplay(heroes, state, sortBy) {
    const selectedSort = sortBy || "power";

    return heroes.slice().sort((a, b) => {
      const powerDifference = Echoes.getHeroPower(b, state) - Echoes.getHeroPower(a, state);
      const rarityDifference = b.rarity - a.rarity;
      const levelDifference = b.level - a.level;

      if (selectedSort === "name") return a.name.localeCompare(b.name) || powerDifference;
      if (selectedSort === "class") return a.className.localeCompare(b.className) || powerDifference;
      if (selectedSort === "level") return levelDifference || rarityDifference || powerDifference;
      if (selectedSort === "rarity") return rarityDifference || levelDifference || powerDifference;
      return powerDifference || rarityDifference || levelDifference;
    });
  }

  function renderPresetHeroList(state, type, presetIndex) {
    const heroes = Echoes.getTeamPresetHeroes(state, type, presetIndex);
    const filledHeroes = heroes.filter(Boolean);

    if (filledHeroes.length === 0) {
      return `<p class="muted">Nenhum heroi salvo.</p>`;
    }

    return `
      <div class="preset-hero-list">
        ${filledHeroes
          .map((hero) => {
            const expedition = Echoes.getHeroExpedition ? Echoes.getHeroExpedition(state, hero.id) : null;
            return `
              <span>
                <strong>${escapeHtml(hero.name)}</strong>
                <em>${escapeHtml(hero.className)} | Poder ${Echoes.getHeroPower(hero, state)}${expedition ? ` | ${escapeHtml(expedition.name)}` : ""}</em>
              </span>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderTeamPresetHeroOptions(state, currentHeroId, usedHeroIds) {
    const heroes = sortHeroesForDisplay(state.heroes, state, "power");

    return [`<option value="">Slot vazio</option>`]
      .concat(
        heroes.map((hero) => {
          const selected = hero.id === currentHeroId;
          const disabled = usedHeroIds.has(hero.id) && !selected;
          return `
            <option value="${hero.id}" ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}>
              ${escapeHtml(hero.name)} | ${escapeHtml(hero.className)} | Poder ${Echoes.getHeroPower(hero, state)}
            </option>
          `;
        })
      )
      .join("");
  }

  function renderTowerPresetCard(state, preset, index) {
    const heroCount = Echoes.getTeamPresetHeroIds(state, "tower", index).length;
    const busyHeroes = Echoes.getTeamPresetBusyHeroes(state, "tower", index);

    return `
      <article class="team-preset-card">
        <div class="team-preset-head">
          <div>
            <p class="eyebrow">Time salvo</p>
            <h3>${escapeHtml(preset.name)}</h3>
          </div>
          <strong>${formatNumber(Echoes.getTeamPresetPower(state, "tower", index))}</strong>
        </div>
        ${renderPresetHeroList(state, "tower", index)}
        ${busyHeroes.length > 0 ? `<p class="muted">Indisponivel para torre: ${escapeHtml(busyHeroes.map((hero) => hero.name).join(", "))}.</p>` : ""}
        <div class="team-preset-actions">
          <button type="button" class="secondary" data-action="saveTowerPreset" data-preset-index="${index}">Salvar atual</button>
          <button type="button" data-action="applyTowerPreset" data-preset-index="${index}" ${heroCount === 0 ? "disabled" : ""}>Usar</button>
          <button type="button" class="secondary" data-action="clearTeamPreset" data-preset-type="tower" data-preset-index="${index}" ${heroCount === 0 ? "disabled" : ""}>Limpar</button>
        </div>
      </article>
    `;
  }

  function renderExpeditionPresetCard(state, preset, index) {
    const heroIds = preset.heroIds || [];
    const usedHeroIds = new Set(heroIds.filter(Boolean));
    const heroCount = Echoes.getTeamPresetHeroIds(state, "expedition", index).length;

    return `
      <article class="team-preset-card">
        <div class="team-preset-head">
          <div>
            <p class="eyebrow">Expedicao salva</p>
            <h3>${escapeHtml(preset.name)}</h3>
          </div>
          <strong>${formatNumber(Echoes.getTeamPresetPower(state, "expedition", index))}</strong>
        </div>
        <div class="preset-select-grid">
          ${Array.from({ length: Echoes.CONFIG.maxExpeditionHeroes }, (_, slotIndex) => {
            const currentHeroId = heroIds[slotIndex] || "";
            return `
              <label class="control-field">
                <span>Heroi ${slotIndex + 1}</span>
                <select
                  data-team-preset-select
                  data-preset-type="expedition"
                  data-preset-index="${index}"
                  data-preset-slot="${slotIndex}"
                >
                  ${renderTeamPresetHeroOptions(state, currentHeroId, usedHeroIds)}
                </select>
              </label>
            `;
          }).join("")}
        </div>
        <div class="team-preset-actions">
          <button type="button" class="secondary" data-action="saveExpeditionPresetFromFormation" data-preset-index="${index}">Usar 3 da formação</button>
          <button type="button" class="secondary" data-action="clearTeamPreset" data-preset-type="expedition" data-preset-index="${index}" ${heroCount === 0 ? "disabled" : ""}>Limpar</button>
        </div>
      </article>
    `;
  }

  function renderFormationPresetManager(state) {
    const towerPresets = Echoes.getTeamPresets(state, "tower");
    const expeditionPresets = Echoes.getTeamPresets(state, "expedition");

    return `
      <section class="panel wide team-preset-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Favoritos</p>
            <h2>Times predefinidos</h2>
          </div>
          <strong>${Echoes.CONFIG.maxTowerTeamPresets}+${Echoes.CONFIG.maxExpeditionTeamPresets} slots</strong>
        </div>
        <p class="muted">Salve ate 3 times para torre e configure ate 3 times rapidos de expedicao. Os times salvos nao substituem automaticamente sua formação ate voce escolher usar.</p>
        <h3 class="subheading">Torre</h3>
        <div class="team-preset-grid">
          ${towerPresets.map((preset, index) => renderTowerPresetCard(state, preset, index)).join("")}
        </div>
        <h3 class="subheading">Expedicoes</h3>
        <div class="team-preset-grid">
          ${expeditionPresets.map((preset, index) => renderExpeditionPresetCard(state, preset, index)).join("")}
        </div>
      </section>
    `;
  }

  function renderFormationSlot(hero, index, state) {
    const rowName = index < Echoes.CONFIG.frontSlots ? "Frente" : "Tras";
    const slotNumber = index < Echoes.CONFIG.frontSlots ? index + 1 : index - 1;

    return `
      <article class="formation-slot ${hero ? "filled" : ""}">
        <div class="slot-label">${rowName} ${slotNumber}</div>
        ${
          hero
            ? `${renderHeroCard(hero, { inFormation: true, compact: true, state })}`
            : `<div class="empty-slot">Slot vazio</div>`
        }
      </article>
    `;
  }

  function renderFormation(state) {
    const formationHeroes = Echoes.getFormationHeroes(state);
    const slots = formationHeroes.map((hero, index) => renderFormationSlot(hero, index, state)).join("");

    const availableHeroes = sortHeroesForDisplay(
      state.heroes.filter((hero) => !Echoes.isHeroInFormation(state, hero.id)),
      state,
      UI.heroList.sortBy
    );

    return `
      <section class="panel-grid">
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Equipe ativa</p>
              <h2>Formação</h2>
            </div>
            <strong>Poder ${formatNumber(Echoes.getFormationPower(state))}</strong>
          </div>
          <div class="formation-grid">${slots}</div>
        </article>
        ${renderFormationPresetManager(state)}
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Banco</p>
              <h2>Reservas</h2>
            </div>
            <strong>${availableHeroes.length} disponivel(is)</strong>
          </div>
          ${
            availableHeroes.length === 0
              ? `<p class="muted">Nao ha herois fora da formação.</p>`
              : `<div class="card-grid compact-grid">${availableHeroes.map((hero) => renderHeroCard(hero, { compact: true, state })).join("")}</div>`
          }
        </article>
      </section>
    `;
  }


  function renderConsumableTargetOptions(state, definition) {
    if (definition.target !== "hero") return "";

    return (
      '<select data-consumable-target="' + definition.id + '">' +
        state.heroes.map((hero) => {
          const hp = Echoes.getHeroHpSummary ? Echoes.getHeroHpSummary(state, hero) : { current: hero.stats.hp, max: hero.stats.hp };
          const injuryCount = Echoes.getHeroActiveInjuries ? Echoes.getHeroActiveInjuries(hero).length : 0;
          const morale = Number.isFinite(hero.morale) ? hero.morale : 80;
          return '<option value="' + hero.id + '">' + escapeHtml(hero.name) + ' | HP ' + hp.current + '/' + hp.max + ' | Moral ' + morale + ' | Fer. ' + injuryCount + '</option>';
        }).join('') +
      '</select>'
    );
  }

  function renderConsumableCard(state, definition) {
    const quantity = Echoes.getConsumableQuantity ? Echoes.getConsumableQuantity(state, definition.id) : 0;
    const needsTarget = definition.target === "hero";

    return (
      '<article class="card consumable-card">' +
        '<div class="hero-topline">' +
          '<div>' +
            '<p class="eyebrow">' + escapeHtml(definition.moment) + '</p>' +
            '<h3>' + escapeHtml(definition.name) + '</h3>' +
          '</div>' +
          '<span class="class-badge">x' + quantity + '</span>' +
        '</div>' +
        '<p class="muted">' + escapeHtml(definition.description) + '</p>' +
        (needsTarget ? renderConsumableTargetOptions(state, definition) : '') +
        '<button type="button" data-action="useConsumable" data-consumable-id="' + definition.id + '" ' + (quantity > 0 && (!needsTarget || state.heroes.length > 0) ? '' : 'disabled') + '>Usar</button>' +
      '</article>'
    );
  }

  function renderConsumablesSection(state) {
    if (Echoes.normalizeConsumablesState) {
      Echoes.normalizeConsumablesState(state);
    }

    const definitions = Object.values(Echoes.CONSUMABLE_DEFINITIONS || {});
    const total = definitions.reduce((sum, definition) => sum + (Echoes.getConsumableQuantity ? Echoes.getConsumableQuantity(state, definition.id) : 0), 0);

    return (
      '<article class="panel wide consumables-panel">' +
        '<div class="section-head">' +
          '<div>' +
            '<p class="eyebrow">Preparacao</p>' +
            '<h2>Consumiveis</h2>' +
          '</div>' +
          '<strong>' + total + ' item(ns)</strong>' +
        '</div>' +
        '<div class="card-grid consumable-grid">' + definitions.map((definition) => renderConsumableCard(state, definition)).join('') + '</div>' +
      '</article>'
    );
  }

  function renderInventoryItem(item, state) {
    const owner = Echoes.findEquipmentOwner(state, item.id);

    return `
      <article class="card inventory-card rarity-${item.rarity}">
        <div class="hero-topline">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="stars">${Echoes.getRarityStars(item.rarity)}</p>
          </div>
          <span class="class-badge">${Echoes.getEquipmentTypeName(item.type)}</span>
        </div>
        <p class="trait">${Echoes.getEquipmentBonusLabel(item)}</p>
        <p class="muted">${owner ? `Equipado por ${owner.name}` : "Disponivel no inventario"}</p>
      </article>
    `;
  }

  function renderInventory(state) {
    const sortedItems = state.inventory
      .slice()
      .sort((a, b) => b.rarity - a.rarity || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

    return `
      <section class="panel-grid">
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Inventario</p>
              <h2>Equipamentos</h2>
            </div>
            <strong>${state.inventory.length} item(ns)</strong>
          </div>
          ${
            sortedItems.length === 0
              ? `<p class="muted">Nenhum equipamento encontrado ainda. Ven??a andares da torre para ter chance de obter itens.</p>`
              : `<div class="card-grid">${sortedItems.map((item) => renderInventoryItem(item, state)).join("")}</div>`
          }
        </article>
        ${renderConsumablesSection(state)}
      </section>
    `;
  }

  function renderExpeditionHeroOption(hero, definition, state) {
    const busyExpedition = Echoes.getHeroExpedition(state, hero.id);
    const disabled = busyExpedition ? "disabled" : "";
    const busyText = busyExpedition ? ` - em ${busyExpedition.name}` : "";

    return `
      <label class="expedition-hero-option ${busyExpedition ? "busy" : ""}">
        <input
          type="checkbox"
          data-expedition-choice="${definition.id}"
          value="${hero.id}"
          ${disabled}
        />
        <span>${escapeHtml(hero.name)} | Poder ${Echoes.getHeroPower(hero, state)}${busyText}</span>
      </label>
    `;
  }

  function renderExpeditionHelper() {
    return `
      <aside class="helper-panel">
        <div>
          <p class="eyebrow">Ajuda rapida</p>
          <h3>Como expedir</h3>
        </div>
        <div class="helper-list">
          <span><strong>${Echoes.CONFIG.maxExpeditionHeroes}</strong> herois no maximo por expedicao.</span>
          <span>Herois enviados nao entram na torre ate retornarem.</span>
          <span>Poder abaixo do recomendado reduz a recompensa, sem chance de falha.</span>
          <span>O tempo continua contando com o jogo fechado.</span>
        </div>
      </aside>
    `;
  }

  function renderActiveExpedition(definition, activeExpedition, state) {
    const remainingMs = Echoes.getExpeditionRemainingMs(activeExpedition);
    const isComplete = Echoes.isExpeditionComplete(activeExpedition);
    const sentHeroes = activeExpedition.heroIds.map((heroId) => Echoes.findHero(state, heroId)).filter(Boolean);
    const reward = Echoes.getActiveExpeditionReward(state, activeExpedition);

    return `
      <div class="expedition-active">
        <div class="summary-grid">
          <div><span>Tempo restante</span><strong>${isComplete ? "Pronta" : Echoes.formatDuration(remainingMs)}</strong></div>
          <div><span>Poder enviado</span><strong>${reward.power}/${definition.recommendedPower}</strong></div>
          <div><span>Recompensa</span><strong>${reward.amount} ${Echoes.getExpeditionRewardName(reward.type)}</strong></div>
        </div>
        <p class="muted">Herois enviados: ${sentHeroes.map((hero) => hero.name).join(", ")}</p>
        <button type="button" data-action="collectExpedition" data-expedition-id="${definition.id}" ${isComplete ? "" : "disabled"}>
          Coletar recompensa
        </button>
      </div>
    `;
  }

  function renderExpeditionPresetActions(state, definition) {
    const presets = Echoes.getTeamPresets(state, "expedition");

    return `
      <div class="expedition-preset-panel">
        <div class="team-preset-head">
          <div>
            <p class="eyebrow">Times rapidos</p>
            <h3>Usar predefinido</h3>
          </div>
          <strong>${Echoes.CONFIG.maxExpeditionHeroes} max.</strong>
        </div>
        <div class="expedition-preset-grid">
          ${presets
            .map((preset, index) => {
              const heroIds = Echoes.getTeamPresetHeroIds(state, "expedition", index);
              const busyHeroes = Echoes.getTeamPresetBusyHeroes(state, "expedition", index);
              const disabled = heroIds.length === 0 || busyHeroes.length > 0;
              const helperText =
                heroIds.length === 0
                  ? "Vazio"
                  : busyHeroes.length > 0
                    ? `Ocupado: ${busyHeroes.map((hero) => hero.name).join(", ")}`
                    : `${heroIds.length} heroi(s) | Poder ${Echoes.getTeamPresetPower(state, "expedition", index)}`;

              return `
                <div class="expedition-preset-card">
                  <strong>${escapeHtml(preset.name)}</strong>
                  <span>${escapeHtml(helperText)}</span>
                  <div class="team-preset-actions">
                    <button
                      type="button"
                      class="secondary"
                      data-action="selectExpeditionPreset"
                      data-expedition-id="${definition.id}"
                      data-preset-index="${index}"
                      ${disabled ? "disabled" : ""}
                    >
                      Selecionar
                    </button>
                    <button
                      type="button"
                      data-action="startExpeditionPreset"
                      data-expedition-id="${definition.id}"
                      data-preset-index="${index}"
                      ${disabled ? "disabled" : ""}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderAvailableExpedition(definition, state) {
    const availableHeroes = state.heroes.slice().sort((a, b) => Echoes.getHeroPower(b, state) - Echoes.getHeroPower(a, state));
    const selectableHeroes = availableHeroes.filter((hero) => !Echoes.getHeroExpedition(state, hero.id));
    const baseReward = `${definition.reward.amount} ${Echoes.getExpeditionRewardName(definition.reward.type)}`;
    const durationMs = Echoes.getExpeditionDurationMs ? Echoes.getExpeditionDurationMs(state, definition) : definition.durationMs;

    return `
      <div class="expedition-setup">
        <div class="summary-grid">
          <div><span>Duração</span><strong>${Echoes.formatDuration(definition.durationMs)}</strong></div>
          <div><span>Poder recomendado</span><strong>${definition.recommendedPower}</strong></div>
          <div><span>Recompensa base</span><strong>${baseReward}</strong></div>
        </div>
        ${renderExpeditionPresetActions(state, definition)}
        <h3 class="subheading">Escolha manual</h3>
        <div class="expedition-hero-list" data-expedition-list="${definition.id}">
          ${
            availableHeroes.length === 0
              ? `<p class="muted">Nenhum heroi disponivel.</p>`
              : availableHeroes.map((hero) => renderExpeditionHeroOption(hero, definition, state)).join("")
          }
        </div>
        <button type="button" data-action="startExpedition" data-expedition-id="${definition.id}" ${
          selectableHeroes.length === 0 ? "disabled" : ""
        }>Enviar expedicao</button>
      </div>
    `;
  }

  function renderExpeditions(state) {
    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Missões idle</p>
            <h2>Expedicoes</h2>
          </div>
          <strong>${state.activeExpeditions.length}/3 em andamento</strong>
        </div>
        <div class="card-grid expedition-grid">
          ${Echoes.EXPEDITION_DEFINITIONS.map((definition) => {
            const activeExpedition = Echoes.getActiveExpedition(state, definition.id);
            return `
              <article class="card expedition-card">
                <div class="hero-topline">
                  <div>
                    <h3>${definition.name}</h3>
                    <p class="muted">${definition.description}</p>
                  </div>
                  <span class="class-badge">${definition.reward.type === "xp" ? "XP" : Echoes.getExpeditionRewardName(definition.reward.type)}</span>
                </div>
                ${activeExpedition ? renderActiveExpedition(definition, activeExpedition, state) : renderAvailableExpedition(definition, state)}
              </article>
            `;
          }).join("")}
        </div>
        ${renderExpeditionHelper()}
      </section>
    `;
  }


  function renderRecruitmentHeroOption(hero) {
    const stats = hero.stats || {};
    const specializationHint = Echoes.getFutureSpecializationHint ? Echoes.getFutureSpecializationHint(hero) : "";

    return (
      '<article class="card hero-card recruitment-option rarity-' + hero.rarity + ' class-' + hero.classKey + '">' +
        '<div class="hero-topline">' +
          '<div>' +
            '<p class="stars">' + Echoes.getRarityStars(hero.rarity) + '</p>' +
            '<h3>' + escapeHtml(hero.name) + '</h3>' +
          '</div>' +
          '<span class="class-badge class-' + hero.classKey + '">' + escapeHtml(hero.className) + '</span>' +
        '</div>' +
        '<p class="trait">' + escapeHtml(hero.traitName) + ': ' + escapeHtml(hero.traitDescription) + '</p>' +
        (hero.recruitmentTag ? '<p class="muted">Origem: ' + escapeHtml(hero.recruitmentTag) + '</p>' : '') +
        '<div class="stat-line">' +
          '<span>HP ' + (stats.hp || 0) + '</span>' +
          '<span>ATK ' + (stats.atk || 0) + '</span>' +
          '<span>DEF ' + (stats.def || 0) + '</span>' +
          '<span>SPD ' + (stats.spd || 0) + '</span>' +
          '<span>FOCUS ' + (stats.focus || 0) + '</span>' +
          '<span>LUCK ' + (stats.luck || 0) + '</span>' +
        '</div>' +
        (specializationHint ? '<p class="muted">Especializacoes futuras: ' + escapeHtml(specializationHint) + '</p>' : '') +
        '<button type="button" data-action="chooseRecruitmentHero" data-hero-id="' + hero.id + '">Recrutar</button>' +
      '</article>'
    );
  }

  function renderRecruitmentChoiceModal(state) {
    if (Echoes.normalizeRecruitmentState) {
      Echoes.normalizeRecruitmentState(state);
    }

    const choice = state.pendingRecruitmentChoice;
    if (!choice) return "";

    return (
      '<section class="recruitment-backdrop" role="dialog" aria-modal="true" aria-labelledby="recruitmentTitle">' +
        '<article class="recruitment-modal">' +
          '<div class="section-head">' +
            '<div>' +
              '<p class="eyebrow">Recrutamento</p>' +
              '<h2 id="recruitmentTitle">' + escapeHtml(choice.title) + '</h2>' +
              '<p class="muted">' + escapeHtml(choice.description) + '</p>' +
            '</div>' +
            '<strong>Escolha 1 de ' + choice.options.length + '</strong>' +
          '</div>' +
          '<div class="card-grid recruitment-grid">' + choice.options.map(renderRecruitmentHeroOption).join('') + '</div>' +
        '</article>' +
      '</section>'
    );
  }

  function renderRecruitmentPanel(state) {
    const contracts = state.heroContracts || 0;
    return (
      '<article class="panel summon-panel recruitment-panel">' +
        '<p class="eyebrow">Contratos</p>' +
        '<h2>Recrutamento</h2>' +
        '<p class="muted">Use um Contrato de Heroi para revelar tres candidatos e escolher apenas um.</p>' +
        '<div class="summary-grid">' +
          '<div><span>Disponiveis</span><strong>' + formatNumber(contracts) + '</strong></div>' +
          '<div><span>Escolha</span><strong>1 de 3</strong></div>' +
        '</div>' +
        '<button type="button" data-action="openHeroContract" ' + (contracts > 0 && !state.pendingRecruitmentChoice ? '' : 'disabled') + '>Usar contrato</button>' +
      '</article>'
    );
  }

  function renderSummonRates(type) {
    const table = Echoes.getAdjustedSummonRarityTable ? Echoes.getAdjustedSummonRarityTable(type) : Echoes.SUMMON_RARITY_TABLES[type];
    return table.map((entry) => `${entry.rarity}â˜… ${entry.chance}%`).join(" | ");
  }

  function renderSummon(state) {
    const commonCost = Echoes.getSummonCost("common", state);
    const superiorCost = Echoes.getSummonCost("superior", state);
    const last = state.summonHistory[0];

    return `
      <section class="panel-grid two-columns">
        <article class="panel summon-panel">
          <p class="eyebrow">Portal</p>
          <h2>Invocação comum</h2>
          <p class="muted">Custo: ${commonCost.amount} ouro.</p>
          <p class="rates">${renderSummonRates("common")}</p>
          <button type="button" data-action="summon" data-summon-type="common" ${
            state.resources.gold < commonCost.amount ? "disabled" : ""
          }>Invocar com ouro</button>
        </article>
        <article class="panel summon-panel superior">
          <p class="eyebrow">Cristais</p>
          <h2>Invocação superior</h2>
          <p class="muted">Custo: ${superiorCost.amount} cristais.</p>
          <p class="rates">${renderSummonRates("superior")}</p>
          <button type="button" data-action="summon" data-summon-type="superior" ${
            state.resources.crystals < superiorCost.amount ? "disabled" : ""
          }>Invocar com cristais</button>
        </article>
        ${renderRecruitmentPanel(state)}
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Historico</p>
              <h2>Ultimas invocacoes</h2>
            </div>
            ${last ? `<strong>${last.rarity}â˜… ${escapeHtml(last.name)}</strong>` : ""}
          </div>
          ${
            state.summonHistory.length === 0
              ? `<p class="muted">O historico aparecera aqui apos a primeira invocação.</p>`
              : `<div class="history-list">${state.summonHistory
                  .map(
                    (entry) => `
                    <div>
                      <strong>${entry.rarity}â˜… ${escapeHtml(entry.name)}</strong>
                      <span>${entry.className} | ${entry.type === "superior" ? "Superior" : "Comum"}</span>
                    </div>
                  `
                  )
                  .join("")}</div>`
          }
        </article>
      </section>
    `;
  }

  function renderProgressBar(current, target) {
    const safeTarget = Math.max(1, target);

    return `
      <progress class="mission-progress" value="${Math.min(current, safeTarget)}" max="${safeTarget}" aria-label="Progresso ${current} de ${target}"></progress>
    `;
  }

  function renderMissionReward(reward) {
    return Echoes.formatMissionReward ? Echoes.formatMissionReward(reward) : "";
  }

  function renderDailyMissionCard(state, mission) {
    const progress = Echoes.getDailyMissionProgress(state, mission);
    const complete = Echoes.isDailyMissionComplete(state, mission);
    const claimed = Boolean(state.dailyMissions && state.dailyMissions.claimed && state.dailyMissions.claimed[mission.id]);

    return `
      <article class="card mission-card ${complete ? "complete" : ""} ${claimed ? "claimed" : ""}">
        <div class="mission-card-head">
          <div>
            <h3>${escapeHtml(mission.title)}</h3>
            <p class="muted">${escapeHtml(mission.description)}</p>
          </div>
          <span class="class-badge">${progress}/${mission.target}</span>
        </div>
        ${renderProgressBar(progress, mission.target)}
        <p class="mission-reward">Recompensa: ${escapeHtml(renderMissionReward(mission.reward))}</p>
        <button
          type="button"
          data-action="claimDailyMission"
          data-mission-id="${mission.id}"
          ${complete && !claimed ? "" : "disabled"}
        >
          ${claimed ? "Coletada" : complete ? "Coletar recompensa" : "Em progresso"}
        </button>
      </article>
    `;
  }

  function renderAchievementCard(state, achievement) {
    const progress = Echoes.getAchievementProgress(state, achievement);
    const complete = Echoes.isAchievementComplete(state, achievement);
    const claimed = Boolean(state.achievements && state.achievements[achievement.id] && state.achievements[achievement.id].claimed);

    return `
      <article class="card mission-card achievement-card ${complete ? "complete" : ""} ${claimed ? "claimed" : ""}">
        <div class="mission-card-head">
          <div>
            <h3>${escapeHtml(achievement.title)}</h3>
            <p class="muted">${escapeHtml(achievement.description)}</p>
          </div>
          <span class="class-badge">${progress}/${achievement.target}</span>
        </div>
        ${renderProgressBar(progress, achievement.target)}
        <p class="mission-reward">Recompensa: ${escapeHtml(renderMissionReward(achievement.reward))}</p>
        <button
          type="button"
          data-action="claimAchievement"
          data-achievement-id="${achievement.id}"
          ${complete && !claimed ? "" : "disabled"}
        >
          ${claimed ? "Coletada" : complete ? "Coletar recompensa" : "Bloqueada"}
        </button>
      </article>
    `;
  }


  function renderRelicCard(state, relic) {
    const relicState = Echoes.getRelicState(state, relic.id);
    const unlocked = Echoes.isRelicUnlocked(state, relic);
    const maxed = relicState.level >= relic.maxLevel;
    const cost = Echoes.getRelicUpgradeCost(relic, relicState.level);
    const canUpgrade = unlocked && !maxed && Echoes.getResourceAmount(state, "echoFragments") >= cost;

    return (
      '<article class="card relic-card ' + (unlocked ? 'unlocked' : 'locked') + ' ' + (maxed ? 'maxed' : '') + '">' +
        '<div class="relic-card-head">' +
          '<div>' +
            '<p class="eyebrow">' + (unlocked ? 'Reliquia permanente' : 'Bloqueada') + '</p>' +
            '<h3>' + escapeHtml(relic.name) + '</h3>' +
          '</div>' +
          '<span class="class-badge">Nv. ' + relicState.level + '/' + relic.maxLevel + '</span>' +
        '</div>' +
        '<p class="muted">' + escapeHtml(relic.description) + '</p>' +
        '<div class="relic-effect-box">' +
          '<span>Atual</span>' +
          '<strong>' + escapeHtml(Echoes.getRelicCurrentEffectText(state, relic)) + '</strong>' +
        '</div>' +
        '<div class="relic-effect-box next">' +
          '<span>Proximo</span>' +
          '<strong>' + escapeHtml(Echoes.getRelicNextEffectText(state, relic)) + '</strong>' +
        '</div>' +
        '<p class="relic-unlock-text">' + escapeHtml(Echoes.getRelicUnlockText(state, relic)) + '</p>' +
        '<button type="button" data-action="upgradeRelic" data-relic-id="' + relic.id + '" ' + (canUpgrade ? '' : 'disabled') + '>' +
          (maxed ? 'Nivel maximo' : unlocked ? 'Melhorar (' + cost + ' Fragmentos de Eco)' : 'Bloqueada') +
        '</button>' +
      '</article>'
    );
  }

  function renderRelics(state) {
    if (Echoes.normalizeRelicState) {
      Echoes.normalizeRelicState(state);
    }

    const relics = Echoes.RELIC_DEFINITIONS || [];
    const unlockedCount = relics.filter((relic) => Echoes.isRelicUnlocked(state, relic)).length;
    const totalLevels = relics.reduce((total, relic) => total + Echoes.getRelicState(state, relic.id).level, 0);

    return (
      '<section class="panel-grid">' +
        '<article class="panel focus-panel relic-hero-panel">' +
          '<p class="eyebrow">Conta permanente</p>' +
          '<h2>Reliquias</h2>' +
          '<p class="muted">Fragmentos de Eco aprimoram bonus globais da conta. Esses efeitos permanecem no save e afetam todos os herois e sistemas relacionados.</p>' +
          '<div class="summary-grid">' +
            '<div><span>Fragmentos de Eco</span><strong>' + formatNumber(state.echoFragments || 0) + '</strong></div>' +
            '<div><span>Reliquias disponiveis</span><strong>' + unlockedCount + '/' + relics.length + '</strong></div>' +
            '<div><span>Niveis ativos</span><strong>' + totalLevels + '</strong></div>' +
          '</div>' +
        '</article>' +
        '<article class="panel wide">' +
          '<div class="section-head">' +
            '<div>' +
              '<p class="eyebrow">Aprimoramentos</p>' +
              '<h2>Acervo de ecos</h2>' +
            '</div>' +
            '<strong>' + formatNumber(state.echoFragments || 0) + ' eco</strong>' +
          '</div>' +
          '<div class="card-grid relic-grid">' +
            relics.map((relic) => renderRelicCard(state, relic)).join('') +
          '</div>' +
        '</article>' +
      '</section>'
    );
  }


  function renderLibraryEnemyCard(state, enemyKey) {
    const view = Echoes.getLibraryEnemyView(state, enemyKey);
    const stats = view.stats || {};
    return (
      '<article class="card library-card ' + (view.discovered ? '' : 'locked') + '">' +
        '<div class="hero-topline"><div><p class="eyebrow">' + escapeHtml(view.role) + '</p><h3>' + escapeHtml(view.name) + '</h3></div>' +
        '<span class="class-badge">' + view.encountered + ' visto(s)</span></div>' +
        '<p class="muted">' + escapeHtml(view.description) + '</p>' +
        '<div class="summary-grid">' +
          '<div><span>Regiao</span><strong>' + escapeHtml(view.region) + '</strong></div>' +
          '<div><span>Derrotas</span><strong>' + view.defeated + '</strong></div>' +
          '<div><span>Andar</span><strong>' + (view.lastFloor || '???') + '</strong></div>' +
        '</div>' +
        (view.detailsUnlocked ? '<p class="trait">HP ' + stats.hp + ' | ATK ' + stats.atk + ' | DEF ' + stats.def + ' | SPD ' + stats.spd + ' | FOCUS ' + stats.focus + '</p>' : '<p class="muted">Derrote ' + Echoes.ENEMY_DETAILS_UNLOCK_DEFEATS + ' vez(es) para liberar atributos, habilidades e drops.</p>') +
        (view.detailsUnlocked ? '<p class="muted">Habilidades: ' + view.abilities.map(escapeHtml).join(' | ') + '</p><p class="muted">Drops: ' + view.drops.map(escapeHtml).join(' | ') + '</p>' : '') +
      '</article>'
    );
  }

  function renderLibraryBossCard(state, bossKey) {
    const boss = state.library.bosses[bossKey] || {};
    const enemy = Echoes.ENEMY_ARCHETYPES[bossKey] || {};
    return (
      '<article class="card library-card ' + (boss.defeated ? '' : 'locked') + '">' +
        '<div class="hero-topline"><div><p class="eyebrow">Chefe</p><h3>' + escapeHtml(enemy.name || 'Chefe desconhecido') + '</h3></div>' +
        '<span class="class-badge">' + (boss.bestResult === 'victory' ? 'Vencido' : 'Encontrado') + '</span></div>' +
        '<p class="muted">Capitulo: ' + escapeHtml(boss.chapterName || '???') + '</p>' +
        '<div class="summary-grid">' +
          '<div><span>Tentativas</span><strong>' + (boss.attempts || 0) + '</strong></div>' +
          '<div><span>Melhor</span><strong>' + escapeHtml(boss.bestResult || '???') + '</strong></div>' +
          '<div><span>Recompensa</span><strong>' + escapeHtml(boss.specialReward || '???') + '</strong></div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderLibraryEventCard(state, eventKey) {
    const eventRecord = state.library.events[eventKey] || { encountered: 0, results: [] };
    const definition = Echoes.TOWER_EVENT_DEFINITIONS[eventKey];
    const discovered = eventRecord.encountered > 0;
    return (
      '<article class="card library-card ' + (discovered ? '' : 'locked') + '">' +
        '<div class="hero-topline"><div><p class="eyebrow">Evento</p><h3>' + escapeHtml(discovered ? definition.title : 'Evento desconhecido') + '</h3></div>' +
        '<span class="class-badge">' + eventRecord.encountered + 'x</span></div>' +
        '<p class="muted">' + escapeHtml(discovered ? definition.description : 'Ainda nao encontrado na torre.') + '</p>' +
        '<p class="trait">Resultados vistos: ' + (eventRecord.results.length ? eventRecord.results.map(escapeHtml).join(' | ') : '???') + '</p>' +
      '</article>'
    );
  }

  function renderLibraryRelicCard(state, relic) {
    const unlocked = Echoes.isRelicUnlocked(state, relic);
    return '<article class="card library-card ' + (unlocked ? '' : 'locked') + '"><div class="hero-topline"><div><p class="eyebrow">Reliquia</p><h3>' + escapeHtml(unlocked ? relic.name : 'Reliquia bloqueada') + '</h3></div><span class="class-badge">' + (unlocked ? 'Visivel' : 'Bloqueada') + '</span></div><p class="muted">' + escapeHtml(unlocked ? relic.description : Echoes.getRelicUnlockText(state, relic)) + '</p></article>';
  }

  function renderLibraryHeroes(state) {
    const classes = Object.values(state.library.heroes.classes || {});
    const rarities = Object.values(state.library.heroes.rarities || {});
    const traits = Object.values(state.library.heroes.traits || {});
    return (
      '<article class="panel wide"><div class="section-head"><div><p class="eyebrow">Colecao</p><h2>Herois Encontrados</h2></div><strong>' + classes.length + ' classe(s)</strong></div>' +
      '<div class="summary-grid"><div><span>Classes</span><strong>' + (classes.map((item) => escapeHtml(item.name)).join(' | ') || 'Nenhuma') + '</strong></div>' +
      '<div><span>Raridades</span><strong>' + (rarities.map((item) => escapeHtml(item.name)).join(' | ') || 'Nenhuma') + '</strong></div>' +
      '<div><span>Tracos</span><strong>' + (traits.map((item) => escapeHtml(item.name)).join(' | ') || 'Nenhum') + '</strong></div></div></article>'
    );
  }

  function renderLibrary(state) {
    if (Echoes.normalizeLibraryState) Echoes.normalizeLibraryState(state);
    const enemyKeys = Object.keys(Echoes.ENEMY_ARCHETYPES || {}).filter((key) => Echoes.ENEMY_ARCHETYPES[key].role !== 'chefe');
    const bossKeys = Object.keys(Echoes.ENEMY_ARCHETYPES || {}).filter((key) => Echoes.ENEMY_ARCHETYPES[key].role === 'chefe');
    const eventKeys = Object.keys(Echoes.TOWER_EVENT_DEFINITIONS || {});
    const discoveredEnemies = Object.values(state.library.enemies || {}).filter((record) => record.encountered > 0).length;
    return (
      '<section class="panel-grid">' +
        '<article class="panel focus-panel"><p class="eyebrow">Descobertas</p><h2>Biblioteca</h2><p class="muted">Registros sao preenchidos conforme voce enfrenta inimigos, vence chefes, resolve eventos e encontra herois.</p><div class="summary-grid"><div><span>Inimigos</span><strong>' + discoveredEnemies + '</strong></div><div><span>Chefes</span><strong>' + Object.keys(state.library.bosses || {}).length + '</strong></div><div><span>Eventos</span><strong>' + Object.keys(state.library.events || {}).length + '</strong></div></div></article>' +
        '<article class="panel wide"><div class="section-head"><div><p class="eyebrow">Bestiario</p><h2>Inimigos</h2></div><strong>' + enemyKeys.length + ' entrada(s)</strong></div><div class="card-grid library-grid">' + enemyKeys.map((key) => renderLibraryEnemyCard(state, key)).join('') + '</div></article>' +
        '<article class="panel wide"><div class="section-head"><div><p class="eyebrow">Chefes</p><h2>Marcos de capitulo</h2></div></div><div class="card-grid library-grid">' + bossKeys.map((key) => renderLibraryBossCard(state, key)).join('') + '</div></article>' +
        '<article class="panel wide"><div class="section-head"><div><p class="eyebrow">Eventos da Torre</p><h2>Ocorrencias</h2></div></div><div class="card-grid library-grid">' + eventKeys.map((key) => renderLibraryEventCard(state, key)).join('') + '</div></article>' +
        '<article class="panel wide"><div class="section-head"><div><p class="eyebrow">Reliquias</p><h2>Arquivo permanente</h2></div></div><div class="card-grid library-grid">' + (Echoes.RELIC_DEFINITIONS || []).map((relic) => renderLibraryRelicCard(state, relic)).join('') + '</div></article>' +
        renderLibraryHeroes(state) +
      '</section>'
    );
  }

  function renderMissions(state) {
    if (Echoes.normalizeMissionState) {
      Echoes.normalizeMissionState(state);
    }

    const claimable = Echoes.getClaimableMissionCount ? Echoes.getClaimableMissionCount(state) : 0;
    const dailyDate = state.dailyMissions && state.dailyMissions.dateKey ? state.dailyMissions.dateKey : "";

    return `
      <section class="panel-grid">
        <article class="panel focus-panel mission-hero-panel">
          <p class="eyebrow">Objetivos</p>
          <h2>Missões e conquistas</h2>
          <p class="muted">Complete objetivos jogando normalmente e colete recompensas uma unica vez. Missões diarias reiniciam pela data local do navegador.</p>
          <div class="summary-grid">
            <div><span>Data diaria</span><strong>${escapeHtml(dailyDate)}</strong></div>
            <div><span>Recompensas prontas</span><strong>${claimable}</strong></div>
            <div><span>Vitorias na torre</span><strong>${state.missionStats.towerVictories || 0}</strong></div>
          </div>
        </article>
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Reset diario</p>
              <h2>Missões diarias</h2>
            </div>
            <strong>${dailyDate}</strong>
          </div>
          <div class="card-grid mission-grid">
            ${Echoes.DAILY_MISSION_DEFINITIONS.map((mission) => renderDailyMissionCard(state, mission)).join("")}
          </div>
        </article>
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Permanentes</p>
              <h2>Conquistas</h2>
            </div>
            <strong>${Echoes.ACHIEVEMENT_DEFINITIONS.length} objetivo(s)</strong>
          </div>
          <div class="card-grid mission-grid">
            ${Echoes.ACHIEVEMENT_DEFINITIONS.map((achievement) => renderAchievementCard(state, achievement)).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function getTowerBattleStatus(state) {
    const formationHeroes = Echoes.getFormationHeroes(state).filter(Boolean);
    const energyCost = Echoes.CONFIG.towerEnergyCost;
    const currentEnergy = Echoes.getResourceAmount(state, "energy");

    if (state.pendingTowerEvent) {
      return { canBattle: false, message: "Resolva o evento pendente da torre antes de continuar." };
    }

    if (formationHeroes.length === 0) {
      return { canBattle: false, message: "Monte uma formação antes de entrar na torre." };
    }

    const busyHero = formationHeroes.find((hero) => Echoes.isHeroOnExpedition && Echoes.isHeroOnExpedition(state, hero.id));
    if (busyHero) {
      const expedition = Echoes.getHeroExpedition(state, busyHero.id);
      return {
        canBattle: false,
        message: `${busyHero.name} esta em expedicao${expedition ? `: ${expedition.name}` : ""}.`,
      };
    }

    if (currentEnergy < energyCost) {
      return {
        canBattle: false,
        message: `Energia insuficiente: voce tem ${currentEnergy}/${energyCost}. Aguarde regenerar ou recupere energia em recompensas.`,
      };
    }

    return { canBattle: true, message: `Pronto para lutar. Cada tentativa custa ${energyCost} energia.` };
  }

  function renderTowerBattleStatus(status) {
    return `<p class="tower-status ${status.canBattle ? "ready" : "blocked"}">${escapeHtml(status.message)}</p>`;
  }

  function renderTowerPresetPicker(state) {
    const presets = Echoes.getTeamPresets(state, "tower");

    return `
      <div class="tower-preset-panel">
        <div class="team-preset-head">
          <div>
            <p class="eyebrow">Time de torre</p>
            <h3>Selecionar favoritos</h3>
          </div>
          <strong>Atual ${formatNumber(Echoes.getFormationPower(state))}</strong>
        </div>
        <div class="team-preset-strip">
          ${presets
            .map((preset, index) => {
              const heroCount = Echoes.getTeamPresetHeroIds(state, "tower", index).length;
              const busyHeroes = Echoes.getTeamPresetBusyHeroes(state, "tower", index);
              const helperText =
                heroCount === 0
                  ? "Vazio"
                  : busyHeroes.length > 0
                    ? `Ocupado: ${busyHeroes.map((hero) => hero.name).join(", ")}`
                    : `${heroCount} heroi(s) | Poder ${Echoes.getTeamPresetPower(state, "tower", index)}`;

              return `
                <button
                  type="button"
                  class="secondary preset-strip-card"
                  data-action="applyTowerPreset"
                  data-preset-index="${index}"
                  ${heroCount === 0 ? "disabled" : ""}
                >
                  <strong>${escapeHtml(preset.name)}</strong>
                  <span>${escapeHtml(helperText)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderTowerEventChoice(state, event, choice) {
    const availability = Echoes.canChooseTowerEventOption
      ? Echoes.canChooseTowerEventOption(state, event, choice.id)
      : { ok: true };
    const costText = choice.cost ? ` Custo: ${choice.cost.amount} ${choice.cost.resource === "gold" ? "ouro" : choice.cost.resource}.` : "";
    const disabled = availability.ok ? "" : "disabled";

    return `
      <button
        type="button"
        class="secondary tower-event-choice"
        data-action="towerEventChoice"
        data-event-choice="${choice.id}"
        ${disabled}
      >
        <strong>${escapeHtml(choice.label)}</strong>
        <span>${escapeHtml(choice.description + costText)}</span>
        ${availability.ok ? "" : `<em>${escapeHtml(availability.message)}</em>`}
      </button>
    `;
  }

  function renderTowerEvent(state) {
    const event = state.pendingTowerEvent;
    const definition = event && Echoes.getTowerEventDefinition ? Echoes.getTowerEventDefinition(event.typeKey) : null;

    if (!event || !definition) return "";

    const phaseLabel = Echoes.getTowerEventPhaseLabel ? Echoes.getTowerEventPhaseLabel(event.phase) : "Evento";
    const nextStep =
      event.phase === "pre"
        ? "A escolha sera aplicada e o combate comecara em seguida."
        : "A escolha sera aplicada ao progresso atual da torre.";

    return `
      <article class="panel wide tower-event-panel tone-${definition.tone}">
        <div class="section-head">
          <div>
            <p class="eyebrow">${escapeHtml(phaseLabel)}</p>
            <h2>${escapeHtml(definition.title)}</h2>
          </div>
          <strong>Andar ${event.floor}</strong>
        </div>
        <p class="muted">${escapeHtml(definition.description)}</p>
        <p class="modifier">${nextStep}</p>
        <div class="tower-event-choice-grid">
          ${definition.choices.map((choice) => renderTowerEventChoice(state, event, choice)).join("")}
        </div>
      </article>
    `;
  }

  function renderTowerBattleEffects(state) {
    const effects = Array.isArray(state.towerBattleEffects) ? state.towerBattleEffects : [];
    if (effects.length === 0) return "";

    return `
      <div class="tower-effect-list">
        <h3 class="subheading">Efeitos na proxima luta</h3>
        ${effects
          .map(
            (effect) => `
              <div>
                <strong>${escapeHtml(effect.label)}</strong>
                <span>${escapeHtml(effect.description)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderChapterCompletion(state) {
    const completion = state.lastChapterCompletion;
    if (!completion || !completion.chapterName) return "";

    const reward = completion.reward || {};
    const rewardText = Echoes.formatMissionReward
      ? Echoes.formatMissionReward(reward)
      : Object.keys(reward).map((key) => `${reward[key]} ${key}`).join(" | ");

    return `
      <article class="panel wide chapter-completion-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Capitulo concluido</p>
            <h2>${escapeHtml(completion.chapterName)}</h2>
            <p class="muted">A regiao foi estabilizada e o proximo trecho da torre foi desbloqueado.</p>
          </div>
          <strong>Capitulo ${completion.chapterNumber}</strong>
        </div>
        <div class="summary-grid">
          <div><span>Recompensa especial</span><strong>${escapeHtml(rewardText)}</strong></div>
          <div><span>Proximo capitulo</span><strong>${escapeHtml(completion.nextChapterName || "Campanha atual concluida")}</strong></div>
        </div>
        <button type="button" class="secondary" data-action="clearChapterCompletion">Continuar campanha</button>
      </article>
    `;
  }

  function renderTowerChapterPanel(state, floorData) {
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorData ? floorData.floor : state.towerFloor) : null;
    if (!chapter) return "";

    const completedIds = Echoes.getCompletedTowerChapterIds ? Echoes.getCompletedTowerChapterIds(state) : [];
    const completed = completedIds.includes(chapter.id);
    const regional = chapter.regionalModifier || {};

    return `
      <article class="panel wide tower-chapter-panel tone-${chapter.tone}">
        <div class="section-head">
          <div>
            <p class="eyebrow">Capitulo ${chapter.number} | Andares ${chapter.startFloor}-${chapter.endFloor}</p>
            <h2>${escapeHtml(chapter.name)}</h2>
            <p class="muted">${escapeHtml(chapter.description)}</p>
          </div>
          <span class="floor-badge ${completed ? "" : "elite"}">${completed ? "Concluido" : "Em campanha"}</span>
        </div>
        <div class="chapter-detail-grid">
          <div><span>Tema</span><strong>${escapeHtml(chapter.theme)}</strong></div>
          <div><span>Inimigos predominantes</span><strong>${chapter.predominantEnemies.map(escapeHtml).join(" | ")}</strong></div>
          <div><span>Eventos especificos</span><strong>${chapter.specificEvents.map(escapeHtml).join(" | ")}</strong></div>
          <div><span>Chefe final</span><strong>${escapeHtml(chapter.finalBoss)}</strong></div>
          <div><span>Modificador regional</span><strong>${escapeHtml(regional.label || "Sem modificador")}: ${escapeHtml(regional.description || "")}</strong></div>
        </div>
      </article>
    `;
  }

  function renderTowerProgress(state) {
    const currentFloor = Math.min(Echoes.CONFIG.towerMaxFloor, Math.max(1, state.towerFloor || 1));
    const completedFloor = Math.min(Echoes.CONFIG.towerMaxFloor, Math.max(0, currentFloor - 1));

    return `
      <div class="tower-progress-panel">
        <div class="tower-progress-head">
          <span>Progresso da torre</span>
          <strong>${completedFloor}/${Echoes.CONFIG.towerMaxFloor}</strong>
        </div>
        <div class="tower-floor-track">
          ${Echoes.TOWER_FLOORS.map((floor) => {
            const isCompleted = floor.floor < currentFloor;
            const isCurrent = floor.floor === currentFloor;
            const isBoss = Echoes.isBossFloor ? Echoes.isBossFloor(floor) : false;

            return `
              <span
                class="tower-floor-dot ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""} ${isBoss ? "boss" : ""}"
                title="Andar ${floor.floor}: ${escapeHtml(floor.title)}"
              >${floor.floor}</span>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderFloorTypeBadge(floorData) {
    const isBoss = Echoes.isBossFloor ? Echoes.isBossFloor(floorData) : false;
    if (isBoss) return `<span class="floor-badge boss">Chefe</span>`;
    if (floorData.floor % 5 === 0) return `<span class="floor-badge elite">Marco</span>`;
    return `<span class="floor-badge">Andar comum</span>`;
  }

  function renderRepeatFloors(state, includePresetPicker) {
    const completedFloors = Echoes.TOWER_FLOORS.filter((floor) => Echoes.canRepeatTowerFloor(state, floor.floor));
    const battleStatus = getTowerBattleStatus(state);

    if (completedFloors.length === 0) {
      return "";
    }

    return `
      <article class="panel wide">
        <div class="section-head">
          <div>
            <p class="eyebrow">Repeticao</p>
            <h2>Andares vencidos</h2>
          </div>
          <strong>${completedFloors.length} liberado(s)</strong>
        </div>
        <p class="muted">Repita andares ja vencidos para buscar ouro, XP e chance de equipamentos. O progresso atual da torre nao muda.</p>
        ${includePresetPicker ? renderTowerPresetPicker(state) : ""}
        <div class="summary-grid tower-cost-grid">
          <div><span>Custo por tentativa</span><strong>${Echoes.CONFIG.towerEnergyCost} energia</strong></div>
          <div><span>Energia atual</span><strong>${state.resources.energy}/${state.resources.maxEnergy}</strong></div>
          <div><span>Poder equipe</span><strong>${formatNumber(Echoes.getFormationPower(state))}</strong></div>
        </div>
        ${renderTowerBattleStatus(battleStatus)}
        <div class="repeat-floor-grid">
          ${completedFloors
            .map(
              (floor) => `
                <button
                  type="button"
                  class="secondary repeat-floor-button"
                  data-action="repeatBattle"
                  data-repeat-floor="${floor.floor}"
                  ${battleStatus.canBattle ? "" : "disabled"}
                >
                  <span>Andar ${floor.floor}</span>
                  <small>${floor.title}</small>
                </button>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function renderTower(state) {
    const floorData = Echoes.getFloorData(state.towerFloor);
    const repeatFloors = renderRepeatFloors(state, !floorData);
    const pendingEvent = renderTowerEvent(state);
    const chapterCompletion = renderChapterCompletion(state);

    if (!floorData) {
      return `
        <section class="panel-grid">
          ${chapterCompletion}
          ${pendingEvent}
          ${renderTowerChapterPanel(state, null)}
          <article class="panel focus-panel">
            <p class="eyebrow">Torre inicial</p>
            <h2>${Echoes.CONFIG.towerMaxFloor} andares concluidos</h2>
            <p class="muted">A torre atual foi concluida. Continue repetindo andares para fortalecer a equipe.</p>
          </article>
          ${repeatFloors}
        </section>
      `;
    }

    const battleStatus = getTowerBattleStatus(state);
    const modifierSummary = Echoes.getFloorModifierSummary ? Echoes.getFloorModifierSummary(floorData) : "";
    const isBoss = Echoes.isBossFloor ? Echoes.isBossFloor(floorData) : false;

    return `
      <section class="panel-grid two-columns">
        ${chapterCompletion}
        ${pendingEvent}
        ${renderTowerChapterPanel(state, floorData)}
        <article class="panel focus-panel tower-current-panel ${isBoss ? "boss-floor" : ""}">
          <div class="tower-title-row">
            <div>
              <p class="eyebrow">Andar atual</p>
              <h2>${floorData.floor}. ${floorData.title}</h2>
            </div>
            ${renderFloorTypeBadge(floorData)}
          </div>
          <p class="muted">Nivel recomendado ${floorData.recommendedLevel}. Dificuldade estimada ${Echoes.getFloorPower(floorData.floor)}.</p>
          ${renderTowerProgress(state)}
          ${renderTowerPresetPicker(state)}
          <div class="summary-grid">
            <div><span>Mecanica</span><strong>${floorData.mechanic}</strong></div>
            <div><span>Custo</span><strong>${Echoes.CONFIG.towerEnergyCost} energia</strong></div>
            <div><span>Poder equipe</span><strong>${formatNumber(Echoes.getFormationPower(state))}</strong></div>
          </div>
          ${floorData.modifier ? `<p class="modifier">${floorData.modifier}</p>` : ""}
          ${modifierSummary ? `<p class="modifier">Modificadores: ${escapeHtml(modifierSummary)}.</p>` : ""}
          ${renderTowerBattleEffects(state)}
          ${renderTowerBattleStatus(battleStatus)}
          <button type="button" data-action="battle" ${battleStatus.canBattle ? "" : "disabled"}>Iniciar combate automatico</button>
        </article>
        <article class="panel">
          <h2>Previa</h2>
          <div class="enemy-list">
            ${floorData.enemyKeys
              .map((enemyKey) => {
                const enemy = Echoes.ENEMY_ARCHETYPES[enemyKey];
                const bossClass = enemy && enemy.role === "chefe" ? "boss" : "";
                return `<span class="${bossClass}">${escapeHtml(enemy.name)}</span>`;
              })
              .join("")}
          </div>
          <h3 class="subheading">Recompensa</h3>
          <p class="muted">${Echoes.describeReward(floorData.floor)}</p>
          <p class="muted">Dica do andar: ${floorData.rewardHint}.</p>
        </article>
        ${repeatFloors}
      </section>
    `;
  }

  function canStartTowerBattle(state) {
    return getTowerBattleStatus(state).canBattle;
  }

  function renderBattle(state) {
    return Echoes.renderBattleView(state);
  }

  function renderPreferenceSpeedButton(preferences, speed, label) {
    const active = preferences.battle.defaultSpeed === speed;

    return `
      <button
        type="button"
        class="secondary ${active ? "active-speed" : ""}"
        data-action="setPreference"
        data-pref-path="battle.defaultSpeed"
        data-pref-value="${speed}"
      >
        ${label}
      </button>
    `;
  }

  function renderPreferenceToggle(preferences, path, label, description) {
    const [group, key] = path.split(".");
    const checked = Boolean(preferences[group] && preferences[group][key]);

    return `
      <label class="setting-toggle">
        <input
          type="checkbox"
          data-preference-input
          data-pref-path="${path}"
          ${checked ? "checked" : ""}
        />
        <span>
          <strong>${label}</strong>
          <em>${description}</em>
        </span>
      </label>
    `;
  }

  function renderPreferenceRange(preferences, path, label) {
    const [group, key] = path.split(".");
    const value = preferences[group] && Number.isFinite(preferences[group][key]) ? preferences[group][key] : 0;

    return `
      <label class="setting-range">
        <span>${label}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value="${value}"
          data-preference-input
          data-pref-path="${path}"
        />
        <strong>${value}%</strong>
      </label>
    `;
  }

  function renderSettings(state) {
    const preferences = Echoes.getPreferences ? Echoes.getPreferences() : Echoes.DEFAULT_PREFERENCES;

    return `
      <section class="panel-grid two-columns settings-grid">
        <article class="panel settings-panel">
          <p class="eyebrow">Combate</p>
          <h2>Velocidade padrao</h2>
          <p class="muted">Define a velocidade inicial do replay ao abrir combates novos.</p>
          <div class="setting-segmented" aria-label="Velocidade padrao de combate">
            ${renderPreferenceSpeedButton(preferences, "1x", "1x")}
            ${renderPreferenceSpeedButton(preferences, "2x", "2x")}
            ${renderPreferenceSpeedButton(preferences, "instant", "Instantaneo")}
          </div>
        </article>
        <article class="panel settings-panel">
          <p class="eyebrow">Visual</p>
          <h2>Preferencias visuais</h2>
          <div class="setting-stack">
            ${renderPreferenceToggle(preferences, "visual.reduceAnimations", "Reduzir animacoes", "Remove pulsos, transicoes e entradas animadas.")}
            ${renderPreferenceToggle(preferences, "visual.compactMode", "Modo compacto", "Reduz espacos e deixa listas mais densas.")}
            ${renderPreferenceToggle(preferences, "visual.showDetailedNumbers", "Numeros detalhados", "Mostra valores completos e bonus quando disponiveis.")}
          </div>
        </article>
        <article class="panel settings-panel wide">
          <p class="eyebrow">Audio</p>
          <h2>Volumes</h2>
          <p class="muted">O audio ainda e estrutural, mas essas preferencias ja ficam salvas para a proxima etapa.</p>
          <div class="setting-stack">
            ${renderPreferenceRange(preferences, "audio.masterVolume", "Volume geral")}
            ${renderPreferenceRange(preferences, "audio.musicVolume", "Musica")}
            ${renderPreferenceRange(preferences, "audio.effectsVolume", "Efeitos")}
          </div>
        </article>
        <article class="panel settings-panel">
          <p class="eyebrow">Backup local</p>
          <h2>Exportar save</h2>
          <p class="muted">Gere um arquivo JSON com todo o progresso salvo neste navegador. Use esse arquivo para backup ou para transferir o save.</p>
          <div class="summary-grid">
            <div><span>Versao do save</span><strong>${state.saveVersion || Echoes.CONFIG.saveVersion}</strong></div>
            <div><span>Andar atual</span><strong>${state.towerFloor}</strong></div>
            <div><span>Herois</span><strong>${state.heroes.length}</strong></div>
          </div>
          <button type="button" data-action="exportSave">Exportar save</button>
        </article>
        <article class="panel settings-panel">
          <p class="eyebrow">Restaurar progresso</p>
          <h2>Importar save</h2>
          <p class="muted">Selecione um arquivo JSON exportado pelo jogo. O progresso atual sera sobrescrito apos confirmação.</p>
          <input class="hidden-file-input" id="saveImportInput" type="file" accept="application/json,.json" data-save-import />
          <button type="button" class="secondary" data-action="importSave">Selecionar arquivo</button>
        </article>
        <article class="panel settings-panel">
          <p class="eyebrow">Preferencias</p>
          <h2>Restaurar padroes</h2>
          <p class="muted">Restaura apenas configuracoes de visual, audio e combate. O save do jogo nao e alterado.</p>
          <button type="button" class="secondary" data-action="resetPreferences">Restaurar preferencias</button>
        </article>
        <article class="panel wide settings-danger-panel">
          <p class="eyebrow">Zona de risco</p>
          <h2>Resetar save</h2>
          <p class="muted">Remove todo o progresso local deste navegador. A ação e irreversível sem um backup exportado.</p>
          <button type="button" class="danger" data-action="reset">Resetar save</button>
        </article>
        <article class="panel wide settings-panel credits-panel">
          <p class="eyebrow">Creditos</p>
          <h2>Ascensao dos Ecos</h2>
          <div class="summary-grid">
            <div><span>Versao do jogo</span><strong>${Echoes.CONFIG.gameVersion}</strong></div>
            <div><span>Projeto</span><strong>Ascensao dos Ecos</strong></div>
            <div><span>Tecnologias</span><strong>HTML, CSS, JavaScript puro, localStorage</strong></div>
          </div>
        </article>
      </section>
    `;
  }

  function renderCurrentTab(state) {
    const views = {
      base: renderBase,
      heroes: renderHeroes,
      formation: renderFormation,
      inventory: renderInventory,
      expeditions: renderExpeditions,
      missions: renderMissions,
      relics: renderRelics,
      library: renderLibrary,
      summon: renderSummon,
      tower: renderTower,
      battle: renderBattle,
      settings: renderSettings,
    };

    return (views[UI.currentTab] || renderBase)(state);
  }

  function render(state) {
    Echoes.stopBattlePlayback();
    Echoes.regenerateEnergy(state);
    renderResourceBar(state);
    renderSaveStatus(state);

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === UI.currentTab);
    });

    document.getElementById("app").innerHTML = `${renderMessage()}${renderCurrentTab(state)}${renderRecruitmentChoiceModal(state)}${renderNarrativeScene(state)}`;
    Echoes.scheduleBattlePlayback(state, render);
  }

  function setMessage(message) {
    UI.message = message || "";
  }

  function setTab(tab) {
    UI.currentTab = tab;
  }

  Echoes.UI = UI;
  Echoes.render = render;
  Echoes.setMessage = setMessage;
  Echoes.setTab = setTab;
  Echoes.setHeroListOption = setHeroListOption;
})(window);
