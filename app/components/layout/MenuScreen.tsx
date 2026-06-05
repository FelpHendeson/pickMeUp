"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MenuScreen() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const aboutPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aboutOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAboutOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aboutOpen]);

  useEffect(() => {
    if (aboutOpen) aboutPanelRef.current?.focus({ preventScroll: true });
  }, [aboutOpen]);

  return (
    <div className={`menu-screen heroic-panel${entering ? " is-entering" : ""}`}>
      <div className="menu-vignette" aria-hidden="true" />
      <div className="menu-runes" aria-hidden="true" />

      <header className="menu-header">
        <Link className="brand-mark" href="/" aria-label="Ascensao dos Ecos">
          <span className="brand-glyph" aria-hidden="true">
            &#9670;
          </span>
          Ascensao dos Ecos
        </Link>
        <span className="header-status">Portao da Torre ativo</span>
      </header>

      <main className="hero-menu">
        <section className="hero-copy" aria-labelledby="gameTitle">
          <p className="eyebrow">Tower Gacha RPG</p>
          <h1 id="gameTitle">
            <span className="title-line">Ascensao</span>
            <span className="title-line title-accent">dos Ecos</span>
          </h1>
          <p className="hero-subtitle">
            Monte sua equipe, invoque herois e escale a torre dimensional andar por andar.
          </p>

          <div className="menu-actions">
            <Link className="primary-action" href="/jogar" onClick={() => setEntering(true)}>
              <span className="action-icon" aria-hidden="true">
                &#9654;
              </span>
              Entrar na Torre
            </Link>
            <button
              aria-controls="aboutPanel"
              aria-expanded={aboutOpen}
              className="secondary-action"
              onClick={() => setAboutOpen((open) => !open)}
              type="button"
            >
              Sobre
            </button>
          </div>

          <p className="hero-tagline">Combate automatico &middot; Progressao persistente &middot; Save local</p>
        </section>

        <aside
          aria-label="Sobre o jogo"
          className="about-panel art-card"
          hidden={!aboutOpen}
          id="aboutPanel"
          ref={aboutPanelRef}
          tabIndex={-1}
        >
          <p className="panel-kicker">A Torre</p>
          <h2>Uma escalada entre ecos, invocacoes e risco.</h2>
          <p>
            Recrute herois, ajuste sua formacao e avance por combates automaticos em andares cada vez mais hostis.
          </p>
          <ul>
            <li>Equipe estrategica de 5 herois</li>
            <li>Recompensas por andar e capitulo</li>
            <li>Progressao salva no navegador</li>
          </ul>
        </aside>
      </main>

      <footer className="menu-footer">
        <span>Alpha Web</span>
        <a href="https://github.com/FelpHendeson/pickMeUp">Repositorio</a>
      </footer>
    </div>
  );
}
