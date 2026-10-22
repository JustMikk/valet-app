import { describe, expect, it } from "vitest"

import {
  ACCENT_OPTIONS,
  ACCENT_SWATCHES,
  DEFAULT_ACCENT,
  deriveAccentVars,
  tenantThemeCss,
} from "./accent"
import { contrastRatio, deltaEOk, parseHex } from "./color"

describe("deriveAccentVars", () => {
  it("returns the exported Regency gold values exactly in light", () => {
    expect(deriveAccentVars(DEFAULT_ACCENT, "light")).toEqual({
      "--accent": "#C9A24A",
      "--accent-rgb": "201 162 74",
      "--accent-ink": "#1C1404",
      "--accent-soft": "#F7EFDA",
      "--accent-text": "#7F611A",
    })
  })

  it("uses the exported dark gold for the default accent in dark", () => {
    expect(deriveAccentVars(DEFAULT_ACCENT, "dark")).toEqual({
      "--accent": "#D9B661",
      "--accent-rgb": "217 182 97",
      "--accent-ink": "#1C1404",
      "--accent-soft": "#2B2415",
      "--accent-text": "#E6C77E",
    })
  })

  it("keeps a tenant accent's hex in both modes (D8)", () => {
    expect(deriveAccentVars("#8E1B2A", "light")["--accent"]).toBe("#8E1B2A")
    expect(deriveAccentVars("#8E1B2A", "dark")["--accent"]).toBe("#8E1B2A")
  })

  it("switches ink to white for dark accents (luminance below .55)", () => {
    expect(deriveAccentVars("#1F3A5F", "light")["--accent-ink"]).toBe("#FFFFFF")
    expect(deriveAccentVars("#C9A24A", "light")["--accent-ink"]).toBe("#1C1404")
  })

  it("accepts lowercase and normalises to uppercase", () => {
    expect(deriveAccentVars("#8e1b2a", "light")["--accent"]).toBe("#8E1B2A")
  })

  it("rejects anything that is not a 6-digit hex color", () => {
    expect(() => deriveAccentVars("red", "light")).toThrow()
    expect(() => deriveAccentVars("#FFF", "light")).toThrow()
  })

  it("derivation formula reproduces the exported gold soft/text within ΔE_ok < 2 (D7)", () => {
    for (const [mode, base, soft, text] of [
      ["light", "#C9A24A", "#F7EFDA", "#7F611A"],
      ["dark", "#D9B661", "#2B2415", "#E6C77E"],
    ] as const) {
      // A near-identical gold skips the exact-match shortcut and goes through the formula.
      const nudged = base.replace(/.$/, (d) => (d === "A" ? "B" : "A"))
      const vars = deriveAccentVars(nudged, mode)
      expect(deltaEOk(parseHex(vars["--accent-soft"]), parseHex(soft))).toBeLessThan(2)
      expect(deltaEOk(parseHex(vars["--accent-text"]), parseHex(text))).toBeLessThan(2)
    }
  })

  // Surfaces from tokens.css that body text can sit on (--bg, --elev, --surface).
  const SURFACES = {
    light: ["#FFFFFF", "#F4F4F2"],
    dark: ["#0A0A0B", "#18181A", "#1E1E21"],
  } as const

  it.each(ACCENT_SWATCHES)(
    "accent text on %s meets 4.5:1 on every surface and on its soft fill",
    (hex) => {
      for (const mode of ["light", "dark"] as const) {
        const vars = deriveAccentVars(hex, mode)
        const text = parseHex(vars["--accent-text"])
        for (const surface of SURFACES[mode]) {
          const ratio = contrastRatio(text, parseHex(surface))
          expect(ratio, `${mode} text on ${surface}`).toBeGreaterThanOrEqual(4.5)
        }
        const onSoft = contrastRatio(text, parseHex(vars["--accent-soft"]))
        expect(onSoft, `${mode} text on soft`).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it("names every swatch for assistive tech", () => {
    expect(ACCENT_OPTIONS.map((o) => o.name)).toEqual([
      "Regency gold",
      "Burgundy",
      "Navy",
      "Forest green",
    ])
    expect(ACCENT_OPTIONS.map((o) => o.hex)).toEqual([...ACCENT_SWATCHES])
  })

  it.each(ACCENT_SWATCHES)("ink on %s meets 4.5:1 on the accent fill", (hex) => {
    for (const mode of ["light", "dark"] as const) {
      const vars = deriveAccentVars(hex, mode)
      const ratio = contrastRatio(parseHex(vars["--accent-ink"]), parseHex(vars["--accent"]))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("tenantThemeCss", () => {
  it("scopes light and dark variables to the theme selectors", () => {
    const css = tenantThemeCss("#1F3A5F")
    expect(css).toContain(':root,[data-theme="light"]{--accent:#1F3A5F;')
    expect(css).toContain('[data-theme="dark"]{--accent:#1F3A5F;')
  })
})
