"use client";

import "./interactive-choice-panel.css";
import { AacSymbol } from "@/components/boards/aac-symbols";
import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import {
  getScenarioById,
  INTERACTIVE_SCENARIOS,
  matchScenarioFromText,
  type InteractiveChoiceOption,
  type InteractiveScenario,
} from "@/lib/communication/interactive-scenarios";
import { recordActivitySession } from "@/lib/communication/storage";
import { useEffect, useMemo, useState } from "react";

export type InteractiveOutcome = {
  scenarioId: string;
  choices: { label: string; symbolId: AacSymbolId; pictogramId: number }[];
  summaryText: string;
};

type InteractiveChoicePanelProps = {
  userId: string;
  questionHint?: string;
  onOutcomeConfirmed: (outcome: InteractiveOutcome) => void;
};

type Phase = "scenarios" | "choose" | "follow-up" | "confirm";

type SelectedChoice = {
  option: InteractiveChoiceOption;
  label: string;
};

export function InteractiveChoicePanel({
  userId,
  questionHint,
  onOutcomeConfirmed,
}: InteractiveChoicePanelProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("scenarios");
  const [scenario, setScenario] = useState<InteractiveScenario | null>(null);
  const [primaryChoices, setPrimaryChoices] = useState<SelectedChoice[]>([]);
  const [followUpChoice, setFollowUpChoice] = useState<SelectedChoice | null>(null);
  const [pendingOption, setPendingOption] = useState<SelectedChoice | null>(null);

  const matchedFromHint = useMemo(() => {
    if (!questionHint?.trim()) return null;
    return matchScenarioFromText(questionHint);
  }, [questionHint]);

  useEffect(() => {
    if (matchedFromHint && phase === "scenarios") {
      startScenario(matchedFromHint);
    }
  }, [matchedFromHint]); // eslint-disable-line react-hooks/exhaustive-deps

  function speakText(text: string) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    const ttsPref = localStorage.getItem(`aac-tts-enabled:${userId}`);
    if (ttsPref === "0") return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    recordActivitySession(userId);
  }

  function startScenario(next: InteractiveScenario) {
    setScenario(next);
    setPrimaryChoices([]);
    setFollowUpChoice(null);
    setPendingOption(null);
    setPhase("choose");
    speakText(t(next.questionKey));
  }

  function optionLabel(option: InteractiveChoiceOption): string {
    return t(option.labelKey);
  }

  function handleOptionTap(option: InteractiveChoiceOption) {
    const choice: SelectedChoice = { option, label: optionLabel(option) };

    if (scenario?.allowMultiple && phase === "choose") {
      setPrimaryChoices((prev) => {
        const exists = prev.some((item) => item.option.id === option.id);
        if (exists) return prev.filter((item) => item.option.id !== option.id);
        return [...prev, choice];
      });
      return;
    }

    setPendingOption(choice);
    setPhase("confirm");
    speakText(choice.label);
  }

  function confirmSingleChoice() {
    if (!pendingOption || !scenario) return;

    const choices = [pendingOption];
    setPrimaryChoices(choices);

    if (scenario.followUp) {
      setPendingOption(null);
      setPhase("follow-up");
      speakText(t(scenario.followUp.questionKey));
      return;
    }

    finalizeOutcome(choices, null);
  }

  function confirmMultipleChoices() {
    if (!scenario || primaryChoices.length === 0) return;

    if (scenario.followUp) {
      setPhase("follow-up");
      speakText(t(scenario.followUp.questionKey));
      return;
    }

    finalizeOutcome(primaryChoices, null);
  }

  function handleFollowUpTap(option: InteractiveChoiceOption) {
    const choice: SelectedChoice = { option, label: optionLabel(option) };
    setFollowUpChoice(choice);
    setPhase("confirm");
    speakText(choice.label);
  }

  function confirmFollowUp() {
    if (!scenario || !followUpChoice) return;
    finalizeOutcome(primaryChoices.length > 0 ? primaryChoices : pendingOption ? [pendingOption] : [], followUpChoice);
  }

  function buildSummary(
    currentScenario: InteractiveScenario,
    primary: SelectedChoice[],
    followUp: SelectedChoice | null,
  ): string {
    const labels = primary.map((item) => item.label).join(", ");

    if (followUp && currentScenario.followUp) {
      return t(currentScenario.followUp.outcomePrefixKey, {
        place: labels || followUp.label,
        transport: followUp.label,
        choice: labels,
        drink: followUp.label,
      });
    }

    return t(currentScenario.outcomePrefixKey, { choice: labels });
  }

  function finalizeOutcome(primary: SelectedChoice[], followUp: SelectedChoice | null) {
    if (!scenario) return;

    const allChoices = [...primary, ...(followUp ? [followUp] : [])];
    const summaryText = buildSummary(scenario, primary, followUp);

    onOutcomeConfirmed({
      scenarioId: scenario.id,
      choices: allChoices.map((item) => ({
        label: item.label,
        symbolId: item.option.symbolId,
        pictogramId: item.option.pictogramId,
      })),
      summaryText,
    });

    speakText(summaryText);
    recordActivitySession(userId);
    resetSession();
  }

  function resetSession() {
    setScenario(null);
    setPrimaryChoices([]);
    setFollowUpChoice(null);
    setPendingOption(null);
    setPhase("scenarios");
  }

  function changeMind() {
    if (phase === "confirm" && scenario?.followUp && followUpChoice) {
      setFollowUpChoice(null);
      setPhase("follow-up");
      return;
    }
    if (phase === "confirm" && pendingOption) {
      setPendingOption(null);
      setPhase(scenario?.allowMultiple ? "choose" : "choose");
      return;
    }
    if (phase === "follow-up") {
      setFollowUpChoice(null);
      return;
    }
    setPrimaryChoices([]);
    setPendingOption(null);
    setPhase("choose");
  }

  const activeOptions: InteractiveChoiceOption[] =
    phase === "follow-up" && scenario?.followUp
      ? scenario.followUp.options
      : scenario?.options ?? [];

  const questionText =
    phase === "follow-up" && scenario?.followUp
      ? t(scenario.followUp.questionKey)
      : scenario
        ? t(scenario.questionKey)
        : "";

  return (
    <section className="interactive-choice-panel" aria-labelledby="interactive-choice-title">
      <header className="interactive-choice-header">
        <h2 id="interactive-choice-title" className="interactive-choice-title">
          {t("interactive.title")}
        </h2>
        <p className="interactive-choice-desc">{t("interactive.desc")}</p>
      </header>

      {phase === "scenarios" && (
        <div className="interactive-scenario-grid" role="list">
          {INTERACTIVE_SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className="interactive-scenario-card"
              onClick={() => startScenario(item)}
            >
              <span className="interactive-scenario-symbol">
                <AacSymbol
                  id={item.options[0]?.symbolId ?? "talk"}
                  pictogramId={item.options[0]?.pictogramId}
                  alt=""
                />
              </span>
              <span className="interactive-scenario-name">{t(item.titleKey)}</span>
              <span className="interactive-scenario-meta">{t(item.categoryKey)}</span>
            </button>
          ))}
        </div>
      )}

      {(phase === "choose" || phase === "follow-up") && scenario && (
        <div className="interactive-choose-stage">
          <div className="interactive-question-banner" role="status">
            <p className="interactive-question-label">{t("interactive.questionLabel")}</p>
            <p className="interactive-question-text">{questionText}</p>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-outline interactive-speak-question"
              onClick={() => speakText(questionText)}
            >
              {t("interactive.speakQuestion")}
            </button>
          </div>

          {scenario.allowMultiple && phase === "choose" && (
            <p className="interactive-multi-hint">{t("interactive.multiHint")}</p>
          )}

          <div className="interactive-options-grid" role="list">
            {activeOptions.map((option) => {
              const label = optionLabel(option);
              const selected =
                phase === "choose" && scenario.allowMultiple
                  ? primaryChoices.some((item) => item.option.id === option.id)
                  : false;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="listitem"
                  aria-pressed={selected}
                  className={`interactive-option-tile ${selected ? "interactive-option-tile-selected" : ""}`}
                  onClick={() =>
                    phase === "follow-up" ? handleFollowUpTap(option) : handleOptionTap(option)
                  }
                >
                  <span className="interactive-option-symbol">
                    <AacSymbol id={option.symbolId} pictogramId={option.pictogramId} alt={label} />
                  </span>
                  <span className="interactive-option-label">{label}</span>
                </button>
              );
            })}
          </div>

          {scenario.allowMultiple && phase === "choose" && (
            <div className="interactive-stage-actions">
              <button
                type="button"
                className="dashboard-btn dashboard-btn-primary"
                disabled={primaryChoices.length === 0}
                onClick={confirmMultipleChoices}
              >
                {t("interactive.doneChoosing")}
              </button>
              <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={resetSession}>
                {t("interactive.startOver")}
              </button>
            </div>
          )}

          {!scenario.allowMultiple && (
            <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={resetSession}>
              {t("interactive.pickDifferentTopic")}
            </button>
          )}
        </div>
      )}

      {phase === "confirm" && (
        <div className="interactive-confirm-stage">
          <p className="interactive-confirm-label">{t("interactive.confirmLabel")}</p>
          <p className="interactive-confirm-choice">
            {followUpChoice?.label ?? pendingOption?.label ?? primaryChoices.map((c) => c.label).join(", ")}
          </p>
          <p className="interactive-confirm-hint">{t("interactive.confirmHint")}</p>

          <div className="interactive-confirm-actions">
            <button
              type="button"
              className="dashboard-btn dashboard-btn-primary"
              onClick={() => {
                if (followUpChoice) {
                  confirmFollowUp();
                } else {
                  confirmSingleChoice();
                }
              }}
            >
              {t("interactive.yesChoice")}
            </button>
            <button type="button" className="dashboard-btn dashboard-btn-outline" onClick={changeMind}>
              {t("interactive.changeMind")}
            </button>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-outline"
              onClick={() => speakText(followUpChoice?.label ?? pendingOption?.label ?? "")}
            >
              {t("interactive.speakChoice")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function tryStartScenarioFromMessage(
  messageText: string,
): InteractiveScenario | null {
  return matchScenarioFromText(messageText);
}

export { getScenarioById };
