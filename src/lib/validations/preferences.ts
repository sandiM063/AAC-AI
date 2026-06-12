import { z } from "zod";
import { isValidLanguageId } from "@/lib/languages";
import { isValidThemeId } from "@/lib/themes";

export const updatePreferencesSchema = z.object({
  theme: z
    .string()
    .optional()
    .refine((v) => v === undefined || isValidThemeId(v), "Invalid theme"),
  language: z
    .string()
    .optional()
    .refine((v) => v === undefined || isValidLanguageId(v), "Invalid language"),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
