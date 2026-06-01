import Link from "next/link";

export function LandingCta() {
  return (
    <section className="landing-cta">
      <div className="landing-cta-inner">
        <h2 className="landing-cta-title">Empower every voice, starting today.</h2>
        <p className="landing-cta-desc">
          Join AAC Communicate and build communication boards that work for you, your
          students, or your patients.
        </p>
        <div className="landing-cta-actions">
          <Link href="/login" className="landing-button landing-button-dark landing-button-lg">
            Get started
          </Link>
          <Link href="/login" className="landing-button landing-button-soft landing-button-lg">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
