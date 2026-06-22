import { getAppUrl } from "@/lib/app-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Use the site the user actually opened (Netlify/proxy-safe), not a stale AUTH_URL. */
function getOAuthOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const protocol = forwardedProto?.split(",")[0]?.trim() || "https";
    return `${protocol}://${host}`;
  }

  return `${url.protocol}//${url.host}`;
}

export function getGoogleRedirectUri(request?: Request): string {
  const origin = request ? getOAuthOrigin(request) : getAppUrl();
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<string> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Google token exchange failed");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token missing");
  }

  return data.access_token;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Google userinfo failed");
  }

  const data = (await response.json()) as GoogleUserInfo;
  if (!data.id || !data.email) {
    throw new Error("Google profile incomplete");
  }

  return data;
}

export function splitGoogleName(profile: GoogleUserInfo): { firstName: string; lastName: string } {
  const firstName = profile.given_name?.trim() || profile.name?.split(" ")[0]?.trim() || "Google";
  const lastName =
    profile.family_name?.trim() ||
    profile.name?.split(" ").slice(1).join(" ").trim() ||
    "User";

  return { firstName, lastName };
}
