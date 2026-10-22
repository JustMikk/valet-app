import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Vitest globals are off, so Testing Library cannot register its auto-cleanup.
afterEach(cleanup)

// jsdom has no matchMedia. Default: no media query matches (phone width, light scheme).
// Tests that depend on a width or scheme stub their own (vi.stubGlobal("matchMedia", …)).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
