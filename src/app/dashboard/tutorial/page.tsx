import { TutorialDemo } from "@/components/dashboard/tutorial-demo";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function TutorialPage() {
  const t = await getServerTranslator();

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.tutorial.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.tutorial.description")}</p>
        </div>
      </header>

      <TutorialDemo />
    </div>
  );
}
