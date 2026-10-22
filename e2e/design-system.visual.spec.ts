import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { expect, test, type Page } from "@playwright/test"

import { boxByText, sectionBox, settle, type Box } from "./visual-helpers"

// Pixel comparison of /design-system against the design export (Phase 1, Task 17).
// Both pages are 1320 px canvases; section 05's light panel spans x 72–692 on both.
const DESIGN_URL = pathToFileURL(
  join(process.cwd(), "docs/inputs/designs/Design System.dc.html"),
).href
const REPORT_DIR = join(process.cwd(), "test-results", "design-system-visual")
const LIGHT_PANEL = { minX: 72, maxX: 692 }
const TOLERANCE_PX = 1

type Probe = {
  name: string
  selector: string
  text: string
  measure: ("height" | "width")[]
  /** Label repeats on the page: measure its first occurrence. */
  first?: boolean
  /** Different element on /design-system when the export uses a generic div. */
  oursSelector?: string
  /** Documented difference: the app screens win over the sheet (OPEN_QUESTIONS D1). */
  expectedDelta?: { height?: number; reason: string }
}

const PROBES: Probe[] = [
  { name: "top-bar pill", selector: "div", text: "Live Board", measure: ["height"] },
  { name: "accent button", selector: "button", text: "Clock in", measure: ["height", "width"] },
  { name: "strong button", selector: "button", text: "Approve", measure: ["height", "width"] },
  {
    name: "secondary button",
    selector: "button",
    text: "Message",
    measure: ["height"],
    first: true,
  },
  {
    name: "ghost button",
    selector: "button",
    text: "View rosterchevron_right",
    measure: ["height"],
  },
  { name: "destructive button", selector: "button", text: "Mark no-show", measure: ["height"] },
  // Chip width follows the label's glyph widths, which differ with the font substitution (D1).
  { name: "chip", selector: "span,button", text: "Today", measure: ["height"] },
  { name: "badge on site", selector: "span", text: "On site", measure: ["height"] },
  { name: "badge open slot", selector: "span", text: "Open slot", measure: ["height"] },
  { name: "list row", selector: "div", text: "Clock-in opens5:45 PM", measure: ["height"] },
  { name: "person row", selector: "div", text: "verified2h 12m", measure: ["height"] },
  { name: "assign button", selector: "span,button", text: "Assign", measure: ["height"] },
  { name: "attention action", selector: "span,button", text: "Call", measure: ["height"] },
  {
    name: "banner",
    selector: "div",
    text: "Offline · board last updated 6:02 PM",
    measure: ["height"],
  },
  {
    name: "tab bar",
    selector: 'div[style*="repeat(4"]',
    oursSelector: "nav",
    text: "groupStaff",
    measure: ["height"],
    expectedDelta: { height: -4, reason: "Staff PWA shell tab bar is 76 px; the sheet draws 80" },
  },
]

async function measure(page: Page, side: "design" | "ours") {
  const out: Record<string, Box | null> = {}
  for (const probe of PROBES) {
    out[probe.name] = await boxByText(
      page,
      side === "ours" ? (probe.oursSelector ?? probe.selector) : probe.selector,
      probe.text,
      LIGHT_PANEL,
      probe.first ? "first" : "smallest",
    )
  }
  return out
}

test.describe("design system vs Design System.dc.html", () => {
  test("component boxes match the design export", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1320, height: 900 } })
    const design = await context.newPage()
    await design.goto(DESIGN_URL)
    await settle(design)
    const ours = await context.newPage()
    await ours.goto("/design-system")
    await settle(ours)

    const [designBoxes, ourBoxes] = await Promise.all([
      measure(design, "design"),
      measure(ours, "ours"),
    ])
    const rows = PROBES.flatMap((probe) =>
      probe.measure.map((dim) => {
        const d = designBoxes[probe.name]?.[dim] ?? NaN
        const o = ourBoxes[probe.name]?.[dim] ?? NaN
        const allowed = dim === "height" ? (probe.expectedDelta?.height ?? 0) : 0
        return { probe: probe.name, dim, design: d, ours: o, delta: o - d, allowed }
      }),
    )

    mkdirSync(REPORT_DIR, { recursive: true })
    writeFileSync(join(REPORT_DIR, "measurements.json"), JSON.stringify(rows, null, 2))
    for (const number of ["01", "02", "03", "04", "05", "06"]) {
      for (const [label, page] of [
        ["design", design],
        ["ours", ours],
      ] as const) {
        const box = await sectionBox(page, number)
        await page.screenshot({
          path: join(REPORT_DIR, `section-${number}-${label}.png`),
          fullPage: true,
          clip: { x: box.x, y: box.y, width: box.width, height: box.height },
        })
      }
    }

    for (const row of rows) {
      expect(Number.isFinite(row.design), `${row.probe} found in the design`).toBe(true)
      expect(Number.isFinite(row.ours), `${row.probe} found on /design-system`).toBe(true)
      expect(
        Math.abs(row.delta - row.allowed),
        `${row.probe} ${row.dim}: design ${row.design} vs ours ${row.ours}`,
      ).toBeLessThanOrEqual(TOLERANCE_PX)
    }
    await context.close()
  })

  test("@visual sections match the committed baselines", async ({ page }) => {
    await page.setViewportSize({ width: 1320, height: 900 })
    await page.goto("/design-system")
    await settle(page)
    for (const number of ["01", "02", "03", "04", "05", "06"]) {
      const box = await sectionBox(page, number)
      await expect(page).toHaveScreenshot(`section-${number}.png`, {
        fullPage: true,
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
        maxDiffPixelRatio: 0.002,
      })
    }
  })
})
