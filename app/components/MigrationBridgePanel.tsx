"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/src/store/gameStore";

export function MigrationBridgePanel() {
  const { state, source, loadLegacyLocalSave } = useGameStore();
  const [message, setMessage] = useState("Verificando save local...");

  useEffect(() => {
    const result = loadLegacyLocalSave();
    setMessage(result.ok ? "Save legado encontrado e normalizado pelo core TypeScript." : result.message);
  }, [loadLegacyLocalSave]);

  return (
    <article>
      <span>Ponte de save</span>
      <h2>Leitura do legado</h2>
      <p>{message}</p>
      <div className="mini-grid">
        <div>
          <strong>{state.towerFloor}</strong>
          <small>Andar</small>
        </div>
        <div>
          <strong>{state.heroes.length}</strong>
          <small>Herois</small>
        </div>
        <div>
          <strong>{state.inventory.length}</strong>
          <small>Itens</small>
        </div>
        <div>
          <strong>{source}</strong>
          <small>Fonte</small>
        </div>
      </div>
    </article>
  );
}
