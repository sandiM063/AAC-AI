import type { DetailLevel, TaskStep } from "@/lib/ai/summarize-task-steps";

export type BoardTask = {
  id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  stepCount: number;
  detailLevel: DetailLevel;
  completedStepIds: string[];
  updatedAt: string;
};

export function createTaskId() {
  return `task-${Math.random().toString(36).slice(2, 10)}`;
}
