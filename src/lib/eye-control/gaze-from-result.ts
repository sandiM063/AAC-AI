import type { GazeResult } from "webeyetrack";
import { getGazeCalibrationMap } from "./gaze-calibration-map";
import { getHeadPoseTracker } from "./head-pose-tracker";
import { normPogToScreen, observedNormFromResult } from "./gaze-coords";
import type { GazePoint } from "./gaze-filter";

export function rawGazeFromResult(result: GazeResult): GazePoint | null {
  if (result.gazeState !== "open") return null;
  if (!result.facialLandmarks?.length) return null;

  const observed = observedNormFromResult(result);
  if (!observed) return null;

  return normPogToScreen([observed.x, observed.y]);
}

export function gazeFromResult(result: GazeResult): GazePoint | null {
  const raw = rawGazeFromResult(result);
  if (!raw) return null;

  const map = getGazeCalibrationMap();
  let point = map.isActive() ? map.mapScreen(raw) : raw;
  point = getHeadPoseTracker().compensateScreen(point);
  return point;
}

export function hasFaceInResult(result: GazeResult): boolean {
  return Boolean(result.facialLandmarks?.length);
}
