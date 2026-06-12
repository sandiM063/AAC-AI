import {
  deleteAvatarFile,
  readAvatarFile,
  saveAvatarFile,
  validateAvatarBuffer,
} from "@/lib/profile-image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user-session";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.profileImageUpdatedAt) {
    return new NextResponse(null, { status: 404 });
  }

  const bytes = await readAvatarFile(user.id);
  if (!bytes) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const validationError = validateAvatarBuffer(bytes, file.type);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await saveAvatarFile(user.id, bytes);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUpdatedAt: new Date() },
      select: { profileImageUpdatedAt: true },
    });

    return NextResponse.json({
      profileImageUpdatedAt: updated.profileImageUpdatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Avatar upload failed:", error);
    }
    return NextResponse.json(
      { error: "Unable to update profile picture. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteAvatarFile(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageUpdatedAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AAC] Avatar delete failed:", error);
    }
    return NextResponse.json(
      { error: "Unable to remove profile picture. Please try again." },
      { status: 500 },
    );
  }
}
