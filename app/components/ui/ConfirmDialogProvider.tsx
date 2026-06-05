"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { UiModal } from "./UiModal";

export type ConfirmDialogTone = "default" | "danger" | "ritual";

export type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
};

type PendingConfirmDialog = Required<Pick<ConfirmDialogOptions, "confirmLabel" | "cancelLabel" | "tone">> &
  Pick<ConfirmDialogOptions, "title" | "description"> & {
    resolve: (confirmed: boolean) => void;
  };

type ConfirmDialog = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialog | null>(null);

export function useConfirmDialog(): ConfirmDialog {
  const confirmDialog = useContext(ConfirmDialogContext);
  if (!confirmDialog) {
    throw new Error("useConfirmDialog deve ser usado dentro de ConfirmDialogProvider.");
  }
  return confirmDialog;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pendingDialog, setPendingDialog] = useState<PendingConfirmDialog | null>(null);

  const confirmDialog = useCallback<ConfirmDialog>((options) => {
    return new Promise((resolve) => {
      setPendingDialog({
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? "Confirmar",
        cancelLabel: options.cancelLabel ?? "Cancelar",
        tone: options.tone ?? "default",
        resolve,
      });
    });
  }, []);

  const closeDialog = useCallback((confirmed: boolean) => {
    setPendingDialog((currentDialog) => {
      currentDialog?.resolve(confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pendingDialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDialog, pendingDialog]);

  const contextValue = useMemo(() => confirmDialog, [confirmDialog]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      {pendingDialog ? (
        <UiModal
          className="confirm-dialog-card"
          labelledBy="confirmDialogTitle"
          overline={pendingDialog.tone === "danger" ? "Ação irreversível" : "Confirmação"}
          title={pendingDialog.title}
          tone={pendingDialog.tone}
        >
          <p>{pendingDialog.description}</p>
          <div className="modal-action-row">
            <button className="ui-action secondary" onClick={() => closeDialog(false)} type="button">
              {pendingDialog.cancelLabel}
            </button>
            <button className={`ui-action ${pendingDialog.tone === "danger" ? "danger" : "primary"}`} onClick={() => closeDialog(true)} type="button">
              {pendingDialog.confirmLabel}
            </button>
          </div>
        </UiModal>
      ) : null}
    </ConfirmDialogContext.Provider>
  );
}
