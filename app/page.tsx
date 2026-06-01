import { MigrationDashboard } from "./components/MigrationDashboard";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Branch de migracao</p>
        <h1>Ascensao dos Ecos</h1>
        <p>
          Base inicial em Next.js para evoluir o jogo para React, TypeScript e persistencia em banco sem alterar a
          branch master.
        </p>
        <div className="actions">
          <a href="/game/index.html">Abrir jogo legado</a>
          <a className="secondary" href="https://github.com/FelpHendeson/pickMeUp">
            Repositorio
          </a>
        </div>
      </section>

      <MigrationDashboard />
    </main>
  );
}
