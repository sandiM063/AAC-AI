import { clearAssistantHistory, loadAssistantHistory } from "@/lib/ai/assistant-memory/storage";
import { getCurrentUser } from "@/lib/user-session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await loadAssistantHistory(user.id);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Unable to load assistant history" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearAssistantHistory(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to clear assistant history" }, { status: 500 });
  }
}
