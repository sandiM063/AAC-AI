export type SavedPhraseTile = {
  symbolId: string;
  pictogramId?: number;
  label: string;
};

export type SavedPhrase = {
  id: string;
  tiles: SavedPhraseTile[];
  createdAt: string;
};

const PHRASES_KEY = "aac-saved-phrases";
const SESSIONS_KEY = "aac-week-sessions";

function phrasesKey(userId: string) {
  return `${PHRASES_KEY}:${userId}`;
}

function sessionsKey(userId: string) {
  return `${SESSIONS_KEY}:${userId}`;
}

export function loadSavedPhrases(userId: string): SavedPhrase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(phrasesKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPhrase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedPhrases(userId: string, phrases: SavedPhrase[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(phrasesKey(userId), JSON.stringify(phrases));
}

export function recordActivitySession(userId: string) {
  if (typeof window === "undefined") return;
  const week = getWeekId();
  const raw = localStorage.getItem(sessionsKey(userId));
  const data = raw ? (JSON.parse(raw) as { week: string; count: number }) : { week, count: 0 };
  const count = data.week === week ? data.count + 1 : 1;
  localStorage.setItem(sessionsKey(userId), JSON.stringify({ week, count }));
}

export function getWeeklySessionCount(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(sessionsKey(userId));
    if (!raw) return 0;
    const data = JSON.parse(raw) as { week: string; count: number };
    return data.week === getWeekId() ? data.count : 0;
  } catch {
    return 0;
  }
}

function getWeekId() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-w${week}`;
}
