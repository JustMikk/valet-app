"use client"

import { useEffect, useRef } from "react"

// Chime notes: two quick tones — a bright ding followed by a softer overtone.
const NOTES: Array<{ freq: number; startSec: number; durSec: number; gain: number }> = [
  { freq: 1046.5, startSec: 0.0, durSec: 0.18, gain: 0.38 }, // C6 — main ding
  { freq: 1318.5, startSec: 0.06, durSec: 0.22, gain: 0.22 }, // E6 — overtone
]

function playChime(ctx: AudioContext) {
  const now = ctx.currentTime
  for (const note of NOTES) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = note.freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = now + note.startSec
    gain.gain.setValueAtTime(note.gain, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + note.durSec)
    osc.start(t0)
    osc.stop(t0 + note.durSec + 0.01)
  }
}

/**
 * Plays a two-note chime whenever `unread` increases after the initial mount.
 * The AudioContext is created lazily on the first user gesture (browser autoplay rules).
 * Pass `unread` from useNotifications() in both the staff and admin shells.
 */
export function useNotificationChime(unread: number) {
  const ctxRef = useRef<AudioContext | null>(null)
  const prevRef = useRef<number | null>(null)
  const unlockedRef = useRef(false)

  // Unlock the AudioContext on the first user interaction (click, key, touch).
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return
      unlockedRef.current = true
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      } else if (ctxRef.current.state === "suspended") {
        void ctxRef.current.resume()
      }
    }
    window.addEventListener("pointerdown", unlock, { once: true, passive: true })
    window.addEventListener("keydown", unlock, { once: true, passive: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  useEffect(() => {
    // Skip the very first render — we don't want a chime on page load.
    if (prevRef.current === null) {
      prevRef.current = unread
      return
    }
    if (unread > prevRef.current && unlockedRef.current && ctxRef.current) {
      playChime(ctxRef.current)
    }
    prevRef.current = unread
  }, [unread])
}
