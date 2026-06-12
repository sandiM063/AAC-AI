import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { getServerTranslator } from "@/lib/i18n/server";
import type { StoredProfessionId } from "@/lib/professions";
import { getCurrentUser } from "@/lib/user-session";

export default async function AssistantPage() {
  const t = await getServerTranslator();
  const user = await getCurrentUser();

  return (
    <div className="dashboard-content dashboard-content-wide">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.assistant.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.assistant.description")}</p>
        </div>
      </header>

      {user && (
        <AssistantPanel
          userId={user.id}
          profession={(user.profession as StoredProfessionId | null) ?? null}
        />
      )}
    </div>
  );
}
