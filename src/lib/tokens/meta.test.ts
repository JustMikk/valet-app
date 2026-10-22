import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { COLOR_TOKENS } from "./meta"

const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8")

/** Custom properties declared in the first rule whose selector list starts with `selector`. */
function declarations(selector: string): Map<string, string> {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start))
  const vars = new Map<string, string>()
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim().toLowerCase())
  }
  return vars
}

const light = declarations(':root,\n[data-theme="light"]')
const dark = declarations('[data-theme="dark"] {')

describe("COLOR_TOKENS", () => {
  it("lists the 21 color tokens of the design system sheet", () => {
    expect(COLOR_TOKENS).toHaveLength(21)
  })

  it.each(COLOR_TOKENS)("$name matches tokens.css in light and dark", (token) => {
    expect(light.get(token.name)).toBe(token.light.toLowerCase())
    expect(dark.get(token.name)).toBe(token.dark.toLowerCase())
  })

  it("gives every token a role", () => {
    for (const token of COLOR_TOKENS) expect(token.role.length).toBeGreaterThan(0)
  })
})
