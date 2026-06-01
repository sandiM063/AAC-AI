import Link from "next/link";
import { LandingSectionHeader } from "./landing-section-header";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "to get started",
    description: "Everything you need to explore AAC Communicate and build your first boards.",
    features: [
      "Unlimited personal boards",
      "Email or phone sign-up",
      "Profession onboarding",
      "Dashboard workspace",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "Coming soon",
    period: "for power users",
    description: "Advanced presets, AI assistance, and collaboration for growing teams.",
    features: [
      "AI phrase suggestions",
      "Text-to-speech integrations",
      "Shared team boards",
      "Priority support",
    ],
    cta: "Join waitlist",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    period: "for organizations",
    description: "Custom deployments for schools, clinics, and care networks at scale.",
    features: [
      "Organization-wide rollout",
      "Custom symbol libraries",
      "Admin & compliance tools",
      "Dedicated onboarding",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
] as const;

export function LandingPricing() {
  return (
    <section id="pricing" className="landing-section landing-section-muted">
      <div className="landing-section-inner">
        <LandingSectionHeader
          eyebrow="Pricing"
          title="Start free, grow when you're ready"
          description="No credit card required. Upgrade as your team and communication needs expand."
        />
        <div className="landing-pricing-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`landing-pricing-card ${plan.highlighted ? "landing-pricing-card-highlighted" : ""}`}
            >
              <h3 className="landing-pricing-name">{plan.name}</h3>
              <p className="landing-pricing-price">{plan.price}</p>
              <p className="landing-pricing-period">{plan.period}</p>
              <p className="landing-pricing-desc">{plan.description}</p>
              <ul className="landing-pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`landing-button landing-button-lg ${plan.highlighted ? "landing-button-dark" : "landing-button-soft"}`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
