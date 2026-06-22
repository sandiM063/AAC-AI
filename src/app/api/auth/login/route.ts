import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { findUserByLogin } from "@/lib/auth-helpers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { fieldErrors, loginSchema, normalizePhone } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: fieldErrors(parsed.error.issues) },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const user = await findUserByLogin({
      loginMethod: data.loginMethod,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone ? normalizePhone(data.phone) : undefined,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Click Continue with Google." },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profession: user.profession,
      },
      needsOnboarding: !user.onboardingCompletedAt,
    });

    response.cookies.set(SESSION_COOKIE, user.id, sessionCookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
