import type { SectionTutorialId } from "./registry";

const STORAGE_PREFIX = "aac-tutorials-completed";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function getCompletedTutorials(userId: string): SectionTutorialId[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SectionTutorialId[]) : [];
  } catch {
    return [];
  }
}

export function isTutorialComplete(userId: string, tutorialId: SectionTutorialId): boolean {
  return getCompletedTutorials(userId).includes(tutorialId);
}

export function markTutorialComplete(userId: string, tutorialId: SectionTutorialId) {
  if (typeof window === "undefined") return;

  const completed = new Set(getCompletedTutorials(userId));
  completed.add(tutorialId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...completed]));
}
