import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { COMMUNITY_PRESET_CATALOG } from "../src/lib/presets/community-preset-catalog";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@aac.app";
  const password = await bcrypt.hash("demo12345", 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName: "Demo",
      lastName: "User",
      emailVerified: true,
    },
    create: {
      email,
      password,
      firstName: "Demo",
      lastName: "User",
      authProvider: "credentials",
      emailVerified: true,
    },
  });

  const presetCount = await prisma.communityPreset.count();
  if (presetCount === 0) {
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

  console.log("Seed complete. Demo login:");
  console.log("  Email:    demo@aac.app");
  console.log("  Password: demo12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
