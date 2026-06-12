import { ProfileActions } from "@/components/dashboard/profile-actions";
import { ProfileUserCard } from "@/components/dashboard/profile-user-card";
import { createTranslator } from "@/lib/i18n";
import { getServerTranslator } from "@/lib/i18n/server";
import { getLanguageOption, isValidLanguageId } from "@/lib/languages";
import { getProfessionLabel } from "@/lib/professions";
import { getThemeOption } from "@/lib/themes";
import { getCurrentUser } from "@/lib/user-session";
import { redirect } from "next/navigation";

function formatContact(user: {
  email: string | null;
  countryCode: string | null;
  phone: string | null;
}) {
  if (user.email) return user.email;
  if (user.countryCode && user.phone) {
    return `${user.countryCode} ${user.phone}`;
  }
  return "—";
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const t = await getServerTranslator();
  const language = isValidLanguageId(user.language) ? user.language : "en";
  const themeT = createTranslator(language);
  const professionLabel = getProfessionLabel(user.profession);
  const theme = getThemeOption(user.theme);
  const languageOption = getLanguageOption(user.language);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.profile.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.profile.subtitle")}</p>
        </div>
      </header>

      <section className="dashboard-card" data-tutorial="profile-user-card">
        <ProfileUserCard
          initials={initials}
          profileImageUpdatedAt={user.profileImageUpdatedAt?.toISOString() ?? null}
          displayName={`${user.firstName} ${user.lastName}`}
          contact={formatContact(user)}
        />

        <dl className="dashboard-profile-details">
          <div className="dashboard-profile-detail">
            <dt>{t("pages.profile.profession")}</dt>
            <dd>{professionLabel ?? t("common.notSet")}</dd>
          </div>
          <div className="dashboard-profile-detail">
            <dt>{t("pages.profile.theme")}</dt>
            <dd>{themeT(`themes.${theme.id}.label`)}</dd>
          </div>
          <div className="dashboard-profile-detail">
            <dt>{t("pages.profile.language")}</dt>
            <dd>{languageOption.label}</dd>
          </div>
          <div className="dashboard-profile-detail">
            <dt>{t("pages.profile.memberSince")}</dt>
            <dd>
              {user.createdAt.toLocaleDateString(language, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <ProfileActions userId={user.id} />
    </div>
  );
}
