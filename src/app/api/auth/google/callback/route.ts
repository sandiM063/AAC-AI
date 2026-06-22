import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
  splitGoogleName,
} from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

function redirectWithError(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return redirectWithError(request, "google_not_configured");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithError(request, "google_state_mismatch");
  }

  try {
    const redirectUri = getGoogleRedirectUri(request);
    const accessToken = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleUserInfo(accessToken);
    const email = profile.email.toLowerCase();
    const { firstName, lastName } = splitGoogleName(profile);

    let user =
      (await prisma.user.findUnique({ where: { googleId: profile.id } })) ??
      (await prisma.user.findUnique({ where: { email } }));

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? profile.id,
          authProvider: user.password ? user.authProvider : "google",
          emailVerified: true,
          profileImageUrl: profile.picture ?? user.profileImageUrl,
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          googleId: profile.id,
          authProvider: "google",
          emailVerified: profile.verified_email ?? true,
          profileImageUrl: profile.picture ?? null,
        },
      });
    }

    const destination = user.onboardingCompletedAt ? "/dashboard" : "/onboarding";
    const response = NextResponse.redirect(new URL(destination, request.url));

    response.cookies.set(SESSION_COOKIE, user.id, sessionCookieOptions);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });

    return response;
  } catch {
    return redirectWithError(request, "google_sign_in_failed");
  }
}
