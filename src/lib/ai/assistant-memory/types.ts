export type StoredAssistantRole = "user" | "assistant";

export type AssistantChatTurn = {
  role: StoredAssistantRole;
  content: string;
};

export type AssistantMessageMetadata = {
  createdTask?: { id: string; title: string; stepCount?: number };
  source?: "gemini" | "rules";
};
