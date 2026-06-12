import { GoogleGenAI, type Content } from "@google/genai";
import { getGeminiApiKey, getGeminiModel } from "@/lib/ai/gemini/config";

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateGeminiText(params: {
  system: string;
  user: string;
  contents?: Content[];
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string | null> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: params.contents ?? params.user,
      config: {
        systemInstruction: params.system,
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxOutputTokens ?? 1024,
      },
    });
    const text = response.text?.trim();
    return text || null;
  } catch (error) {
    console.error("[AAC] Gemini text request failed:", error);
    return null;
  }
}

export async function generateGeminiJson<T>(params: {
  system: string;
  user: string;
  contents?: Content[];
  schema: object;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<T | null> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: params.contents ?? params.user,
      config: {
        systemInstruction: params.system,
        temperature: params.temperature ?? 0.4,
        maxOutputTokens: params.maxOutputTokens ?? 2048,
        responseMimeType: "application/json",
        responseJsonSchema: params.schema,
      },
    });
    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[AAC] Gemini JSON request failed:", error);
    return null;
  }
}
