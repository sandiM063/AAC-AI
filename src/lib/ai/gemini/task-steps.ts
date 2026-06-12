import { Type } from "@google/genai";
import { generateGeminiJson } from "@/lib/ai/gemini/client";
import { AAC_SYSTEM_PREAMBLE } from "@/lib/ai/gemini/prompts";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";

type StepGenerationResult = {
  steps: string[];
};

const STEP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered AAC task step labels",
    },
  },
  required: ["steps"],
};

function clampStepCount(stepCount: number): number {
  return Math.min(10, Math.max(2, Math.round(stepCount)));
}

export async function generateTaskStepTitlesWithGemini(params: {
  taskTitle: string;
  taskDescription?: string;
  stepCount: number;
}): Promise<string[] | null> {
  if (!isGeminiConfigured()) return null;

  const stepCount = clampStepCount(params.stepCount);
  const title = params.taskTitle.trim() || "Daily routine";
  const description = params.taskDescription?.trim() ?? "";

  const system = `${AAC_SYSTEM_PREAMBLE}

Generate AAC task board steps: short action labels (2–6 words) that work as symbol tiles for people using augmentative communication.

Rules:
- Generate exactly ${stepCount} steps — no more, no fewer
- The task TITLE is the primary guide — expand or simplify that single task to match ${stepCount} steps
- With few steps (2–3): use broad phases of the same task
- With many steps (7–10): break the same task into finer sub-steps
- Optional task details are hints only — never limit output to the number of detail lines
- Include ONLY steps that belong to this task — no greetings or unrelated fillers
- Use concrete, everyday language
- Do not number the steps in the text`;

  const user = description
    ? `Task title: ${title}\nOptional notes (hints only):\n${description}\n\nGenerate exactly ${stepCount} ordered steps for "${title}".`
    : `Task title: ${title}\n\nGenerate exactly ${stepCount} ordered steps for this task.`;

  const result = await generateGeminiJson<StepGenerationResult>({
    system,
    user,
    schema: STEP_SCHEMA,
    temperature: 0.35,
  });

  const steps = (result?.steps ?? [])
    .map((step) => step.trim())
    .filter((step) => step.length >= 2 && step.length <= 80);

  if (steps.length < 2) return null;

  if (steps.length === stepCount) return steps;
  if (steps.length > stepCount) return steps.slice(0, stepCount);

  return null;
}
