import { prisma } from "@/lib/prisma";
import type {
  AssistantChatTurn,
  AssistantMessageMetadata,
  StoredAssistantRole,
} from "@/lib/ai/assistant-memory/types";
import { formatRagContext, indexMemoryChunks, retrieveRelevantMemory } from "@/lib/ai/assistant-memory/rag";

const HISTORY_LIMIT = 40;

export type PersistedAssistantMessage = {
  id: string;
  role: StoredAssistantRole;
  content: string;
  createdAt: string;
  createdTask?: { id: string; title: string; stepCount?: number };
  source?: "gemini" | "rules";
};

function parseMetadata(raw: string | null): AssistantMessageMetadata | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AssistantMessageMetadata;
  } catch {
    return null;
  }
}

export async function loadAssistantHistory(userId: string): Promise<PersistedAssistantMessage[]> {
  const rows = await prisma.assistantMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });

  return rows.map((row) => {
    const metadata = parseMetadata(row.metadata);
    return {
      id: row.id,
      role: row.role as StoredAssistantRole,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      createdTask: metadata?.createdTask,
      source: metadata?.source,
    };
  });
}

export async function saveAssistantMessage(params: {
  userId: string;
  role: StoredAssistantRole;
  content: string;
  metadata?: AssistantMessageMetadata;
}): Promise<PersistedAssistantMessage> {
  const row = await prisma.assistantMessage.create({
    data: {
      userId: params.userId,
      role: params.role,
      content: params.content,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });

  return {
    id: row.id,
    role: row.role as StoredAssistantRole,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    createdTask: params.metadata?.createdTask,
    source: params.metadata?.source,
  };
}

export async function clearAssistantHistory(userId: string): Promise<void> {
  await prisma.assistantMessage.deleteMany({ where: { userId } });
  await prisma.assistantMemoryChunk.deleteMany({ where: { userId } });
}

export async function getConversationContext(userId: string, message: string): Promise<{
  history: AssistantChatTurn[];
  ragContext: string;
}> {
  const rows = await prisma.assistantMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });

  const history = rows
    .reverse()
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      role: row.role as StoredAssistantRole,
      content: row.content,
    }));

  const snippets = await retrieveRelevantMemory(userId, message);

  return {
    history,
    ragContext: formatRagContext(snippets),
  };
}

export async function rememberAssistantExchange(params: {
  userId: string;
  userMessage: string;
  assistantMessage: string;
  source: "gemini" | "rules";
  createdTask?: { id: string; title: string; stepCount?: number };
}): Promise<void> {
  const userRow = await saveAssistantMessage({
    userId: params.userId,
    role: "user",
    content: params.userMessage,
  });

  const assistantRow = await saveAssistantMessage({
    userId: params.userId,
    role: "assistant",
    content: params.assistantMessage,
    metadata: {
      source: params.source,
      createdTask: params.createdTask,
    },
  });

  const memoryChunks = [
    { content: `User said: ${params.userMessage}`, messageId: userRow.id },
    {
      content: params.createdTask
        ? `Assistant created task board "${params.createdTask.title}": ${params.assistantMessage}`
        : `Assistant replied: ${params.assistantMessage}`,
      messageId: assistantRow.id,
    },
  ];

  await indexMemoryChunks(params.userId, memoryChunks);
}
