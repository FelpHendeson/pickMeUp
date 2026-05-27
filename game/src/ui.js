(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const UI = {
    currentTab: "base",
    message: "",
  };

  const escapeHtml = Echoes.escapeHtml;
  const formatNumber = Echoes.formatNumber;

  function getResourceItems(state) {
    const maxFloor = Echoes.CONFIG.towerMaxFloor;
    return [
      ["Conta", `Nv. ${state.accountLevel}`],
      ["Andar", state.towerFloor > maxFloor ? `${maxFloor}/${maxFloor}` : state.towerFloor],
      ["Ouro", formatNumber(state.resources.gold)],
      ["Cristais", formatNumber(state.resources.crystals)],
      ["Essencia", formatNumber(state.resources.essence)],
      ["Fragmentos", formatNumber(state.resources.fragments)],
      ["Energia", `${state.resources.energy}/${state.resources.maxEnergy}`],
      ["Equip.", state.inventory.length],
      ["Feridos", Echoes.getInjuredHeroes ? Echoes.getInjuredHeroes(state).length : 0],
      ["Exped.", state.activeExpeditions.length],
      ["Missoes", Echoes.getClaimableMissionCount ? Echoes.getClaimableMissionCount(state) : 0],
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
      return `<span class="specialization-badge pending">Especializacao disponivel</span>`;
    }

    return `<span class="specialization-badge locked">Especializacao no nivel ${Echoes.SPECIALIZATION_LEVEL}</span>`;
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
            <button type="button" class="danger" data-action="reset">Resetar progresso</button>
          </div>
        </article>
        <section class="room-grid">
          ${renderRoomCard("Portal de Invocacao", state.baseRooms.summonPortal, "Recruta novos herois com ouro ou cristais.")}
          ${renderRoomCard("Quartel", state.baseRooms.barracks, "Organiza a lista de herois e a equipe ativa.")}
          ${renderRoomCard("Campo de Treino", state.baseRooms.trainingGround, "Base para progressao futura de XP passivo.")}
          ${renderRoomCard("Enfermaria", state.baseRooms.infirmary, "Trata ferimentos de herois derrotados na torre.")}
          ${renderRoomCard("Oficina", state.baseRooms.workshop, "Desbloqueia ao vencer o andar 10.")}
          ${renderRoomCard("Conselho de Missoes", state.baseRooms.missionBoard, "Preparado para expedicoes em versoes futuras.")}
        </section>
        ${renderInfirmary(state)}
      </section>
    `;
  }

  function renderHeroActionButton(hero, inFormation, state) {
    const expedition = state && Echoes.getHeroExpedition ? Echoes.getHeroExpedition(state, hero.id) : null;
    if (inFormation) {
      return `<button type="button" class="secondary" data-action="removeFormation" data-hero-id="${hero.id}">Remover da formacao</button>`;
    }

    if (expedition) {
      return `<button type="button" class="secondary" disabled>Em expedicao</button>`;
    }

    return `<button type="button" data-action="addFormation" data-hero-id="${hero.id}">Adicionar a formacao</button>`;
  }

  function renderHeroStatGrid(hero, state) {
    const stats = Echoes.getHeroEffectiveStats(state, hero);
    const baseStats = hero.stats || {};

    function renderStat(statKey) {
      const bonus = stats[statKey] - (baseStats[statKey] || 0);
      return `
        <span>
          ${statKey.toUpperCase()} <strong>${stats[statKey]}</strong>
          ${bonus !== 0 ? `<em class="${bonus > 0 ? "positive" : "negative"}">${bonus > 0 ? "+" : ""}${bonus}</em>` : ""}
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

          return `<option value="${item.id}" ${selected}>${item.rarity}★ ${escapeHtml(item.name)} (${Echoes.getEquipmentBonusLabel(item)}${escapeHtml(ownerText)})</option>`;
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
    const initial = hero.className ? hero.className.charAt(0).toUpperCase() : "?";
    return `${initial} ${hero.className}`;
  }

  function renderHeroStateBadges(hero, inFormation, expedition) {
    const badges = [];

    if (inFormation) badges.push(`<span class="state-badge formation">Na formacao</span>`);
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
          <h4>Especializacao</h4>
          <strong>${escapeHtml(chosen.name)} - ${escapeHtml(chosen.passiveName)}</strong>
          <p>${escapeHtml(chosen.description)}</p>
        </div>
      `;
    }

    if (!Echoes.canHeroSpecialize(hero)) return "";

    return `
      <div class="specialization-panel">
        <h4>Escolher especializacao</h4>
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

  function renderHeroes(state) {
    if (state.heroes.length === 0) {
      return `
        <section class="panel">
          <h2>Herois</h2>
          <p class="muted">Nenhum heroi recrutado ainda. Va ate Invocacao para chamar a primeira equipe.</p>
        </section>
      `;
    }

    const sortedHeroes = sortHeroesForDisplay(state.heroes, state);

    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Quartel</p>
            <h2>Lista de herois</h2>
          </div>
          <strong>${state.heroes.length} recrutado(s)</strong>
        </div>
        <div class="card-grid">
          ${sortedHeroes.map((hero) => renderHeroCard(hero, { inFormation: Echoes.isHeroInFormation(state, hero.id), state })).join("")}
        </div>
      </section>
    `;
  }

  function sortHeroesForDisplay(heroes, state) {
    return heroes
      .slice()
      .sort((a, b) => b.rarity - a.rarity || b.level - a.level || Echoes.getHeroPower(b, state) - Echoes.getHeroPower(a, state));
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

    const availableHeroes = state.heroes.filter((hero) => !Echoes.isHeroInFormation(state, hero.id));

    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Equipe ativa</p>
            <h2>Formacao</h2>
          </div>
          <strong>Poder ${formatNumber(Echoes.getFormationPower(state))}</strong>
        </div>
        <div class="formation-grid">${slots}</div>
        <h3 class="subheading">Reservas</h3>
        ${
          availableHeroes.length === 0
            ? `<p class="muted">Nao ha herois fora da formacao.</p>`
            : `<div class="card-grid compact-grid">${availableHeroes.map((hero) => renderHeroCard(hero, { compact: true, state })).join("")}</div>`
        }
      </section>
    `;
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
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Inventario</p>
            <h2>Equipamentos</h2>
          </div>
          <strong>${state.inventory.length} item(ns)</strong>
        </div>
        ${
          sortedItems.length === 0
            ? `<p class="muted">Nenhum equipamento encontrado ainda. Vença andares da torre para ter chance de obter itens.</p>`
            : `<div class="card-grid">${sortedItems.map((item) => renderInventoryItem(item, state)).join("")}</div>`
        }
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

  function renderAvailableExpedition(definition, state) {
    const availableHeroes = state.heroes.slice().sort((a, b) => Echoes.getHeroPower(b, state) - Echoes.getHeroPower(a, state));
    const selectableHeroes = availableHeroes.filter((hero) => !Echoes.getHeroExpedition(state, hero.id));
    const baseReward = `${definition.reward.amount} ${Echoes.getExpeditionRewardName(definition.reward.type)}`;

    return `
      <div class="expedition-setup">
        <div class="summary-grid">
          <div><span>Duracao</span><strong>${Echoes.formatDuration(definition.durationMs)}</strong></div>
          <div><span>Poder recomendado</span><strong>${definition.recommendedPower}</strong></div>
          <div><span>Recompensa base</span><strong>${baseReward}</strong></div>
        </div>
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
            <p class="eyebrow">Missoes idle</p>
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

  function renderSummonRates(type) {
    const table = Echoes.getAdjustedSummonRarityTable ? Echoes.getAdjustedSummonRarityTable(type) : Echoes.SUMMON_RARITY_TABLES[type];
    return table.map((entry) => `${entry.rarity}★ ${entry.chance}%`).join(" | ");
  }

  function renderSummon(state) {
    const commonCost = Echoes.getSummonCost("common");
    const superiorCost = Echoes.getSummonCost("superior");
    const last = state.summonHistory[0];

    return `
      <section class="panel-grid two-columns">
        <article class="panel summon-panel">
          <p class="eyebrow">Portal</p>
          <h2>Invocacao comum</h2>
          <p class="muted">Custo: ${commonCost.amount} ouro.</p>
          <p class="rates">${renderSummonRates("common")}</p>
          <button type="button" data-action="summon" data-summon-type="common" ${
            state.resources.gold < commonCost.amount ? "disabled" : ""
          }>Invocar com ouro</button>
        </article>
        <article class="panel summon-panel superior">
          <p class="eyebrow">Cristais</p>
          <h2>Invocacao superior</h2>
          <p class="muted">Custo: ${superiorCost.amount} cristais.</p>
          <p class="rates">${renderSummonRates("superior")}</p>
          <button type="button" data-action="summon" data-summon-type="superior" ${
            state.resources.crystals < superiorCost.amount ? "disabled" : ""
          }>Invocar com cristais</button>
        </article>
        <article class="panel wide">
          <div class="section-head">
            <div>
              <p class="eyebrow">Historico</p>
              <h2>Ultimas invocacoes</h2>
            </div>
            ${last ? `<strong>${last.rarity}★ ${escapeHtml(last.name)}</strong>` : ""}
          </div>
          ${
            state.summonHistory.length === 0
              ? `<p class="muted">O historico aparecera aqui apos a primeira invocacao.</p>`
              : `<div class="history-list">${state.summonHistory
                  .map(
                    (entry) => `
                    <div>
                      <strong>${entry.rarity}★ ${escapeHtml(entry.name)}</strong>
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
          <h2>Missoes e conquistas</h2>
          <p class="muted">Complete objetivos jogando normalmente e colete recompensas uma unica vez. Missoes diarias reiniciam pela data local do navegador.</p>
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
              <h2>Missoes diarias</h2>
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
      return { canBattle: false, message: "Monte uma formacao antes de entrar na torre." };
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

  function renderRepeatFloors(state) {
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
    const repeatFloors = renderRepeatFloors(state);
    const pendingEvent = renderTowerEvent(state);

    if (!floorData) {
      return `
        <section class="panel-grid">
          ${pendingEvent}
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
        ${pendingEvent}
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

  function renderCurrentTab(state) {
    const views = {
      base: renderBase,
      heroes: renderHeroes,
      formation: renderFormation,
      inventory: renderInventory,
      expeditions: renderExpeditions,
      missions: renderMissions,
      summon: renderSummon,
      tower: renderTower,
      battle: renderBattle,
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

    document.getElementById("app").innerHTML = `${renderMessage()}${renderCurrentTab(state)}`;
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
})(window);
