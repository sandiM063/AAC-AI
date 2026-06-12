import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/ai/gemini/embeddings";

const MAX_CHUNKS_STORED = 400;
const MAX_CHUNKS_SCANNED = 250;
const TOP_K = 6;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parseEmbedding(raw: string): number[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((value): value is number => typeof value === "number");
  } catch {
    return null;
  }
}

export async function indexMemoryChunks(
  userId: string,
  chunks: { content: string; messageId?: string }[],
): Promise<void> {
  const normalized = chunks
    .map((chunk) => ({ ...chunk, content: chunk.content.trim() }))
    .filter((chunk) => chunk.content.length >= 8);

  if (normalized.length === 0) return;

  for (const chunk of normalized) {
    const embedding = await embedText(chunk.content);
    if (!embedding) continue;

    await prisma.assistantMemoryChunk.create({
      data: {
        userId,
        messageId: chunk.messageId,
        content: chunk.content,
        embedding: JSON.stringify(embedding),
      },
    });
  }

  const overflow = await prisma.assistantMemoryChunk.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: MAX_CHUNKS_STORED,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.assistantMemoryChunk.deleteMany({
      where: { id: { in: overflow.map((row) => row.id) } },
    });
  }
}

export async function retrieveRelevantMemory(
  userId: string,
  query: string,
): Promise<string[]> {
  const queryEmbedding = await embedText(query);
  if (!queryEmbedding) return [];

  const chunks = await prisma.assistantMemoryChunk.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_CHUNKS_SCANNED,
    select: { content: true, embedding: true },
  });

  const scored = chunks
    .map((chunk) => {
      const embedding = parseEmbedding(chunk.embedding);
      if (!embedding) return null;
      return {
        content: chunk.content,
        score: cosineSimilarity(queryEmbedding, embedding),
      };
    })
    .filter((entry): entry is { content: string; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .filter((entry) => entry.score >= 0.35);

  const unique: string[] = [];
  for (const entry of scored) {
    if (!unique.includes(entry.content)) {
      unique.push(entry.content);
    }
  }

  return unique;
}

export function formatRagContext(snippets: string[]): string {
  if (snippets.length === 0) {
    return "No relevant past interactions retrieved yet.";
  }

  return snippets.map((snippet, index) => `${index + 1}. ${snippet}`).join("\n");
}
