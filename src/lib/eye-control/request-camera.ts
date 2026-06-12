export type CameraAccessResult = "granted" | "denied" | "unsupported";

export async function requestCameraAccess(): Promise<CameraAccessResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch {
    return "denied";
  }
}
