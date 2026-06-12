import { EYE_VIDEO_ID } from "./webeyetrack-session";

export function isCameraStreamActive(): boolean {
  const video = document.getElementById(EYE_VIDEO_ID) as HTMLVideoElement | null;
  const stream = video?.srcObject;
  if (!(stream instanceof MediaStream)) return false;

  const track = stream.getVideoTracks()[0];
  return Boolean(track && track.readyState === "live" && track.enabled);
}
