"use client";

import { useTranslation } from "@/components/i18n/language-provider";
import {
  EYE_CONTROL_CHANGE_EVENT,
  EYE_CONTROL_STATUS_EVENT,
} from "@/lib/eye-control/constants";
import {
  getEyeDwellSpeed,
  setEyeDwellSpeed,
  type EyeDwellSpeed,
} from "@/lib/eye-control/dwell-settings";
import { requestCameraAccess } from "@/lib/eye-control/request-camera";
import {
  isEyeControlEnabled,
  requestEyeControlRecalibration,
  requestEyeControlStart,
  setEyeControlEnabled,
} from "@/lib/eye-control/storage";
import { useEffect, useState } from "react";
import "@/components/eye-control/eye-control.css";

type EyeControlSettingsProps = {
  userId: string;
};

type EyePhase = "off" | "starting" | "calibrating" | "active" | "error";

export function EyeControlSettings({ userId }: EyeControlSettingsProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<EyePhase>("off");
  const [status, setStatus] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [dwellSpeed, setDwellSpeed] = useState<EyeDwellSpeed>("slow");

  const cameraRunning = phase === "starting" || phase === "calibrating" || phase === "active";

  useEffect(() => {
    setEnabled(isEyeControlEnabled(userId));
    setDwellSpeed(getEyeDwellSpeed(userId));

    function onChange(event: Event) {
      const detail = (event as CustomEvent<{ userId: string; enabled: boolean }>).detail;
      if (detail.userId !== userId) return;
      setEnabled(detail.enabled);
      if (!detail.enabled) {
        setStatus(t("settings.eyeControl.statusOff"));
      }
    }

    function onStatus(event: Event) {
      const detail = (event as CustomEvent<{ userId: string; phase: EyePhase }>).detail;
      if (detail.userId !== userId) return;
      setPhase(detail.phase);

      if (detail.phase === "starting") {
        setStatus(t("settings.eyeControl.statusStarting"));
      } else if (detail.phase === "calibrating") {
        setStatus(t("settings.eyeControl.statusCalibrating"));
      } else if (detail.phase === "active") {
        setStatus(t("settings.eyeControl.statusActive"));
      } else if (detail.phase === "error") {
        setStatus(t("settings.eyeControl.errorCamera"));
      }
    }

    window.addEventListener(EYE_CONTROL_CHANGE_EVENT, onChange);
    window.addEventListener(EYE_CONTROL_STATUS_EVENT, onStatus);
    return () => {
      window.removeEventListener(EYE_CONTROL_CHANGE_EVENT, onChange);
      window.removeEventListener(EYE_CONTROL_STATUS_EVENT, onStatus);
    };
  }, [userId, t]);

  async function startWithCamera() {
    setIsRequestingCamera(true);
    setStatus(t("settings.eyeControl.requestingCamera"));

    const result = await requestCameraAccess();
    setIsRequestingCamera(false);

    if (result === "unsupported") {
      setStatus(t("settings.eyeControl.errorUnsupported"));
      return false;
    }

    if (result === "denied") {
      setStatus(t("settings.eyeControl.errorCameraDenied"));
      return false;
    }

    requestEyeControlStart(userId);
    setStatus(t("settings.eyeControl.statusOn"));
    return true;
  }

  async function handleToggle() {
    const next = !enabled;

    if (next) {
      setEnabled(true);
      setEyeControlEnabled(userId, true);
      await startWithCamera();
      return;
    }

    setEnabled(false);
    setEyeControlEnabled(userId, false);
    setStatus(t("settings.eyeControl.statusOff"));
  }

  async function handleAllowCamera() {
    await startWithCamera();
  }

  function handleRecalibrate() {
    if (!cameraRunning) {
      void startWithCamera().then((started) => {
        if (started) requestEyeControlRecalibration();
      });
      return;
    }
    requestEyeControlRecalibration();
    setStatus(t("settings.eyeControl.recalibrating"));
  }

  return (
    <section className="dashboard-card" data-tutorial="settings-eye-control">
      <h2 className="dashboard-card-title">{t("settings.eyeControl.title")}</h2>
      <p className="dashboard-settings-desc">{t("settings.eyeControl.description")}</p>

      <div className="dashboard-eye-control-row">
        <div className="dashboard-eye-control-copy">
          <p className="dashboard-settings-label">{t("settings.eyeControl.toggleLabel")}</p>
          <p className="dashboard-eye-control-note">{t("settings.eyeControl.privacyNote")}</p>
          {status && (
            <p className="dashboard-eye-control-status" role="status">
              {status}
            </p>
          )}
        </div>

        <div className="dashboard-eye-control-actions">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t("settings.eyeControl.toggleLabel")}
            className="dashboard-toggle"
            disabled={isRequestingCamera}
            onClick={() => void handleToggle()}
          >
            <span className="dashboard-toggle-thumb" aria-hidden />
          </button>

          {enabled && cameraRunning && (
            <button
              type="button"
              className="dashboard-btn dashboard-btn-outline"
              onClick={handleRecalibrate}
            >
              {t("settings.eyeControl.recalibrate")}
            </button>
          )}
        </div>
      </div>

      {enabled && !cameraRunning && (
        <div className="eye-control-camera-prompt">
          <p className="dashboard-eye-control-note">{t("settings.eyeControl.cameraPrompt")}</p>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary"
            disabled={isRequestingCamera}
            onClick={() => void handleAllowCamera()}
          >
            {isRequestingCamera
              ? t("settings.eyeControl.requestingCamera")
              : t("settings.eyeControl.allowCamera")}
          </button>
        </div>
      )}

      {enabled && (
        <label className="dashboard-settings-field dashboard-eye-control-speed">
          <span className="dashboard-settings-label">{t("settings.eyeControl.dwellSpeedLabel")}</span>
          <select
            className="dashboard-settings-select"
            value={dwellSpeed}
            onChange={(event) => {
              const next = event.target.value as EyeDwellSpeed;
              setDwellSpeed(next);
              setEyeDwellSpeed(userId, next);
            }}
          >
            <option value="slow">{t("settings.eyeControl.dwellSpeedSlow")}</option>
            <option value="normal">{t("settings.eyeControl.dwellSpeedNormal")}</option>
            <option value="fast">{t("settings.eyeControl.dwellSpeedFast")}</option>
          </select>
        </label>
      )}

      <p className="dashboard-eye-control-note">{t("settings.eyeControl.howItWorks")}</p>
    </section>
  );
}
