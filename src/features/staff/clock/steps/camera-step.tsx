import { Icon } from "@/components/shared"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import type { CameraStatus } from "../use-camera"

type CameraStepProps = {
  /** Callback ref for the live <video>. */
  attach: (video: HTMLVideoElement | null) => void
  status: CameraStatus
  /** A frame has arrived, so the shutter can be pressed. */
  ready: boolean
  onFrame: () => void
  /** Inside the venue (clock-in) or capturing for an approval request. */
  inside: boolean
  /** Meters from the venue, shown in the "Inside" chip. */
  distanceM: number
  onClose: () => void
  onShoot: () => void
}

/**
 * Step 2 of 2: selfie stage. The front camera is live behind the oval (a placeholder label shows
 * while it starts, or for a simulated camera); the shutter is enabled once a frame has arrived.
 */
export function CameraStep({
  attach,
  status,
  ready,
  onFrame,
  inside,
  distanceM,
  onClose,
  onShoot,
}: CameraStepProps) {
  const chip: { icon: IconName; label: string; className: string } = inside
    ? { icon: "verified", label: `Inside · ${distanceM} m from venue`, className: "camera-chip-ok" }
    : { icon: "wrong_location", label: "For approval request", className: "camera-chip-warn" }
  const live = status === "live"

  return (
    <div className="absolute inset-0 animate-screen text-white camera-bg">
      <video
        ref={attach}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        onLoadedData={onFrame}
        // Mirrored like a selfie preview; the stored photo is not.
        className={cn("absolute inset-0 size-full -scale-x-100 object-cover", !live && "hidden")}
      />
      <div className="absolute top-[calc(50%-190px)] left-1/2 -ml-28.75 grid h-75 w-57.5 place-items-center rounded-[50%] camera-oval">
        {!live && (
          <span className="font-mono text-12 tracking-p060 text-white/55">
            {status === "starting" ? "STARTING CAMERA" : "LIVE FRONT CAMERA"}
          </span>
        )}
      </div>
      <div className="absolute top-[calc(var(--safe-top)+8px)] right-5 left-5 flex items-center justify-between tablet:top-5">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-13 place-items-center rounded-pill border-0 camera-button text-white"
        >
          <Icon name="close" size={24} />
        </button>
        <span
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-pill pr-3.5 pl-2.5 text-14 font-semibold",
            chip.className,
          )}
        >
          <Icon name={chip.icon} filled size={18} />
          {chip.label}
        </span>
        <span className="w-13" />
      </div>
      <div className="absolute inset-x-0 top-[calc(50%+130px)] flex flex-col gap-1.5 text-center">
        <span className="font-display text-24 font-semibold tracking-n020">Take a selfie</span>
        <span className="text-16 text-white/70">Face inside the oval · Step 2 of 2</span>
      </div>
      <div className="absolute inset-x-0 bottom-12 flex justify-center">
        <button
          type="button"
          aria-label="Take selfie"
          disabled={!ready}
          onClick={onShoot}
          className="size-21 rounded-pill border-5 border-white bg-transparent p-1.25 transition-[transform,opacity] duration-150 active:scale-90 disabled:opacity-50"
        >
          <span className="block size-full rounded-pill bg-white" />
        </button>
      </div>
    </div>
  )
}
