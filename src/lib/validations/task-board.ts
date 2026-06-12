import { z } from "zod";

export const summarizeStepsSchema = z.object({
  taskTitle: z.string().trim().min(1, "Task title is required").max(200),
  taskDescription: z.string().trim().max(2000).optional(),
  stepCount: z.number().int().min(2).max(10),
  existingStepTitles: z.array(z.string().trim().max(80)).max(10).optional(),
});
