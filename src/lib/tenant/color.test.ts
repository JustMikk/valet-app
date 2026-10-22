import { describe, expect, it } from "vitest"

import {
  contrastRatio,
  deltaEOk,
  fromOklch,
  parseHex,
  relativeLuminance,
  toHex,
  toOklch,
} from "./color"

describe("color", () => {
  it("parses and formats hex", () => {
    expect(parseHex("#C9A24A")).toEqual({ r: 201, g: 162, b: 74 })
    expect(toHex({ r: 201, g: 162, b: 74 })).toBe("#C9A24A")
  })

  it("round-trips sRGB through OKLCH", () => {
    for (const hex of ["#C9A24A", "#8E1B2A", "#1F3A5F", "#2F5D46", "#FFFFFF", "#0B0B0B"]) {
      expect(toHex(fromOklch(toOklch(parseHex(hex))))).toBe(hex)
    }
  })

  it("computes WCAG relative luminance and contrast", () => {
    expect(relativeLuminance(parseHex("#FFFFFF"))).toBeCloseTo(1, 5)
    expect(relativeLuminance(parseHex("#000000"))).toBeCloseTo(0, 5)
    expect(contrastRatio(parseHex("#000000"), parseHex("#FFFFFF"))).toBeCloseTo(21, 5)
  })

  it("measures perceptual distance in OKLab (×100)", () => {
    expect(deltaEOk(parseHex("#C9A24A"), parseHex("#C9A24A"))).toBe(0)
    expect(deltaEOk(parseHex("#000000"), parseHex("#FFFFFF"))).toBeGreaterThan(99)
  })

  it("clamps out-of-gamut colors by reducing chroma", () => {
    const rgb = fromOklch({ l: 0.95, c: 0.4, h: 264 })
    for (const channel of [rgb.r, rgb.g, rgb.b]) {
      expect(channel).toBeGreaterThanOrEqual(0)
      expect(channel).toBeLessThanOrEqual(255)
    }
  })
})
