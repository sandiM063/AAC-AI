"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { useEffect, useState } from "react";

const TTS_KEY = "aac-tts-enabled";

type IntegrationsPanelProps = {
  userId: string;
};

export function IntegrationsPanel({ userId }: IntegrationsPanelProps) {
  const { t } = useTranslation();
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    const key = `${TTS_KEY}:${userId}`;
    setTtsEnabled(localStorage.getItem(key) === "1");
  }, [userId]);

  function toggleTts() {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    localStorage.setItem(`${TTS_KEY}:${userId}`, next ? "1" : "0");
  }

  const integrations = [
    {
      id: "tts",
      name: t("integrations.tts.name"),
      description: t("integrations.tts.description"),
      initial: t("integrations.tts.name").charAt(0),
      connected: ttsEnabled,
      onToggle: toggleTts,
    },
    {
      id: "cloudSync",
      name: t("integrations.cloudSync.name"),
      description: t("integrations.cloudSync.description"),
      initial: t("integrations.cloudSync.name").charAt(0),
      connected: false,
      onToggle: undefined,
    },
    {
      id: "collaboration",
      name: t("integrations.collaboration.name"),
      description: t("integrations.collaboration.description"),
      initial: t("integrations.collaboration.name").charAt(0),
      connected: false,
      onToggle: undefined,
    },
  ];

  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card-title">{t("pages.overview.integrations")}</h2>
      <ul className="dashboard-list">
        {integrations.map((item) => (
          <li key={item.id} className="dashboard-list-row">
            <div className="dashboard-list-icon" aria-hidden>
              {item.initial}
            </div>
            <div className="dashboard-list-body">
              <p className="dashboard-list-title">{item.name}</p>
              <p className="dashboard-list-desc">{item.description}</p>
            </div>
            {item.onToggle ? (
              <button
                type="button"
                className={`dashboard-btn ${item.connected ? "dashboard-btn-primary" : "dashboard-btn-outline"}`}
                onClick={item.onToggle}
              >
                {item.connected ? t("integrations.connected") : t("common.connect")}
              </button>
            ) : (
              <button type="button" className="dashboard-btn dashboard-btn-outline" disabled>
                {t("integrations.comingSoon")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
