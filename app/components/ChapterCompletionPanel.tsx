"use client";

import { formatMissionReward, hasChapterCompletion } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

type ChapterCompletion = {
  chapterName?: string;
  chapterNumber?: number;
  nextChapterName?: string;
  reward?: Record<string, number>;
};

export function ChapterCompletionPanel() {
  const state = useGameStore((store) => store.state);
  const clearChapterCompletion = useGameStore((store) => store.clearChapterCompletion);

  if (!hasChapterCompletion(state)) return null;

  const completion = state.lastChapterCompletion as ChapterCompletion;
  const rewardText = completion.reward ? formatMissionReward(completion.reward) : "Sem recompensa registrada";

  return (
    <article className="chapter-completion-panel">
      <div className="section-heading">
        <span>Capitulo concluido</span>
        <h2>{completion.chapterName}</h2>
        <p>A regiao foi estabilizada e o proximo trecho da torre foi desbloqueado.</p>
      </div>
      <div className="tower-summary roster-summary">
        <div>
          <strong>Capitulo</strong>
          <span>{completion.chapterNumber}</span>
        </div>
        <div>
          <strong>Recompensa especial</strong>
          <span>{rewardText}</span>
        </div>
        <div>
          <strong>Proximo capitulo</strong>
          <span>{completion.nextChapterName || "Campanha atual concluida"}</span>
        </div>
      </div>
      <button className="hero-inline-action primary" onClick={() => clearChapterCompletion()} type="button">
        Continuar campanha
      </button>
    </article>
  );
}
