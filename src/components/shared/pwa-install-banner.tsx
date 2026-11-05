"use client"

import { useState } from "react"

import { usePwaInstall } from "@/lib/platform/use-pwa-install"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

import { Icon } from "./icon"

const DISMISS_KEY = "pwa_banner_dismissed"

function dismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1")
  } catch {
    // storage unavailable — banner will reappear, which is acceptable
  }
}

/** iOS-specific step list shown in the sheet. */
function IosSteps() {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      <li className="flex items-start gap-3">
        <Icon name="ios_share" size={22} className="mt-0.5 shrink-0 text-accent-text" />
        <span className="text-15 leading-x140">
          Tap the <strong>Share</strong> button in Safari&rsquo;s toolbar
        </span>
      </li>
      <li className="flex items-start gap-3">
        <Icon name="add_box" size={22} className="mt-0.5 shrink-0 text-accent-text" />
        <span className="text-15 leading-x140">
          Scroll down and tap <strong>Add to Home Screen</strong>
        </span>
      </li>
      <li className="flex items-start gap-3">
        <Icon name="check_circle" size={22} className="mt-0.5 shrink-0 text-accent-text" />
        <span className="text-15 leading-x140">
          Tap <strong>Add</strong> &mdash; the app opens from your home screen from now on
        </span>
      </li>
    </ol>
  )
}

type BannerProps = { className?: string }

/**
 * Sticky install prompt that appears above content when the app is not yet installed.
 * Android/Chrome: one-tap native prompt. iOS/Safari: inline step list.
 * Dismissed per session so it doesn't interrupt after the user interacts.
 */
export function PwaInstallBanner({ className }: BannerProps) {
  const hydrated = useHydrated()
  const install = usePwaInstall()
  const [gone, setGone] = useState(false)
  const [iosOpen, setIosOpen] = useState(false)

  if (!hydrated || gone || dismissed() || install.kind === "none") return null

  const hide = () => {
    dismiss()
    setGone(true)
  }

  if (install.kind === "android") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border-b border-line bg-surface px-4 py-3",
          className,
        )}
      >
        <Icon name="install_mobile" size={22} className="shrink-0 text-accent-text" filled />
        <p className="m-0 flex-1 text-14 leading-x135 font-semibold">
          Install the app for faster access and offline support
        </p>
        <button
          type="button"
          onClick={async () => {
            await install.prompt()
            hide()
          }}
          className="shrink-0 rounded-pill bg-accent px-3.5 py-2 text-14 font-semibold text-white"
        >
          Install
        </button>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={hide}
          className="grid size-8 shrink-0 place-items-center rounded-pill bg-transparent text-fg-2"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    )
  }

  // iOS
  return (
    <div className={cn("flex flex-col border-b border-line bg-surface", className)}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon name="install_mobile" size={22} className="shrink-0 text-accent-text" filled />
        <p className="m-0 flex-1 text-14 leading-x135 font-semibold">
          Add to your home screen for the best experience
        </p>
        <button
          type="button"
          onClick={() => setIosOpen((v) => !v)}
          className="shrink-0 rounded-pill bg-accent px-3.5 py-2 text-14 font-semibold text-white"
        >
          How
        </button>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={hide}
          className="grid size-8 shrink-0 place-items-center rounded-pill bg-transparent text-fg-2"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      {iosOpen && (
        <div className="border-t border-line px-4 pt-3 pb-4">
          <IosSteps />
        </div>
      )}
    </div>
  )
}
