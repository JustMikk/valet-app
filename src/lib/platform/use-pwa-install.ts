"use client"

// PWA install prompt abstraction (platform layer). Android/Chrome fires beforeinstallprompt;
// iOS/Safari has no event — we detect it by UA and standalone mode.
import { useEffect, useState } from "react"

export type InstallState =
  { kind: "android"; prompt: () => Promise<void> } | { kind: "ios" } | { kind: "none" }

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  )
}

/**
 * Tracks whether the app can be installed and provides the prompt trigger.
 * Returns `kind: "none"` when already installed or not installable.
 */
export function usePwaInstall(): InstallState {
  // Lazy initializer: iOS is knowable synchronously at mount, no effect needed.
  const [state, setState] = useState<InstallState>(() => {
    if (typeof window === "undefined") return { kind: "none" }
    if (isInStandalone()) return { kind: "none" }
    if (isIos()) return { kind: "ios" }
    return { kind: "none" }
  })

  useEffect(() => {
    if (isInStandalone() || isIos()) return

    const handler = (e: Event) => {
      e.preventDefault()
      const deferredPrompt = e as BeforeInstallPromptEvent
      setState({
        kind: "android",
        prompt: async () => {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          if (outcome === "accepted") setState({ kind: "none" })
        },
      })
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  return state
}

// The browser fires this event but it's not in the lib.dom types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt(): void
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}
