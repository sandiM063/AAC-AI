import type { GazePoint } from "./gaze-filter";

const ACTIONABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[role="button"]:not([aria-disabled="true"])',
  '[role="link"]',
  '[role="tab"]',
  ".dashboard-nav-link",
  ".dashboard-btn",
  "[data-eye-action]",
].join(", ");

const IGNORE_SELECTOR = [
  "#aac-eye-track-video",
  ".eye-control-video-wrap",
  "[data-eye-ignore]",
  ".eye-calibration-overlay",
  ".eye-control-status-pill",
  ".eye-gaze-cursor",
].join(", ");

let cachedTargets: HTMLElement[] = [];
let cachedAt = 0;
const CACHE_MS = 400;

function isIgnored(element: HTMLElement): boolean {
  return Boolean(element.closest(IGNORE_SELECTOR));
}

function refreshCache() {
  cachedTargets = Array.from(document.querySelectorAll<HTMLElement>(ACTIONABLE_SELECTOR)).filter(
    (element) => {
      if (isIgnored(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    },
  );
  cachedAt = performance.now();
}

function getTargets(): HTMLElement[] {
  if (performance.now() - cachedAt > CACHE_MS) {
    refreshCache();
  }
  return cachedTargets;
}

function distanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

export function invalidateTargetCache() {
  cachedAt = 0;
}

export function findBestTarget(
  point: GazePoint,
  maxDistance: number,
  padding: number,
): HTMLElement | null {
  const targets = getTargets();
  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const element of targets) {
    const rect = element.getBoundingClientRect();
    const expanded = {
      left: rect.left - padding,
      right: rect.right + padding,
      top: rect.top - padding,
      bottom: rect.bottom + padding,
    };

    const inside =
      point.x >= expanded.left &&
      point.x <= expanded.right &&
      point.y >= expanded.top &&
      point.y <= expanded.bottom;

    const distance = distanceToRect(point.x, point.y, rect);
    const score = inside ? distance * 0.35 : distance;

    if (score <= maxDistance && score < bestScore) {
      best = element;
      bestScore = score;
    }
  }

  return best;
}
