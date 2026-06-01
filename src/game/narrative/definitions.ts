export type NarrativeScene = {
  id: string;
  title: string;
  text: string;
};

export type ChapterNarrativeMoments = {
  start: NarrativeScene;
  bossBefore: NarrativeScene;
  bossAfter: NarrativeScene;
};

export const NARRATIVE_SCENES: Record<string, NarrativeScene> = {
  intro: {
    id: "intro",
    title: "A torre acordou",
    text: "O primeiro sino rompeu a noite sem vento. Da pedra escura, a torre chamou nomes que ninguem lembrava, e os herois invocados abriram os olhos diante de uma guerra antiga.",
  },
  firstSevereInjury: {
    id: "firstSevereInjury",
    title: "Sangue no limiar",
    text: "A torre nao mata apenas com laminas. Ela deixa marcas, cobra folego e memoria. Quando um heroi cai gravemente, todos entendem que sobreviver tambem tem um preco.",
  },
  firstCriticalMorale: {
    id: "firstCriticalMorale",
    title: "Vozes na armadura",
    text: "Nem todo colapso faz barulho. As maos tremem, a coragem falha por um instante, e a torre sussurra que nenhum juramento dura para sempre.",
  },
};

export const CHAPTER_SCENES: Record<string, ChapterNarrativeMoments> = {
  awakening_ruins: {
    start: {
      id: "chapter_awakening_ruins_start",
      title: "Ruinas do Despertar",
      text: "A entrada respira poeira fria. Runas antigas pulsam sob os passos da equipe, como se a torre estivesse escolhendo quem merece continuar.",
    },
    bossBefore: {
      id: "chapter_awakening_ruins_bossBefore",
      title: "O nucleo desperto",
      text: "No fundo das ruinas, pedra e metal se erguem em forma de sentinela. O Golem Antigo nao guarda tesouro: guarda a porta para algo pior.",
    },
    bossAfter: {
      id: "chapter_awakening_ruins_bossAfter",
      title: "A primeira porta cede",
      text: "Quando o colosso cai, o silencio dura pouco. Atraves das rachaduras, uma floresta escura cresce onde nao deveria haver sol.",
    },
  },
  bestial_forest: {
    start: {
      id: "chapter_bestial_forest_start",
      title: "Floresta Bestial",
      text: "Raizes atravessam pedra e ferro. Entre galhos sem folhas, a torre aprende a cacar, e cada ruido parece responder com dentes.",
    },
    bossBefore: {
      id: "chapter_bestial_forest_bossBefore",
      title: "O oraculo estilhacado",
      text: "Cristais partidos flutuam como olhos ao redor do trono. O Oraculo ve futuros quebrados e tenta empurrar a equipe para o pior deles.",
    },
    bossAfter: {
      id: "chapter_bestial_forest_bossAfter",
      title: "Vidro sob os pes",
      text: "Os fragmentos perdem o brilho, mas nao a voz. Eles anunciam corredores frios abaixo, onde os mortos ainda reconhecem passos vivos.",
    },
  },
  spectral_crypt: {
    start: {
      id: "chapter_spectral_crypt_start",
      title: "Cripta Espectral",
      text: "A descida cheira a vela apagada e ferro velho. Na cripta, cada vitoria parece emprestada, e cada sombra espera ser chamada pelo nome.",
    },
    bossBefore: {
      id: "chapter_spectral_crypt_bossBefore",
      title: "Coroa do Eclipse",
      text: "A luz se dobra no salao final. O Avatar do Eclipse ergue a mao, e a energia dos herois responde como se pertencesse a ele.",
    },
    bossAfter: {
      id: "chapter_spectral_crypt_bossAfter",
      title: "Depois do eclipse",
      text: "A coroa se parte sem cair. Por um instante, a torre recua, e a equipe sente que esperanca tambem pode ser uma arma.",
    },
  },
  infernal_abyss: {
    start: {
      id: "chapter_infernal_abyss_start",
      title: "Abismo Infernal",
      text: "O ar queima sem chama clara. Correntes atravessam o vazio, e a torre revela um abismo que parece ter sido aberto de dentro para fora.",
    },
    bossBefore: {
      id: "chapter_infernal_abyss_bossBefore",
      title: "Garganta da serpente",
      text: "A Serpente Abissal se move sob a ponte como uma noite viva. Cada escama reflete uma derrota que ainda nao aconteceu.",
    },
    bossAfter: {
      id: "chapter_infernal_abyss_bossAfter",
      title: "Cinzas em silencio",
      text: "O abismo fecha um olho. Nao e paz, ainda nao, mas os invocados permanecem de pe, e isso basta para manter a chama acesa.",
    },
  },
};
