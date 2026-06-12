import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-session";
import { updatePreferencesSchema } from "@/lib/validations/preferences";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    theme: user.theme,
    language: user.language,
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid preferences" },
        { status: 400 },
      );
    }

    const { theme, language } = parsed.data;

    if (theme === undefined && language === undefined) {
      return NextResponse.json(
        { error: "No preferences to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(theme !== undefined ? { theme } : {}),
        ...(language !== undefined ? { language } : {}),
      },
      select: { theme: true, language: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Update preferences failed:", error);
    }
    return NextResponse.json(
      { error: "Unable to save preferences. Please try again." },
      { status: 500 },
    );
  }
}
