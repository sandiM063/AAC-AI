/** Consecutive frames without a detected face before showing a warning. */
export const EYE_TRACKING_LOST_FRAMES = 200;

export type TrackingHealth = "ok" | "lost";

export class TrackingHealthMonitor {
  private invalidStreak = 0;
  private health: TrackingHealth = "ok";

  noteSample(faceDetected: boolean): TrackingHealth {
    if (faceDetected) {
      this.invalidStreak = 0;
    } else {
      this.invalidStreak += 1;
    }

    const next: TrackingHealth =
      this.invalidStreak >= EYE_TRACKING_LOST_FRAMES ? "lost" : "ok";

    if (next !== this.health) {
      this.health = next;
    }

    return this.health;
  }

  getHealth(): TrackingHealth {
    return this.health;
  }

  reset() {
    this.invalidStreak = 0;
    this.health = "ok";
  }
}
