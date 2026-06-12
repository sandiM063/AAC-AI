import { isGeminiConfigured } from "@/lib/ai/gemini/config";
import { getGeminiModel } from "@/lib/ai/gemini/config";
import { getCurrentUser } from "@/lib/user-session";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    geminiConfigured: isGeminiConfigured(),
    model: isGeminiConfigured() ? getGeminiModel() : null,
  });
}
