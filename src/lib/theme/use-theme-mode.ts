"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  systemPrefersDark,
  writeThemePreference,
  type ThemePreference,
} from "./theme"

const DARK_QUERY = "(prefers-color-scheme: dark)"
const listeners = new Set<() => void>()
// Keeps the choice for this session when storage is unavailable.
let sessionPreference: ThemePreference | null = null

const getSnapshot = (): ThemePreference => sessionPreference ?? readThemePreference()
const getServerSnapshot = (): ThemePreference => "system"

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (getSnapshot() === "system") applyTheme(resolveTheme("system", media.matches))
    onChange()
  }
  media.addEventListener("change", onSystemChange)
  window.addEventListener("storage", onChange)
  return () => {
    listeners.delete(onChange)
    media.removeEventListener("change", onSystemChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Current theme preference and a setter that persists it and applies it to <html>. */
export function useThemeMode() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setPreference = useCallback((next: ThemePreference) => {
    sessionPreference = writeThemePreference(next) ? null : next
    applyTheme(resolveTheme(next, systemPrefersDark()))
    listeners.forEach((listener) => listener())
  }, [])

  return { preference, setPreference }
}
