import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { THEME_STORAGE_KEY } from "./theme"
import { useThemeMode } from "./use-theme-mode"

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("useThemeMode", () => {
  it("starts from the stored preference", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    const { result } = renderHook(() => useThemeMode())
    expect(result.current.preference).toBe("dark")
  })

  it("persists, applies and re-renders on change", () => {
    const { result } = renderHook(() => useThemeMode())
    act(() => result.current.setPreference("dark"))
    expect(result.current.preference).toBe("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.dataset.theme).toBe("dark")
  })

  it("keeps the choice for the session when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    const { result } = renderHook(() => useThemeMode())
    act(() => result.current.setPreference("light"))
    expect(result.current.preference).toBe("light")
    expect(document.documentElement.dataset.theme).toBe("light")
  })
})
