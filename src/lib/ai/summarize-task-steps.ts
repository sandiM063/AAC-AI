import type { AacSymbolId } from "@/components/boards/aac-symbols";
import { resolvePictogramIdsForSteps } from "@/lib/aac/resolve-pictogram";
import { generateTaskStepTitlesWithGemini } from "@/lib/ai/gemini/task-steps";
import { StepGenerationError } from "@/lib/ai/step-generation-error";
import { sanitizeTaskDescriptionForGeneration } from "@/lib/ai/task-step-context";
import {
  STEP_LIBRARY,
  STEP_LIBRARY_CATEGORIES,
  type StepLibraryCategoryId,
} from "@/lib/aac/step-library";

export type TaskStep = {
  id: string;
  title: string;
  detail: string;
  order: number;
  symbolId: AacSymbolId;
  pictogramId: number;
};

export type DetailLevel = "broad" | "balanced" | "detailed";

const ROUTINE_TEMPLATES: { keywords: string[]; steps: string[] }[] = [
  {
    keywords: ["morning", "school", "wake", "routine", "get ready", "before school"],
    steps: [
      "Wake up",
      "Use the bathroom",
      "Brush teeth",
      "Get dressed",
      "Eat breakfast",
      "Pack backpack",
      "Put on shoes",
      "Leave for school",
    ],
  },
  {
    keywords: ["evening", "wind-down", "bedtime", "night", "sleep"],
    steps: [
      "Put on pajamas",
      "Brush teeth",
      "Use the bathroom",
      "Read a story",
      "Turn off lights",
      "Go to sleep",
    ],
  },
  {
    keywords: ["doctor", "clinic", "appointment", "visit", "patient", "exam", "health"],
    steps: [
      "Check in at reception",
      "Wait in waiting room",
      "Talk with nurse",
      "See the doctor",
      "Ask questions",
      "Get instructions",
      "Say thank you",
    ],
  },
  {
    keywords: ["meal", "eat", "lunch", "dinner", "breakfast", "kitchen", "food"],
    steps: [
      "Wash hands",
      "Sit at the table",
      "Eat food",
      "Drink water",
      "Clear plate",
      "Say thank you",
    ],
  },
  {
    keywords: ["classroom", "lesson", "teacher", "student", "learn", "arrival", "class"],
    steps: [
      "Say hello",
      "Find your seat",
      "Listen to teacher",
      "Do the activity",
      "Ask for help if needed",
      "Pack up materials",
      "Say goodbye",
    ],
  },
  {
    keywords: ["grocery", "shopping", "store", "market", "shop"],
    steps: [
      "Make a list",
      "Go to the store",
      "Find items",
      "Put items in cart",
      "Pay at checkout",
      "Go home",
    ],
  },
  {
    keywords: ["bath", "shower", "hygiene", "wash"],
    steps: [
      "Get towel and clothes",
      "Turn on water",
      "Wash body",
      "Wash hair",
      "Dry off",
      "Get dressed",
    ],
  },
];

const TASK_SPECIFIC_POOLS: { keywords: RegExp; steps: string[] }[] = [
  {
    keywords: /brush\s*teeth|brushing\s*teeth|teeth|dental|toothbrush/i,
    steps: [
      "Get toothbrush",
      "Get toothpaste",
      "Wet toothbrush",
      "Put toothpaste on brush",
      "Brush top teeth",
      "Brush bottom teeth",
      "Brush tongue",
      "Spit in sink",
      "Rinse mouth",
      "Rinse toothbrush",
      "Put toothbrush away",
    ],
  },
  {
    keywords: /wash\s*hands|hand\s*wash/i,
    steps: [
      "Turn on water",
      "Wet hands",
      "Add soap",
      "Scrub hands",
      "Rinse hands",
      "Dry hands",
    ],
  },
  {
    keywords: /get\s*dressed|dressing|clothes/i,
    steps: [
      "Pick out clothes",
      "Put on underwear",
      "Put on shirt",
      "Put on pants",
      "Put on socks",
      "Put on shoes",
    ],
  },
];

function createId() {
  return `step-${Math.random().toString(36).slice(2, 10)}`;
}

function capitalizeStep(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function scoreTemplate(haystack: string, keywords: string[]): number {
  return keywords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

function isPreferenceQuestion(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  return (
    /\b(what|which|choose|pick|want|prefer|decide)\b/.test(haystack) &&
    /\b(breakfast|lunch|dinner|eat|food|wear|go|feel|activity)\b/.test(haystack)
  );
}

function bestTemplateSteps(title: string, description: string): string[] | null {
  if (isPreferenceQuestion(title, description)) {
    return null;
  }

  const haystack = `${title} ${description}`.toLowerCase();
  let best: { steps: string[]; score: number } | null = null;

  for (const template of ROUTINE_TEMPLATES) {
    const score = scoreTemplate(haystack, template.keywords);
    if (score >= 1 && (!best || score > best.score)) {
      best = { steps: template.steps, score };
    }
  }

  return best?.steps ?? null;
}

function taskSpecificPool(title: string, description: string): string[] | null {
  const haystack = `${title} ${description}`;
  for (const pool of TASK_SPECIFIC_POOLS) {
    if (pool.keywords.test(haystack)) {
      return pool.steps;
    }
  }
  return null;
}

function splitIntoClauses(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .flatMap((line) => line.split(/[.;]+/))
    .flatMap((part) => {
      const trimmed = part.replace(/^[\s\-•*\d.)]+/, "").trim();
      if (!trimmed) return [];
      if (trimmed.includes(",") && trimmed.split(",").every((piece) => piece.trim().length >= 4)) {
        return trimmed.split(",").map((piece) => piece.trim());
      }
      return [trimmed];
    })
    .map((part) => part.replace(/^and\s+/i, "").trim())
    .filter((part) => part.length >= 4 && part.length <= 80);

  const unique: string[] = [];
  for (const clause of normalized) {
    const key = clause.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === key)) {
      unique.push(clause);
    }
  }
  return unique;
}

function pickEvenly(steps: string[], count: number): string[] {
  if (steps.length === 0) return [];
  if (steps.length <= count) return steps.slice(0, count);
  if (count === 1) return [steps[0]];

  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i * (steps.length - 1)) / (count - 1));
    picked.push(steps[index]);
  }
  return picked;
}

function libraryLabel(item: (typeof STEP_LIBRARY)[number]): string {
  const keyword = item.keywords.find((word) => word.length >= 3) ?? item.keywords[0];
  return capitalizeStep(keyword ?? item.id);
}

function matchLibrarySteps(title: string, description: string): string[] {
  const haystack = `${title} ${description}`.toLowerCase();
  const scored = STEP_LIBRARY.map((item) => {
    let score = 0;
    for (const keyword of item.keywords) {
      const normalized = keyword.toLowerCase();
      if (haystack.includes(normalized)) {
        score = Math.max(score, normalized.length);
      }
    }
    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const labels: string[] = [];
  for (const { item } of scored) {
    const label = libraryLabel(item);
    if (!labels.some((existing) => existing.toLowerCase() === label.toLowerCase())) {
      labels.push(label);
    }
  }
  return labels;
}

function bestCategorySteps(title: string, description: string): string[] {
  const haystack = `${title} ${description}`.toLowerCase();
  let bestCategory: StepLibraryCategoryId = "actions";
  let bestScore = 0;

  for (const category of STEP_LIBRARY_CATEGORIES) {
    const items = STEP_LIBRARY.filter((item) => item.category === category.id);
    const score = items.reduce(
      (total, item) =>
        total +
        item.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length,
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category.id;
    }
  }

  if (bestScore < 1) return [];

  return STEP_LIBRARY.filter((item) => item.category === bestCategory)
    .slice(0, 10)
    .map((item) => libraryLabel(item));
}

function titlePhaseSteps(title: string, requestedCount: number): string[] {
  const task = title.trim() || "this task";
  const phases = [
    `Get ready to ${task}`,
    `Start ${task}`,
    `Continue ${task}`,
    `Check ${task}`,
    `Keep working on ${task}`,
    `Almost finish ${task}`,
    `Finish ${task}`,
    `Clean up after ${task}`,
    `Done with ${task}`,
  ];
  return pickEvenly(phases, requestedCount).map(capitalizeStep);
}

function collectTitleDrivenPool(title: string, description: string): string[] {
  const trimmedTitle = title.trim() || "Daily routine";

  const specific = taskSpecificPool(trimmedTitle, description);
  if (specific) return specific.map(capitalizeStep);

  const fromTemplate = bestTemplateSteps(trimmedTitle, description);
  if (fromTemplate) return fromTemplate.map(capitalizeStep);

  const fromLibrary = matchLibrarySteps(trimmedTitle, description);
  if (fromLibrary.length >= 2) return fromLibrary;

  const fromCategory = bestCategorySteps(trimmedTitle, description);
  if (fromCategory.length >= 2) return fromCategory;

  return [];
}

function collectNaturalStepTitles(
  title: string,
  description: string,
  requestedCount: number,
): string[] {
  const trimmedTitle = title.trim() || "Daily routine";
  const fromDescription = splitIntoClauses(description);

  if (fromDescription.length >= requestedCount) {
    return pickEvenly(fromDescription, requestedCount).map(capitalizeStep);
  }

  const titlePool = collectTitleDrivenPool(trimmedTitle, description);
  if (titlePool.length >= requestedCount) {
    return pickEvenly(titlePool, requestedCount);
  }

  if (fromDescription.length >= 2 && titlePool.length >= 2) {
    const merged = [...fromDescription.map(capitalizeStep)];
    for (const step of titlePool) {
      if (!merged.some((existing) => existing.toLowerCase() === step.toLowerCase())) {
        merged.push(step);
      }
      if (merged.length >= requestedCount) break;
    }
    if (merged.length >= requestedCount) {
      return pickEvenly(merged, requestedCount);
    }
  }

  if (titlePool.length >= 2) {
    return pickEvenly(titlePool, requestedCount);
  }

  if (fromDescription.length >= 2) {
    return pickEvenly(fromDescription, requestedCount).map(capitalizeStep);
  }

  if (fromDescription.length === 1 && trimmedTitle.length >= 3) {
    const merged = [
      ...fromDescription.map(capitalizeStep),
      ...titlePhaseSteps(trimmedTitle, requestedCount - 1),
    ];
    return pickEvenly(merged, requestedCount);
  }

  if (trimmedTitle.length >= 3) {
    return titlePhaseSteps(trimmedTitle, requestedCount);
  }

  return [];
}

function fitStepCount(
  naturalSteps: string[],
  requestedCount: number,
): { ok: true; steps: string[] } | { ok: false; naturalStepCount: number } {
  const unique: string[] = [];
  for (const step of naturalSteps) {
    const normalized = step.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === key)) {
      unique.push(normalized);
    }
  }

  if (unique.length < 2) {
    return { ok: false, naturalStepCount: unique.length };
  }

  if (unique.length < requestedCount) {
    return { ok: false, naturalStepCount: unique.length };
  }

  if (unique.length === requestedCount) {
    return { ok: true, steps: unique.map(capitalizeStep) };
  }

  return { ok: true, steps: pickEvenly(unique, requestedCount).map(capitalizeStep) };
}

export function validateStepTitlesForCount(
  naturalSteps: string[],
  requestedCount: number,
): string[] {
  const fit = fitStepCount(naturalSteps, requestedCount);
  if (fit.ok) return fit.steps;

  throw new StepGenerationError({
    code: fit.naturalStepCount < 2 ? "insufficient_detail" : "too_many_steps_requested",
    naturalStepCount: fit.naturalStepCount,
    requestedStepCount: requestedCount,
  });
}

function toDetail(title: string, detailLevel: DetailLevel): string {
  if (detailLevel === "broad") {
    return `Complete: ${title}`;
  }
  if (detailLevel === "balanced") {
    return `${title}. Use your board if you need help.`;
  }
  return `${title}. Take your time and ask for support if needed.`;
}

export function getDetailLevel(stepCount: number): DetailLevel {
  if (stepCount <= 3) return "broad";
  if (stepCount <= 6) return "balanced";
  return "detailed";
}

export async function buildTaskStepsFromTitles(
  titles: string[],
  detailLevel?: DetailLevel,
): Promise<TaskStep[]> {
  const level = detailLevel ?? getDetailLevel(titles.length);
  const normalized = titles.map((title) => capitalizeStep(title.trim())).filter(Boolean);
  const symbols = await resolvePictogramIdsForSteps(normalized);

  return normalized.map((title, index) => ({
    id: createId(),
    title,
    detail: toDetail(title, level),
    order: index + 1,
    symbolId: symbols[index].symbolId,
    pictogramId: symbols[index].pictogramId,
  }));
}

export async function summarizeTaskSteps(params: {
  taskTitle: string;
  taskDescription?: string;
  stepCount: number;
  existingStepTitles?: string[];
}): Promise<TaskStep[]> {
  const requestedCount = Math.min(10, Math.max(2, Math.round(params.stepCount)));
  const taskTitle = params.taskTitle.trim() || "Daily routine";
  const taskDescription = sanitizeTaskDescriptionForGeneration(
    params.taskDescription,
    params.existingStepTitles,
  );

  const geminiTitles = await generateTaskStepTitlesWithGemini({
    taskTitle,
    taskDescription,
    stepCount: requestedCount,
  });

  let titles: string[];

  if (geminiTitles && geminiTitles.length === requestedCount) {
    titles = geminiTitles.map(capitalizeStep);
  } else {
    const naturalTitles = collectNaturalStepTitles(taskTitle, taskDescription, requestedCount);
    titles = validateStepTitlesForCount(naturalTitles, requestedCount);
  }

  const detailLevel = getDetailLevel(requestedCount);
  return buildTaskStepsFromTitles(titles, detailLevel);
}
