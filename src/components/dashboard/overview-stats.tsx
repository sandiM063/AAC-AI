"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { loadBoardTasks } from "@/lib/boards/storage";
import { getWeeklySessionCount, loadSavedPhrases } from "@/lib/communication/storage";
import { useEffect, useState } from "react";

type OverviewStatsProps = {
  userId: string;
};

export function OverviewStats({ userId }: OverviewStatsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ boards: 0, phrases: 0, sessions: 0 });

  useEffect(() => {
    setStats({
      boards: loadBoardTasks(userId).length,
      phrases: loadSavedPhrases(userId).length,
      sessions: getWeeklySessionCount(userId),
    });
  }, [userId]);

  const items = [
    { label: t("stats.boards"), value: String(stats.boards) },
    { label: t("stats.phrasesSaved"), value: String(stats.phrases) },
    { label: t("stats.sessionsThisWeek"), value: String(stats.sessions) },
  ];

  return (
    <section className="dashboard-stats-grid" data-tutorial="overview-stats">
      {items.map((stat) => (
        <article key={stat.label} className="dashboard-card dashboard-stat-card">
          <p className="dashboard-stat-label">{stat.label}</p>
          <p className="dashboard-stat-value">{stat.value}</p>
        </article>
      ))}
    </section>
  );
}
