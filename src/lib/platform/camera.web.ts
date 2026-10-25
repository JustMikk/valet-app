import type { CameraOutcome, CameraProvider, CameraSession } from "./types"

/** Longest side of the stored selfie: enough to recognise a face, small enough to upload on 4G. */
const MAX_SIDE_PX = 640
const JPEG_QUALITY = 0.72

function sessionFor(stream: MediaStream): CameraSession {
  return {
    stream,
    capture(video) {
      if (!video || video.videoWidth === 0) return null
      const scale = Math.min(1, MAX_SIDE_PX / Math.max(video.videoWidth, video.videoHeight))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext("2d")
      if (!context) return null
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
    },
    stop() {
      for (const track of stream.getTracks()) track.stop()
    },
  }
}

/** Browser camera: the front camera, video only, live (no file picker). */
export const webCamera: CameraProvider = {
  async open(): Promise<CameraOutcome> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return { ok: false, reason: "unsupported" }
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      })
      return { ok: true, session: sessionFor(stream) }
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ""
      const denied = name === "NotAllowedError" || name === "SecurityError"
      return { ok: false, reason: denied ? "denied" : "unavailable" }
    }
  },
}
