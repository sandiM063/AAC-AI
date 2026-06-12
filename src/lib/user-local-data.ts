const USER_LOCAL_KEY_PREFIXES = [
  "aac-board-tasks",
  "aac-saved-phrases",
  "aac-week-sessions",
  "aac-tutorials-completed",
  "aac-tts-enabled",
  "aac-eye-control",
  "aac-eye-calibrated",
  "aac-eye-dwell-speed",
  "aac-presets-applied",
  "aac-phrase-category",
] as const;

export function clearUserLocalData(userId: string): void {
  if (typeof window === "undefined" || !userId) return;

  for (const prefix of USER_LOCAL_KEY_PREFIXES) {
    localStorage.removeItem(`${prefix}:${userId}`);
  }
}

export function resetClientAppearance(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = "green";
  document.documentElement.lang = "en";
}
