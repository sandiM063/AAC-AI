"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { clearUserLocalData, resetClientAppearance } from "@/lib/user-local-data";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileActionsProps = {
  userId: string;
};

export function ProfileActions({ userId }: ProfileActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearUserLocalData(userId);
      resetClientAppearance();
      router.push("/");
      router.refresh();
    } catch {
      setError(t("pages.profile.signOutError"));
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? t("pages.profile.deleteError"));
        setIsDeleting(false);
        return;
      }

      clearUserLocalData(userId);
      resetClientAppearance();
      router.push("/");
      router.refresh();
    } catch {
      setError(t("pages.profile.deleteRetry"));
      setIsDeleting(false);
    }
  }

  return (
    <section className="dashboard-card dashboard-danger-zone" data-tutorial="profile-actions">
      <h2 className="dashboard-card-title">{t("pages.profile.accountActions")}</h2>
      <p className="dashboard-danger-desc">{t("pages.profile.accountActionsDesc")}</p>

      {error && (
        <div role="alert" className="dashboard-settings-error">
          {error}
        </div>
      )}

      <div className="dashboard-profile-actions">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut || isDeleting}
          className="dashboard-btn dashboard-btn-outline dashboard-profile-action-btn"
        >
          {isSigningOut ? t("common.signingOut") : t("common.signOut")}
        </button>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSigningOut || isDeleting}
            className="dashboard-btn dashboard-btn-danger dashboard-profile-action-btn"
          >
            {t("pages.profile.deleteAccount")}
          </button>
        ) : (
          <div className="dashboard-delete-confirm">
            <p className="dashboard-delete-confirm-text">{t("pages.profile.deleteConfirm")}</p>
            <div className="dashboard-delete-confirm-actions">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="dashboard-btn dashboard-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="dashboard-btn dashboard-btn-danger"
              >
                {isDeleting ? t("pages.profile.deleting") : t("pages.profile.deleteConfirmButton")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
