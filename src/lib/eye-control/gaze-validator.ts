import type { GazePoint } from "./gaze-filter";

/** Reject single-frame jumps larger than this (px). */
const MAX_GAZE_JUMP_PX = 420;

export class GazeValidator {
  private lastGood: GazePoint | null = null;
  private jumpScale = 1;

  setJumpScale(scale: number) {
    this.jumpScale = Math.max(1, Math.min(4, scale));
  }

  validate(point: GazePoint): GazePoint | null {
    const x = Number(point.x);
    const y = Number(point.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    if (x < -40 || y < -40 || x > width + 40 || y > height + 40) {
      return null;
    }

    if (this.lastGood) {
      const jump = Math.hypot(x - this.lastGood.x, y - this.lastGood.y);
      if (jump > MAX_GAZE_JUMP_PX * this.jumpScale) {
        return null;
      }
    }

    const good = { x, y };
    this.lastGood = good;
    return good;
  }

  getLastGood(): GazePoint | null {
    return this.lastGood;
  }

  reset() {
    this.lastGood = null;
    this.jumpScale = 1;
  }
}
