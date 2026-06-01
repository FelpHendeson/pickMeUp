"use client";

import { useGameStore } from "@/src/store/gameStore";

type MemorialEntry = {
  id: string;
  name: string;
  classKey?: string;
  rarity?: number;
  level?: number;
  lostAtFloor?: number | null;
  lostAt?: string;
  mode?: string;
};

export function MemorialPanel() {
  const deadHeroes = useGameStore((store) => store.state.deadHeroes) as MemorialEntry[];

  if (!Array.isArray(deadHeroes) || deadHeroes.length === 0) return null;

  return (
    <section className="memorial-panel">
      <div className="section-heading">
        <span>Memorial</span>
        <h2>Herois perdidos no Hardcore</h2>
        <p>Registro permanente de herois que cairam definitivamente no modo Hardcore.</p>
      </div>
      <div className="memorial-grid">
        {deadHeroes.map((entry) => (
          <article className="memorial-card" key={entry.id}>
            <strong>{entry.name}</strong>
            <span>
              {entry.classKey || "classe desconhecida"} | Nv. {entry.level || "?"} | {entry.rarity || "?"} estrela(s)
            </span>
            <small>
              Perdido {entry.lostAtFloor ? `no andar ${entry.lostAtFloor}` : "na torre"}
              {entry.lostAt ? ` em ${new Date(entry.lostAt).toLocaleDateString("pt-BR")}` : ""}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
