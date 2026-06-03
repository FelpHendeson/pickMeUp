import { GameShell } from "./components/layout/GameShell";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Jogo em React</p>
        <h1>Ascensao dos Ecos</h1>
        <p>
          Experiencia principal em Next.js, React, TypeScript e PostgreSQL, com save local no navegador e snapshot
          opcional na nuvem.
        </p>
        <div className="actions">
          <a className="secondary" href="https://github.com/FelpHendeson/pickMeUp">
            Repositorio
          </a>
        </div>
      </section>

      <GameShell />
    </main>
  );
}
