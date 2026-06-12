import {
  EYE_LOCK_RELEASE_DISTANCE_PX,
  EYE_LOCK_RELEASE_MS,
  EYE_LOCK_STABLE_MS,
  EYE_NEAREST_TARGET_PX,
} from "./constants";

function distanceToElement(x: number, y: number, element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

function isConnected(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element && element.isConnected);
}

/**
 * Sticky target selection with hysteresis so gaze jitter does not hop between buttons.
 */
export class TargetLock {
  private locked: HTMLElement | null = null;
  private pending: HTMLElement | null = null;
  private pendingSince = 0;
  private releasingSince = 0;

  resolve(
    x: number,
    y: number,
    findCandidate: (x: number, y: number) => HTMLElement | null,
  ): HTMLElement | null {
    if (isConnected(this.locked)) {
      const distance = distanceToElement(x, y, this.locked);
      if (distance <= EYE_LOCK_RELEASE_DISTANCE_PX) {
        this.releasingSince = 0;
        return this.locked;
      }

      if (this.releasingSince === 0) {
        this.releasingSince = performance.now();
      }

      if (performance.now() - this.releasingSince < EYE_LOCK_RELEASE_MS) {
        return this.locked;
      }

      this.locked = null;
      this.releasingSince = 0;
    }

    const candidate = findCandidate(x, y);
    if (!candidate) {
      this.pending = null;
      this.pendingSince = 0;
      return null;
    }

    if (candidate !== this.pending) {
      this.pending = candidate;
      this.pendingSince = performance.now();
      return null;
    }

    if (performance.now() - this.pendingSince < EYE_LOCK_STABLE_MS) {
      return null;
    }

    this.locked = candidate;
    this.pending = null;
    this.pendingSince = 0;
    return candidate;
  }

  getLocked(): HTMLElement | null {
    return isConnected(this.locked) ? this.locked : null;
  }

  reset() {
    this.locked = null;
    this.pending = null;
    this.pendingSince = 0;
    this.releasingSince = 0;
  }
}

export function distanceToNearestTarget(x: number, y: number, element: HTMLElement): number {
  return distanceToElement(x, y, element);
}

export { EYE_NEAREST_TARGET_PX };
