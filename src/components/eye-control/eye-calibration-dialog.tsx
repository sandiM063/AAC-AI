"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import {
  CALIBRATION_HIT_RADIUS_PX,
  CALIBRATION_POINTS,
  EYE_CALIBRATION_DWELL_MS,
} from "@/lib/eye-control/constants";
import type { GazePoint } from "@/lib/eye-control/gaze-filter";
import { useCallback, useEffect, useRef, useState } from "react";

export type GazePosition = GazePoint;

type CalibrationTarget = { x: number; y: number };

type EyeCalibrationDialogProps = {
  open: boolean;
  gaze: GazePosition | null;
  onComplete: () => void;
  onCancel: () => void;
  onActiveTargetChange: (target: CalibrationTarget | null) => void;
  onPointActivated: (point: CalibrationTarget) => void;
};

function distanceToPoint(gaze: GazePosition, target: CalibrationTarget) {
  return Math.hypot(gaze.x - target.x, gaze.y - target.y);
}

function targetFromDot(
  element: HTMLButtonElement | null,
  point: { x: number; y: number },
): CalibrationTarget {
  if (element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
  return {
    x: point.x * window.innerWidth,
    y: point.y * window.innerHeight,
  };
}

export function EyeCalibrationDialog({
  open,
  gaze,
  onComplete,
  onCancel,
  onActiveTargetChange,
  onPointActivated,
}: EyeCalibrationDialogProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [dwellProgress, setDwellProgress] = useState(0);
  const dwellRef = useRef<number | null>(null);
  const activeDotRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setDwellProgress(0);
      dwellRef.current = null;
      onActiveTargetChange(null);
    }
  }, [open, onActiveTargetChange]);

  useEffect(() => {
    if (!open) return;
    const point = CALIBRATION_POINTS[index];
    onActiveTargetChange(point ? targetFromDot(activeDotRef.current, point) : null);
  }, [open, index, onActiveTargetChange]);

  const completePoint = useCallback(
    (pointIndex: number, dotElement: HTMLButtonElement | null) => {
      const point = CALIBRATION_POINTS[pointIndex];
      if (point) {
        onPointActivated(targetFromDot(dotElement, point));
      }

      setDwellProgress(0);
      dwellRef.current = null;

      if (pointIndex >= CALIBRATION_POINTS.length - 1) {
        onActiveTargetChange(null);
        onComplete();
      } else {
        setIndex(pointIndex + 1);
      }
    },
    [onActiveTargetChange, onComplete, onPointActivated],
  );

  useEffect(() => {
    if (!open || !gaze) {
      dwellRef.current = null;
      setDwellProgress(0);
      return;
    }

    const point = CALIBRATION_POINTS[index];
    if (!point) return;

    const target = targetFromDot(activeDotRef.current, point);
    const onTarget = distanceToPoint(gaze, target) <= CALIBRATION_HIT_RADIUS_PX;

    if (onTarget) {
      if (dwellRef.current === null) {
        dwellRef.current = performance.now();
      }
      const elapsed = performance.now() - dwellRef.current;
      const progress = Math.min(1, elapsed / EYE_CALIBRATION_DWELL_MS);
      setDwellProgress(progress);
      if (progress >= 1) {
        completePoint(index, activeDotRef.current);
      }
    } else {
      dwellRef.current = null;
      setDwellProgress(0);
    }
  }, [open, gaze, index, completePoint]);

  if (!open) return null;

  return (
    <div
      className="eye-calibration-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eye-calibration-title"
      data-eye-ignore
    >
      <div className="eye-calibration-panel dashboard-card" data-eye-ignore>
        <h2 id="eye-calibration-title" className="dashboard-card-title">
          {t("settings.eyeControl.calibrationTitle")}
        </h2>
        <p className="dashboard-settings-desc">{t("settings.eyeControl.calibrationDesc")}</p>
        <p className="dashboard-eye-control-note">{t("settings.eyeControl.calibrationClickHint")}</p>
        <p className="eye-calibration-progress" aria-live="polite">
          {t("settings.eyeControl.calibrationProgress", {
            current: String(index + 1),
            total: String(CALIBRATION_POINTS.length),
          })}
        </p>
        <button
          type="button"
          className="dashboard-btn dashboard-btn-outline eye-calibration-skip"
          data-eye-action
          onClick={onCancel}
        >
          {t("settings.eyeControl.calibrationSkip")}
        </button>
      </div>

      {CALIBRATION_POINTS.map((point, pointIndex) => {
        const active = pointIndex === index;
        return (
          <button
            key={pointIndex}
            ref={active ? activeDotRef : undefined}
            type="button"
            className={`eye-calibration-dot ${active ? "eye-calibration-dot-active" : ""}`}
            data-calibration-dot
            data-eye-action
            disabled={!active}
            aria-label={
              active
                ? t("settings.eyeControl.calibrationDotLabel", {
                    current: String(pointIndex + 1),
                    total: String(CALIBRATION_POINTS.length),
                  })
                : undefined
            }
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              ["--eye-dwell-progress" as string]: active ? String(dwellProgress) : "0",
            }}
            onClick={() => {
              if (active) completePoint(pointIndex, activeDotRef.current);
            }}
          />
        );
      })}
    </div>
  );
}
