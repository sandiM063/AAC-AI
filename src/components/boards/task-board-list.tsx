"use client";

import { AacSymbol } from "@/components/boards/aac-symbols";
import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { useTranslation } from "@/components/i18n/language-provider";
import type { BoardTask } from "@/lib/boards/types";

type TaskBoardListProps = {
  tasks: BoardTask[];
  onOpenTask: (taskId: string) => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
};

function taskSymbol(task: BoardTask): { symbolId: AacSymbolId; pictogramId?: number } {
  const step = task.steps[0];
  return {
    symbolId: step?.symbolId ?? "star",
    pictogramId: step?.pictogramId,
  };
}

export function TaskBoardList({ tasks, onOpenTask, onAddTask, onDeleteTask }: TaskBoardListProps) {
  const { t } = useTranslation();

  return (
    <section className="task-board-list-panel" data-tutorial="boards-task-list">
      <header className="task-board-list-header">
        <h2 className="task-board-list-title">{t("nav.boards")}</h2>
        <p className="task-board-list-desc">{t("taskBoard.listDesc")}</p>
      </header>

      <div className="task-board-list-body">
        <h3 className="task-board-list-section-title">{t("taskBoard.listTitle")}</h3>

        <div className="task-board-grid task-board-task-grid" role="list">
        {tasks.map((task) => {
          const done = task.completedStepIds.length;
          const total = task.steps.length;

          return (
            <div key={task.id} className="task-board-task-card-wrap" role="listitem">
              <button
                type="button"
                className="task-board-card task-board-task-card"
                onClick={() => onOpenTask(task.id)}
              >
                <span className="task-board-card-symbol-wrap">
                  <AacSymbol
                    id={taskSymbol(task).symbolId}
                    pictogramId={taskSymbol(task).pictogramId}
                    className="task-board-card-symbol"
                    alt={task.title}
                  />
                </span>
                <span className="task-board-card-label">{task.title}</span>
                <span className="task-board-task-meta">
                  {total > 0
                    ? t("taskBoard.taskStepCount", { count: String(total), done: String(done) })
                    : t("taskBoard.taskNoSteps")}
                </span>
              </button>
              <button
                type="button"
                className="task-board-task-delete"
                aria-label={t("taskBoard.removeTaskAria", { title: task.title })}
                onClick={() => onDeleteTask(task.id)}
              >
                <span aria-hidden>×</span>
              </button>
            </div>
          );
        })}

        <div className="task-board-task-card-wrap task-board-add-card-wrap" role="listitem">
          <button
            type="button"
            className="task-board-card task-board-add-card"
            data-tutorial="boards-add-task"
            aria-label={t("taskBoard.addTask")}
            onClick={onAddTask}
          >
            <span className="task-board-add-icon-wrap" aria-hidden>
              <span className="task-board-add-icon">+</span>
            </span>
            <span className="task-board-add-label">{t("taskBoard.addTask")}</span>
            <span className="task-board-task-meta task-board-add-meta">
              {t("taskBoard.addTaskHint")}
            </span>
          </button>
        </div>
        </div>
      </div>

      <footer className="task-board-list-footer">
        <p className="aac-symbol-credit">{t("common.arasaacCredit")}</p>
      </footer>
    </section>
  );
}
