"use client";

import "./confirm-dialog.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" role="presentation">
      <button
        type="button"
        className="confirm-dialog-backdrop"
        aria-label={cancelLabel ?? t("common.cancel")}
        onClick={onCancel}
      />
      <div
        className="confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="confirm-dialog-desc">
          {description}
        </p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline confirm-dialog-btn"
            onClick={onCancel}
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            type="button"
            className={`dashboard-btn confirm-dialog-btn confirm-dialog-btn-confirm ${danger ? "confirm-dialog-btn-danger" : "dashboard-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
