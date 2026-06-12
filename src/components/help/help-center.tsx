"use client";

import "./help-center.css";
import { useTranslation } from "@/components/i18n/language-provider";
import Link from "next/link";
import { useState } from "react";

const FAQ_KEYS = ["boards", "communication", "ai", "print", "settings"] as const;
const TIP_KEYS = ["symbols", "caregiver", "tasks", "tts"] as const;
const QUICK_LINK_KEYS = ["boards", "communication", "assistant", "settings"] as const;

export function HelpCenter() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<string | null>("boards");

  return (
    <div className="help-center">
      <section className="dashboard-card">
        <h2 className="dashboard-card-title">{t("help.quickLinksTitle")}</h2>
        <div className="help-quick-links">
          {QUICK_LINK_KEYS.map((key) => (
            <Link key={key} href={t(`help.quickLinks.${key}.href`)} className="help-quick-link">
              <span className="help-quick-link-title">{t(`help.quickLinks.${key}.title`)}</span>
              <span className="help-quick-link-desc">{t(`help.quickLinks.${key}.desc`)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card" id="faq">
        <h2 className="dashboard-card-title">{t("help.faqTitle")}</h2>
        <ul className="help-faq-list">
          {FAQ_KEYS.map((key) => {
            const isOpen = openFaq === key;
            return (
              <li key={key} className="help-faq-item">
                <button
                  type="button"
                  className="help-faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : key)}
                >
                  {t(`help.faq.${key}.q`)}
                  <span aria-hidden>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="help-faq-answer">{t(`help.faq.${key}.a`)}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dashboard-card">
        <h2 className="dashboard-card-title">{t("help.tipsTitle")}</h2>
        <ul className="help-tips-list">
          {TIP_KEYS.map((key) => (
            <li key={key}>{t(`help.tips.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section className="dashboard-card" id="collaboration">
        <h2 className="dashboard-card-title">{t("help.contactTitle")}</h2>
        <p className="help-contact">{t("help.contactBody")}</p>
      </section>
    </div>
  );
}
