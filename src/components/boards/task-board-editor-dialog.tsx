"use client";

import { TaskBoardWorkspace } from "@/components/boards/task-board-workspace";
import { useTranslation } from "@/components/i18n/language-provider";
import type { BoardTask } from "@/lib/boards/types";
import { useEffect } from "react";

type TaskBoardEditorDialogProps = {
  task: BoardTask;
  onChange: (task: BoardTask) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function TaskBoardEditorDialog({
  task,
  onChange,
  onDelete,
  onClose,
}: TaskBoardEditorDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="task-board-editor-overlay" role="presentation">
      <button
        type="button"
        className="task-board-editor-backdrop"
        aria-label={t("taskBoard.closeEditor")}
        onClick={onClose}
      />

      <div
        className="task-board-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-board-editor-title"
      >
        <header className="task-board-editor-header">
          <div>
            <p className="task-board-editor-eyebrow">{t("taskBoard.editorEyebrow")}</p>
            <h2 id="task-board-editor-title" className="task-board-editor-title">
              {task.title}
            </h2>
          </div>
          <div className="task-board-editor-header-actions">
            <button
              type="button"
              className="dashboard-btn dashboard-btn-outline task-board-editor-delete"
              onClick={onDelete}
            >
              {t("taskBoard.removeTask")}
            </button>
            <button
              type="button"
              className="dashboard-btn dashboard-btn-outline task-board-editor-close"
              onClick={onClose}
            >
              {t("taskBoard.closeEditor")}
            </button>
          </div>
        </header>

        <div className="task-board-editor-body">
          <TaskBoardWorkspace task={task} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
