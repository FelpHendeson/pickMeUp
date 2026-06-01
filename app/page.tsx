const migrationMilestones = [
  "Extrair regras puras para game-core em TypeScript",
  "Migrar estado local para store React/Zustand",
  "Adicionar persistencia PostgreSQL com Prisma",
  "Recriar telas principais em componentes React",
  "Substituir o legado /game quando o fluxo da torre estiver completo",
];

const currentSystems = [
  "Torre com capitulos e dificuldade",
  "Combate automatico e resultado 2.0",
  "Herois, equipamentos, moral e ferimentos",
  "Reliquias, biblioteca, missoes e conquistas",
  "Consumiveis, afinidade e recrutamento alternativo",
];

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

      <section className="grid">
        <article>
          <span>Status atual</span>
          <h2>Legado preservado</h2>
          <p>
            A implementacao em JavaScript puro continua em <code>game/</code>. A migracao deve trocar telas e regras
            por partes, mantendo o jogo jogavel durante o processo.
          </p>
        </article>

        <article>
          <span>Stack alvo</span>
          <h2>Next + PostgreSQL</h2>
          <p>
            A branch prepara Next.js, TypeScript, Prisma, Zustand e TanStack Query para suportar login, cloud save e
            sincronizacao futura.
          </p>
        </article>
      </section>

      <section className="columns">
        <div>
          <h2>Sistemas existentes</h2>
          <ul>
            {currentSystems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Proximos passos</h2>
          <ol>
            {migrationMilestones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
