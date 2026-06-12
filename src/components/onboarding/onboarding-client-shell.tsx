"use client";

import { LanguageProvider } from "@/components/i18n/language-provider";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import type { LanguageId } from "@/lib/languages";

type OnboardingClientShellProps = {
  firstName: string;
  initialLanguage: LanguageId;
};

export function OnboardingClientShell({
  firstName,
  initialLanguage,
}: OnboardingClientShellProps) {
  return (
    <LanguageProvider language={initialLanguage}>
      <OnboardingFlow firstName={firstName} initialLanguage={initialLanguage} />
    </LanguageProvider>
  );
}
