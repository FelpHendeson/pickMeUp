"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export const GAME_TOAST_EVENT = "ascensao:toast";

export type ToastTone = "default" | "success" | "warning" | "danger" | "arcane";

export type ToastOptions = {
  message: string;
  title?: string;
  tone?: ToastTone;
};

type ToastEntry = Required<ToastOptions> & {
  id: string;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_TIMEOUT_MS = 3600;

function createToastId(): string {
  return `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getToastTitle(tone: ToastTone): string {
  if (tone === "success") return "Ação concluída";
  if (tone === "warning") return "Atenção";
  if (tone === "danger") return "Ação bloqueada";
  if (tone === "arcane") return "Eco registrado";
  return "Registro";
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const tone = options.tone ?? "default";
      const entry: ToastEntry = {
        id: createToastId(),
        message: options.message,
        title: options.title ?? getToastTitle(tone),
        tone,
      };

      setToasts((current) => [entry, ...current].slice(0, 4));
      const timer = window.setTimeout(() => dismissToast(entry.id), TOAST_TIMEOUT_MS);
      timers.current.set(entry.id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    function handleToastEvent(event: Event) {
      const detail = (event as CustomEvent<ToastOptions>).detail;
      if (!detail?.message) return;
      showToast(detail);
    }

    window.addEventListener(GAME_TOAST_EVENT, handleToastEvent);
    return () => {
      window.removeEventListener(GAME_TOAST_EVENT, handleToastEvent);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [showToast]);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div aria-live="polite" aria-relevant="additions text" className="toast-region">
        {toasts.map((toast) => (
          <article className={`toast-card tone-${toast.tone}`} key={toast.id} role="status">
            <div>
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </div>
            <button aria-label="Fechar aviso" onClick={() => dismissToast(toast.id)} type="button">
              ×
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
