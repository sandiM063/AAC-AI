import { z } from "zod";
import { isValidProfessionId } from "@/lib/professions";

export const selectProfessionSchema = z.object({
  professionId: z
    .string()
    .min(1, "Select a profession")
    .refine(isValidProfessionId, "Invalid profession"),
});

export type SelectProfessionInput = z.infer<typeof selectProfessionSchema>;
