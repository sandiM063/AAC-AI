"use client";

import "./profile-avatar.css";
import "./theme-preview.css";
import { useTranslation } from "@/components/i18n/language-provider";
import type { ThemeId } from "@/lib/themes";
import { useEffect, useId } from "react";
import { ThemePreviewMini } from "./theme-preview-mini";

type ThemePreviewDialogProps = {
  open: boolean;
  themeId: ThemeId;
  isSaving?: boolean;
  onApply: () => void;
  onCancel: () => void;
};

export function ThemePreviewDialog({
  open,
  themeId,
  isSaving = false,
  onApply,
  onCancel,
}: ThemePreviewDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onCancel();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isSaving, onCancel]);

  if (!open) return null;

  return (
    <div className="dashboard-profile-camera-overlay" role="presentation">
      <button
        type="button"
        className="dashboard-profile-camera-backdrop"
        aria-label={t("common.cancel")}
        disabled={isSaving}
        onClick={onCancel}
      />
      <div
        className="dashboard-profile-camera-dialog dashboard-theme-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="dashboard-profile-camera-title">
          {t("settings.themeReviewTitle")}
        </h2>
        <p className="dashboard-theme-preview-dialog-hint">{t("settings.themePreviewHint")}</p>
        <p className="dashboard-theme-preview-dialog-name">{t(`themes.${themeId}.label`)}</p>

        <ThemePreviewMini themeId={themeId} size="large" />

        <div className="dashboard-profile-camera-actions dashboard-theme-preview-dialog-actions">
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline dashboard-profile-camera-btn"
            disabled={isSaving}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary dashboard-profile-camera-btn"
            disabled={isSaving}
            onClick={onApply}
          >
            {t("settings.applyTheme")}
          </button>
        </div>
      </div>
    </div>
  );
}
