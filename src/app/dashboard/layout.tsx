import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ThemeApplier } from "@/components/dashboard/theme-applier";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { toDashboardUser } from "@/lib/dashboard-user";
import { getCurrentUser, userNeedsOnboarding } from "@/lib/user-session";
import { isValidLanguageId } from "@/lib/languages";
import { isStoredProfessionId } from "@/lib/professions";
import { isValidThemeId } from "@/lib/themes";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (userNeedsOnboarding(user)) {
    redirect("/onboarding");
  }

  const theme = isValidThemeId(user.theme) ? user.theme : "green";
  const language = isValidLanguageId(user.language) ? user.language : "en";

  const rawProfession = user.profession ?? "";
  const professionId = isStoredProfessionId(rawProfession) ? rawProfession : null;

  return (
    <>
      <ThemeApplier theme={theme} language={language} />
      <LanguageProvider language={language}>
        <DashboardShell
          user={toDashboardUser(user)}
          userId={user.id}
          professionId={professionId}
          wantsTutorial={user.wantsTutorial === true}
        >
          {children}
        </DashboardShell>
      </LanguageProvider>
    </>
  );
}
