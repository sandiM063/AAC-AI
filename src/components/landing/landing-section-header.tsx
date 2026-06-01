type LandingSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: LandingSectionHeaderProps) {
  return (
    <header
      className={`landing-section-header ${align === "center" ? "landing-section-header-center" : ""}`}
    >
      {eyebrow && <p className="landing-section-eyebrow">{eyebrow}</p>}
      <h2 className="landing-section-title">{title}</h2>
      {description && <p className="landing-section-desc">{description}</p>}
    </header>
  );
}
