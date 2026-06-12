export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}
