import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist";
import type { GettingStartedItem } from "@/components/dashboard/getting-started-checklist";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { IntegrationsPanel } from "@/components/dashboard/integrations-panel";
import { getServerTranslator } from "@/lib/i18n/server";
import { getProfession } from "@/lib/professions";
import { getCurrentUser } from "@/lib/user-session";

const ACTION_HREFS: Record<string, string> = {
  "Create board": "/dashboard/boards",
  "Browse presets": "/dashboard/communication",
  "Learn more": "/dashboard/help",
  Invite: "/dashboard/help#collaboration",
  "Open profile": "/dashboard/profile",
  "Get started": "/dashboard/communication",
  "Ask AI": "/dashboard/assistant",
};

const GETTING_STARTED_BY_PROFESSION = {
  physician: [
    {
      title: "Set up a clinical communication board",
      description: "Start with exam, consent, and bedside phrases for patient visits.",
      action: "Create board",
    },
    {
      title: "Add diagnostic & treatment phrases",
      description: "Preset messages for explaining plans, symptoms, and next steps.",
      action: "Browse presets",
    },
    {
      title: "Configure medical templates",
      description: "Specialty-specific boards and clinical workflows (coming soon).",
      action: "Learn more",
    },
    {
      title: "Share with your care team",
      description: "Coordinate boards with nurses, specialists, and staff.",
      action: "Invite",
    },
  ],
  caregiver: [
    {
      title: "Set up a daily needs board",
      description: "Build phrases for comfort, meals, mobility, and personal care.",
      action: "Create board",
    },
    {
      title: "Add family update phrases",
      description: "Quick messages for handoffs, routines, and check-ins.",
      action: "Browse presets",
    },
    {
      title: "Explore caregiver templates",
      description: "Home care and support presets tailored to your setting (coming soon).",
      action: "Learn more",
    },
    {
      title: "Invite family or co-caregivers",
      description: "Share boards with relatives, aides, or support workers.",
      action: "Invite",
    },
  ],
  physician_caregiver: [
    {
      title: "Update your profession",
      description: "Choose Physician or Caregiver for templates tailored to your role.",
      action: "Open profile",
    },
    {
      title: "Set up a communication board",
      description: "Start with phrases for greetings, needs, and comfort.",
      action: "Create board",
    },
    {
      title: "Browse shared presets",
      description: "Clinical and caregiver phrase sets until you update your profession.",
      action: "Browse presets",
    },
    {
      title: "Invite collaborators",
      description: "Share boards with your care team or family.",
      action: "Invite",
    },
  ],
  teacher: [
    {
      title: "Create a classroom communication board",
      description: "Build boards for lessons, routines, and participation.",
      action: "Create board",
    },
    {
      title: "Explore learning symbol sets",
      description: "Presets for vocabulary, subjects, and social skills.",
      action: "Browse presets",
    },
    {
      title: "Plan individualized instruction",
      description: "Student-specific boards and goals (coming soon).",
      action: "Learn more",
    },
    {
      title: "Share with paraprofessionals",
      description: "Collaborate with aides, specialists, or co-teachers.",
      action: "Invite",
    },
  ],
} as const;

const DEFAULT_GETTING_STARTED = [
  {
    title: "Set up your communication board",
    description: "Create your first board with symbols and phrases.",
    action: "Get started",
  },
  {
    title: "Customize your profile",
    description: "Add preferences for how you communicate.",
    action: "Open profile",
  },
  {
    title: "Try AI suggestions",
    description: "Ask the AI Assistant for phrase and routine ideas.",
    action: "Ask AI",
  },
  {
    title: "Invite collaborators",
    description: "Share access with your team or family.",
    action: "Invite",
  },
];

function withLinks(
  items: readonly { title: string; description: string; action: string }[],
): GettingStartedItem[] {
  return items.map((item) => ({
    ...item,
    href: ACTION_HREFS[item.action] ?? "/dashboard/help",
  }));
}

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  const t = await getServerTranslator();
  const profession = getProfession(user?.profession ?? null);

  const gettingStartedRaw =
    user?.profession && user.profession in GETTING_STARTED_BY_PROFESSION
      ? GETTING_STARTED_BY_PROFESSION[
          user.profession as keyof typeof GETTING_STARTED_BY_PROFESSION
        ]
      : DEFAULT_GETTING_STARTED;

  const gettingStarted = withLinks(gettingStartedRaw);

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header" data-tutorial="overview-header">
        <div>
          <h1 className="dashboard-page-title">{t("pages.overview.title")}</h1>
          <p className="dashboard-page-subtitle">
            {profession
              ? t("pages.overview.subtitleWithProfession", { profession: profession.label })
              : t("pages.overview.subtitle")}
          </p>
        </div>
        <div className="dashboard-progress-pill">
          <span className="dashboard-progress-ring" aria-hidden />
          <span>{t("pages.overview.progress", { completed: 0, total: 4 })}</span>
        </div>
      </header>

      {profession && (
        <section className="dashboard-card dashboard-profession-banner">
          <p className="dashboard-profession-banner-label">{t("pages.overview.yourProfession")}</p>
          <h2 className="dashboard-profession-banner-title">{profession.label}</h2>
          <p className="dashboard-profession-banner-desc">{profession.description}</p>
          <ul className="dashboard-profession-banner-features">
            {profession.featurePreview.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      )}

      <GettingStartedChecklist
        title={t("pages.overview.gettingStarted")}
        items={gettingStarted}
      />

      {user && <OverviewStats userId={user.id} />}

      <section className="dashboard-card">
        <div className="dashboard-card-header dashboard-card-header-row">
          <h2 className="dashboard-card-title">{t("pages.overview.activity")}</h2>
          <div className="dashboard-segmented" role="tablist" aria-label={t("pages.overview.activity")}>
            <button type="button" className="dashboard-segment dashboard-segment-active">
              {t("pages.overview.activityAll")}
            </button>
            <button type="button" className="dashboard-segment">
              {t("pages.overview.activityWeek")}
            </button>
            <button type="button" className="dashboard-segment">
              {t("pages.overview.activityMonth")}
            </button>
          </div>
        </div>
        <div className="dashboard-heatmap-placeholder" aria-hidden>
          {Array.from({ length: 84 }).map((_, i) => (
            <span
              key={i}
              className="dashboard-heatmap-cell"
              style={{ opacity: 0.15 + (i % 5) * 0.12 }}
            />
          ))}
        </div>
        <p className="dashboard-heatmap-legend">
          <span>{t("pages.overview.heatmapFewer")}</span>
          <span className="dashboard-heatmap-legend-scale" />
          <span>{t("pages.overview.heatmapMore")}</span>
        </p>
      </section>

      {user && <IntegrationsPanel userId={user.id} />}
    </div>
  );
}
