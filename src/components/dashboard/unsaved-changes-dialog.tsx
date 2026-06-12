"use client";

import { useTranslation } from "@/components/i18n/language-provider";

type UnsavedChangesDialogProps = {
  open: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onStay: () => void;
};

export function UnsavedChangesDialog({
  open,
  isSaving = false,
  onSave,
  onDiscard,
  onStay,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="dashboard-unsaved-overlay" role="presentation">
      <button
        type="button"
        className="dashboard-unsaved-backdrop"
        aria-label={t("settings.stayOnPage")}
        onClick={onStay}
      />
      <div
        className="dashboard-unsaved-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-desc"
      >
        <h2 id="unsaved-changes-title" className="dashboard-unsaved-title">
          {t("settings.unsavedDialogTitle")}
        </h2>
        <p id="unsaved-changes-desc" className="dashboard-unsaved-desc">
          {t("settings.unsavedDialogDesc")}
        </p>
        <div className="dashboard-unsaved-actions">
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline dashboard-unsaved-btn"
            disabled={isSaving}
            onClick={onStay}
          >
            {t("settings.stayOnPage")}
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline dashboard-unsaved-btn dashboard-unsaved-btn-danger"
            disabled={isSaving}
            onClick={onDiscard}
          >
            {t("settings.discardChanges")}
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary dashboard-unsaved-btn"
            disabled={isSaving}
            onClick={onSave}
          >
            {isSaving ? t("settings.saving") : t("settings.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
