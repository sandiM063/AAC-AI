import { EYE_DWELL_MS } from "./constants";

export type EyeDwellSpeed = "fast" | "normal" | "slow";

const DWELL_SPEED_KEY = "aac-eye-dwell-speed";

/** Smooth, deliberate activation times. */
export const EYE_DWELL_SPEED_MS: Record<EyeDwellSpeed, number> = {
  fast: 1600,
  normal: 2200,
  slow: 3000,
};

export function getEyeDwellSpeed(userId: string): EyeDwellSpeed {
  if (typeof window === "undefined") return "slow";
  const stored = localStorage.getItem(`${DWELL_SPEED_KEY}:${userId}`);
  if (stored === "fast" || stored === "normal") return stored;
  return "slow";
}

export function setEyeDwellSpeed(userId: string, speed: EyeDwellSpeed) {
  localStorage.setItem(`${DWELL_SPEED_KEY}:${userId}`, speed);
}

export function getEyeDwellMs(userId: string): number {
  return EYE_DWELL_SPEED_MS[getEyeDwellSpeed(userId)] ?? EYE_DWELL_MS;
}
