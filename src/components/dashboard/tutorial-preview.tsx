"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import type { SectionTutorialId } from "@/lib/tutorials/registry";

type TutorialPreviewProps = {
  tutorialId: SectionTutorialId;
  step: number;
};

export function TutorialPreview({ tutorialId, step }: TutorialPreviewProps) {
  const { t } = useTranslation();

  if (tutorialId === "overview") {
    return <OverviewPreview step={step} t={t} />;
  }

  if (tutorialId === "boards") {
    return <BoardsPreview step={step} t={t} />;
  }

  if (tutorialId === "settings") {
    return <SettingsPreview step={step} t={t} />;
  }

  return <ProfilePreview step={step} t={t} />;
}

type TFn = (key: string, params?: Record<string, string | number>) => string;

function OverviewPreview({ step, t }: { step: number; t: TFn }) {
  if (step === 1) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("tutorialDemo.preview.welcomeTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("tutorialDemo.preview.welcomeDesc")}</p>
        <div className="tutorial-demo-mock-board">
          {["Hello", "Yes", "Help", "Thanks"].map((label) => (
            <div key={label} className="tutorial-demo-mock-tile">
              {label}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("tutorialDemo.preview.boardTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("tutorialDemo.preview.boardDesc")}</p>
        <div className="tutorial-demo-mock-board">
          {["Wake up", "Dress", "Breakfast", "Pack bag", "Shoes", "Leave", "Bus", "School"].map(
            (label, index) => (
              <div
                key={label}
                className={`tutorial-demo-mock-tile ${index === 2 ? "tutorial-demo-mock-tile-highlight" : ""}`}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("tutorialDemo.preview.aiTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("tutorialDemo.preview.aiDesc")}</p>
        <div className="tutorial-demo-mock-steps">
          {[
            t("tutorialDemo.preview.sampleStep1"),
            t("tutorialDemo.preview.sampleStep2"),
            t("tutorialDemo.preview.sampleStep3"),
            t("tutorialDemo.preview.sampleStep4"),
            t("tutorialDemo.preview.sampleStep5"),
          ].map((label, index) => (
            <div
              key={label}
              className={`tutorial-demo-mock-step ${index === 1 ? "tutorial-demo-mock-step-active" : ""}`}
            >
              <span className="tutorial-demo-mock-step-num">{index + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("tutorialDemo.preview.printTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("tutorialDemo.preview.printDesc")}</p>
        <div className="tutorial-demo-mock-print">
          <div className="tutorial-demo-mock-print-line" />
          <div className="tutorial-demo-mock-print-line tutorial-demo-mock-print-line-short" />
          <div className="tutorial-demo-mock-print-line" />
          <div className="tutorial-demo-mock-print-line tutorial-demo-mock-print-line-short" />
        </div>
      </>
    );
  }

  return (
    <div className="tutorial-demo-complete">
      <span className="tutorial-demo-complete-icon" aria-hidden>
        ✓
      </span>
      <h3 className="tutorial-demo-preview-title">{t("tutorialDemo.preview.doneTitle")}</h3>
      <p className="tutorial-demo-preview-desc">{t("tutorialDemo.preview.doneDesc")}</p>
    </div>
  );
}

function BoardsPreview({ step, t }: { step: number; t: TFn }) {
  if (step === 1) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.boards.preview.taskTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("sectionTutorials.boards.preview.taskDesc")}</p>
        <div className="tutorial-demo-mock-form">
          <div className="tutorial-demo-mock-print-line" />
          <div className="tutorial-demo-mock-print-line tutorial-demo-mock-print-line-short" />
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.boards.preview.aiTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("sectionTutorials.boards.preview.aiDesc")}</p>
        <div className="tutorial-demo-mock-range">
          <span className="tutorial-demo-mock-range-track" />
          <span className="tutorial-demo-mock-range-thumb" />
        </div>
        <div className="tutorial-demo-mock-steps">
          {[1, 2, 3].map((num) => (
            <div key={num} className="tutorial-demo-mock-step">
              <span className="tutorial-demo-mock-step-num">{num}</span>
              <span>{t(`sectionTutorials.boards.preview.sampleStep${num}`)}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.boards.preview.interactTitle")}</h3>
      <p className="tutorial-demo-preview-desc">{t("sectionTutorials.boards.preview.interactDesc")}</p>
      <div className="tutorial-demo-mock-actions">
        <span className="tutorial-demo-mock-chip">{t("sectionTutorials.boards.preview.chipCheck")}</span>
        <span className="tutorial-demo-mock-chip">{t("sectionTutorials.boards.preview.chipPrint")}</span>
      </div>
    </>
  );
}

function SettingsPreview({ step, t }: { step: number; t: TFn }) {
  if (step === 1) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.settings.preview.themeTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("sectionTutorials.settings.preview.themeDesc")}</p>
        <div className="tutorial-demo-mock-theme-grid">
          {["green", "blue", "violet", "teal"].map((theme, index) => (
            <div
              key={theme}
              className={`tutorial-demo-mock-theme ${index === 0 ? "tutorial-demo-mock-theme-active" : ""}`}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.settings.preview.saveTitle")}</h3>
      <p className="tutorial-demo-preview-desc">{t("sectionTutorials.settings.preview.saveDesc")}</p>
      <div className="tutorial-demo-mock-save-bar">
        <span className="tutorial-demo-mock-print-line tutorial-demo-mock-print-line-short" />
        <span className="tutorial-demo-mock-btn" />
        <span className="tutorial-demo-mock-btn tutorial-demo-mock-btn-primary" />
      </div>
    </>
  );
}

function ProfilePreview({ step, t }: { step: number; t: TFn }) {
  if (step === 1) {
    return (
      <>
        <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.profile.preview.photoTitle")}</h3>
        <p className="tutorial-demo-preview-desc">{t("sectionTutorials.profile.preview.photoDesc")}</p>
        <div className="tutorial-demo-mock-profile-row">
          <span className="tutorial-demo-mock-avatar" />
          <div className="tutorial-demo-mock-profile-text">
            <div className="tutorial-demo-mock-print-line tutorial-demo-mock-print-line-short" />
            <div className="tutorial-demo-mock-print-line" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="tutorial-demo-preview-title">{t("sectionTutorials.profile.preview.accountTitle")}</h3>
      <p className="tutorial-demo-preview-desc">{t("sectionTutorials.profile.preview.accountDesc")}</p>
      <div className="tutorial-demo-mock-actions tutorial-demo-mock-actions-column">
        <span className="tutorial-demo-mock-btn tutorial-demo-mock-btn-wide" />
        <span className="tutorial-demo-mock-btn tutorial-demo-mock-btn-wide tutorial-demo-mock-btn-danger" />
      </div>
    </>
  );
}
