import { HelpCenter } from "@/components/help/help-center";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function HelpPage() {
  const t = await getServerTranslator();

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.help.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.help.description")}</p>
        </div>
      </header>

      <HelpCenter />
    </div>
  );
}
