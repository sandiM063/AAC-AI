import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { getCurrentUser } from "@/lib/user-session";

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Delete account failed:", error);
    }
    return NextResponse.json(
      { error: "Unable to delete account. Please try again." },
      { status: 500 },
    );
  }
}
