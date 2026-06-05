"use client";

import type { ReactNode } from "react";

export type UiModalTone = "default" | "danger" | "ritual" | "arcane";
export type UiModalSize = "normal" | "large";

type UiModalProps = {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  labelledBy: string;
  onClose?: () => void;
  overline?: string;
  size?: UiModalSize;
  subtitle?: string;
  title: string;
  tone?: UiModalTone;
};

export function UiModal({
  actions,
  children,
  className = "",
  closeLabel = "Fechar",
  labelledBy,
  onClose,
  overline = "Registro",
  size = "normal",
  subtitle,
  title,
  tone = "default",
}: UiModalProps) {
  return (
    <section aria-labelledby={labelledBy} aria-modal="true" className={`modal-backdrop ui-modal-backdrop tone-${tone}`} role="dialog">
      <article className={`modal-card ui-modal-card size-${size} ${className}`.trim()}>
        <div className="ui-modal-head">
          <div>
            <span>{overline}</span>
            <h2 id={labelledBy}>{title}</h2>
            {subtitle ? <p className="ui-modal-subtitle">{subtitle}</p> : null}
          </div>
          {onClose ? (
            <button className="ui-action secondary" onClick={onClose} type="button">
              {closeLabel}
            </button>
          ) : null}
        </div>
        <div className="ui-modal-body">{children}</div>
        {actions ? <div className="ui-modal-footer">{actions}</div> : null}
      </article>
    </section>
  );
}
