type DashboardPlaceholderProps = {
  title: string;
  description?: string;
};

export function DashboardPlaceholder({
  title,
  description = "This section is ready for you to define features and actions.",
}: DashboardPlaceholderProps) {
  return (
    <div className="dashboard-content">
      <header className="dashboard-page-header">
        <div>
          <h1 className="dashboard-page-title">{title}</h1>
          <p className="dashboard-page-subtitle">{description}</p>
        </div>
      </header>

      <section className="dashboard-card">
        <p className="text-sm text-[#6b7280]">
          Placeholder content — tell me what buttons and functions you want here.
        </p>
      </section>
    </div>
  );
}
