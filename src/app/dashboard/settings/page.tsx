import { SettingsPreferences } from "@/components/dashboard/settings-preferences";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/user-session";
import type { LanguageId } from "@/lib/languages";
import type { ThemeId } from "@/lib/themes";
import { isValidLanguageId } from "@/lib/languages";
import { isValidThemeId } from "@/lib/themes";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = await getServerTranslator();
  const theme: ThemeId = isValidThemeId(user.theme) ? user.theme : "green";
  const language: LanguageId = isValidLanguageId(user.language)
    ? user.language
    : "en";

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("settings.pageTitle")}</h1>
          <p className="dashboard-page-subtitle">{t("settings.pageSubtitle")}</p>
        </div>
      </header>

      <SettingsPreferences
        userId={user.id}
        initialTheme={theme}
        initialLanguage={language}
      />
    </div>
  );
}
