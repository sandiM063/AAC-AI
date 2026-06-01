import { NextResponse } from "next/server";
import { isValidProfessionId } from "@/lib/professions";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { selectProfessionSchema } from "@/lib/validations/profession";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = selectProfessionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid profession";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { professionId } = parsed.data;

    if (!isValidProfessionId(professionId)) {
      return NextResponse.json({ error: "Invalid profession" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profession: professionId,
        professionSelectedAt: new Date(),
      },
      select: {
        profession: true,
        professionSelectedAt: true,
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
