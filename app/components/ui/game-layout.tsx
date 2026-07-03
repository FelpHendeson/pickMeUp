"use client";

import { useId, useState, type ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type GameTone = "default" | "gold" | "arcane" | "success" | "warning" | "danger";

// GamePage: contêiner de tela focada com ritmo vertical previsível.
// Impõe a hierarquia cabeçalho -> ação -> métricas -> conteúdo -> detalhes.
export function GamePage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("game-page", className)}>{children}</section>;
}

// GamePageHeader: cabeçalho compacto (eyebrow, título, subtítulo curto,
// badges de status e ações secundárias discretas).
export function GamePageHeader({
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
  tone = "default",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  tone?: GameTone;
}) {
  return (
    <header className={cx("game-page-header", `tone-${tone}`)}>
      <div className="game-page-header-copy">
        {eyebrow ? <span className="game-page-eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
        {badges ? <div className="game-page-badges">{badges}</div> : null}
      </div>
      {actions ? <div className="game-page-header-actions">{actions}</div> : null}
    </header>
  );
}

export type GameStat = {
  key: string;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: GameTone;
};

// CompactStatStrip: faixa horizontal com as métricas essenciais (idealmente 3-5).
export function CompactStatStrip({ stats, className }: { stats: GameStat[]; className?: string }) {
  return (
    <div className={cx("compact-stat-strip", className)}>
      {stats.map((stat) => (
        <span className={cx("compact-stat", stat.tone && `tone-${stat.tone}`)} key={stat.key} title={stat.hint}>
          <strong>{stat.value}</strong>
          <small>{stat.label}</small>
        </span>
      ))}
    </div>
  );
}

// PrimaryActionPanel: zona de foco com a ÚNICA ação principal da tela.
// Reúne contexto curto, aviso opcional e o botão dominante.
export function PrimaryActionPanel({
  eyebrow,
  title,
  description,
  tone = "default",
  action,
  warning,
  secondaryActions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: GameTone;
  action?: { label: string; detail?: string; onClick: () => void; disabled?: boolean };
  warning?: ReactNode;
  secondaryActions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={cx("primary-action-panel", `tone-${tone}`)}>
      <div className="primary-action-copy">
        {eyebrow ? <span className="primary-action-eyebrow">{eyebrow}</span> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {warning ? <div className="primary-action-warning">{warning}</div> : null}
      </div>
      {children ? <div className="primary-action-extra">{children}</div> : null}
      {action ? (
        <button className="primary-action-button" disabled={action.disabled} onClick={action.onClick} type="button">
          <strong>{action.label}</strong>
          {action.detail ? <span>{action.detail}</span> : null}
        </button>
      ) : null}
      {secondaryActions ? <div className="primary-action-secondary">{secondaryActions}</div> : null}
    </section>
  );
}

// FocusPanel: card do conteúdo principal, com título e dica opcionais.
export function FocusPanel({
  title,
  hint,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("focus-panel", className)}>
      {title || action ? (
        <div className="focus-panel-head">
          <div>
            {title ? <strong>{title}</strong> : null}
            {hint ? <small>{hint}</small> : null}
          </div>
          {action ? <div className="focus-panel-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// SecondaryInfoGrid: grade compacta para informação secundária.
export function SecondaryInfoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("secondary-info-grid", className)}>{children}</div>;
}

// DetailDrawer: detalhes sob demanda (recolhido por padrão).
// Base do progressive disclosure para mapas, listas longas e explicações.
export function DetailDrawer({
  title,
  summary,
  defaultOpen = false,
  tone = "default",
  className,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  tone?: GameTone;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={cx("detail-drawer", `tone-${tone}`, open && "is-open", className)}>
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="detail-drawer-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="detail-drawer-title">
          <strong>{title}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <span aria-hidden="true" className="detail-drawer-caret">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="detail-drawer-content" id={contentId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
