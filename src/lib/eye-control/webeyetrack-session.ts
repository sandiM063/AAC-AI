import type { GazeResult } from "webeyetrack";
import { normPogToScreen, observedNormFromResult, screenToNormPog } from "./gaze-coords";
import { getGazeCalibrationMap } from "./gaze-calibration-map";
import type { GazePoint } from "./gaze-filter";

export const EYE_VIDEO_ID = "aac-eye-track-video";

/** WebEyeTrack ignores clicks closer than 1s apart. */
const CALIBRATION_CLICK_GAP_MS = 1100;
const GAZE_AVERAGE_WINDOW = 24;

type GazeListener = (result: GazeResult) => void;

type WebEyeTrackProxyLike = {
  onGazeResults: (result: GazeResult) => void;
  status: "idle" | "inference" | "calib";
};

type WebcamClientLike = {
  stopWebcam(): void;
};

export class EyeTrackSession {
  private proxy: WebEyeTrackProxyLike | null = null;
  private webcam: WebcamClientLike | null = null;
  private worker: Worker | null = null;
  private listener: GazeListener | null = null;
  private allowWorkerClick = false;
  private calibrationSamples = 0;
  private lastCalibrationClickAt = 0;
  private recentNormSamples: { x: number; y: number }[] = [];
  private recentHeadResults: GazeResult[] = [];

  async start(listener: GazeListener): Promise<void> {
    if (this.proxy) return;

    this.listener = listener;
    const { WebcamClient, WebEyeTrackProxy } = await import("webeyetrack");

    const webcam = new WebcamClient(EYE_VIDEO_ID);
    const proxy = new WebEyeTrackProxy(webcam);
    const worker = (proxy as unknown as { worker: Worker }).worker;

    this.webcam = webcam;
    this.proxy = proxy;
    this.worker = worker;
    this.guardWorkerClicks();

    proxy.onGazeResults = (result) => {
      if (result.gazeState === "open" && result.facialLandmarks?.length) {
        const observed = observedNormFromResult(result);
        if (observed) {
          this.recentNormSamples.push(observed);
          if (this.recentNormSamples.length > GAZE_AVERAGE_WINDOW) {
            this.recentNormSamples.shift();
          }
        }
        this.recentHeadResults.push(result);
        if (this.recentHeadResults.length > 40) {
          this.recentHeadResults.shift();
        }
      }
      this.listener?.(result);
    };
  }

  private guardWorkerClicks() {
    const worker = this.worker;
    if (!worker) return;

    const original = worker.postMessage.bind(worker);
    worker.postMessage = (message: { type?: string; payload?: unknown }) => {
      if (message?.type === "click" && !this.allowWorkerClick) return;
      original(message);
    };
  }

  private averagedObservedScreen(): GazePoint | null {
    if (this.recentNormSamples.length < 8) return null;

    let sumX = 0;
    let sumY = 0;
    for (const sample of this.recentNormSamples) {
      sumX += sample.x;
      sumY += sample.y;
    }
    const nx = sumX / this.recentNormSamples.length;
    const ny = sumY / this.recentNormSamples.length;
    return normPogToScreen([nx, ny]);
  }

  getRecentHeadResults(): GazeResult[] {
    return this.recentHeadResults;
  }

  private sendWorkerAdaptation(targetScreen: GazePoint): boolean {
    if (!this.worker) return false;

    const now = performance.now();
    if (now - this.lastCalibrationClickAt < CALIBRATION_CLICK_GAP_MS) {
      return false;
    }

    const observedScreen = this.averagedObservedScreen();
    if (!observedScreen) return false;

    const targetNorm = screenToNormPog(targetScreen.x, targetScreen.y);

    this.allowWorkerClick = true;
    try {
      this.worker.postMessage({ type: "click", payload: targetNorm });
      this.lastCalibrationClickAt = now;
      this.recentNormSamples = [];
      return true;
    } finally {
      this.allowWorkerClick = false;
    }
  }

  /** Initial 9-dot calibration sample. */
  recordCalibrationSample(targetScreen: GazePoint): boolean {
    const observedScreen = this.averagedObservedScreen();
    if (!observedScreen) return false;
    if (!this.sendWorkerAdaptation(targetScreen)) return false;

    getGazeCalibrationMap().addPair(targetScreen, observedScreen);
    this.calibrationSamples += 1;
    return true;
  }

  /** Silent adaptation when the user successfully activates a control. */
  recordRuntimeAdaptation(targetScreen: GazePoint): boolean {
    const observedScreen = this.averagedObservedScreen();
    if (!observedScreen) return false;
    if (!this.sendWorkerAdaptation(targetScreen)) return false;

    getGazeCalibrationMap().addRuntimePair(targetScreen, observedScreen);
    return true;
  }

  getCalibrationSampleCount() {
    return this.calibrationSamples;
  }

  resetCalibrationSamples() {
    this.calibrationSamples = 0;
    this.lastCalibrationClickAt = 0;
    this.recentNormSamples = [];
    this.recentHeadResults = [];
    getGazeCalibrationMap().reset();
  }

  stop() {
    this.webcam?.stopWebcam();
    this.proxy = null;
    this.webcam = null;
    this.worker = null;
    this.listener = null;
    this.calibrationSamples = 0;
    this.lastCalibrationClickAt = 0;
    this.recentNormSamples = [];
    this.recentHeadResults = [];
  }

  isRunning() {
    return Boolean(this.proxy);
  }
}

let sharedSession: EyeTrackSession | null = null;

export function getEyeTrackSession(): EyeTrackSession {
  if (!sharedSession) {
    sharedSession = new EyeTrackSession();
  }
  return sharedSession;
}

function elementCenter(element: Element): GazePoint | null {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function adaptToActivatedElement(element: Element) {
  const center = elementCenter(element);
  if (!center) return;
  getEyeTrackSession().recordRuntimeAdaptation(center);
}
