import { SELECTABLE_PROFESSIONS } from "@/lib/professions";
import Link from "next/link";
import { LandingSectionHeader } from "./landing-section-header";

export function LandingTeams() {
  return (
    <section id="teams" className="landing-section">
      <div className="landing-section-inner">
        <LandingSectionHeader
          eyebrow="For teams"
          title="Built for the way you work"
          description="Physicians, caregivers, and educators share communication goals — each with presets and templates built for their setting."
        />
        <div className="landing-profession-grid">
          {SELECTABLE_PROFESSIONS.map((profession) => (
            <article key={profession.id} className="landing-profession-card">
              <h3 className="landing-profession-title">{profession.label}</h3>
              <p className="landing-profession-desc">{profession.description}</p>
              <ul className="landing-profession-list">
                {profession.featurePreview.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
          <article className="landing-profession-card landing-profession-card-accent">
            <h3 className="landing-profession-title">Teams &amp; organizations</h3>
            <p className="landing-profession-desc">
              Invite collaborators, share boards across devices, and keep everyone aligned
              on the same communication toolkit.
            </p>
            <ul className="landing-profession-list">
              <li>Shared workspace access</li>
              <li>Role-based collaboration</li>
              <li>Team boards (coming soon)</li>
            </ul>
          </article>
        </div>
        <div className="landing-section-cta-row">
          <Link href="/login" className="landing-button landing-button-dark landing-button-lg">
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}
