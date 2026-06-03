import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

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
