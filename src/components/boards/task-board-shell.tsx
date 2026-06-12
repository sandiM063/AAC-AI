"use client";

import { TaskBoardEditorDialog } from "@/components/boards/task-board-editor-dialog";
import { TaskBoardList } from "@/components/boards/task-board-list";
import { CommunityPresetsPanel } from "@/components/presets/community-presets-panel";
import "@/components/presets/community-presets-panel.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { loadBoardTasks, saveBoardTasks } from "@/lib/boards/storage";
import type { BoardTask } from "@/lib/boards/types";
import { createTaskId } from "@/lib/boards/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type TaskBoardShellProps = {
  userId: string;
};

type BoardView = "mine" | "presets";

export function TaskBoardShell({ userId }: TaskBoardShellProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<BoardView>("mine");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(loadBoardTasks(userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    const taskId = searchParams.get("task");
    if (taskId && tasks.some((task) => task.id === taskId)) {
      setOpenTaskId(taskId);
    }
  }, [hydrated, searchParams, tasks]);

  const persist = useCallback(
    (next: BoardTask[]) => {
      setTasks(next);
      saveBoardTasks(userId, next);
    },
    [userId],
  );

  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;
  const pendingDeleteTask = tasks.find((task) => task.id === pendingDeleteId) ?? null;

  function handleOpenTask(taskId: string) {
    setOpenTaskId(taskId);
  }

  function handleAddTask() {
    const now = new Date().toISOString();
    const task: BoardTask = {
      id: createTaskId(),
      title: t("taskBoard.newTaskDefault"),
      description: "",
      steps: [],
      stepCount: 5,
      detailLevel: "balanced",
      completedStepIds: [],
      updatedAt: now,
    };
    persist([...tasks, task]);
    setOpenTaskId(task.id);
  }

  function handleTaskChange(updated: BoardTask) {
    persist(
      tasks.map((task) =>
        task.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : task,
      ),
    );
  }

  function requestDeleteTask(taskId: string) {
    setPendingDeleteId(taskId);
  }

  function confirmDeleteTask() {
    if (!pendingDeleteId) return;

    persist(tasks.filter((item) => item.id !== pendingDeleteId));
    if (openTaskId === pendingDeleteId) {
      setOpenTaskId(null);
    }
    setPendingDeleteId(null);
  }

  function handleApplyPresetTask(task: Omit<BoardTask, "updatedAt">) {
    const now = new Date().toISOString();
    const boardTask: BoardTask = { ...task, updatedAt: now };
    persist([...tasks, boardTask]);
    setView("mine");
    setOpenTaskId(boardTask.id);
  }

  if (!hydrated) {
    return null;
  }

  return (
    <>
      <div className="board-view-tabs" role="tablist" aria-label={t("communityPresets.viewTabs")}>
        <button
          type="button"
          role="tab"
          aria-selected={view === "mine"}
          className={`board-view-tab ${view === "mine" ? "board-view-tab-active" : ""}`}
          onClick={() => setView("mine")}
        >
          {t("communityPresets.myTasks")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "presets"}
          className={`board-view-tab ${view === "presets" ? "board-view-tab-active" : ""}`}
          onClick={() => setView("presets")}
        >
          {t("communityPresets.tabPresets")}
        </button>
      </div>

      {view === "mine" ? (
        <TaskBoardList
          tasks={tasks}
          onOpenTask={handleOpenTask}
          onAddTask={handleAddTask}
          onDeleteTask={requestDeleteTask}
        />
      ) : (
        <CommunityPresetsPanel type="task" onApplyTask={handleApplyPresetTask} />
      )}

      {openTask && (
        <TaskBoardEditorDialog
          task={openTask}
          onChange={handleTaskChange}
          onDelete={() => requestDeleteTask(openTask.id)}
          onClose={() => setOpenTaskId(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteTask)}
        title={t("taskBoard.removeTask")}
        description={t("taskBoard.removeTaskConfirm", {
          title: pendingDeleteTask?.title ?? "",
        })}
        confirmLabel={t("taskBoard.removeTask")}
        danger
        onConfirm={confirmDeleteTask}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
