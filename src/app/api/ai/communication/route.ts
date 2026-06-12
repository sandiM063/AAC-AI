import {
  communicationMessageToSteps,
  interpretCommunicationMessage,
  suggestCommunicationReply,
} from "@/lib/ai/gemini/communication";
import { isGeminiConfigured } from "@/lib/ai/gemini/config";
import { buildTaskStepsFromTitles, getDetailLevel } from "@/lib/ai/summarize-task-steps";
import { getCurrentUser } from "@/lib/user-session";
import { communicationAiSchema } from "@/lib/validations/communication-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = communicationAiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { action, tiles } = parsed.data;
    const source = isGeminiConfigured() ? "gemini" : "rules";

    if (action === "interpret") {
      const result = await interpretCommunicationMessage(tiles);
      return NextResponse.json({ ...result, source });
    }

    if (action === "suggest_reply") {
      const result = await suggestCommunicationReply(tiles);
      return NextResponse.json({ ...result, source });
    }

    const result = await communicationMessageToSteps(tiles);

    if (result.useInteractiveChoices) {
      return NextResponse.json({
        taskTitle: result.taskTitle,
        steps: result.steps,
        stepCount: result.steps.length,
        useInteractiveChoices: true,
        scenarioId: result.scenarioId,
        source,
      });
    }

    const detailLevel = getDetailLevel(result.steps.length);
    const steps = await buildTaskStepsFromTitles(result.steps, detailLevel);

    return NextResponse.json({
      taskTitle: result.taskTitle,
      steps,
      stepCount: steps.length,
      detailLevel,
      source,
    });
  } catch {
    return NextResponse.json({ error: "Unable to process communication request" }, { status: 500 });
  }
}
