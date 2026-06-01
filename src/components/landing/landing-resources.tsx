import Link from "next/link";
import { LandingSectionHeader } from "./landing-section-header";

const RESOURCES = [
  {
    title: "Getting started guide",
    description: "Set up your account, configure OTP, and seed your workspace in a few steps.",
    href: "#faq",
    label: "Read FAQ",
  },
  {
    title: "Communication boards",
    description: "Learn how symbol grids, categories, and output phrases work together.",
    href: "#features",
    label: "Explore features",
  },
  {
    title: "Profession presets",
    description: "See how physician, caregiver, and educator templates speed up your first session.",
    href: "#teams",
    label: "View for teams",
  },
  {
    title: "Help & support",
    description: "Answers to common questions about sign-up, verification, and your dashboard.",
    href: "#faq",
    label: "Get help",
  },
] as const;

export function LandingResources() {
  return (
    <section id="resources" className="landing-section">
      <div className="landing-section-inner">
        <LandingSectionHeader
          eyebrow="Resources"
          title="Learn, build, and get support"
          description="Guides and references to help you get the most from AAC Communicate."
        />
        <div className="landing-resources-grid">
          {RESOURCES.map((resource) => (
            <article key={resource.title} className="landing-resource-card">
              <h3 className="landing-resource-title">{resource.title}</h3>
              <p className="landing-resource-desc">{resource.description}</p>
              <a href={resource.href} className="landing-resource-link">
                {resource.label}
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
        <div className="landing-resources-banner">
          <div>
            <p className="landing-resources-banner-label">Ready to try it?</p>
            <p className="landing-resources-banner-title">
              Create your account and open your workspace today.
            </p>
          </div>
          <Link href="/login" className="landing-button landing-button-dark">
            Sign up free
          </Link>
        </div>
      </div>
    </section>
  );
}
