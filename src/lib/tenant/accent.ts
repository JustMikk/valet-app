// zod/mini: tree-shakable, so boundary checks on the critical path stay small (ADR-009).
import { z } from "zod/mini"

import { contrastRatio, fromOklch, parseHex, toHex, toOklch, type Oklch, type Rgb } from "./color"

export type ThemeMode = "light" | "dark"

export const AccentHex = z
  .string()
  .check(z.regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a #RRGGBB color"), z.toUpperCase())

/** Regency gold, the default tenant accent. */
export const DEFAULT_ACCENT = "#C9A24A"

/** Accent choices offered in tenant Settings (Admin Pages.dc.html; OPEN_QUESTIONS D3). */
export const ACCENT_SWATCHES = ["#C9A24A", "#8E1B2A", "#1F3A5F", "#2F5D46"] as const

export type AccentVars = {
  "--accent": string
  "--accent-rgb": string
  "--accent-ink": string
  "--accent-soft": string
  "--accent-text": string
}

// Exported values for the default gold, per mode. Also the reference the derivation is tuned on.
const GOLD = {
  light: { accent: "#C9A24A", soft: "#F7EFDA", text: "#7F611A", bg: "#FFFFFF" },
  dark: { accent: "#D9B661", soft: "#2B2415", text: "#E6C77E", bg: "#0A0A0B" },
} as const

const INK_DARK = "#1C1404"
const INK_LIGHT = "#FFFFFF"
const MIN_TEXT_CONTRAST = 4.5

/** Label color on an accent fill: the design export's luminance rule (Admin.dc.html). */
function inkFor({ r, g, b }: Rgb): string {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? INK_DARK : INK_LIGHT
}

/**
 * Re-creates a gold-derived color for another accent (D7): same lightness, chroma scaled by the
 * accent's chroma relative to gold, hue rotated by the same offset gold's variant has.
 */
function relativeTo(accent: Oklch, goldAccent: Oklch, goldVariant: Oklch): Oklch {
  const ratio = goldAccent.c === 0 ? 0 : goldVariant.c / goldAccent.c
  return { l: goldVariant.l, c: accent.c * ratio, h: accent.h + (goldVariant.h - goldAccent.h) }
}

/** Moves text lightness away from the backgrounds until it meets 4.5:1 on both. */
function ensureTextContrast(text: Oklch, backgrounds: Rgb[], mode: ThemeMode): Rgb {
  const step = mode === "light" ? -0.01 : 0.01
  let candidate = text
  for (let i = 0; i < 60; i++) {
    const rgb = fromOklch(candidate)
    if (backgrounds.every((bg) => contrastRatio(rgb, bg) >= MIN_TEXT_CONTRAST)) return rgb
    candidate = { ...candidate, l: Math.min(1, Math.max(0, candidate.l + step)) }
  }
  return fromOklch(candidate)
}

/** CSS variables for a tenant accent in one theme mode. Throws on an invalid hex. */
export function deriveAccentVars(input: string, mode: ThemeMode): AccentVars {
  const hex = AccentHex.parse(input)
  const gold = GOLD[mode]

  if (hex === DEFAULT_ACCENT) {
    const rgb = parseHex(gold.accent)
    return {
      "--accent": gold.accent,
      "--accent-rgb": `${rgb.r} ${rgb.g} ${rgb.b}`,
      "--accent-ink": inkFor(rgb),
      "--accent-soft": gold.soft,
      "--accent-text": gold.text,
    }
  }

  // Tenant accents use the same hex in light and dark (D8).
  const rgb = parseHex(hex)
  const accent = toOklch(rgb)
  const goldAccent = toOklch(parseHex(gold.accent))
  const soft = fromOklch(relativeTo(accent, goldAccent, toOklch(parseHex(gold.soft))))
  const text = ensureTextContrast(
    relativeTo(accent, goldAccent, toOklch(parseHex(gold.text))),
    [parseHex(gold.bg), soft],
    mode,
  )
  return {
    "--accent": hex,
    "--accent-rgb": `${rgb.r} ${rgb.g} ${rgb.b}`,
    "--accent-ink": inkFor(rgb),
    "--accent-soft": toHex(soft),
    "--accent-text": toHex(text),
  }
}

const declarations = (vars: AccentVars) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value};`)
    .join("")

/**
 * Stylesheet that overrides the accent tokens for both theme scopes. Light comes first so that
 * on a dark page the dark rule (same specificity, later) wins, as in tokens.css.
 */
export function tenantThemeCss(accent: string): string {
  return (
    `:root,[data-theme="light"]{${declarations(deriveAccentVars(accent, "light"))}}` +
    `[data-theme="dark"]{${declarations(deriveAccentVars(accent, "dark"))}}`
  )
}
