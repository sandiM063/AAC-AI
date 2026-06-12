import {
  buildTaskStepsFromTitles,
  getDetailLevel,
} from "@/lib/ai/summarize-task-steps";
import {
  ensureCommunityPresetsSeeded,
  recordPresetUse,
  togglePresetFavorite,
  togglePresetLike,
} from "@/lib/presets/community-preset-service";
import type {
  CommunicationPresetPayload,
  TaskPresetPayload,
} from "@/lib/presets/community-preset-types";
import { prisma } from "@/lib/prisma";
import { createTaskId } from "@/lib/boards/types";
import { getCurrentUser } from "@/lib/user-session";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureCommunityPresetsSeeded();

    const { id } = await context.params;
    const body = (await request.json()) as { action?: string };
    const action = body.action;

    const preset = await prisma.communityPreset.findUnique({ where: { id } });
    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    if (action === "like") {
      const result = await togglePresetLike(user.id, id);
      return NextResponse.json(result);
    }

    if (action === "favorite") {
      const result = await togglePresetFavorite(user.id, id);
      return NextResponse.json(result);
    }

    if (action === "apply") {
      await recordPresetUse(user.id, id);

      if (preset.type === "task") {
        const payload = JSON.parse(preset.payload) as TaskPresetPayload;
        const detailLevel = getDetailLevel(payload.stepTitles.length);
        const steps = await buildTaskStepsFromTitles(payload.stepTitles, detailLevel);

        return NextResponse.json({
          type: "task",
          task: {
            id: createTaskId(),
            title: payload.taskTitle,
            description: payload.taskDescription,
            steps,
            stepCount: steps.length,
            detailLevel,
            completedStepIds: [] as string[],
          },
        });
      }

      const payload = JSON.parse(preset.payload) as CommunicationPresetPayload;
      return NextResponse.json({
        type: "communication",
        tiles: payload.tiles,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to process preset action" }, { status: 500 });
  }
}
