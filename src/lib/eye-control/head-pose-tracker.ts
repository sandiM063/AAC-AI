import type { GazeResult } from "webeyetrack";
import type { GazePoint } from "./gaze-filter";

type HeadVector = [number, number, number];

const REFERENCE_BLEND = 0.004;
const STABLE_DRIFT = 0.06;
const STABLE_MS = 4000;

function headFromResult(result: GazeResult): HeadVector | null {
  const h = result.headVector;
  if (!h || h.length < 3) return null;
  const x = Number(h[0]);
  const y = Number(h[1]);
  const z = Number(h[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  return [x, y, z];
}

export class HeadPoseTracker {
  private reference: HeadVector | null = null;
  private current: HeadVector | null = null;
  private stableSince: number | null = null;

  reset() {
    this.reference = null;
    this.current = null;
    this.stableSince = null;
  }

  setReference(vector: HeadVector) {
    this.reference = [...vector];
    this.stableSince = performance.now();
  }

  setReferenceFromResults(results: GazeResult[]) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    let n = 0;
    for (const result of results) {
      const h = headFromResult(result);
      if (!h) continue;
      sx += h[0];
      sy += h[1];
      sz += h[2];
      n += 1;
    }
    if (n > 0) {
      this.setReference([sx / n, sy / n, sz / n]);
    }
  }

  noteResult(result: GazeResult) {
    const h = headFromResult(result);
    if (!h) return;
    this.current = h;

    if (!this.reference) return;

    const drift = this.getDriftMagnitude();
    const now = performance.now();

    if (drift <= STABLE_DRIFT) {
      if (this.stableSince === null) this.stableSince = now;
      if (now - this.stableSince >= STABLE_MS) {
        this.reference = [
          this.reference[0] + (h[0] - this.reference[0]) * REFERENCE_BLEND,
          this.reference[1] + (h[1] - this.reference[1]) * REFERENCE_BLEND,
          this.reference[2] + (h[2] - this.reference[2]) * REFERENCE_BLEND,
        ];
      }
    } else {
      this.stableSince = null;
    }
  }

  getDriftMagnitude(): number {
    if (!this.reference || !this.current) return 0;
    return Math.hypot(
      this.current[0] - this.reference[0],
      this.current[1] - this.reference[1],
      this.current[2] - this.reference[2],
    );
  }

  /** Widen jump rejection when the head has moved away from the calibration pose. */
  getJumpScale(): number {
    const drift = this.getDriftMagnitude();
    return 1 + Math.min(2.5, drift * 14);
  }

  /** Shift screen gaze to compensate for head rotation away from the reference pose. */
  compensateScreen(point: GazePoint): GazePoint {
    if (!this.reference || !this.current) return point;

    const dx = this.current[0] - this.reference[0];
    const dy = this.current[1] - this.reference[1];
    const dz = this.current[2] - this.reference[2];
    const w = window.innerWidth;
    const h = window.innerHeight;

    return {
      x: point.x - dx * w * 1.2 - dz * w * 0.4,
      y: point.y - dy * h * 1.1,
    };
  }
}

let sharedTracker: HeadPoseTracker | null = null;

export function getHeadPoseTracker(): HeadPoseTracker {
  if (!sharedTracker) {
    sharedTracker = new HeadPoseTracker();
  }
  return sharedTracker;
}
