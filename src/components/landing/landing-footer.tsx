import Link from "next/link";

const FOOTER_LINKS = {
  product: [
    { label: "Overview", href: "#product" },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],
  solutions: [
    { label: "For physicians", href: "#teams" },
    { label: "For caregivers", href: "#teams" },
    { label: "For educators", href: "#teams" },
    { label: "For teams", href: "#teams" },
  ],
  resources: [
    { label: "Documentation", href: "#resources" },
    { label: "FAQ", href: "#faq" },
    { label: "Get started", href: "/login" },
    { label: "Sign in", href: "/login" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
} as const;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-mark" aria-hidden>
              AAC
            </span>
            <span className="landing-logo-text">AAC Communicate</span>
          </Link>
          <p className="landing-footer-tagline">
            Accessible communication for everyone — symbol boards and tools for
            physicians, caregivers, and educators.
          </p>
        </div>

        <div className="landing-footer-columns">
          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Solutions" links={FOOTER_LINKS.solutions} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />
          <FooterColumn title="Company" links={FOOTER_LINKS.company} />
        </div>
      </div>

      <div className="landing-footer-bottom">
        <p>© {year} AAC Communicate. All rights reserved.</p>
        <p className="landing-footer-bottom-note">Made for inclusive communication.</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="landing-footer-column">
      <h3 className="landing-footer-column-title">{title}</h3>
      <ul className="landing-footer-links">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {link.href.startsWith("/") ? (
              <Link href={link.href}>{link.label}</Link>
            ) : (
              <a href={link.href}>{link.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
