import { z } from "zod";
import { isValidLanguageId } from "@/lib/languages";
import { isValidProfessionId } from "@/lib/professions";

export const AAC_EXPERIENCE_LEVELS = ["experienced", "some", "new"] as const;

export type AacExperienceLevel = (typeof AAC_EXPERIENCE_LEVELS)[number];

export function isValidAacExperience(value: string): value is AacExperienceLevel {
  return AAC_EXPERIENCE_LEVELS.includes(value as AacExperienceLevel);
}

export const onboardingSchema = z.object({
  professionId: z
    .string()
    .optional()
    .refine((v) => v === undefined || isValidProfessionId(v), "Invalid profession"),
  language: z
    .string()
    .optional()
    .refine((v) => v === undefined || isValidLanguageId(v), "Invalid language"),
  aacExperience: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || isValidAacExperience(v),
      "Invalid AAC experience level",
    ),
  wantsTutorial: z.boolean().optional(),
  complete: z.boolean().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
