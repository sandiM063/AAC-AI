import { OnboardingClientShell } from "@/components/onboarding/onboarding-client-shell";
import { ThemeApplier } from "@/components/dashboard/theme-applier";
import { getCurrentUser, userNeedsOnboarding } from "@/lib/user-session";
import { isValidLanguageId } from "@/lib/languages";
import { isValidThemeId } from "@/lib/themes";
import type { LanguageId } from "@/lib/languages";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userNeedsOnboarding(user)) {
    redirect("/dashboard");
  }

  const language: LanguageId = isValidLanguageId(user.language) ? user.language : "en";
  const theme = isValidThemeId(user.theme) ? user.theme : "green";

  return (
    <>
      <ThemeApplier theme={theme} language={language} />
      <div className="profession-page">
      <div className="profession-page-inner">
        <Link href="/" className="profession-brand">
          <span className="profession-brand-mark">AAC</span>
          <span>AAC Communicate</span>
        </Link>

        <OnboardingClientShell firstName={user.firstName} initialLanguage={language} />
      </div>
    </div>
    </>
  );
}
