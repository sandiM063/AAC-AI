import { PhraseBoard } from "@/components/communication/phrase-board";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/user-session";

export default async function CommunicationPage() {
  const t = await getServerTranslator();
  const user = await getCurrentUser();

  return (
    <div className="dashboard-content dashboard-content-wide">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.communication.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.communication.description")}</p>
        </div>
      </header>

      {user && <PhraseBoard userId={user.id} />}
    </div>
  );
}
