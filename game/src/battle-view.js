(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const BattleView = {
    speed: "instant",
    eventCursor: 0,
    playbackId: null,
    timer: null,
  };

  function inferBattleEventType(message) {
    if (/CRITICO/i.test(message)) return "critical";
    if (/curou|cura/i.test(message)) return "heal";
    if (/caiu/i.test(message)) return "death";
    if (/venceu/i.test(message)) return "victory";
    if (/derrotada|perdido/i.test(message)) return "defeat";
    if (/Recompensa|Cristais|Essencia|Fragmentos|Oficina/i.test(message)) return "reward";
    if (/usou|liberou|conjurou/i.test(message)) return "skill";
    if (/Turno/i.test(message)) return "round";
    return "damage";
  }

  function getBattleEvents(battle) {
    if (Array.isArray(battle.events) && battle.events.length > 0) {
      return battle.events;
    }

    // Saves from before Alpha 0.2 only have text logs, so the view infers enough event data to remain readable.
    return (battle.log || []).map((message) => ({
      type: inferBattleEventType(message),
      message,
      playerTeam: battle.playerTeam || [],
      enemyTeam: battle.enemyTeam || [],
    }));
  }

  function getBattlePlaybackId(battle) {
    return battle.id || `${battle.floor}_${battle.rounds}_${battle.result}_${(battle.log || []).length}`;
  }

  function prepareBattlePlayback(battle) {
    const events = getBattleEvents(battle);
    const battleId = getBattlePlaybackId(battle);

    if (BattleView.playbackId !== battleId) {
      BattleView.playbackId = battleId;
      BattleView.eventCursor = BattleView.speed === "instant" ? events.length : 1;
    }

    if (BattleView.speed === "instant") {
      BattleView.eventCursor = events.length;
    }

    BattleView.eventCursor = Math.max(1, Math.min(BattleView.eventCursor, events.length || 1));

    return {
      events,
      visibleEvents: events.slice(0, BattleView.eventCursor),
    };
  }

  function getCurrentBattleSnapshot(battle, visibleEvents) {
    const currentEvent = visibleEvents[visibleEvents.length - 1];

    return {
      playerTeam: (currentEvent && currentEvent.playerTeam) || battle.playerTeam || [],
      enemyTeam: (currentEvent && currentEvent.enemyTeam) || battle.enemyTeam || [],
    };
  }

  function getUnitStatusLabels(unit) {
    const statuses = unit.statuses || {};
    const labels = [];

    if (statuses.taunt) labels.push("Provocando");
    if (statuses.guard) labels.push("Defesa+");
    if (statuses.mark) labels.push("Marcado");

    return labels;
  }

  function renderBattleBar(kind, current, max) {
    const safeMax = Math.max(1, max || 1);
    const percent = Math.max(0, Math.min(100, Math.round((current / safeMax) * 100)));

    return `
      <div class="${kind}-track">
        <div class="${kind}-fill" style="width: ${percent}%"></div>
      </div>
    `;
  }

  function renderBattleUnit(unit) {
    const hpPercent = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
    const energy = Math.min(unit.energy || 0, unit.maxEnergy || 100);
    const aliveClass = unit.alive === false || unit.hp <= 0 ? "dead" : hpPercent <= 0.3 ? "low-hp" : "";
    const statusLabels = getUnitStatusLabels(unit);

    return `
      <article class="battle-unit ${aliveClass}">
        <div class="battle-unit-head">
          <div>
            <strong>${Echoes.escapeHtml(unit.name)}</strong>
            <span>${Echoes.escapeHtml(unit.className || unit.role || "")}</span>
          </div>
          <em>${unit.position === "front" ? "Frente" : "Tras"}</em>
        </div>
        <div class="bar-row">
          <span>HP</span>
          ${renderBattleBar("hp", unit.hp || 0, unit.maxHp || 1)}
          <strong>${unit.hp || 0}/${unit.maxHp || 0}</strong>
        </div>
        <div class="bar-row">
          <span>EN</span>
          ${renderBattleBar("energy", energy, unit.maxEnergy || 100)}
          <strong>${energy}/${unit.maxEnergy || 100}</strong>
        </div>
        ${
          statusLabels.length > 0
            ? `<div class="status-row">${statusLabels.map((label) => `<span>${label}</span>`).join("")}</div>`
            : ""
        }
      </article>
    `;
  }

  function renderBattleTeam(title, units, side) {
    return `
      <section class="battle-team ${side}">
        <div class="battle-team-title">
          <h3>${title}</h3>
          <span>${units.filter((unit) => unit.alive !== false && unit.hp > 0).length}/${units.length} vivos</span>
        </div>
        <div class="battle-unit-grid">
          ${units.map(renderBattleUnit).join("")}
        </div>
      </section>
    `;
  }

  function renderBattleSpeedButton(speed, label) {
    return `
      <button
        type="button"
        class="secondary ${BattleView.speed === speed ? "active-speed" : ""}"
        data-action="setBattleSpeed"
        data-speed="${speed}"
      >${label}</button>
    `;
  }

  function getBattleEventLabel(type) {
    const labels = {
      critical: "Critico",
      damage: "Dano",
      death: "Morte",
      heal: "Cura",
      "skill-heal": "Cura",
      skill: "Habilidade",
      "skill-buff": "Habilidade",
      victory: "Vitoria",
      defeat: "Derrota",
      reward: "Recompensa",
      round: "Turno",
      info: "Info",
    };

    return labels[type] || "Log";
  }

  function renderBattleLog(events) {
    return `
      <ol class="combat-log">
        ${events
          .map(
            (event) => `
              <li class="log-${event.type}">
                <span>${getBattleEventLabel(event.type)}</span>
                ${Echoes.escapeHtml(event.message)}
              </li>
            `
          )
          .join("")}
      </ol>
    `;
  }

  function renderEmptyBattleView() {
    return `
      <section class="panel">
        <p class="eyebrow">Log</p>
        <h2>Combate</h2>
        <p class="muted">Inicie um andar da torre para ver o combate automatico em turnos.</p>
      </section>
    `;
  }

  function renderBattleView(state) {
    const battle = state.lastBattle;

    if (!battle) {
      return renderEmptyBattleView();
    }

    const playback = prepareBattlePlayback(battle);
    const snapshot = getCurrentBattleSnapshot(battle, playback.visibleEvents);
    const isComplete = playback.visibleEvents.length >= playback.events.length;

    return `
      <section class="battle-layout">
        <article class="panel battle-stage">
          <div class="section-head">
            <div>
              <p class="eyebrow">Resultado</p>
              <h2>${battle.result === "victory" ? "Vitoria" : "Derrota"} no andar ${battle.floor}</h2>
              <p class="muted">${battle.rounds} turno(s) resolvidos automaticamente.</p>
            </div>
            <div class="speed-control" aria-label="Velocidade do replay">
              ${renderBattleSpeedButton("1x", "1x")}
              ${renderBattleSpeedButton("2x", "2x")}
              ${renderBattleSpeedButton("instant", "Instantaneo")}
            </div>
          </div>
          <div class="battle-progress">
            Evento ${Math.min(playback.visibleEvents.length, playback.events.length)} de ${playback.events.length}
            ${isComplete ? "| replay completo" : "| reproduzindo"}
          </div>
          <div class="battlefield">
            ${renderBattleTeam("Equipe", snapshot.playerTeam, "player")}
            ${renderBattleTeam("Inimigos", snapshot.enemyTeam, "enemy")}
          </div>
        </article>
        <article class="panel combat-log-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Turnos</p>
              <h2>Log de combate</h2>
            </div>
            <button type="button" class="secondary" data-action="clearMessage">Limpar aviso</button>
          </div>
          ${renderBattleLog(playback.visibleEvents)}
        </article>
      </section>
    `;
  }

  function getBattlePlaybackDelay() {
    if (BattleView.speed === "2x") return 320;
    return 700;
  }

  function stopBattlePlayback() {
    if (!BattleView.timer) return;

    clearTimeout(BattleView.timer);
    BattleView.timer = null;
  }

  function scheduleBattlePlayback(state, renderCallback) {
    if (Echoes.UI.currentTab !== "battle" || BattleView.speed === "instant" || !state.lastBattle) return;

    const events = getBattleEvents(state.lastBattle);
    if (BattleView.eventCursor >= events.length) return;

    BattleView.timer = setTimeout(() => {
      BattleView.eventCursor += 1;
      renderCallback(state);
    }, getBattlePlaybackDelay());
  }

  function setBattleSpeed(speed) {
    const previousSpeed = BattleView.speed;
    BattleView.speed = ["1x", "2x", "instant"].includes(speed) ? speed : "instant";

    if (previousSpeed === "instant" && BattleView.speed !== "instant") {
      BattleView.eventCursor = 1;
    }
  }

  Echoes.renderBattleView = renderBattleView;
  Echoes.stopBattlePlayback = stopBattlePlayback;
  Echoes.scheduleBattlePlayback = scheduleBattlePlayback;
  Echoes.setBattleSpeed = setBattleSpeed;
})(window);
