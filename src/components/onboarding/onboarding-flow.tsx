"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import { LANGUAGES, type LanguageId } from "@/lib/languages";
import {
  searchProfessions,
  type Profession,
  type ProfessionId,
} from "@/lib/professions";
import type { AacExperienceLevel } from "@/lib/validations/onboarding";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TOTAL_STEPS = 4;

const AAC_EXPERIENCE_OPTIONS: {
  id: AacExperienceLevel;
  title: string;
  description: string;
}[] = [
  {
    id: "experienced",
    title: "Yes — I use AAC boards regularly",
    description:
      "I am comfortable building and deploying augmentative communication grids in my practice.",
  },
  {
    id: "some",
    title: "Somewhat — limited experience",
    description:
      "I have used AAC tools occasionally and understand the basics of symbol-based communication.",
  },
  {
    id: "new",
    title: "No — I am new to AAC boards",
    description:
      "I am beginning to explore augmentative and alternative communication for my setting.",
  },
];

type OnboardingFlowProps = {
  firstName: string;
  initialLanguage: LanguageId;
};

type Step = 1 | 2 | 3 | 4;

export function OnboardingFlow({ firstName, initialLanguage }: OnboardingFlowProps) {
  const { t, setLanguage: setUiLanguage } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState("");
  const [professionId, setProfessionId] = useState<ProfessionId | null>(null);
  const [language, setLanguage] = useState<LanguageId>(initialLanguage);
  const [aacExperience, setAacExperience] = useState<AacExperienceLevel | null>(null);
  const [wantsTutorial, setWantsTutorial] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const professionResults = useMemo(() => searchProfessions(query), [query]);

  useEffect(() => {
    document.documentElement.lang = language;
    setUiLanguage(language);
  }, [language, setUiLanguage]);

  async function saveOnboarding(payload: Record<string, unknown>) {
    const response = await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to save your responses");
    }
  }

  async function handleContinue() {
    setError(null);

    if (step === 1) {
      setIsLoading(true);
      try {
        await saveOnboarding({ language });
        setStep(2);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 2) {
      if (!professionId) {
        setError("Select a profession to continue");
        return;
      }
      setIsLoading(true);
      try {
        await saveOnboarding({ professionId });
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 3) {
      if (!aacExperience) {
        setError("Select the option that best describes your experience");
        return;
      }
      setIsLoading(true);
      try {
        await saveOnboarding({ aacExperience });
        setStep(4);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 4) {
      if (wantsTutorial === null) {
        setError("Please choose whether you would like a guided orientation");
        return;
      }
      setIsLoading(true);
      try {
        await saveOnboarding({ wantsTutorial, complete: true });
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save");
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleBack() {
    setError(null);
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  }

  function handleLanguageChange(nextLanguage: LanguageId) {
    setLanguage(nextLanguage);
    setError(null);
  }

  return (
    <div className="onboarding-flow">
      <OnboardingProgress step={step} total={TOTAL_STEPS} />

      {step === 1 && (
        <header className="onboarding-step-header">
          <h1 className="profession-picker-title">{t("onboarding.languageTitle")}</h1>
          <p className="profession-picker-subtitle">{t("onboarding.languageDesc")}</p>
        </header>
      )}

      {step === 2 && (
        <header className="onboarding-step-header">
          <h1 className="profession-picker-title">
            {t("onboarding.professionTitle", { name: firstName })}
          </h1>
          <p className="profession-picker-subtitle">{t("onboarding.professionDesc")}</p>
        </header>
      )}

      {step === 3 && (
        <header className="onboarding-step-header">
          <h1 className="profession-picker-title">{t("onboarding.aacTitle")}</h1>
          <p className="profession-picker-subtitle">{t("onboarding.aacDesc")}</p>
        </header>
      )}

      {step === 4 && (
        <header className="onboarding-step-header">
          <h1 className="profession-picker-title">{t("onboarding.tutorialTitle")}</h1>
          <p className="profession-picker-subtitle">{t("onboarding.tutorialDesc")}</p>
        </header>
      )}

      {error && (
        <div role="alert" className="profession-error">
          {error}
        </div>
      )}

      {step === 1 && (
        <label className="onboarding-field">
          <span className="onboarding-field-label">{t("onboarding.displayLanguage")}</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageId)}
            className="onboarding-select"
          >
            {LANGUAGES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} — {option.nativeLabel}
              </option>
            ))}
          </select>
        </label>
      )}

      {step === 2 && (
        <div className="onboarding-step-profession">
          <div className="profession-search-wrap">
            <svg
              className="profession-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("onboarding.professionSearch")}
              className="profession-search-input"
              aria-label={t("onboarding.professionSearch")}
            />
          </div>
          <div className="profession-results" role="listbox" aria-label="Professions">
            {professionResults.length === 0 ? (
              <p className="profession-empty">{t("onboarding.professionEmpty")}</p>
            ) : (
              professionResults.map((profession) => (
                <ProfessionCard
                  key={profession.id}
                  profession={profession}
                  selected={professionId === profession.id}
                  onSelect={() => {
                    setProfessionId(profession.id as ProfessionId);
                    setError(null);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-choice-list" role="radiogroup" aria-label="AAC experience">
          {AAC_EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={aacExperience === option.id}
              onClick={() => {
                setAacExperience(option.id);
                setError(null);
              }}
              className={`onboarding-choice-card ${aacExperience === option.id ? "onboarding-choice-card-active" : ""}`}
            >
              <span className="onboarding-choice-radio" aria-hidden />
              <span className="onboarding-choice-title">{option.title}</span>
              <span className="onboarding-choice-desc">{option.description}</span>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-choice-list onboarding-choice-list-compact" role="radiogroup" aria-label="Guided orientation">
          <button
            type="button"
            role="radio"
            aria-checked={wantsTutorial === true}
            onClick={() => {
              setWantsTutorial(true);
              setError(null);
            }}
            className={`onboarding-choice-card ${wantsTutorial === true ? "onboarding-choice-card-active" : ""}`}
          >
            <span className="onboarding-choice-radio" aria-hidden />
            <span className="onboarding-choice-title">{t("onboarding.tutorialYes")}</span>
            <span className="onboarding-choice-desc">{t("onboarding.tutorialYesDesc")}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={wantsTutorial === false}
            onClick={() => {
              setWantsTutorial(false);
              setError(null);
            }}
            className={`onboarding-choice-card ${wantsTutorial === false ? "onboarding-choice-card-active" : ""}`}
          >
            <span className="onboarding-choice-radio" aria-hidden />
            <span className="onboarding-choice-title">{t("onboarding.tutorialNo")}</span>
            <span className="onboarding-choice-desc">{t("onboarding.tutorialNoDesc")}</span>
          </button>
        </div>
      )}

      <div className="onboarding-actions">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="onboarding-back"
          >
            {t("onboarding.back")}
          </button>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className="profession-continue onboarding-continue"
        >
          {isLoading
            ? t("onboarding.saving")
            : step === TOTAL_STEPS
              ? t("onboarding.complete")
              : t("onboarding.continue")}
        </button>
      </div>
    </div>
  );
}

function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="onboarding-progress" aria-label={`Step ${step} of ${total}`}>
      <span className="profession-picker-badge">
        Step {step} of {total}
      </span>
      <div className="onboarding-progress-track" aria-hidden>
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={`onboarding-progress-segment ${index < step ? "onboarding-progress-segment-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProfessionCard({
  profession,
  selected,
  onSelect,
}: {
  profession: Profession;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`profession-card ${selected ? "profession-card-selected" : ""}`}
    >
      <div className="profession-card-top">
        <h2 className="profession-card-title">{profession.label}</h2>
        <span className={`profession-card-radio ${selected ? "profession-card-radio-on" : ""}`} />
      </div>
      <p className="profession-card-desc">{profession.description}</p>
      <ul className="profession-card-features">
        {profession.featurePreview.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </button>
  );
}
