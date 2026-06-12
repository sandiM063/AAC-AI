import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { repairTaskTitle } from "@/lib/ai/create-board-from-prompt";
import { getPictogramIdForSymbol } from "@/lib/aac/arasaac";
import type { BoardTask } from "./types";
import { createTaskId } from "./types";

const STORAGE_KEY = "aac-board-tasks";

function storageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

const DEFAULT_TASKS: Omit<BoardTask, "id" | "updatedAt">[] = [
  {
    title: "Morning routine before school",
    description: "Wake up, get dressed, eat breakfast, and pack bag before leaving.",
    steps: [],
    stepCount: 5,
    detailLevel: "balanced",
    completedStepIds: [],
  },
  {
    title: "Evening wind-down",
    description: "Brush teeth, pajamas, story time, and lights out.",
    steps: [],
    stepCount: 4,
    detailLevel: "balanced",
    completedStepIds: [],
  },
];

export function createDefaultTasks(): BoardTask[] {
  const now = new Date().toISOString();
  return DEFAULT_TASKS.map((task) => ({
    ...task,
    id: createTaskId(),
    updatedAt: now,
  }));
}

function sanitizeLoadedTasks(tasks: BoardTask[]): BoardTask[] {
  let changed = false;

  const sanitized = tasks.map((task) => {
    let taskChanged = false;
    const title = repairTaskTitle(task.title, task.description);
    if (title !== task.title) taskChanged = true;

    const steps = task.steps.map((step) => {
      if (step.pictogramId) return step;
      taskChanged = true;
      return {
        ...step,
        pictogramId: getPictogramIdForSymbol(step.symbolId as AacSymbolId),
      };
    });

    if (!taskChanged) return task;
    changed = true;
    return { ...task, title, steps };
  });

  return changed ? sanitized : tasks;
}

export function loadBoardTasks(userId: string): BoardTask[] {
  if (typeof window === "undefined") return createDefaultTasks();

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return createDefaultTasks();
    const parsed = JSON.parse(raw) as BoardTask[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaultTasks();

    const sanitized = sanitizeLoadedTasks(parsed);
    if (sanitized !== parsed) {
      localStorage.setItem(storageKey(userId), JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return createDefaultTasks();
  }
}

export function saveBoardTasks(userId: string, tasks: BoardTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(tasks));
}
