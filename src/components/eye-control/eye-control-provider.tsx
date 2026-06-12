"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import {
  EYE_CONTROL_CHANGE_EVENT,
  EYE_CONTROL_RECALIBRATE_EVENT,
  EYE_CONTROL_START_EVENT,
  EYE_CONTROL_STATUS_EVENT,
  EYE_DWELL_COOLDOWN_MS,
  EYE_GAZE_SMOOTHING_ALPHA,
  EYE_MIN_CALIBRATION_SAMPLES,
  EYE_MOUSE_MODE_KEY,
  EYE_NAV_SMOOTHING_ALPHA,
  EYE_TRACKING_NAV_GRACE_MS,
} from "@/lib/eye-control/constants";
import {
  applyDwellHighlight,
  clearDwellHighlight,
  createDwellState,
  findActionableElementAt,
} from "@/lib/eye-control/dwell";
import { getEyeDwellMs } from "@/lib/eye-control/dwell-settings";
import { gazeFromResult, hasFaceInResult, rawGazeFromResult } from "@/lib/eye-control/gaze-from-result";
import { getGazeCalibrationMap } from "@/lib/eye-control/gaze-calibration-map";
import { GazeFilter, type GazePoint } from "@/lib/eye-control/gaze-filter";
import { GazeValidator } from "@/lib/eye-control/gaze-validator";
import { isCameraStreamActive } from "@/lib/eye-control/resume-tracking";
import { TargetLock } from "@/lib/eye-control/target-lock";
import { invalidateTargetCache } from "@/lib/eye-control/target-cache";
import {
  TrackingHealthMonitor,
  type TrackingHealth,
} from "@/lib/eye-control/tracking-health";
import { getHeadPoseTracker } from "@/lib/eye-control/head-pose-tracker";
import {
  isEyeControlCalibrated,
  isEyeControlEnabled,
  requestEyeControlStart,
  setEyeControlCalibrated,
} from "@/lib/eye-control/storage";
import {
  EYE_VIDEO_ID,
  adaptToActivatedElement,
  getEyeTrackSession,
} from "@/lib/eye-control/webeyetrack-session";
import type { GazeResult } from "webeyetrack";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EyeCalibrationDialog } from "./eye-calibration-dialog";
import { EyeGazeCursor } from "./eye-gaze-cursor";
import "./eye-control.css";

type EyeControlProviderProps = {
  userId: string;
  children: ReactNode;
};

type Phase = "off" | "starting" | "calibrating" | "active" | "error";

function updateCursorElement(element: HTMLDivElement | null, point: GazePoint | null) {
  if (!element) return;
  if (!point) {
    element.style.display = "none";
    return;
  }
  element.style.display = "block";
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
}

function updateVideoTrackingIndicator(health: TrackingHealth) {
  document.querySelector(".eye-control-video-wrap")?.setAttribute("data-tracking", health);
}

export function EyeControlProvider({ userId, children }: EyeControlProviderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("off");
  const [error, setError] = useState<string | null>(null);
  const [calibrationGaze, setCalibrationGaze] = useState<GazePoint | null>(null);
  const [calibrationSession, setCalibrationSession] = useState(0);
  const [needsCalibrationBanner, setNeedsCalibrationBanner] = useState(false);
  const [mouseMode, setMouseMode] = useState(false);
  const [trackingHealth, setTrackingHealth] = useState<TrackingHealth>("ok");
  const [showCamera, setShowCamera] = useState(false);
  const dwellState = useRef(createDwellState());
  const cooldownUntil = useRef(0);
  const navigationPaused = useRef(false);
  const phaseRef = useRef<Phase>("off");
  const displayFilterRef = useRef(new GazeFilter(EYE_GAZE_SMOOTHING_ALPHA));
  const navFilterRef = useRef(new GazeFilter(EYE_NAV_SMOOTHING_ALPHA));
  const gazeValidatorRef = useRef(new GazeValidator());
  const targetLockRef = useRef(new TargetLock());
  const lastCalibrationSampleAt = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastCalibrationGazeUpdate = useRef(0);
  const lastCalibrationGazePoint = useRef<GazePoint | null>(null);
  const mouseModeRef = useRef(false);
  const trackingMonitorRef = useRef(new TrackingHealthMonitor());
  const trackingHealthRef = useRef<TrackingHealth>("ok");
  const lastFaceSeenAt = useRef(0);
  const beginEyeControlRef = useRef<() => Promise<void>>(async () => {});
  const resumeNavigationRef = useRef<() => Promise<void>>(async () => {});
  const processGazeRef = useRef<(result: GazeResult) => void>(() => {});

  const clearActiveDwell = useCallback(() => {
    clearDwellHighlight(dwellState.current.target);
    dwellState.current = createDwellState();
    targetLockRef.current.reset();
  }, []);

  const enterMouseMode = useCallback(() => {
    mouseModeRef.current = true;
    setMouseMode(true);
    navigationPaused.current = true;
    clearActiveDwell();
    updateCursorElement(cursorRef.current, null);
    document.body.classList.add("eye-control-mouse-mode");
  }, [clearActiveDwell]);

  const exitMouseMode = useCallback(() => {
    mouseModeRef.current = false;
    setMouseMode(false);
    if (phaseRef.current === "active") {
      navigationPaused.current = false;
    }
    document.body.classList.remove("eye-control-mouse-mode");
  }, []);

  const toggleMouseMode = useCallback(() => {
    if (phaseRef.current !== "active") return;
    if (mouseModeRef.current) {
      exitMouseMode();
    } else {
      enterMouseMode();
    }
  }, [enterMouseMode, exitMouseMode]);

  const resetNavigationState = useCallback(() => {
    clearDwellHighlight(dwellState.current.target);
    dwellState.current = createDwellState();
    displayFilterRef.current.reset();
    navFilterRef.current.reset();
    gazeValidatorRef.current.reset();
    targetLockRef.current.reset();
    lastCalibrationSampleAt.current = 0;
    lastCalibrationGazeUpdate.current = 0;
    lastCalibrationGazePoint.current = null;
    trackingMonitorRef.current.reset();
    trackingHealthRef.current = "ok";
    mouseModeRef.current = false;
    setMouseMode(false);
    setTrackingHealth("ok");
    updateVideoTrackingIndicator("ok");
    setCalibrationGaze(null);
    updateCursorElement(cursorRef.current, null);
    document.body.classList.remove("eye-control-mouse-mode");
    getGazeCalibrationMap().reset();
    getHeadPoseTracker().reset();
    lastFaceSeenAt.current = 0;
    invalidateTargetCache();
  }, []);

  const finishCalibration = useCallback(() => {
    getGazeCalibrationMap().enable();
    getHeadPoseTracker().setReferenceFromResults(getEyeTrackSession().getRecentHeadResults());
    displayFilterRef.current.reset();
    navFilterRef.current.reset();
    gazeValidatorRef.current.reset();
    lastCalibrationGazePoint.current = null;
    lastFaceSeenAt.current = performance.now();
    setCalibrationGaze(null);
    updateCursorElement(cursorRef.current, null);
  }, []);

  const processGazeResult = useCallback(
    (result: GazeResult) => {
      const hasFace = hasFaceInResult(result);
      if (hasFace) {
        lastFaceSeenAt.current = performance.now();
        getHeadPoseTracker().noteResult(result);
      }

      const health = trackingMonitorRef.current.noteSample(hasFace);
      if (health !== trackingHealthRef.current) {
        trackingHealthRef.current = health;
        setTrackingHealth(health);
        updateVideoTrackingIndicator(health);
      }

      const headTracker = getHeadPoseTracker();
      gazeValidatorRef.current.setJumpScale(headTracker.getJumpScale());

      if (mouseModeRef.current) {
        updateCursorElement(cursorRef.current, null);
        return;
      }

      if (phaseRef.current === "calibrating") {
        const calGaze = rawGazeFromResult(result);
        const calValidated = calGaze ? gazeValidatorRef.current.validate(calGaze) : null;
        const held =
          calValidated ??
          displayFilterRef.current.peek() ??
          gazeValidatorRef.current.getLastGood();
        updateCursorElement(cursorRef.current, held);

        if (calValidated) {
          const now = performance.now();
          if (now - lastCalibrationGazeUpdate.current >= 50) {
            lastCalibrationGazeUpdate.current = now;
            const prev = lastCalibrationGazePoint.current;
            if (!prev || Math.hypot(prev.x - calValidated.x, prev.y - calValidated.y) > 3) {
              lastCalibrationGazePoint.current = calValidated;
              setCalibrationGaze(calValidated);
            }
          }
        }
        return;
      }

      const rawGaze = gazeFromResult(result);
      const validated = rawGaze ? gazeValidatorRef.current.validate(rawGaze) : null;

      let cursorGaze = displayFilterRef.current.peek();
      let navGaze = navFilterRef.current.peek();

      if (validated) {
        cursorGaze = displayFilterRef.current.filter(validated);
        navGaze = navFilterRef.current.filter(validated);
      }

      const held =
        cursorGaze ?? displayFilterRef.current.peek() ?? gazeValidatorRef.current.getLastGood();
      updateCursorElement(cursorRef.current, held);

      if (navigationPaused.current || phaseRef.current !== "active") return;

      const faceGraceExpired =
        performance.now() - lastFaceSeenAt.current > EYE_TRACKING_NAV_GRACE_MS;
      if (trackingHealthRef.current === "lost" && faceGraceExpired) return;

      if (!navGaze) return;
      if (performance.now() < cooldownUntil.current) return;

      const target = targetLockRef.current.resolve(navGaze.x, navGaze.y, (x, y) =>
        findActionableElementAt({ x, y }),
      );
      const state = dwellState.current;
      const dwellMs = getEyeDwellMs(userId);

      if (target !== state.target) {
        clearDwellHighlight(state.target);
        state.target = target;
        state.startedAt = target ? performance.now() : null;
        state.progress = 0;
      }

      if (!target || state.startedAt === null) return;

      const elapsed = performance.now() - state.startedAt;
      state.progress = Math.min(1, elapsed / dwellMs);
      applyDwellHighlight(target, state.progress);

      if (state.progress >= 1) {
        target.click();
        adaptToActivatedElement(target);
        cooldownUntil.current = performance.now() + EYE_DWELL_COOLDOWN_MS;
        clearDwellHighlight(target);
        state.target = null;
        state.startedAt = null;
        state.progress = 0;
        targetLockRef.current.reset();
        invalidateTargetCache();
      }
    },
    [userId],
  );

  processGazeRef.current = processGazeResult;

  const enterCalibration = useCallback(() => {
    const session = getEyeTrackSession();
    session.resetCalibrationSamples();
    setEyeControlCalibrated(userId, false);
    navigationPaused.current = true;
    setNeedsCalibrationBanner(false);
    setPhase("calibrating");
  }, [userId]);

  const startDwellNavigation = useCallback(() => {
    const session = getEyeTrackSession();
    if (session.getCalibrationSampleCount() < EYE_MIN_CALIBRATION_SAMPLES) {
      enterCalibration();
      return;
    }

    navigationPaused.current = false;
    setCalibrationGaze(null);
    setNeedsCalibrationBanner(false);
    setPhase("active");
  }, [enterCalibration]);

  const stopTracking = useCallback(() => {
    getEyeTrackSession().stop();
    resetNavigationState();
    navigationPaused.current = false;
    setNeedsCalibrationBanner(false);
    setShowCamera(false);
    setPhase("off");
    setError(null);
  }, [resetNavigationState]);

  const beginEyeControl = useCallback(async () => {
    if (typeof window === "undefined") return;

    setPhase("starting");
    setError(null);
    resetNavigationState();

    try {
      const session = getEyeTrackSession();
      session.stop();
      setShowCamera(true);
      await session.start((result) => processGazeRef.current(result));

      if (
        isEyeControlCalibrated(userId) &&
        session.getCalibrationSampleCount() >= EYE_MIN_CALIBRATION_SAMPLES
      ) {
        startDwellNavigation();
      } else {
        enterCalibration();
      }
    } catch (cause) {
      console.error("Eye navigation failed to start:", cause);
      setError("camera");
      setPhase("error");
      setShowCamera(false);
    }
  }, [enterCalibration, resetNavigationState, startDwellNavigation, userId]);

  const resumeNavigation = useCallback(async () => {
    if (!isEyeControlEnabled(userId)) return;

    const previousPhase = phaseRef.current;
    if (previousPhase === "off" || previousPhase === "error") {
      await beginEyeControl();
      return;
    }

    if (!isCameraStreamActive()) {
      await beginEyeControl();
      return;
    }

    targetLockRef.current.reset();
    dwellState.current = createDwellState();
    clearDwellHighlight(dwellState.current.target);
    invalidateTargetCache();

    const heldGaze = displayFilterRef.current.peek() ?? gazeValidatorRef.current.getLastGood();
    updateCursorElement(cursorRef.current, heldGaze);

    if (previousPhase === "calibrating") {
      navigationPaused.current = true;
      setPhase("calibrating");
      return;
    }

    navigationPaused.current = false;
    setPhase("active");
  }, [beginEyeControl, userId]);

  beginEyeControlRef.current = beginEyeControl;
  resumeNavigationRef.current = resumeNavigation;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const active = phase === "active" || phase === "calibrating" || phase === "starting";
    document.body.classList.toggle("eye-control-active", active);
    return () => {
      document.body.classList.remove("eye-control-active");
      document.body.classList.remove("eye-control-mouse-mode");
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "active") {
      exitMouseMode();
    }
  }, [phase, exitMouseMode]);

  useEffect(() => {
    if (phase !== "active") return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== EYE_MOUSE_MODE_KEY || event.repeat) return;
      if (phaseRef.current !== "active") return;
      event.preventDefault();
      toggleMouseMode();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, toggleMouseMode]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EYE_CONTROL_STATUS_EVENT, { detail: { userId, phase } }),
    );
  }, [phase, userId]);

  useEffect(() => {
    function onChange(event: Event) {
      const detail = (event as CustomEvent<{ userId: string; enabled: boolean }>).detail;
      if (detail.userId !== userId) return;
      if (!detail.enabled) {
        void stopTracking();
      }
    }

    function onStart(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      if (!isEyeControlEnabled(userId)) return;
      void beginEyeControlRef.current();
    }

    async function onRecalibrate() {
      if (!isEyeControlEnabled(userId)) return;
      if (!getEyeTrackSession().isRunning()) {
        requestEyeControlStart(userId);
        return;
      }
      resetNavigationState();
      setCalibrationSession((session) => session + 1);
      enterCalibration();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        getEyeTrackSession().stop();
        setShowCamera(false);
        return;
      }
      void resumeNavigationRef.current();
    }

    window.addEventListener(EYE_CONTROL_CHANGE_EVENT, onChange);
    window.addEventListener(EYE_CONTROL_START_EVENT, onStart);
    window.addEventListener(EYE_CONTROL_RECALIBRATE_EVENT, onRecalibrate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", () => void resumeNavigationRef.current());
    window.addEventListener("pageshow", () => void resumeNavigationRef.current());

    if (isEyeControlEnabled(userId) && phaseRef.current === "off") {
      void beginEyeControlRef.current();
    }

    return () => {
      window.removeEventListener(EYE_CONTROL_CHANGE_EVENT, onChange);
      window.removeEventListener(EYE_CONTROL_START_EVENT, onStart);
      window.removeEventListener(EYE_CONTROL_RECALIBRATE_EVENT, onRecalibrate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId, stopTracking, resetNavigationState, enterCalibration]);

  useEffect(() => {
    invalidateTargetCache();
    clearDwellHighlight(dwellState.current.target);
    dwellState.current = createDwellState();
    targetLockRef.current.reset();
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (isEyeControlEnabled(userId)) {
        getEyeTrackSession().stop();
      }
    };
  }, [userId]);

  const handleActiveCalibrationTarget = useCallback((_target: { x: number; y: number } | null) => {
    // Calibration dots drive training via onPointActivated only.
  }, []);

  const handleCalibrationPointActivated = useCallback((point: { x: number; y: number }) => {
    const session = getEyeTrackSession();
    if (session.recordCalibrationSample(point)) {
      lastCalibrationSampleAt.current = performance.now();
      return;
    }

    window.setTimeout(() => {
      if (phaseRef.current !== "calibrating") return;
      if (session.recordCalibrationSample(point)) {
        lastCalibrationSampleAt.current = performance.now();
      }
    }, 1150);
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    if (getEyeTrackSession().getCalibrationSampleCount() < EYE_MIN_CALIBRATION_SAMPLES) {
      setNeedsCalibrationBanner(true);
      return;
    }

    finishCalibration();
    setEyeControlCalibrated(userId, true);
    navigationPaused.current = false;
    startDwellNavigation();
  }, [finishCalibration, startDwellNavigation, userId]);

  const handleCalibrationCancel = useCallback(() => {
    if (getEyeTrackSession().getCalibrationSampleCount() < EYE_MIN_CALIBRATION_SAMPLES) {
      setNeedsCalibrationBanner(true);
      return;
    }

    finishCalibration();
    setEyeControlCalibrated(userId, true);
    navigationPaused.current = false;
    startDwellNavigation();
  }, [finishCalibration, startDwellNavigation, userId]);

  const showGazeCursor =
    (phase === "active" || phase === "calibrating" || phase === "starting") && !mouseMode;

  return (
    <>
      {children}

      {showCamera && (
        <div className="eye-control-video-wrap" data-tracking="ok" data-eye-ignore>
          <video
            id={EYE_VIDEO_ID}
            autoPlay
            muted
            playsInline
            aria-label="Eye tracking camera"
          />
        </div>
      )}

      <EyeGazeCursor ref={cursorRef} visible={showGazeCursor} />

      <EyeCalibrationDialog
        key={calibrationSession}
        open={phase === "calibrating"}
        gaze={calibrationGaze}
        onComplete={handleCalibrationComplete}
        onCancel={handleCalibrationCancel}
        onActiveTargetChange={handleActiveCalibrationTarget}
        onPointActivated={handleCalibrationPointActivated}
      />

      {needsCalibrationBanner && phase === "calibrating" && (
        <div className="eye-control-error-banner" role="status" data-eye-ignore>
          {t("settings.eyeControl.calibrationIncomplete")}
        </div>
      )}

      {(phase === "starting" || phase === "active") && (
        <div
          className={`eye-control-status-pill ${mouseMode ? "eye-control-status-pill-mouse" : ""} ${trackingHealth === "lost" && !mouseMode ? "eye-control-status-pill-warning" : ""}`}
          aria-live="polite"
          data-eye-ignore
        >
          <span className="eye-control-status-dot" aria-hidden />
          {phase === "starting"
            ? t("settings.eyeControl.statusStarting")
            : mouseMode
              ? t("settings.eyeControl.statusMouseMode")
              : trackingHealth === "lost"
                ? t("settings.eyeControl.statusTrackingLost")
                : t("settings.eyeControl.statusActive")}
        </div>
      )}

      {phase === "error" && error && (
        <div className="eye-control-error-banner" role="alert" data-eye-ignore>
          {error === "camera"
            ? t("settings.eyeControl.errorCamera")
            : t("settings.eyeControl.errorUnsupported")}
        </div>
      )}
    </>
  );
}
