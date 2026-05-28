(function (global) {
  "use strict";

  const Echoes = (global.Echoes = global.Echoes || {});

  const NARRATIVE_SCENES = {
    intro: {
      id: "intro",
      title: "A torre acordou",
      text:
        "O primeiro sino rompeu a noite sem vento. Da pedra escura, a torre chamou nomes que ninguem lembrava, e os herois invocados abriram os olhos diante de uma guerra antiga.",
    },
    firstSevereInjury: {
      id: "firstSevereInjury",
      title: "Sangue no limiar",
      text:
        "A torre nao mata apenas com laminas. Ela deixa marcas, cobra folego e memoria. Quando um heroi cai gravemente, todos entendem que sobreviver tambem tem um preco.",
    },
    firstCriticalMorale: {
      id: "firstCriticalMorale",
      title: "Vozes na armadura",
      text:
        "Nem todo colapso faz barulho. As maos tremem, a coragem falha por um instante, e a torre sussurra que nenhum juramento dura para sempre.",
    },
  };

  const CHAPTER_SCENES = {
    awakening_ruins: {
      start: {
        title: "Ruinas do Despertar",
        text:
          "A entrada respira poeira fria. Runas antigas pulsam sob os passos da equipe, como se a torre estivesse escolhendo quem merece continuar.",
      },
      bossBefore: {
        title: "O nucleo desperto",
        text:
          "No fundo das ruinas, pedra e metal se erguem em forma de sentinela. O Golem Antigo nao guarda tesouro: guarda a porta para algo pior.",
      },
      bossAfter: {
        title: "A primeira porta cede",
        text:
          "Quando o colosso cai, o silencio dura pouco. Atraves das rachaduras, uma floresta escura cresce onde nao deveria haver sol.",
      },
    },
    bestial_forest: {
      start: {
        title: "Floresta Bestial",
        text:
          "Raizes atravessam pedra e ferro. Entre galhos sem folhas, a torre aprende a cacar, e cada ruido parece responder com dentes.",
      },
      bossBefore: {
        title: "O oraculo estilhacado",
        text:
          "Cristais partidos flutuam como olhos ao redor do trono. O Oraculo ve futuros quebrados e tenta empurrar a equipe para o pior deles.",
      },
      bossAfter: {
        title: "Vidro sob os pes",
        text:
          "Os fragmentos perdem o brilho, mas nao a voz. Eles anunciam corredores frios abaixo, onde os mortos ainda reconhecem passos vivos.",
      },
    },
    spectral_crypt: {
      start: {
        title: "Cripta Espectral",
        text:
          "A descida cheira a vela apagada e ferro velho. Na cripta, cada vitoria parece emprestada, e cada sombra espera ser chamada pelo nome.",
      },
      bossBefore: {
        title: "Coroa do Eclipse",
        text:
          "A luz se dobra no salao final. O Avatar do Eclipse ergue a mao, e a energia dos herois responde como se pertencesse a ele.",
      },
      bossAfter: {
        title: "Depois do eclipse",
        text:
          "A coroa se parte sem cair. Por um instante, a torre recua, e a equipe sente que esperanca tambem pode ser uma arma.",
      },
    },
    infernal_abyss: {
      start: {
        title: "Abismo Infernal",
        text:
          "O ar queima sem chama clara. Correntes atravessam o vazio, e a torre revela um abismo que parece ter sido aberto de dentro para fora.",
      },
      bossBefore: {
        title: "Garganta da serpente",
        text:
          "A Serpente Abissal se move sob a ponte como uma noite viva. Cada escama reflete uma derrota que ainda nao aconteceu.",
      },
      bossAfter: {
        title: "Cinzas em silencio",
        text:
          "O abismo fecha um olho. Nao e paz, ainda nao, mas os invocados permanecem de pe, e isso basta para manter a chama acesa.",
      },
    },
  };

  function buildChapterSceneId(chapterId, moment) {
    return `chapter_${chapterId}_${moment}`;
  }

  function getNarrativeScene(sceneId) {
    if (NARRATIVE_SCENES[sceneId]) return NARRATIVE_SCENES[sceneId];

    const match = /^chapter_(.+)_(start|bossBefore|bossAfter)$/.exec(sceneId);
    if (!match) return null;

    const chapterId = match[1];
    const moment = match[2];
    const scene = CHAPTER_SCENES[chapterId] && CHAPTER_SCENES[chapterId][moment];
    if (!scene) return null;

    return {
      id: sceneId,
      title: scene.title,
      text: scene.text,
    };
  }

  function normalizeNarrativeState(state) {
    const narrative = state.narrative && typeof state.narrative === "object" ? state.narrative : {};
    const seen = Array.isArray(narrative.seenSceneIds) ? narrative.seenSceneIds : [];
    const pending = Array.isArray(narrative.pendingScenes) ? narrative.pendingScenes : [];
    const seenSet = new Set(seen.filter((sceneId) => getNarrativeScene(sceneId)));

    state.narrative = {
      seenSceneIds: Array.from(seenSet),
      pendingScenes: pending
        .filter((sceneId, index, list) => getNarrativeScene(sceneId) && !seenSet.has(sceneId) && list.indexOf(sceneId) === index)
        .slice(0, 6),
    };

    return state.narrative;
  }

  function hasSeenNarrativeScene(state, sceneId) {
    normalizeNarrativeState(state);
    return state.narrative.seenSceneIds.includes(sceneId);
  }

  function queueNarrativeScene(state, sceneId) {
    const scene = getNarrativeScene(sceneId);
    if (!scene) return false;

    normalizeNarrativeState(state);
    if (state.narrative.seenSceneIds.includes(sceneId)) return false;
    if (state.narrative.pendingScenes.includes(sceneId)) return false;

    state.narrative.pendingScenes.push(sceneId);
    return true;
  }

  function getPendingNarrativeScene(state) {
    normalizeNarrativeState(state);
    const sceneId = state.narrative.pendingScenes.find((id) => getNarrativeScene(id));
    return sceneId ? getNarrativeScene(sceneId) : null;
  }

  function markNarrativeSceneSeen(state, sceneId) {
    normalizeNarrativeState(state);

    state.narrative.pendingScenes = state.narrative.pendingScenes.filter((id) => id !== sceneId);
    if (!state.narrative.seenSceneIds.includes(sceneId)) {
      state.narrative.seenSceneIds.push(sceneId);
    }

    return { ok: true, message: "Cena registrada." };
  }

  function ensureIntroNarrative(state) {
    queueNarrativeScene(state, "intro");
  }

  function queueChapterStartNarrative(state, floorNumber) {
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;
    if (!chapter || chapter.startFloor !== floorNumber) return false;

    return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "start"));
  }

  function queueBossBeforeNarrative(state, floorNumber) {
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;
    if (!chapter || chapter.endFloor !== floorNumber) return false;

    return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "bossBefore"));
  }

  function queueBossAfterNarrative(state, floorNumber) {
    const chapter = Echoes.getTowerChapterByFloor ? Echoes.getTowerChapterByFloor(floorNumber) : null;
    if (!chapter || chapter.endFloor !== floorNumber) return false;

    return queueNarrativeScene(state, buildChapterSceneId(chapter.id, "bossAfter"));
  }

  function queueFirstSevereInjuryNarrative(state) {
    return queueNarrativeScene(state, "firstSevereInjury");
  }

  function queueFirstCriticalMoraleNarrative(state) {
    return queueNarrativeScene(state, "firstCriticalMorale");
  }

  Echoes.NARRATIVE_SCENES = NARRATIVE_SCENES;
  Echoes.CHAPTER_SCENES = CHAPTER_SCENES;
  Echoes.getNarrativeScene = getNarrativeScene;
  Echoes.normalizeNarrativeState = normalizeNarrativeState;
  Echoes.hasSeenNarrativeScene = hasSeenNarrativeScene;
  Echoes.queueNarrativeScene = queueNarrativeScene;
  Echoes.getPendingNarrativeScene = getPendingNarrativeScene;
  Echoes.markNarrativeSceneSeen = markNarrativeSceneSeen;
  Echoes.ensureIntroNarrative = ensureIntroNarrative;
  Echoes.queueChapterStartNarrative = queueChapterStartNarrative;
  Echoes.queueBossBeforeNarrative = queueBossBeforeNarrative;
  Echoes.queueBossAfterNarrative = queueBossAfterNarrative;
  Echoes.queueFirstSevereInjuryNarrative = queueFirstSevereInjuryNarrative;
  Echoes.queueFirstCriticalMoraleNarrative = queueFirstCriticalMoraleNarrative;
})(window);
