import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { onboardingSchema } from "@/lib/validations/onboarding";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid onboarding data";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { professionId, language, aacExperience, wantsTutorial, complete } =
      parsed.data;

    if (
      professionId === undefined &&
      language === undefined &&
      aacExperience === undefined &&
      wantsTutorial === undefined &&
      !complete
    ) {
      return NextResponse.json({ error: "No onboarding data provided" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(professionId !== undefined
          ? { profession: professionId, professionSelectedAt: new Date() }
          : {}),
        ...(language !== undefined ? { language } : {}),
        ...(aacExperience !== undefined ? { aacExperience } : {}),
        ...(wantsTutorial !== undefined ? { wantsTutorial } : {}),
        ...(complete ? { onboardingCompletedAt: new Date() } : {}),
      },
      select: {
        profession: true,
        language: true,
        aacExperience: true,
        wantsTutorial: true,
        onboardingCompletedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
