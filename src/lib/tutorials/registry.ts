export type SectionTutorialId = "overview" | "communication" | "boards" | "settings" | "profile";

export type SectionTutorialConfig = {
  id: SectionTutorialId;
  path: string;
  stepCount: number;
  messageRoot: "tutorialDemo" | `sectionTutorials.${SectionTutorialId}`;
};

export const SECTION_TUTORIALS: SectionTutorialConfig[] = [
  {
    id: "overview",
    path: "/dashboard",
    stepCount: 5,
    messageRoot: "tutorialDemo",
  },
  {
    id: "communication",
    path: "/dashboard/communication",
    stepCount: 3,
    messageRoot: "sectionTutorials.communication",
  },
  {
    id: "boards",
    path: "/dashboard/boards",
    stepCount: 2,
    messageRoot: "sectionTutorials.boards",
  },
  {
    id: "settings",
    path: "/dashboard/settings",
    stepCount: 2,
    messageRoot: "sectionTutorials.settings",
  },
  {
    id: "profile",
    path: "/dashboard/profile",
    stepCount: 2,
    messageRoot: "sectionTutorials.profile",
  },
];

export function getTutorialForPath(pathname: string): SectionTutorialConfig | null {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return SECTION_TUTORIALS.find((tutorial) => tutorial.id === "overview") ?? null;
  }

  if (pathname === "/dashboard/tutorial") {
    return null;
  }

  return (
    SECTION_TUTORIALS.find(
      (tutorial) => tutorial.id !== "overview" && pathname.startsWith(tutorial.path),
    ) ?? null
  );
}
