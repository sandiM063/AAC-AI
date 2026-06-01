import { LandingCta } from "./landing-cta";
import { LandingFaq } from "./landing-faq";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingHowItWorks } from "./landing-how-it-works";
import { LandingPreview } from "./landing-preview";
import { LandingPricing } from "./landing-pricing";
import { LandingResources } from "./landing-resources";
import { LandingTeams } from "./landing-teams";

export function LandingPage() {
  return (
    <div className="landing-page">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingPreview />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTeams />
        <LandingPricing />
        <LandingResources />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
