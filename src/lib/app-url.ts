import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Public site URL — required for Google OAuth redirect (e.g. https://your-app.netlify.app). */
export function getAppUrl(request?: Request): string {
  const fromEnv =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (request) {
    const { protocol, host } = new URL(request.url);
    return `${protocol}//${host}`;
  }

  return "http://localhost:3000";
}

export function getProjectRoot(): string {
  return projectRoot;
}
