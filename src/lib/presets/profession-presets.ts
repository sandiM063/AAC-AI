import type { BoardTask } from "@/lib/boards/types";
import type { PhraseCategoryId } from "@/lib/communication/phrases";
import type { StoredProfessionId } from "@/lib/professions";

export type ProfessionPresetBundle = {
  defaultPhraseCategory: PhraseCategoryId;
  boardTasks: Omit<BoardTask, "id" | "updatedAt">[];
};

const PRESETS: Record<StoredProfessionId, ProfessionPresetBundle> = {
  physician: {
    defaultPhraseCategory: "health",
    boardTasks: [
      {
        title: "Patient visit",
        description: "Check in, wait, talk with nurse, see doctor, ask questions, follow-up.",
        steps: [],
        stepCount: 6,
        detailLevel: "balanced",
        completedStepIds: [],
      },
      {
        title: "Morning clinical handoff",
        description: "Review notes, see patients, document, and plan follow-up.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
    ],
  },
  caregiver: {
    defaultPhraseCategory: "selfcare",
    boardTasks: [
      {
        title: "Morning care routine",
        description: "Wake up, bathroom, brush teeth, get dressed, eat breakfast.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
      {
        title: "Evening wind-down",
        description: "Brush teeth, pajamas, story time, lights out.",
        steps: [],
        stepCount: 4,
        detailLevel: "balanced",
        completedStepIds: [],
      },
    ],
  },
  teacher: {
    defaultPhraseCategory: "school",
    boardTasks: [
      {
        title: "Classroom morning arrival",
        description: "Say hello, find seat, listen to teacher, start activity.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
      {
        title: "Lesson routine",
        description: "Materials ready, listen, participate, pack up, goodbye.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
    ],
  },
  physician_caregiver: {
    defaultPhraseCategory: "health",
    boardTasks: [
      {
        title: "Patient visit",
        description: "Check in, wait, see clinician, ask questions, follow-up.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
      {
        title: "Home care morning",
        description: "Wake up, hygiene, breakfast, medications reminder, leave.",
        steps: [],
        stepCount: 5,
        detailLevel: "balanced",
        completedStepIds: [],
      },
    ],
  },
};

export function getProfessionPresets(
  profession: StoredProfessionId | null | undefined,
): ProfessionPresetBundle {
  if (profession && profession in PRESETS) {
    return PRESETS[profession];
  }
  return PRESETS.caregiver;
}

const PRESETS_APPLIED_KEY = "aac-presets-applied";
const PHRASE_CATEGORY_KEY = "aac-phrase-category";

function presetsAppliedKey(userId: string) {
  return `${PRESETS_APPLIED_KEY}:${userId}`;
}

export function getSavedPhraseCategory(userId: string): PhraseCategoryId | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${PHRASE_CATEGORY_KEY}:${userId}`);
  if (!raw) return null;
  return raw as PhraseCategoryId;
}

export function savePhraseCategory(userId: string, category: PhraseCategoryId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PHRASE_CATEGORY_KEY}:${userId}`, category);
}

export function applyProfessionPresetsIfNeeded(
  userId: string,
  profession: StoredProfessionId | null | undefined,
): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(presetsAppliedKey(userId)) === "1") return;

  const bundle = getProfessionPresets(profession);
  savePhraseCategory(userId, bundle.defaultPhraseCategory);

  const boardKey = `aac-board-tasks:${userId}`;
  const existingBoards = localStorage.getItem(boardKey);
  if (!existingBoards) {
    const now = new Date().toISOString();
    const tasks = bundle.boardTasks.map((task) => ({
      ...task,
      id: `task-${Math.random().toString(36).slice(2, 10)}`,
      updatedAt: now,
    }));
    localStorage.setItem(boardKey, JSON.stringify(tasks));
  }

  localStorage.setItem(presetsAppliedKey(userId), "1");
}
