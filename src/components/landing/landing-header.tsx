import Link from "next/link";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources" },
] as const;

export function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link href="/" className="landing-logo">
          <span className="landing-logo-mark" aria-hidden>
            AAC
          </span>
          <span className="landing-logo-text">AAC Communicate</span>
        </Link>

        <nav className="landing-nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-header-actions">
          <Link href="/login" className="landing-link-button">
            Sign in
          </Link>
          <Link href="/login" className="landing-button landing-button-dark">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
