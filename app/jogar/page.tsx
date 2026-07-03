import Link from "next/link";
import { GameShell } from "../components/layout/GameShell";

export default function PlayPage() {
  return (
    <main className="play-shell">
      <header className="play-topbar">
        <div className="play-topbar-brand">
          <span className="play-topbar-glyph" aria-hidden="true">
            &#9670;
          </span>
          <span className="play-topbar-title">Ascensão dos Ecos</span>
        </div>
        <Link className="play-topbar-back" href="/">
          Voltar ao menu
        </Link>
      </header>

      <GameShell />
    </main>
  );
}
