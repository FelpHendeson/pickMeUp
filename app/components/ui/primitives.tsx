import { useId, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type PanelElement = "article" | "section" | "div";

type UiPanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
  children: ReactNode;
  tone?: "default" | "gold" | "danger" | "arcane";
};

export function UiPanel({ as = "article", children, className, tone = "default", ...props }: UiPanelProps) {
  const Component = as;
  return (
    <Component className={cx("ui-panel", `tone-${tone}`, className)} {...props}>
      {children}
    </Component>
  );
}

type UiButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function UiButton({ children, className, type = "button", variant = "secondary", ...props }: UiButtonProps) {
  return (
    <button className={cx("ui-action", variant, className)} type={type} {...props}>
      {children}
    </button>
  );
}

export function UiBadge({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: string }) {
  return <span className={cx("ui-badge", `tone-${tone}`, className)}>{children}</span>;
}

export function UiProgressBar({ label, value }: { label: string; value: number }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div aria-label={label} className="ui-progress-bar">
      <i style={{ width: `${clampedValue}%` }} />
    </div>
  );
}

export function UiAlertBox({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" | "danger" | "success" }) {
  return <div className={`ui-alert-box tone-${tone}`}>{children}</div>;
}

export function UiEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <article className="ui-empty-state">
      <span>Sem registros</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export type PageHeaderMetric = { label: string; value: string | number; tone?: string };

// Cabecalho compacto e previsivel por aba: titulo, descricao curta,
// ate 2-3 metricas fortes e uma acao principal opcional.
export function PageHeader({
  eyebrow,
  title,
  description,
  metrics,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  metrics?: PageHeaderMetric[];
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow ? <span className="page-header-eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {metrics && metrics.length > 0 ? (
        <div className="page-header-metrics">
          {metrics.slice(0, 3).map((metric) => (
            <span className={metric.tone ? `tone-${metric.tone}` : ""} key={metric.label}>
              <strong>{metric.value}</strong>
              {metric.label}
            </span>
          ))}
        </div>
      ) : null}
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

// Card de secao com titulo e acao opcional, base do padrao visual das abas.
export function SectionCard({
  title,
  hint,
  action,
  className,
  children,
  tone = "default",
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  tone?: "default" | "gold" | "danger" | "arcane";
}) {
  return (
    <section className={cx("section-card", `tone-${tone}`, className)}>
      {title || action ? (
        <div className="section-card-head">
          <div>
            {title ? <strong>{title}</strong> : null}
            {hint ? <small>{hint}</small> : null}
          </div>
          {action ? <div className="section-card-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type CompactStat = { label: string; value: string | number; tone?: string };

// Barra compacta de metricas: leitura rapida sem ocupar muito espaco.
export function CompactStatBar({ stats, className }: { stats: CompactStat[]; className?: string }) {
  return (
    <div className={cx("compact-stat-bar", className)}>
      {stats.map((stat) => (
        <span className={stat.tone ? `tone-${stat.tone}` : ""} key={stat.label}>
          <strong>{stat.value}</strong>
          {stat.label}
        </span>
      ))}
    </div>
  );
}

export function StatusBadge({ children, tone = "default" }: { children: ReactNode; tone?: string }) {
  return <span className={cx("status-badge", `tone-${tone}`)}>{children}</span>;
}

// Secao expansivel para progressive disclosure: mostra pouco, detalhe sob demanda.
export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={cx("collapsible-section", open && "is-open", className)}>
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="collapsible-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="collapsible-title">
          <strong>{title}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <span aria-hidden="true" className="collapsible-caret">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="collapsible-content" id={contentId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
