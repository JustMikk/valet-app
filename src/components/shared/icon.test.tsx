import { readFileSync } from "node:fs"
import { join } from "node:path"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Icon } from "./icon"
import { ICON_NAMES } from "./icon-names"

describe("Icon", () => {
  it("is hidden from assistive tech when decorative", () => {
    const { container } = render(<Icon name="verified" />)
    const glyph = container.firstElementChild
    expect(glyph).toHaveAttribute("aria-hidden", "true")
    expect(glyph).toHaveTextContent("verified")
  })

  it("is announced as an image when given a label", () => {
    render(<Icon name="notifications" label="Notifications" />)
    expect(screen.getByRole("img", { name: "Notifications" })).toBeInTheDocument()
  })

  it("sets size and the FILL / wght axes", () => {
    const { container } = render(<Icon name="flag" filled weight={600} size={18} />)
    const style = (container.firstElementChild as HTMLElement).style
    expect(style.fontSize).toBe("18px")
    expect(style.fontVariationSettings).toBe("'FILL' 1, 'wght' 600")
  })

  it("defaults to outline at weight 400", () => {
    const { container } = render(<Icon name="tune" />)
    const style = (container.firstElementChild as HTMLElement).style
    expect(style.fontVariationSettings).toBe("'FILL' 0, 'wght' 400")
  })
})

describe("icon font subset", () => {
  it("was built from the current ICON_NAMES (run `pnpm icons:build` after changing them)", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "src/fonts/material-symbols-rounded.json"), "utf8"),
    ) as { names: string[] }
    expect(manifest.names).toEqual([...ICON_NAMES].sort())
  })
})
