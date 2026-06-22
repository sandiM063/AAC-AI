import { cookies } from "next/headers";

export const SESSION_COOKIE = "aac_session";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, sessionCookieOptions);
}

export async function getSessionUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function setSessionCookieOnResponse(
  response: {
    cookies: {
      set: (
        name: string,
        value: string,
        options?: typeof sessionCookieOptions & { maxAge?: number },
      ) => void;
    };
  },
  userId: string,
) {
  response.cookies.set(SESSION_COOKIE, userId, sessionCookieOptions);
}
