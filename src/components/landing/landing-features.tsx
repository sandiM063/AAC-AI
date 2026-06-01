import { LandingSectionHeader } from "./landing-section-header";

const FEATURES = [
  {
    title: "Symbol boards",
    description:
      "Build communication grids with phrases, symbols, and categories — designed for clarity on any device.",
  },
  {
    title: "AI assistance",
    description:
      "Get smart suggestions for phrases, tile groupings, and board layouts tailored to your profession.",
  },
  {
    title: "Secure verification",
    description:
      "Email or phone OTP, profession onboarding, and a workspace ready from day one.",
  },
  {
    title: "Text-to-speech ready",
    description:
      "Connect voice output so every selected phrase can be spoken aloud during sessions.",
  },
  {
    title: "Collaboration",
    description:
      "Share boards with care teams, co-teachers, and family members as collaboration rolls out.",
  },
  {
    title: "Cross-device access",
    description:
      "Use AAC Communicate in the browser today — with sync and mobile support on the roadmap.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-section-inner">
        <LandingSectionHeader
          eyebrow="Features"
          title="Everything you need to communicate clearly"
          description="Purpose-built tools for AAC — from your first board to AI-powered suggestions."
        />
        <div className="landing-features-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing-feature-card">
              <span className="landing-feature-icon" aria-hidden />
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
