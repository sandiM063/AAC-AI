import type { SectionTutorialId } from "./registry";

/** data-tutorial attribute values for each tour step (1-indexed). */
export const TUTORIAL_STEP_TARGETS: Record<SectionTutorialId, string[]> = {
  overview: [
    "overview-header",
    "nav-boards",
    "overview-getting-started",
    "overview-stats",
    "nav-settings",
  ],
  communication: [
    "communication-grid",
    "communication-composer",
    "communication-ai",
  ],
  boards: ["boards-task-list", "boards-add-task"],
  settings: ["settings-appearance", "settings-language"],
  profile: ["profile-user-card", "profile-actions"],
};

export function getTutorialTarget(tutorialId: SectionTutorialId, step: number): string {
  const targets = TUTORIAL_STEP_TARGETS[tutorialId];
  return targets[step - 1] ?? targets[0];
}
