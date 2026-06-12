import {
  EYE_CONTROL_CALIBRATION_KEY,
  EYE_CONTROL_CHANGE_EVENT,
  EYE_CONTROL_RECALIBRATE_EVENT,
  EYE_CONTROL_START_EVENT,
  EYE_CONTROL_STORAGE_KEY,
} from "./constants";
import { isEyeControlFeatureEnabled } from "./feature-flag";

function storageKey(userId: string) {
  return `${EYE_CONTROL_STORAGE_KEY}:${userId}`;
}

function calibrationKey(userId: string) {
  return `${EYE_CONTROL_CALIBRATION_KEY}:${userId}`;
}

export function isEyeControlEnabled(userId: string): boolean {
  if (!isEyeControlFeatureEnabled()) return false;
  if (typeof window === "undefined") return false;
  return localStorage.getItem(storageKey(userId)) === "1";
}

export function setEyeControlEnabled(userId: string, enabled: boolean) {
  if (!isEyeControlFeatureEnabled()) return;
  localStorage.setItem(storageKey(userId), enabled ? "1" : "0");
  window.dispatchEvent(
    new CustomEvent(EYE_CONTROL_CHANGE_EVENT, { detail: { userId, enabled } }),
  );
}

export function isEyeControlCalibrated(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(calibrationKey(userId)) === "1";
}

export function setEyeControlCalibrated(userId: string, calibrated: boolean) {
  localStorage.setItem(calibrationKey(userId), calibrated ? "1" : "0");
}

export function requestEyeControlStart(userId?: string) {
  window.dispatchEvent(
    new CustomEvent(EYE_CONTROL_START_EVENT, { detail: { userId } }),
  );
}

export function requestEyeControlRecalibration() {
  window.dispatchEvent(new CustomEvent(EYE_CONTROL_RECALIBRATE_EVENT));
}
