import { z } from "zod";

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  profession: z
    .enum(["physician", "caregiver", "teacher", "physician_caregiver"])
    .nullable()
    .optional(),
});
