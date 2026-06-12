import { z } from "zod";

export const communicationTileSchema = z.object({
  label: z.string().trim().min(1).max(80),
  symbolId: z.string().optional(),
});

export const communicationAiSchema = z.object({
  action: z.enum(["interpret", "suggest_reply", "to_steps"]),
  tiles: z.array(communicationTileSchema).min(1, "Add at least one symbol").max(24),
});
