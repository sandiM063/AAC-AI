import { isStepGenerationError } from "@/lib/ai/step-generation-error";
import { summarizeTaskSteps, getDetailLevel } from "@/lib/ai/summarize-task-steps";
import { getCurrentUser } from "@/lib/user-session";
import { summarizeStepsSchema } from "@/lib/validations/task-board";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = summarizeStepsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { taskTitle, taskDescription, stepCount, existingStepTitles } = parsed.data;
    const steps = await summarizeTaskSteps({
      taskTitle,
      taskDescription,
      stepCount,
      existingStepTitles,
    });

    return NextResponse.json({
      steps,
      detailLevel: getDetailLevel(stepCount),
      stepCount,
    });
  } catch (error) {
    if (isStepGenerationError(error)) {
      return NextResponse.json(
        {
          code: error.code,
          naturalStepCount: error.naturalStepCount,
          requestedStepCount: error.requestedStepCount,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ code: "unknown" }, { status: 500 });
  }
}
