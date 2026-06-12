"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import Link from "next/link";

export function TutorialDemo() {
  const { t } = useTranslation();

  return (
    <div className="dashboard-card">
      <p className="dashboard-settings-desc">{t("pages.tutorial.description")}</p>
      <p className="dashboard-settings-desc" style={{ marginTop: "0.75rem" }}>
        {t("pages.tutorial.autoStartHint")}
      </p>
      <div className="tutorial-demo-actions" style={{ marginTop: "1.25rem" }}>
        <Link href="/dashboard" className="dashboard-btn dashboard-btn-primary">
          {t("pages.tutorial.goOverview")}
        </Link>
        <Link href="/dashboard/boards" className="dashboard-btn dashboard-btn-outline">
          {t("nav.boards")}
        </Link>
        <Link href="/dashboard/settings" className="dashboard-btn dashboard-btn-outline">
          {t("nav.settings")}
        </Link>
        <Link href="/dashboard/profile" className="dashboard-btn dashboard-btn-outline">
          {t("nav.profile")}
        </Link>
      </div>
    </div>
  );
}
