"use client";

import "./task-board.css";
import { AacSymbol } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import type { BoardTask } from "@/lib/boards/types";
import type { DetailLevel, TaskStep } from "@/lib/ai/summarize-task-steps";
import { getDetailLevel } from "@/lib/ai/summarize-task-steps";
import {
  StepLibraryDialog,
  type StepLibrarySelection,
} from "@/components/boards/step-library-dialog";
import { getPictogramIdForSymbol } from "@/lib/aac/arasaac";
import { matchStepSymbol } from "@/lib/aac/match-step-symbol";
import { matchLibraryItem } from "@/lib/aac/step-library";
import { useCallback, useEffect, useState } from "react";

type StepGenerationErrorCode = "insufficient_detail" | "too_many_steps_requested";

type SummarizeResponse = {
  steps?: TaskStep[];
  detailLevel?: DetailLevel;
  stepCount?: number;
  error?: string;
  code?: StepGenerationErrorCode | "unknown";
  naturalStepCount?: number;
  requestedStepCount?: number;
};

type TaskBoardWorkspaceProps = {
  task: BoardTask;
  onChange: (task: BoardTask) => void;
};

function createStepId() {
  return `step-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveSymbolsForTitle(title: string, currentPictogramId?: number) {
  const library = matchLibraryItem(title);
  if (library) {
    return { symbolId: library.symbolId, pictogramId: library.pictogramId };
  }
  const symbolId = matchStepSymbol(title);
  return {
    symbolId,
    pictogramId: currentPictogramId ?? getPictogramIdForSymbol(symbolId),
  };
}

export function TaskBoardWorkspace({ task, onChange }: TaskBoardWorkspaceProps) {
  const { t } = useTranslation();
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [taskDescription, setTaskDescription] = useState(task.description);
  const [stepCount, setStepCount] = useState(task.stepCount);
  const [steps, setSteps] = useState<TaskStep[]>(task.steps);
  const [activeStepId, setActiveStepId] = useState<string | null>(task.steps[0]?.id ?? null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(task.completedStepIds),
  );
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(task.detailLevel);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setStepCount(task.stepCount);
    setSteps(task.steps);
    setActiveStepId(task.steps[0]?.id ?? null);
    setCompletedIds(new Set(task.completedStepIds));
    setDetailLevel(task.detailLevel);
  }, [task.id]);

  const pushChange = useCallback(
    (patch: Partial<BoardTask>) => {
      onChange({
        ...task,
        title: taskTitle,
        description: taskDescription,
        stepCount,
        steps,
        detailLevel,
        completedStepIds: Array.from(completedIds),
        ...patch,
      });
    },
    [task, taskTitle, taskDescription, stepCount, steps, detailLevel, completedIds, onChange],
  );

  const resolveGenerateError = useCallback(
    (data: SummarizeResponse): string => {
      if (
        data.code === "too_many_steps_requested" &&
        data.naturalStepCount !== undefined &&
        data.requestedStepCount !== undefined
      ) {
        return t("taskBoard.cannotBreakDown", {
          count: String(data.requestedStepCount),
          natural: String(data.naturalStepCount),
        });
      }

      if (data.code === "insufficient_detail") {
        return t("taskBoard.insufficientDetail");
      }

      return t("taskBoard.generateError");
    },
    [t],
  );

  const generateSteps = useCallback(async () => {
    const hasDescription = taskDescription.trim().length >= 12;
    const hasSpecificTitle = taskTitle.trim().length >= 4 && taskTitle.trim() !== t("taskBoard.newTaskDefault");

    if (!hasDescription && !hasSpecificTitle) {
      setError(t("taskBoard.generateNeedsDetail"));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/summarize-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle,
          taskDescription,
          stepCount,
          existingStepTitles: steps.map((step) => step.title),
        }),
      });

      const data = (await response.json()) as SummarizeResponse;

      if (!response.ok || !data.steps) {
        setError(resolveGenerateError(data));
        return;
      }

      setSteps(data.steps);
      setStepCount(stepCount);
      setDetailLevel(data.detailLevel ?? getDetailLevel(stepCount));
      setActiveStepId(data.steps[0]?.id ?? null);
      setCompletedIds(new Set());
      onChange({
        ...task,
        title: taskTitle,
        description: taskDescription,
        stepCount,
        steps: data.steps,
        detailLevel: data.detailLevel ?? getDetailLevel(stepCount),
        completedStepIds: [],
      });
    } catch {
      setError(t("taskBoard.generateError"));
    } finally {
      setIsGenerating(false);
    }
  }, [task, taskTitle, taskDescription, stepCount, steps, onChange, t, resolveGenerateError]);

  const activeStep = steps.find((step) => step.id === activeStepId) ?? null;
  const activeIndex = activeStep ? steps.findIndex((step) => step.id === activeStep.id) : -1;
  const completedCount = steps.filter((step) => completedIds.has(step.id)).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  function toggleComplete(stepId: string) {
    const next = new Set(completedIds);
    if (next.has(stepId)) next.delete(stepId);
    else next.add(stepId);
    setCompletedIds(next);
    pushChange({ completedStepIds: Array.from(next) });
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;

    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    const reordered = next.map((step, order) => ({ ...step, order: order + 1 }));
    setSteps(reordered);
    pushChange({ steps: reordered });
  }

  function addStepFromLibrary(selection: StepLibrarySelection) {
    const newStep: TaskStep = {
      id: createStepId(),
      title: selection.title,
      detail: selection.title,
      order: steps.length + 1,
      symbolId: selection.symbolId,
      pictogramId: selection.pictogramId,
    };
    const nextSteps = [...steps, newStep];
    const nextCount = nextSteps.length;
    setSteps(nextSteps);
    setStepCount(nextCount);
    setActiveStepId(newStep.id);
    pushChange({ steps: nextSteps, stepCount: nextCount });
  }

  function removeActiveStep() {
    if (!activeStep || steps.length <= 1) return;

    const removedId = activeStep.id;
    const remaining = steps.filter((step) => step.id !== removedId);
    const reordered = remaining.map((step, order) => ({ ...step, order: order + 1 }));
    const nextActiveId = reordered[Math.min(activeIndex, reordered.length - 1)]?.id ?? null;
    const nextCompleted = Array.from(completedIds).filter((id) => id !== removedId);

    const nextCount = reordered.length;
    setSteps(reordered);
    setStepCount(nextCount);
    setCompletedIds(new Set(nextCompleted));
    setActiveStepId(nextActiveId);
    pushChange({ steps: reordered, stepCount: nextCount, completedStepIds: nextCompleted });
  }

  function updateActiveStepTitle(title: string) {
    if (!activeStep) return;
    const nextSteps = steps.map((step) =>
      step.id === activeStep.id
        ? { ...step, title, detail: title, ...resolveSymbolsForTitle(title, step.pictogramId) }
        : step,
    );
    setSteps(nextSteps);
    pushChange({ steps: nextSteps });
  }

  function handleTitleChange(title: string) {
    setTaskTitle(title);
    pushChange({ title });
  }

  function handleDescriptionChange(description: string) {
    setTaskDescription(description);
    pushChange({ description });
  }

  function handleStepCountChange(count: number) {
    setStepCount(count);
    pushChange({ stepCount: count });
  }

  function handlePrint() {
    window.print();
  }

  const detailLabel =
    detailLevel === "broad"
      ? t("taskBoard.detailBroad")
      : detailLevel === "balanced"
        ? t("taskBoard.detailBalanced")
        : t("taskBoard.detailDetailed");

  return (
    <div className="task-board-page">
      <div className="task-board-toolbar task-board-no-print">
        <div className="task-board-progress" style={{ flex: "1 1 12rem", maxWidth: "20rem" }}>
          <div className="task-board-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="task-board-toolbar-actions">
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline"
            onClick={handlePrint}
            disabled={steps.length === 0}
          >
            {t("taskBoard.print")}
          </button>
        </div>
      </div>

      <div className="task-board-layout">
        <section className="dashboard-card task-board-main task-board-no-print">
          <div className="task-board-task-form" data-tutorial="boards-task-form">
            <label className="task-board-field">
              <span className="task-board-field-label">{t("taskBoard.taskTitle")}</span>
              <input
                type="text"
                className="task-board-input"
                value={taskTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </label>
            <label className="task-board-field">
              <span className="task-board-field-label">{t("taskBoard.taskDescription")}</span>
              <textarea
                className="task-board-textarea"
                value={taskDescription}
                placeholder={t("taskBoard.taskDescriptionPlaceholder")}
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
            </label>
          </div>

          <div data-tutorial="boards-aac-grid">
            <div className="task-board-steps-header">
              <h3 className="task-board-steps-title">{t("taskBoard.boardTitle")}</h3>
              <span className="task-board-steps-meta">
                {t("taskBoard.stepsProgress", {
                  done: String(completedCount),
                  total: String(steps.length),
                })}
              </span>
            </div>

            <div className="task-board-grid task-board-steps-grid" role="list">
              {steps.length === 0 && !isGenerating && (
                <p className="task-board-empty task-board-empty-inline">{t("taskBoard.emptySteps")}</p>
              )}
              {steps.map((step, index) => {
                const isActive = activeStepId === step.id;
                const isDone = completedIds.has(step.id);

                return (
                  <div
                    key={step.id}
                    role="listitem"
                    tabIndex={0}
                    aria-label={step.title}
                    aria-pressed={isActive}
                    className={`task-board-card ${isActive ? "task-board-card-active" : ""} ${isDone ? "task-board-card-done" : ""}`}
                    onClick={() => setActiveStepId(step.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveStepId(step.id);
                      }
                    }}
                  >
                    <span className="task-board-card-symbol-wrap">
                      <AacSymbol
                        id={step.symbolId}
                        pictogramId={step.pictogramId}
                        className="task-board-card-symbol"
                        alt={step.title}
                      />
                    </span>
                    <span className="task-board-card-label">{step.title}</span>
                    {isDone && (
                      <span className="task-board-card-done-badge" aria-hidden>
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="task-board-card task-board-step-add-card"
                aria-label={t("taskBoard.addStep")}
                onClick={() => setLibraryOpen(true)}
              >
                <span className="task-board-step-add-icon-wrap" aria-hidden>
                  <span className="task-board-step-add-icon">+</span>
                </span>
                <span className="task-board-card-label">{t("taskBoard.addStep")}</span>
                <span className="task-board-task-meta">{t("stepLibrary.openHint")}</span>
              </button>
            </div>

            {activeStep && steps.length > 0 && (
              <div className="task-board-step-toolbar-wrap">
                <div className="task-board-step-toolbar" role="toolbar" aria-label={activeStep.title}>
                  <button
                    type="button"
                    className="task-board-toolbar-btn"
                    onClick={() => toggleComplete(activeStep.id)}
                  >
                    {completedIds.has(activeStep.id)
                      ? t("taskBoard.markIncomplete")
                      : t("taskBoard.markComplete")}
                  </button>
                  <button
                    type="button"
                    className="task-board-toolbar-btn"
                    disabled={activeIndex <= 0}
                    onClick={() => moveStep(activeIndex, -1)}
                  >
                    {t("taskBoard.moveUp")}
                  </button>
                  <button
                    type="button"
                    className="task-board-toolbar-btn"
                    disabled={activeIndex >= steps.length - 1}
                    onClick={() => moveStep(activeIndex, 1)}
                  >
                    {t("taskBoard.moveDown")}
                  </button>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      className="task-board-toolbar-btn task-board-toolbar-btn-danger"
                      onClick={removeActiveStep}
                    >
                      {t("taskBoard.removeStep")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="task-board-output" aria-live="polite" data-tutorial="boards-output">
            <span className="task-board-output-label">{t("taskBoard.caregiverHint")}</span>
            {activeStep ? (
              <input
                type="text"
                className="task-board-output-input"
                value={activeStep.title}
                onChange={(e) => updateActiveStepTitle(e.target.value)}
                aria-label={t("taskBoard.taskTitle")}
              />
            ) : (
              <p className="task-board-output-text">{t("taskBoard.tapTile")}</p>
            )}
          </div>
        </section>

        <aside className="task-board-ai-panel task-board-no-print" data-tutorial="boards-ai-panel">
          <div>
            <h3 className="task-board-ai-title">{t("taskBoard.aiTitle")}</h3>
            <p className="task-board-ai-desc">{t("taskBoard.aiDesc")}</p>
          </div>

          <div className="task-board-step-count">
            <div className="task-board-step-count-row">
              <span className="task-board-field-label">{t("taskBoard.stepCount")}</span>
              <span className="task-board-step-count-value">{stepCount}</span>
            </div>
            <input
              type="range"
              className="task-board-range"
              min={2}
              max={10}
              value={stepCount}
              onChange={(e) => handleStepCountChange(Number(e.target.value))}
              aria-label={t("taskBoard.stepCount")}
            />
            <span className="task-board-detail-badge">{detailLabel}</span>
          </div>

          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary"
            style={{ width: "100%", marginTop: 0 }}
            disabled={isGenerating}
            onClick={() => void generateSteps()}
          >
            {isGenerating ? t("taskBoard.generating") : t("taskBoard.generate")}
          </button>

          {error && (
            <div role="alert" className="task-board-ai-alert">
              <span className="task-board-ai-alert-icon" aria-hidden>
                !
              </span>
              <p className="task-board-ai-alert-text">{error}</p>
            </div>
          )}

          <ul className="task-board-ai-suggestions">
            <li>{t("taskBoard.tipFewSteps")}</li>
            <li>{t("taskBoard.tipManySteps")}</li>
            <li>{t("taskBoard.tipSymbols")}</li>
          </ul>
        </aside>
      </div>

      <StepLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={addStepFromLibrary}
      />

      <div className="task-board-print-root" aria-hidden>
        <h1 className="task-board-print-title">{taskTitle}</h1>
        <p className="task-board-print-meta">
          {t("taskBoard.printMeta", {
            count: String(steps.length),
            detail: detailLabel,
          })}
        </p>
        <ol className="task-board-print-grid">
          {steps.map((step) => (
            <li key={step.id} className="task-board-print-tile">
              <span className="task-board-print-tile-order">{step.order}</span>
              <AacSymbol
                id={step.symbolId}
                pictogramId={step.pictogramId}
                className="task-board-print-tile-symbol"
                alt={step.title}
              />
              <span className="task-board-print-tile-label">{step.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
