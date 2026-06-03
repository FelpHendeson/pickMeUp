"use client";

import { getPendingNarrativeScene } from "@/src/game";
import { useGameStore } from "@/src/store/gameStore";

export function NarrativeModal() {
  const state = useGameStore((store) => store.state);
  const continueNarrative = useGameStore((store) => store.continueNarrative);
  const skipNarrative = useGameStore((store) => store.skipNarrative);
  const scene = getPendingNarrativeScene(state);

  if (!scene) return null;

  return (
    <section className="narrative-backdrop" role="dialog" aria-modal="true" aria-labelledby="narrativeTitle">
      <article className="narrative-card">
        <span>Cena da campanha</span>
        <h2 id="narrativeTitle">{scene.title}</h2>
        <p>{scene.text}</p>
        <div className="hero-action-row">
          <button className="hero-inline-action primary" onClick={() => continueNarrative(scene.id)} type="button">
            Continuar
          </button>
          <button className="hero-inline-action" onClick={() => skipNarrative(scene.id)} type="button">
            Pular
          </button>
        </div>
      </article>
    </section>
  );
}
