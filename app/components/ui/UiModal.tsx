"use client";

import type { ReactNode } from "react";

export type UiModalTone = "default" | "danger" | "ritual" | "arcane";

type UiModalProps = {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  onClose?: () => void;
  overline?: string;
  title: string;
  tone?: UiModalTone;
};

export function UiModal({ children, className = "", labelledBy, onClose, overline = "Registro", title, tone = "default" }: UiModalProps) {
  return (
    <section aria-labelledby={labelledBy} aria-modal="true" className={`modal-backdrop ui-modal-backdrop tone-${tone}`} role="dialog">
      <article className={`modal-card ui-modal-card ${className}`.trim()}>
        <div className="ui-modal-head">
          <div>
            <span>{overline}</span>
            <h2 id={labelledBy}>{title}</h2>
          </div>
          {onClose ? (
            <button className="ui-action secondary" onClick={onClose} type="button">
              Fechar
            </button>
          ) : null}
        </div>
        {children}
      </article>
    </section>
  );
}
