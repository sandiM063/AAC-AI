/** Strip wrapping quotes Netlify users sometimes paste from .env files. */
export function normalizeDatabaseUrl(value) {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function resolveDatabaseUrlFromEnv() {
  return normalizeDatabaseUrl(process.env.DATABASE_URL);
}
