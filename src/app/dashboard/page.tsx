import { getProfession } from "@/lib/professions";
import { getCurrentUser } from "@/lib/user-session";

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
  /** @deprecated Legacy combined profession before physician/caregiver split */
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
    description: "Enable smart phrase recommendations (coming soon).",
    action: "Learn more",
  },
  {
    title: "Invite collaborators",
    description: "Share access with your team or family.",
    action: "Invite",
  },
];

const QUICK_STATS = [
  { label: "Boards", value: "0" },
  { label: "Phrases saved", value: "0" },
  { label: "Sessions this week", value: "0" },
];

const INTEGRATIONS = [
  { name: "Text-to-speech", description: "Connect a voice engine for spoken output." },
  { name: "Cloud sync", description: "Back up boards across your devices." },
  { name: "Collaboration", description: "Link teammates to shared boards." },
];

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  const profession = getProfession(user?.profession ?? null);

  const gettingStarted =
    user?.profession && user.profession in GETTING_STARTED_BY_PROFESSION
      ? GETTING_STARTED_BY_PROFESSION[
          user.profession as keyof typeof GETTING_STARTED_BY_PROFESSION
        ]
      : DEFAULT_GETTING_STARTED;

  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">Overview</h1>
          <p className="dashboard-page-subtitle">
            {profession
              ? `${profession.label} workspace — preset datasets and tools coming soon.`
              : "Your AAC workspace"}
          </p>
        </div>
        <div className="dashboard-progress-pill">
          <span className="dashboard-progress-ring" aria-hidden />
          <span>0/4 completed</span>
        </div>
      </header>

      {profession && (
        <section className="dashboard-card dashboard-profession-banner">
          <p className="dashboard-profession-banner-label">Your profession</p>
          <h2 className="dashboard-profession-banner-title">{profession.label}</h2>
          <p className="dashboard-profession-banner-desc">{profession.description}</p>
          <ul className="dashboard-profession-banner-features">
            {profession.featurePreview.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">Getting started</h2>
        </div>
        <ul className="dashboard-checklist">
          {gettingStarted.map((item, index) => (
            <li
              key={item.title}
              className={`dashboard-checklist-item ${index === 0 ? "dashboard-checklist-item-active" : ""}`}
            >
              <span className="dashboard-check-circle" aria-hidden />
              <div className="dashboard-checklist-body">
                <p className="dashboard-checklist-title">{item.title}</p>
                <p className="dashboard-checklist-desc">{item.description}</p>
                {index === 0 && (
                  <button type="button" className="dashboard-btn dashboard-btn-primary">
                    {item.action}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-stats-grid">
        {QUICK_STATS.map((stat) => (
          <article key={stat.label} className="dashboard-card dashboard-stat-card">
            <p className="dashboard-stat-label">{stat.label}</p>
            <p className="dashboard-stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-card">
        <div className="dashboard-card-header dashboard-card-header-row">
          <h2 className="dashboard-card-title">Activity</h2>
          <div className="dashboard-segmented" role="tablist" aria-label="Activity range">
            <button type="button" className="dashboard-segment dashboard-segment-active">
              All
            </button>
            <button type="button" className="dashboard-segment">
              Week
            </button>
            <button type="button" className="dashboard-segment">
              Month
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
          <span>Fewer</span>
          <span className="dashboard-heatmap-legend-scale" />
          <span>More</span>
        </p>
      </section>

      <section className="dashboard-card">
        <h2 className="dashboard-card-title">Integrations</h2>
        <ul className="dashboard-list">
          {INTEGRATIONS.map((item) => (
            <li key={item.name} className="dashboard-list-row">
              <div className="dashboard-list-icon" aria-hidden>
                {item.name.charAt(0)}
              </div>
              <div className="dashboard-list-body">
                <p className="dashboard-list-title">{item.name}</p>
                <p className="dashboard-list-desc">{item.description}</p>
              </div>
              <button type="button" className="dashboard-btn dashboard-btn-outline">
                Connect
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
