"use client";

import "./profile-avatar.css";
import { useTranslation } from "@/components/i18n/language-provider";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type ProfileCameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
};

export function ProfileCameraCapture({ open, onClose, onCapture }: ProfileCameraCaptureProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraSession, setCameraSession] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setStatus("idle");
      setErrorMessage(null);
      return;
    }
  }, [open, stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setStatus("loading");
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage(t("pages.profile.cameraNotSupported"));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;

        setStatus("error");

        if (error instanceof DOMException) {
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setErrorMessage(t("pages.profile.cameraPermissionDenied"));
            return;
          }
          if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            setErrorMessage(t("pages.profile.cameraNotFound"));
            return;
          }
        }

        setErrorMessage(t("pages.profile.cameraStartError"));
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, cameraSession, stopStream, t]);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleClose]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onCapture(blob);
        onClose();
      },
      "image/jpeg",
      0.88,
    );
  }

  if (!open) return null;

  return (
    <div className="dashboard-profile-camera-overlay" role="presentation">
      <button
        type="button"
        className="dashboard-profile-camera-backdrop"
        aria-label={t("common.cancel")}
        onClick={handleClose}
      />
      <div
        className="dashboard-profile-camera-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="dashboard-profile-camera-title">
          {t("pages.profile.cameraTitle")}
        </h2>

        <div className="dashboard-profile-camera-preview-wrap">
          {status === "loading" && (
            <p className="dashboard-profile-camera-status">{t("pages.profile.cameraLoading")}</p>
          )}
          {status === "error" && (
            <p className="dashboard-profile-camera-status dashboard-profile-camera-status-error">
              {errorMessage}
            </p>
          )}
          <video
            ref={videoRef}
            className={`dashboard-profile-camera-video ${status === "ready" ? "dashboard-profile-camera-video-visible" : ""}`}
            playsInline
            muted
            autoPlay
          />
        </div>

        <div className="dashboard-profile-camera-actions">
          <button
            type="button"
            className="dashboard-btn dashboard-btn-outline dashboard-profile-camera-btn"
            onClick={handleClose}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary dashboard-profile-camera-btn"
            disabled={status !== "ready"}
            onClick={handleCapture}
          >
            {t("pages.profile.cameraCapture")}
          </button>
        </div>
      </div>
    </div>
  );
}
