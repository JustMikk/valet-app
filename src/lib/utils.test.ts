import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { DESIGN_SCALES, cn } from "./utils"

describe("cn", () => {
  it("merges conflicting Tailwind utilities, last one wins", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b")
  })

  it.each([
    // [input, expected]
    ["text-17 text-fg", "text-17 text-fg"],
    ["text-accent-ink text-15", "text-accent-ink text-15"],
    ["text-17 text-18", "text-18"],
    ["text-fg text-fg-2", "text-fg-2"],
    ["rounded-r22 rounded-card", "rounded-card"],
    ["rounded-pill rounded-r10", "rounded-r10"],
    ["leading-x105 leading-x110", "leading-x110"],
    ["tracking-n035 tracking-n020", "tracking-n020"],
    ["shadow-float shadow-card-line", "shadow-card-line"],
    ["font-display font-sans", "font-sans"],
    ["animate-rise animate-shine", "animate-shine"],
  ])("resolves design-token classes: %s → %s", (input, expected) => {
    expect(cn(...input.split(" "))).toBe(expected)
  })
})

describe("DESIGN_SCALES", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
  const themeKeys = (prefix: string) =>
    [...css.matchAll(new RegExp(`^\\s*--${prefix}-([\\w-]+):`, "gm"))]
      .map((m) => m[1])
      .filter((k) => !k.includes("--"))

  it.each([
    ["text", DESIGN_SCALES.text],
    ["leading", DESIGN_SCALES.leading],
    ["tracking", DESIGN_SCALES.tracking],
    ["radius", DESIGN_SCALES.radius],
    ["shadow", DESIGN_SCALES.shadow],
    ["animate", DESIGN_SCALES.animate],
  ])("lists every --%s-* key defined in globals.css", (prefix, scale) => {
    const defined = themeKeys(prefix).filter((k) => !/^(sm|md|lg|xl|[234]xl)$/.test(k))
    expect([...scale].sort()).toEqual(defined.sort())
  })
})
