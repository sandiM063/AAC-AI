"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { LANGUAGES, type LanguageId } from "@/lib/languages";
import { THEMES, type ThemeId } from "@/lib/themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EyeControlSettings } from "./eye-control-settings";
import { isEyeControlFeatureEnabled } from "@/lib/eye-control/feature-flag";
import { SettingsFormActions } from "./settings-form-actions";
import { ThemePreviewDialog } from "./theme-preview-dialog";
import { ThemePreviewMini } from "./theme-preview-mini";

type SettingsPreferencesProps = {
  userId: string;
  initialTheme: ThemeId;
  initialLanguage: LanguageId;
};

export function SettingsPreferences({
  userId,
  initialTheme,
  initialLanguage,
}: SettingsPreferencesProps) {
  const { t, setLanguage: setUiLanguage } = useTranslation();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [language, setLanguage] = useState<LanguageId>(initialLanguage);
  const [reviewTheme, setReviewTheme] = useState<ThemeId | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = theme !== initialTheme || language !== initialLanguage;

  useEffect(() => {
    setTheme(initialTheme);
    setLanguage(initialLanguage);
    setUiLanguage(initialLanguage);
    document.documentElement.dataset.theme = initialTheme;
    setReviewTheme(null);
  }, [initialTheme, initialLanguage, setUiLanguage]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function handleThemeSelect(nextTheme: ThemeId) {
    setMessage(null);
    setError(null);
    if (nextTheme === theme) return;
    setReviewTheme(nextTheme);
  }

  function handleThemeReviewApply() {
    if (!reviewTheme) return;
    setTheme(reviewTheme);
    setReviewTheme(null);
    setMessage(null);
    setError(null);
  }

  function handleThemeReviewCancel() {
    setReviewTheme(null);
  }

  function handleLanguageChange(nextLanguage: LanguageId) {
    setLanguage(nextLanguage);
    setUiLanguage(nextLanguage);
    setMessage(null);
    setError(null);
  }

  const handleDiscard = useCallback(() => {
    setTheme(initialTheme);
    setLanguage(initialLanguage);
    setUiLanguage(initialLanguage);
    document.documentElement.dataset.theme = initialTheme;
    setReviewTheme(null);
    setMessage(null);
    setError(null);
  }, [initialTheme, initialLanguage, setUiLanguage]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!hasChanges) return true;

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const payload: { theme?: ThemeId; language?: LanguageId } = {};
    if (theme !== initialTheme) payload.theme = theme;
    if (language !== initialLanguage) payload.language = language;

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        theme?: ThemeId;
        language?: LanguageId;
      };

      if (!response.ok) {
        setError(data.error ?? t("settings.saveError"));
        return false;
      }

      if (data.theme) setTheme(data.theme);
      if (data.language) setLanguage(data.language);
      setMessage(t("settings.preferencesSaved"));
      router.refresh();
      return true;
    } catch {
      setError(t("settings.saveRetry"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, theme, language, initialTheme, initialLanguage, router, t]);

  const { UnsavedChangesPrompt } = useUnsavedChangesGuard({
    hasUnsavedChanges: hasChanges || reviewTheme !== null,
    onSave: handleSave,
    onDiscard: handleDiscard,
  });

  return (
    <>
      <div className="dashboard-settings-stack">
        <section className="dashboard-card" data-tutorial="settings-appearance">
          <h2 className="dashboard-card-title">{t("settings.appearanceTitle")}</h2>
          <p className="dashboard-settings-desc">{t("settings.appearanceDesc")}</p>

          <div
            className="dashboard-theme-grid"
            role="radiogroup"
            aria-label={t("settings.colorThemeAria")}
          >
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={theme === option.id}
                disabled={isSaving || reviewTheme !== null}
                onClick={() => handleThemeSelect(option.id)}
                className={`dashboard-theme-option ${theme === option.id ? "dashboard-theme-option-active" : ""}`}
              >
                <ThemePreviewMini themeId={option.id} />
                <span className="dashboard-theme-label">{t(`themes.${option.id}.label`)}</span>
                <span className="dashboard-theme-option-desc">
                  {t(`themes.${option.id}.description`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {isEyeControlFeatureEnabled() && <EyeControlSettings userId={userId} />}

        <section className="dashboard-card" data-tutorial="settings-language">
          <h2 className="dashboard-card-title">{t("settings.languageTitle")}</h2>
          <p className="dashboard-settings-desc">{t("settings.languageDesc")}</p>

          <label className="dashboard-settings-field">
            <span className="dashboard-settings-label">{t("settings.displayLanguage")}</span>
            <select
              value={language}
              disabled={isSaving}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageId)}
              className="dashboard-settings-select"
            >
              {LANGUAGES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} — {option.nativeLabel}
                </option>
              ))}
            </select>
          </label>
        </section>

        <SettingsFormActions
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={() => void handleSave()}
          onDiscard={handleDiscard}
        />

        {(message || error) && !hasChanges && (
          <p
            role={error ? "alert" : "status"}
            className={error ? "dashboard-settings-error" : "dashboard-settings-success"}
          >
            {error ?? message}
          </p>
        )}

        {error && hasChanges && (
          <p role="alert" className="dashboard-settings-error">
            {error}
          </p>
        )}
      </div>

      {reviewTheme && (
        <ThemePreviewDialog
          open
          themeId={reviewTheme}
          isSaving={isSaving}
          onApply={handleThemeReviewApply}
          onCancel={handleThemeReviewCancel}
        />
      )}

      <UnsavedChangesPrompt />
    </>
  );
}
