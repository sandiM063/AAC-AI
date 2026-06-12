import type { GazeResult } from "webeyetrack";
import type { GazePoint } from "./gaze-filter";

/** WebEyeTrack normPog: origin at screen center, range ~[-0.5, 0.5]. */
export function normPogToScreen(normPog: number[]): GazePoint | null {
  const nx = Number(normPog[0]);
  const ny = Number(normPog[1]);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;

  return {
    x: (nx + 0.5) * window.innerWidth,
    y: (ny + 0.5) * window.innerHeight,
  };
}

export function screenToNormPog(x: number, y: number): { x: number; y: number } {
  return {
    x: x / window.innerWidth - 0.5,
    y: y / window.innerHeight - 0.5,
  };
}

export function observedNormFromResult(result: GazeResult): { x: number; y: number } | null {
  const nx = Number(result.normPog[0]);
  const ny = Number(result.normPog[1]);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
  return { x: nx, y: ny };
}
