const FAQ_ITEMS = [
  {
    question: "Who is AAC Communicate for?",
    answer:
      "Caregivers, physicians, teachers, and anyone supporting augmentative and alternative communication — from clinical settings to the classroom.",
  },
  {
    question: "How does verification work?",
    answer:
      "When you register, we send a one-time code to your email or phone. Enter it on the verify screen to activate your account securely.",
  },
  {
    question: "Can I choose my profession?",
    answer:
      "Yes. After verification you pick a profession so your workspace can surface relevant presets and getting-started steps.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Starter plan is free and includes personal boards, your dashboard, and profession onboarding — no credit card required.",
  },
  {
    question: "Can teams share boards?",
    answer:
      "Team collaboration features are on the roadmap. You can already organize your workspace and invite flows are coming soon.",
  },
] as const;

export function LandingFaq() {
  return (
    <section id="faq" className="landing-section landing-section-muted">
      <div className="landing-section-inner landing-section-inner-narrow">
        <header className="landing-section-header landing-section-header-center">
          <p className="landing-section-eyebrow">FAQ</p>
          <h2 className="landing-section-title">Common questions</h2>
        </header>
        <dl className="landing-faq-list">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="landing-faq-item">
              <dt className="landing-faq-question">{item.question}</dt>
              <dd className="landing-faq-answer">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
