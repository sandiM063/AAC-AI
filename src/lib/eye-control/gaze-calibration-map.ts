import type { GazePoint } from "./gaze-filter";

/** Screen-space affine: corrected = M × [x, y, 1]. Built from calibration targets vs raw gaze. */
/** Max runtime pairs kept for rolling recalibration (after initial 9-dot cal). */
const MAX_RUNTIME_PAIRS = 12;

export class GazeCalibrationMap {
  private pairs: { target: GazePoint; observed: GazePoint }[] = [];
  private matrix: [number, number, number, number, number, number] | null = null;
  private active = false;

  reset() {
    this.pairs = [];
    this.matrix = null;
    this.active = false;
  }

  addPair(target: GazePoint, observed: GazePoint) {
    if (!isFinitePoint(target) || !isFinitePoint(observed)) return;
    this.pairs.push({ target, observed });
    this.refit();
  }

  /** Add a confirmed gaze→target pair during use (e.g. after successful dwell). */
  addRuntimePair(target: GazePoint, observed: GazePoint) {
    if (!this.active || !isFinitePoint(target) || !isFinitePoint(observed)) return;
    this.pairs.push({ target, observed });
    if (this.pairs.length > MAX_RUNTIME_PAIRS) {
      this.pairs = this.pairs.slice(-MAX_RUNTIME_PAIRS);
    }
    this.refit();
  }

  private refit() {
    if (this.pairs.length >= 3) {
      this.matrix = fitAffine(this.pairs);
    }
  }

  enable() {
    this.active = this.matrix !== null && this.pairs.length >= 3;
  }

  isActive() {
    return this.active && this.matrix !== null;
  }

  getPairCount() {
    return this.pairs.length;
  }

  mapScreen(observed: GazePoint): GazePoint {
    const m = this.matrix;
    if (!this.active || !m) return observed;
    return {
      x: m[0] * observed.x + m[1] * observed.y + m[2],
      y: m[3] * observed.x + m[4] * observed.y + m[5],
    };
  }
}

let sharedMap: GazeCalibrationMap | null = null;

export function getGazeCalibrationMap(): GazeCalibrationMap {
  if (!sharedMap) {
    sharedMap = new GazeCalibrationMap();
  }
  return sharedMap;
}

function isFinitePoint(p: GazePoint) {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}

function fitAffine(
  pairs: { target: GazePoint; observed: GazePoint }[],
): [number, number, number, number, number, number] {
  const n = pairs.length;
  const a: number[][] = [];
  const bx: number[] = [];
  const by: number[] = [];

  for (const { target, observed } of pairs) {
    a.push([observed.x, observed.y, 1]);
    bx.push(target.x);
    by.push(target.y);
  }

  const wx = solveNormal3(a, bx);
  const wy = solveNormal3(a, by);

  if (!wx || !wy) {
    const meanObsX = pairs.reduce((s, p) => s + p.observed.x, 0) / n;
    const meanObsY = pairs.reduce((s, p) => s + p.observed.y, 0) / n;
    const meanTx = pairs.reduce((s, p) => s + p.target.x, 0) / n;
    const meanTy = pairs.reduce((s, p) => s + p.target.y, 0) / n;
    return [1, 0, meanTx - meanObsX, 0, 1, meanTy - meanObsY];
  }

  return [wx[0], wx[1], wx[2], wy[0], wy[1], wy[2]];
}

function solveNormal3(a: number[][], b: number[]): number[] | null {
  const ata = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const atb = [0, 0, 0];

  for (let i = 0; i < a.length; i++) {
    for (let r = 0; r < 3; r++) {
      atb[r] += a[i][r] * b[i];
      for (let c = 0; c < 3; c++) {
        ata[r][c] += a[i][r] * a[i][c];
      }
    }
  }

  return gaussianElim3(ata, atb);
}

function gaussianElim3(m: number[][], b: number[]): number[] | null {
  const a = m.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-9) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];

    for (let row = col + 1; row < 3; row++) {
      const factor = a[row][col] / a[col][col];
      for (let c = col; c < 4; c++) {
        a[row][c] -= factor * a[col][c];
      }
    }
  }

  const x = [0, 0, 0];
  for (let row = 2; row >= 0; row--) {
    let sum = a[row][3];
    for (let c = row + 1; c < 3; c++) {
      sum -= a[row][c] * x[c];
    }
    x[row] = sum / a[row][row];
  }
  return x;
}
