"use client";

import "./profile-avatar.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { getAvatarUrl } from "@/lib/profile-image-url";
import { resizeImageForAvatar } from "@/lib/resize-image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ProfileCameraCapture } from "./profile-camera-capture";
import { ProfileAvatar } from "./profile-avatar";
import { ProfilePhotoReview } from "./profile-photo-review";

function PenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

type ProfileUserCardProps = {
  initials: string;
  profileImageUpdatedAt: string | null;
  displayName: string;
  contact: string;
};

export function ProfileUserCard({
  initials,
  profileImageUpdatedAt,
  displayName,
  contact,
}: ProfileUserCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const menuId = useId();
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(
    profileImageUpdatedAt
      ? getAvatarUrl(new Date(profileImageUpdatedAt))
      : null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPendingChange = pendingBlob !== null || pendingRemove;
  const reviewMode = pendingRemove ? "remove" : "photo";

  useEffect(() => {
    setSavedImageUrl(
      profileImageUpdatedAt
        ? getAvatarUrl(new Date(profileImageUpdatedAt))
        : null,
    );
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingBlob(null);
    setPendingRemove(false);
    setReviewOpen(false);
  }, [profileImageUpdatedAt]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!menuOpen || reviewOpen || cameraOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-avatar-menu-root]")) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, reviewOpen, cameraOpen]);

  const handleDiscard = useCallback(() => {
    setError(null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingBlob(null);
    setPendingRemove(false);
    setReviewOpen(false);
    setMenuOpen(false);
  }, [previewUrl]);

  async function applyImageBlob(blob: Blob) {
    setError(null);
    setMenuOpen(false);

    try {
      const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
      const resized = await resizeImageForAvatar(file);
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      const nextPreviewUrl = URL.createObjectURL(resized);
      setPreviewUrl(nextPreviewUrl);
      setPendingBlob(resized);
      setPendingRemove(false);
      setReviewOpen(true);
    } catch {
      setError(t("pages.profile.avatarUploadError"));
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await applyImageBlob(file);
  }

  function handleStartRemove() {
    setError(null);
    setMenuOpen(false);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingBlob(null);
    setPendingRemove(true);
    setReviewOpen(true);
  }

  function handleTakePhoto() {
    setError(null);
    setMenuOpen(false);
    setCameraOpen(true);
  }

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!hasPendingChange) return true;

    setError(null);
    setIsSaving(true);

    try {
      if (pendingRemove) {
        const response = await fetch("/api/user/avatar", { method: "DELETE" });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(data.error ?? t("pages.profile.avatarRemoveError"));
          return false;
        }

        setSavedImageUrl(null);
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPendingBlob(null);
        setPendingRemove(false);
        setReviewOpen(false);
        router.refresh();
        return true;
      }

      if (!pendingBlob) return false;

      const formData = new FormData();
      formData.append("image", pendingBlob, "avatar.jpg");

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        profileImageUpdatedAt?: string | null;
      };

      if (!response.ok) {
        setError(data.error ?? t("pages.profile.avatarUploadError"));
        return false;
      }

      if (data.profileImageUpdatedAt) {
        setSavedImageUrl(getAvatarUrl(new Date(data.profileImageUpdatedAt)));
      }

      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setPendingBlob(null);
      setPendingRemove(false);
      setReviewOpen(false);
      router.refresh();
      return true;
    } catch {
      setError(
        pendingRemove
          ? t("pages.profile.avatarRemoveError")
          : t("pages.profile.avatarUploadError"),
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [hasPendingChange, pendingRemove, pendingBlob, previewUrl, router, t]);

  const { UnsavedChangesPrompt } = useUnsavedChangesGuard({
    hasUnsavedChanges: reviewOpen && hasPendingChange,
    onSave: handleSave,
    onDiscard: handleDiscard,
  });

  return (
    <div className="dashboard-profile-user">
      <div className="dashboard-profile-header">
        <div className="dashboard-profile-avatar-slot" data-avatar-menu-root>
          <div className="dashboard-profile-avatar-wrap">
            <button
              type="button"
              className="dashboard-profile-avatar-trigger"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
              disabled={isSaving || reviewOpen}
              onClick={() => {
                if (!reviewOpen) setMenuOpen((open) => !open);
              }}
            >
              <ProfileAvatar initials={initials} imageUrl={savedImageUrl} size="profile">
                <span className="dashboard-profile-avatar-edit" aria-hidden>
                  <PenIcon className="dashboard-profile-avatar-edit-icon" />
                </span>
              </ProfileAvatar>
              <span className="dashboard-profile-avatar-sr-only">
                {t("pages.profile.changePhoto")}
              </span>
            </button>

            {menuOpen && !reviewOpen && (
              <div id={menuId} className="dashboard-profile-avatar-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-profile-avatar-menu-item"
                  disabled={isSaving}
                  onClick={handleTakePhoto}
                >
                  {t("pages.profile.takePhoto")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-profile-avatar-menu-item"
                  disabled={isSaving}
                  onClick={() => libraryInputRef.current?.click()}
                >
                  {t("pages.profile.chooseFromLibrary")}
                </button>
                {savedImageUrl && (
                  <button
                    type="button"
                    role="menuitem"
                    className="dashboard-profile-avatar-menu-item dashboard-profile-avatar-menu-item-danger"
                    disabled={isSaving}
                    onClick={handleStartRemove}
                  >
                    {t("pages.profile.removePhoto")}
                  </button>
                )}
              </div>
            )}
          </div>

          <input
            ref={libraryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="dashboard-profile-avatar-sr-only"
            tabIndex={-1}
            onChange={handleFileChange}
          />
        </div>

        <div className="dashboard-profile-identity">
          <h2 className="dashboard-profile-name">{displayName}</h2>
          <p className="dashboard-profile-contact">{contact}</p>
        </div>
      </div>

      {error && !reviewOpen && (
        <p role="alert" className="dashboard-profile-avatar-error">
          {error}
        </p>
      )}

      <ProfileCameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(blob) => void applyImageBlob(blob)}
      />

      <ProfilePhotoReview
        open={reviewOpen && hasPendingChange}
        mode={reviewMode}
        previewUrl={previewUrl}
        initials={initials}
        savedImageUrl={savedImageUrl}
        isSaving={isSaving}
        error={reviewOpen ? error : null}
        onSave={() => void handleSave()}
        onCancel={handleDiscard}
      />

      <UnsavedChangesPrompt />
    </div>
  );
}
