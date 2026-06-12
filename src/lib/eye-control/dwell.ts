import { EYE_HIT_PADDING_PX, EYE_NEAREST_TARGET_PX } from "./constants";
import type { GazePoint } from "./gaze-filter";
import { findBestTarget } from "./target-cache";

export type DwellState = {
  target: HTMLElement | null;
  startedAt: number | null;
  progress: number;
};

export function createDwellState(): DwellState {
  return { target: null, startedAt: null, progress: 0 };
}

export function findActionableElement(x: number, y: number): HTMLElement | null {
  return findBestTarget({ x, y }, EYE_NEAREST_TARGET_PX, EYE_HIT_PADDING_PX);
}

export function findActionableElementAt(point: GazePoint): HTMLElement | null {
  return findActionableElement(point.x, point.y);
}

export function clearDwellHighlight(target: HTMLElement | null) {
  if (!target) return;
  target.classList.remove("eye-dwell-target");
  target.style.removeProperty("--eye-dwell-progress");
}

export function applyDwellHighlight(target: HTMLElement, progress: number) {
  target.classList.add("eye-dwell-target");
  target.style.setProperty("--eye-dwell-progress", String(Math.min(1, progress)));
}
