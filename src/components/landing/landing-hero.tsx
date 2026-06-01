import Link from "next/link";

export function LandingHero() {
  return (
    <section className="landing-hero">
      <h1 className="landing-hero-title">
        The intuitive way to empower every voice.
      </h1>
      <div className="landing-hero-actions">
        <Link href="/login" className="landing-button landing-button-dark landing-button-lg">
          Get started
          <ArrowIcon />
        </Link>
        <a href="#product" className="landing-button landing-button-soft landing-button-lg">
          See how it works
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="landing-button-arrow">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
