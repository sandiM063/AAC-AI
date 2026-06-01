export type ProfessionId = "physician_caregiver" | "teacher";

export type Profession = {
  id: ProfessionId;
  label: string;
  description: string;
  keywords: string[];
  featurePreview: string[];
};

export const PROFESSIONS: Profession[] = [
  {
    id: "physician_caregiver",
    label: "Physician / Caregiver",
    description:
      "For doctors, nurses, and caregivers communicating with patients and families.",
    keywords: [
      "physician",
      "doctor",
      "caregiver",
      "nurse",
      "clinical",
      "patient",
      "medical",
      "healthcare",
      "hospital",
      "therapy",
      "care",
    ],
    featurePreview: [
      "Patient communication presets",
      "Care team phrases",
      "Clinical boards (coming soon)",
    ],
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
  },
];

const PROFESSION_MAP = new Map(PROFESSIONS.map((p) => [p.id, p]));

export function getProfession(id: string | null | undefined): Profession | undefined {
  if (!id) return undefined;
  return PROFESSION_MAP.get(id as ProfessionId);
}

export function getProfessionLabel(id: string | null | undefined): string | undefined {
  return getProfession(id)?.label;
}

export function searchProfessions(query: string): Profession[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PROFESSIONS;

  return PROFESSIONS.filter((profession) => {
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
  return PROFESSION_MAP.has(id as ProfessionId);
}
