import { ensureCommunityPresetsSeeded } from "@/lib/presets/community-preset-service";
import type { CommunityPresetSummary, CommunityPresetType } from "@/lib/presets/community-preset-types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureCommunityPresetsSeeded();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CommunityPresetType | null;

    if (type !== "task" && type !== "communication") {
      return NextResponse.json({ error: "Invalid preset type" }, { status: 400 });
    }

    const presets = await prisma.communityPreset.findMany({
      where: { type },
      orderBy: [{ dailyUserCount: "desc" }, { favoriteCount: "desc" }],
    });

    const interactions = await prisma.communityPresetInteraction.findMany({
      where: {
        userId: user.id,
        presetId: { in: presets.map((preset) => preset.id) },
      },
    });

    const interactionMap = new Map(interactions.map((item) => [item.presetId, item]));

    const summaries: CommunityPresetSummary[] = presets.map((preset) => {
      const interaction = interactionMap.get(preset.id);
      return {
        id: preset.id,
        slug: preset.slug,
        type: preset.type as CommunityPresetType,
        name: preset.name,
        description: preset.description,
        coverSymbolId: preset.coverSymbolId,
        coverPictogramId: preset.coverPictogramId,
        profession: preset.profession,
        stepCount: preset.stepCount,
        tileCount: preset.tileCount,
        likeCount: preset.likeCount,
        favoriteCount: preset.favoriteCount,
        dailyUserCount: preset.dailyUserCount,
        useCount: preset.useCount,
        liked: interaction?.liked ?? false,
        favorited: interaction?.favorited ?? false,
      };
    });

    return NextResponse.json({ presets: summaries });
  } catch {
    return NextResponse.json({ error: "Unable to load presets" }, { status: 500 });
  }
}
