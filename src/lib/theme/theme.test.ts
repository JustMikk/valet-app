import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  THEME_STORAGE_KEY,
  readThemePreference,
  resolveTheme,
  themeScript,
  writeThemePreference,
} from "./theme"

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("data-theme")
})
afterEach(() => vi.unstubAllGlobals())

describe("resolveTheme", () => {
  it("returns explicit preferences as-is and follows the system for 'system'", () => {
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
  })
})

describe("theme preference storage", () => {
  it("defaults to 'system' when nothing is stored", () => {
    expect(readThemePreference()).toBe("system")
  })

  it("round-trips a stored preference", () => {
    writeThemePreference("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(readThemePreference()).toBe("dark")
  })

  it("ignores an invalid stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple")
    expect(readThemePreference()).toBe("system")
  })

  it("falls back to 'system' when storage throws (private mode, blocked site data)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(readThemePreference()).toBe("system")
    vi.restoreAllMocks()
  })
})

describe("themeScript (runs before paint)", () => {
  const run = () => new Function(themeScript)()

  it("applies a stored dark preference", () => {
    mockSystemDark(false)
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    run()
    expect(document.documentElement.dataset.theme).toBe("dark")
  })

  it("follows the system when no preference is stored", () => {
    mockSystemDark(true)
    run()
    expect(document.documentElement.dataset.theme).toBe("dark")
  })

  it("lets an explicit light preference override a dark system", () => {
    mockSystemDark(true)
    localStorage.setItem(THEME_STORAGE_KEY, "light")
    run()
    expect(document.documentElement.dataset.theme).toBe("light")
  })
})
