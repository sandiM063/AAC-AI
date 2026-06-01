import { LandingSectionHeader } from "./landing-section-header";

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up with email or phone, verify with a secure one-time code, and choose your profession.",
  },
  {
    step: "02",
    title: "Build your first board",
    description:
      "Start from profession-aware presets or create custom symbol grids tailored to your needs.",
  },
  {
    step: "03",
    title: "Communicate with confidence",
    description:
      "Use boards in sessions, share with your team, and get AI suggestions as you grow.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="landing-section landing-section-muted">
      <div className="landing-section-inner">
        <LandingSectionHeader
          eyebrow="How it works"
          title="From sign-up to your first phrase in minutes"
          description="A simple flow designed for caregivers, educators, and the people they support."
        />
        <ol className="landing-steps">
          {STEPS.map((item) => (
            <li key={item.step} className="landing-step-card">
              <span className="landing-step-number">{item.step}</span>
              <h3 className="landing-step-title">{item.title}</h3>
              <p className="landing-step-desc">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
