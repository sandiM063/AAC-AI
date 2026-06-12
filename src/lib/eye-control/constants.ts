export const EYE_CONTROL_STORAGE_KEY = "aac-eye-control";
export const EYE_CONTROL_CALIBRATION_KEY = "aac-eye-calibrated";
export const EYE_CONTROL_CHANGE_EVENT = "aac-eye-control-change";
export const EYE_CONTROL_START_EVENT = "aac-eye-control-start";
export const EYE_CONTROL_STATUS_EVENT = "aac-eye-control-status";
export const EYE_CONTROL_RECALIBRATE_EVENT = "aac-eye-control-recalibrate";

/** Press this key to toggle between eye navigation and normal mouse control. */
export const EYE_MOUSE_MODE_KEY = "Control";

/** Default dwell when no per-user speed is set. */
export const EYE_DWELL_MS = 3000;

/** Cooldown after an activation to avoid double triggers. */
export const EYE_DWELL_COOLDOWN_MS = 800;

/** Extra pixels around each target edge for hit detection. */
export const EYE_HIT_PADDING_PX = 52;

/** Snap to the nearest target within this distance (px). */
export const EYE_NEAREST_TARGET_PX = 180;

/** Must hold gaze on a new target this long before switching (ms). */
export const EYE_LOCK_STABLE_MS = 140;

/** Keep current target until gaze leaves this distance (px). */
export const EYE_LOCK_RELEASE_DISTANCE_PX = 130;

/** Brief drift outside release distance before unlocking (ms). */
export const EYE_LOCK_RELEASE_MS = 380;

/** Cursor display EMA — higher follows eyes more closely. */
export const EYE_GAZE_SMOOTHING_ALPHA = 0.62;

/** Navigation EMA — slightly smoother than display to reduce target hopping. */
export const EYE_NAV_SMOOTHING_ALPHA = 0.46;

/** Dwell time for each calibration dot (ms) — collect stable gaze average before sample. */
export const EYE_CALIBRATION_DWELL_MS = 1800;

export const CALIBRATION_HIT_RADIUS_PX = 280;

/** Minimum training samples before navigation can start (one per calibration dot). */
export const EYE_MIN_CALIBRATION_SAMPLES = 9;

/** Keep navigating with last gaze this long after face drops (ms). */
export const EYE_TRACKING_NAV_GRACE_MS = 5000;

/** @deprecated Use EYE_LOCK_RELEASE_MS */
export const EYE_DWELL_GRACE_MS = EYE_LOCK_RELEASE_MS;

/** @deprecated Replaced by exponential smoothing (EYE_GAZE_SMOOTHING_ALPHA) */
export const EYE_GAZE_SMOOTHING_SAMPLES = 8;

export const CALIBRATION_POINTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 },
  { x: 0.5, y: 0.1 },
  { x: 0.5, y: 0.9 },
  { x: 0.1, y: 0.5 },
  { x: 0.9, y: 0.5 },
] as const;
