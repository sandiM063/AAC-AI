export type ProfessionId = "physician" | "caregiver" | "teacher";

/** @deprecated Stored for users who selected before the split */
export type LegacyProfessionId = "physician_caregiver";

export type StoredProfessionId = ProfessionId | LegacyProfessionId;

export type Profession = {
  id: StoredProfessionId;
  label: string;
  description: string;
  keywords: string[];
  featurePreview: string[];
  selectable: boolean;
};

export const PROFESSIONS: Profession[] = [
  {
    id: "physician",
    label: "Physician",
    description:
      "For doctors and clinicians communicating with patients during exams, rounds, and treatment planning.",
    keywords: [
      "physician",
      "doctor",
      "clinical",
      "patient",
      "medical",
      "healthcare",
      "hospital",
      "md",
      "consult",
      "diagnosis",
    ],
    featurePreview: [
      "Clinical communication presets",
      "Exam & bedside phrase sets",
      "Medical boards (coming soon)",
    ],
    selectable: true,
  },
  {
    id: "caregiver",
    label: "Caregiver",
    description:
      "For nurses, aides, and family caregivers supporting daily needs, comfort, and care coordination.",
    keywords: [
      "caregiver",
      "nurse",
      "aide",
      "family",
      "home care",
      "support",
      "therapy",
      "care",
      "comfort",
      "routine",
    ],
    featurePreview: [
      "Daily needs & comfort presets",
      "Family update phrase sets",
      "Caregiver boards (coming soon)",
    ],
    selectable: true,
  },
  {
    id: "teacher",
    label: "Teacher / Educator",
    description:
      "For teachers and educators supporting students in the classroom and beyond.",
    keywords: [
      "teacher",
      "educator",
      "school",
      "classroom",
      "student",
      "learning",
      "education",
      "special education",
      "instruction",
    ],
    featurePreview: [
      "Lesson communication boards",
      "Learning symbol sets",
      "Classroom presets (coming soon)",
    ],
    selectable: true,
  },
];

const LEGACY_PROFESSION: Profession = {
  id: "physician_caregiver",
  label: "Physician / Caregiver (legacy)",
  description:
    "Your account uses an older combined profession. Choose Physician or Caregiver in settings when you update your profile.",
  keywords: [],
  featurePreview: [
    "Shared communication presets",
    "Care team phrases",
    "Update your profession for tailored templates",
  ],
  selectable: false,
};

const PROFESSION_MAP = new Map<string, Profession>([
  ...PROFESSIONS.map((p) => [p.id, p] as const),
  [LEGACY_PROFESSION.id, LEGACY_PROFESSION],
]);

export const SELECTABLE_PROFESSIONS = PROFESSIONS.filter((p) => p.selectable);

export function getProfession(id: string | null | undefined): Profession | undefined {
  if (!id) return undefined;
  return PROFESSION_MAP.get(id);
}

export function getProfessionLabel(id: string | null | undefined): string | undefined {
  return getProfession(id)?.label;
}

export function searchProfessions(query: string): Profession[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SELECTABLE_PROFESSIONS;

  return SELECTABLE_PROFESSIONS.filter((profession) => {
    const haystack = [
      profession.label,
      profession.description,
      ...profession.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return normalized.split(/\s+/).every((term) => haystack.includes(term));
  });
}

export function isValidProfessionId(id: string): id is ProfessionId {
  return PROFESSIONS.some((p) => p.id === id && p.selectable);
}

export function isStoredProfessionId(id: string): id is StoredProfessionId {
  return PROFESSION_MAP.has(id);
}
