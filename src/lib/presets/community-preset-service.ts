import { prisma } from "@/lib/prisma";
import { COMMUNITY_PRESET_CATALOG } from "@/lib/presets/community-preset-catalog";

let ensured = false;

export async function ensureCommunityPresetsSeeded(): Promise<void> {
  if (ensured) return;

  const count = await prisma.communityPreset.count();
  if (count === 0) {
    await prisma.communityPreset.createMany({
      data: COMMUNITY_PRESET_CATALOG.map((entry) => ({
        type: entry.type,
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        coverSymbolId: entry.coverSymbolId,
        coverPictogramId: entry.coverPictogramId,
        profession: entry.profession ?? null,
        stepCount: entry.stepCount ?? 0,
        tileCount: entry.tileCount ?? 0,
        payload: JSON.stringify(entry.payload),
        likeCount: entry.likeCount,
        favoriteCount: entry.favoriteCount,
        dailyUserCount: entry.dailyUserCount,
        useCount: entry.useCount,
      })),
    });
  }

  ensured = true;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function recordPresetUse(userId: string, presetId: string): Promise<void> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);

  const existing = await prisma.communityPresetInteraction.findUnique({
    where: { userId_presetId: { userId, presetId } },
  });

  const countsAsDailyUser =
    !existing?.lastUsedAt || existing.lastUsedAt < todayStart;

  await prisma.$transaction([
    prisma.communityPresetInteraction.upsert({
      where: { userId_presetId: { userId, presetId } },
      create: {
        userId,
        presetId,
        lastUsedAt: now,
      },
      update: {
        lastUsedAt: now,
      },
    }),
    prisma.communityPreset.update({
      where: { id: presetId },
      data: {
        useCount: { increment: 1 },
        ...(countsAsDailyUser ? { dailyUserCount: { increment: 1 } } : {}),
      },
    }),
  ]);
}

export async function togglePresetLike(
  userId: string,
  presetId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await prisma.communityPresetInteraction.findUnique({
    where: { userId_presetId: { userId, presetId } },
  });

  const nextLiked = !existing?.liked;

  await prisma.$transaction([
    prisma.communityPresetInteraction.upsert({
      where: { userId_presetId: { userId, presetId } },
      create: { userId, presetId, liked: nextLiked },
      update: { liked: nextLiked },
    }),
    prisma.communityPreset.update({
      where: { id: presetId },
      data: { likeCount: { increment: nextLiked ? 1 : -1 } },
    }),
  ]);

  const preset = await prisma.communityPreset.findUniqueOrThrow({
    where: { id: presetId },
    select: { likeCount: true },
  });

  return { liked: nextLiked, likeCount: Math.max(0, preset.likeCount) };
}

export async function togglePresetFavorite(
  userId: string,
  presetId: string,
): Promise<{ favorited: boolean; favoriteCount: number }> {
  const existing = await prisma.communityPresetInteraction.findUnique({
    where: { userId_presetId: { userId, presetId } },
  });

  const nextFavorited = !existing?.favorited;

  await prisma.$transaction([
    prisma.communityPresetInteraction.upsert({
      where: { userId_presetId: { userId, presetId } },
      create: { userId, presetId, favorited: nextFavorited },
      update: { favorited: nextFavorited },
    }),
    prisma.communityPreset.update({
      where: { id: presetId },
      data: { favoriteCount: { increment: nextFavorited ? 1 : -1 } },
    }),
  ]);

  const preset = await prisma.communityPreset.findUniqueOrThrow({
    where: { id: presetId },
    select: { favoriteCount: true },
  });

  return { favorited: nextFavorited, favoriteCount: Math.max(0, preset.favoriteCount) };
}
