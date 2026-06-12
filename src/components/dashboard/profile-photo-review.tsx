"use client";

import "./profile-avatar.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { useEffect, useId } from "react";
import { ProfileAvatar } from "./profile-avatar";

type ProfilePhotoReviewProps = {
  open: boolean;
  mode: "photo" | "remove";
  previewUrl: string | null;
  initials: string;
  savedImageUrl: string | null;
  isSaving: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfilePhotoReview({
  open,
  mode,
  previewUrl,
  initials,
  savedImageUrl,
  isSaving,
  error,
  onSave,
  onCancel,
}: ProfilePhotoReviewProps) {
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

  const title =
    mode === "remove"
      ? t("pages.profile.removeReviewTitle")
      : t("pages.profile.cameraReviewTitle");

  const hint =
    mode === "remove"
      ? t("pages.profile.removePreviewHint")
      : t("pages.profile.photoPreviewHint");

  const saveLabel =
    mode === "remove" ? t("pages.profile.removePhoto") : t("pages.profile.savePhoto");

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
        className="dashboard-profile-camera-dialog dashboard-profile-photo-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="dashboard-profile-camera-title">
          {title}
        </h2>

        <p className="dashboard-profile-photo-review-hint">{hint}</p>

        <div className="dashboard-profile-photo-review-preview">
          {mode === "photo" && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="dashboard-profile-photo-review-image"
            />
          ) : (
            <ProfileAvatar
              initials={initials}
              imageUrl={mode === "remove" ? savedImageUrl : null}
              size="profile"
            />
          )}
        </div>

        {error && (
          <p role="alert" className="dashboard-profile-avatar-error dashboard-profile-photo-review-error">
            {error}
          </p>
        )}

        <div className="dashboard-profile-camera-actions dashboard-profile-photo-review-actions">
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
            className={`dashboard-btn dashboard-profile-camera-btn ${
              mode === "remove"
                ? "dashboard-btn-danger"
                : "dashboard-btn-primary"
            }`}
            disabled={isSaving}
            onClick={onSave}
          >
            {isSaving ? t("settings.saving") : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
