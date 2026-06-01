import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { verifyOtpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid code";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { pendingId, code } = parsed.data;

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Verification session expired. Please register again." },
        { status: 404 },
      );
    }

    if (pending.otpExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Code expired. Request a new code." },
        { status: 410 },
      );
    }

    const codeValid = await verifyOtp(code, pending.otpHash);

    if (!codeValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const isEmail = pending.method === "EMAIL";

    if (isEmail && pending.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email: pending.email },
      });
      if (duplicate) {
        await prisma.pendingRegistration.delete({ where: { id: pendingId } });
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }
    }

    if (!isEmail && pending.countryCode && pending.phone) {
      const duplicate = await prisma.user.findUnique({
        where: {
          countryCode_phone: {
            countryCode: pending.countryCode,
            phone: pending.phone,
          },
        },
      });
      if (duplicate) {
        await prisma.pendingRegistration.delete({ where: { id: pendingId } });
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        countryCode: pending.countryCode,
        phone: pending.phone,
        password: pending.password,
        emailVerified: isEmail,
        phoneVerified: !isEmail,
      },
    });

    await prisma.pendingRegistration.delete({ where: { id: pendingId } });

    const response = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
