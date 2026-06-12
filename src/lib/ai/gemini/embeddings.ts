import { getClient } from "@/lib/ai/gemini/client";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";

const EMBEDDING_MODEL = "text-embedding-004";

export async function embedText(text: string): Promise<number[] | null> {
  if (!isGeminiConfigured()) return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const ai = getClient();
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: trimmed,
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) return null;
    return values;
  } catch (error) {
    console.error("[AAC] Gemini embedding failed:", error);
    return null;
  }
}
