"use client";

import "./tutorial-demo.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { useTutorialSpotlight } from "@/hooks/use-tutorial-spotlight";
import { getTutorialTarget } from "@/lib/tutorials/targets";
import type { SectionTutorialConfig } from "@/lib/tutorials/registry";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type SectionTutorialProps = {
  config: SectionTutorialConfig;
  onComplete: () => void;
  onSkip: () => void;
};

export function SectionTutorial({ config, onComplete, onSkip }: SectionTutorialProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const { stepCount, messageRoot, id } = config;
  const isLast = step === stepCount;
  const targetKey = getTutorialTarget(id, step);
  const { spotlight, cardPosition, remeasure, targetFound } = useTutorialSpotlight(targetKey);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onSkip();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onSkip]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) {
      remeasure();
      return;
    }
    remeasure(card.offsetHeight, card.offsetWidth);
    const frame = window.requestAnimationFrame(() => {
      remeasure(card.offsetHeight, card.offsetWidth);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step, remeasure]);

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((current) => current + 1);
  }

  function handleBack() {
    if (step > 1) setStep((current) => current - 1);
  }

  const progressKey =
    messageRoot === "tutorialDemo" ? "tutorialDemo.progress" : "sectionTutorials.progress";
  const stepLabelKey =
    messageRoot === "tutorialDemo" ? "tutorialDemo.stepLabel" : "sectionTutorials.stepLabel";
  const titleKey = `${messageRoot}.steps.${String(step)}.title`;
  const descriptionKey = `${messageRoot}.steps.${String(step)}.description`;

  return (
    <div className="tutorial-float-root" role="presentation">
      <div className="tutorial-spotlight-scrim" aria-hidden />

      {spotlight && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      <div
        id="tutorial-float-card"
        ref={cardRef}
        className={`tutorial-float-card tutorial-float-card-positioned ${!targetFound ? "tutorial-float-card-centered" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="floating-tutorial-title"
        style={
          cardPosition
            ? { top: cardPosition.top, left: cardPosition.left }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        {cardPosition && (
          <span
            className={`tutorial-float-arrow tutorial-float-arrow-${cardPosition.placement}`}
            style={
              cardPosition.placement === "left" || cardPosition.placement === "right"
                ? { top: cardPosition.arrowOffset }
                : { left: cardPosition.arrowOffset }
            }
            aria-hidden
          />
        )}

        <div className="tutorial-float-progress">
          <span className="tutorial-float-progress-label">
            {t(progressKey, { current: String(step), total: String(stepCount) })}
          </span>
          <div
            className="tutorial-float-progress-track"
            style={{ gridTemplateColumns: `repeat(${stepCount}, 1fr)` }}
            aria-hidden
          >
            {Array.from({ length: stepCount }).map((_, index) => (
              <span
                key={index}
                className={`tutorial-float-progress-segment ${index < step ? "tutorial-float-progress-segment-active" : ""}`}
              />
            ))}
          </div>
        </div>

        <p className="tutorial-float-step-label">
          {t(stepLabelKey, { number: String(step) })}
        </p>
        <h2 id="floating-tutorial-title" className="tutorial-float-title">
          {t(titleKey)}
        </h2>
        <p className="tutorial-float-desc">{t(descriptionKey)}</p>

        <div className="tutorial-float-actions">
          {step > 1 && (
            <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={handleBack}>
              {t("tutorialDemo.back")}
            </button>
          )}
          <button type="button" className="dashboard-btn dashboard-btn-primary" onClick={handleNext}>
            {isLast ? t("sectionTutorials.gotIt") : t("tutorialDemo.next")}
          </button>
          <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={onSkip}>
            {t("tutorialDemo.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
