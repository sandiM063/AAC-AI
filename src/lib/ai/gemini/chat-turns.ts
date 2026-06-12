import type { Content } from "@google/genai";
import type { AssistantChatTurn } from "@/lib/ai/assistant-memory/types";

export function toGeminiContents(history: AssistantChatTurn[], userMessage: string): Content[] {
  const turns: Content[] = history
    .slice(-24)
    .filter((turn) => turn.content.trim())
    .map((turn) => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.content.trim() }],
    }));

  turns.push({
    role: "user",
    parts: [{ text: userMessage.trim() }],
  });

  return turns;
}
