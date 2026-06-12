import { TaskBoardShell } from "@/components/boards/task-board-shell";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/user-session";
import { Suspense } from "react";

export default async function BoardsPage() {
  const t = await getServerTranslator();
  const user = await getCurrentUser();

  return (
    <div className="dashboard-content dashboard-content-wide">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.boards.title")}</h1>
          <p className="dashboard-page-subtitle">{t("pages.boards.description")}</p>
        </div>
      </header>

      {user && (
        <Suspense fallback={null}>
          <TaskBoardShell userId={user.id} />
        </Suspense>
      )}
    </div>
  );
}
