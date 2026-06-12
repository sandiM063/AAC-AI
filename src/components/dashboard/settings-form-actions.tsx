"use client";

import { useTranslation } from "@/components/i18n/language-provider";

type SettingsFormActionsProps = {
  hasChanges: boolean;
  isSaving?: boolean;
  hint?: string;
  saveLabel?: string;
  discardLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
};

export function SettingsFormActions({
  hasChanges,
  isSaving = false,
  hint,
  saveLabel,
  discardLabel,
  onSave,
  onDiscard,
}: SettingsFormActionsProps) {
  const { t } = useTranslation();

  if (!hasChanges) return null;

  return (
    <div className="dashboard-settings-form-actions" role="group" aria-live="polite">
      <p className="dashboard-settings-form-actions-hint">
        {hint ?? t("settings.unsavedChanges")}
      </p>
      <div className="dashboard-settings-form-actions-buttons">
        <button
          type="button"
          className="dashboard-btn dashboard-btn-outline dashboard-settings-form-actions-btn"
          disabled={isSaving}
          onClick={onDiscard}
        >
          {discardLabel ?? t("settings.discardChanges")}
        </button>
        <button
          type="button"
          className="dashboard-btn dashboard-btn-primary dashboard-settings-form-actions-btn"
          disabled={isSaving}
          onClick={onSave}
        >
          {isSaving ? t("settings.saving") : (saveLabel ?? t("settings.saveChanges"))}
        </button>
      </div>
    </div>
  );
}
