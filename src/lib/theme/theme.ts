import { z } from "zod"

import type { ThemeMode } from "@/lib/tenant"

export const ThemePreference = z.enum(["light", "dark", "system"])
export type ThemePreference = z.infer<typeof ThemePreference>

export const THEME_STORAGE_KEY = "vw-theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ThemeMode {
  if (preference === "system") return systemDark ? "dark" : "light"
  return preference
}

/** Stored preference, or "system" when storage is empty, invalid or unavailable. */
export function readThemePreference(): ThemePreference {
  try {
    return ThemePreference.catch("system").parse(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return "system"
  }
}

/** Persists the preference; returns false when storage is unavailable (the choice still applies). */
export function writeThemePreference(preference: ThemePreference): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
    return true
  } catch {
    return false
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
}

/**
 * Inline script that sets data-theme on <html> before first paint, so a static page never
 * flashes the wrong theme. Mirrors readThemePreference + resolveTheme; keep them in sync.
 */
export const themeScript = `(function(){var p=null;try{p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){p=null}var d=p==="dark"||(p!=="light"&&window.matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches);document.documentElement.dataset.theme=d?"dark":"light"})()`
