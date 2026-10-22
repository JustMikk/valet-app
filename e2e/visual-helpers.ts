import type { Page } from "@playwright/test"

export type Box = { x: number; y: number; width: number; height: number }

/**
 * Bounding box of an element matching `selector` whose normalised text ends with `text`, inside
 * the horizontal band [minX, maxX): the smallest such element, or the first in document order
 * when a label repeats. The design export has no ids or roles, so both pages are measured by
 * their shared copy.
 */
export async function boxByText(
  page: Page,
  selector: string,
  text: string,
  band: { minX: number; maxX: number },
  pick: "smallest" | "first" = "smallest",
): Promise<Box | null> {
  return page.evaluate(
    ({ selector, text, band, pick }) => {
      const candidates = [...document.querySelectorAll<HTMLElement>(selector)]
        .filter((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim().endsWith(text))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.x >= band.minX && r.x < band.maxX)
      if (pick === "smallest") candidates.sort((a, b) => a.width * a.height - b.width * b.height)
      const r = candidates[0]
      return r ? { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height } : null
    },
    { selector, text, band, pick },
  )
}

/** Box of the section that contains the h2 starting with `number` (e.g. "05"). */
export async function sectionBox(page: Page, number: string): Promise<Box> {
  return page.evaluate((number) => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      (h.textContent ?? "").trim().startsWith(number),
    )
    const section = heading?.parentElement
    if (!section) throw new Error(`section ${number} not found`)
    const r = section.getBoundingClientRect()
    return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }
  }, number)
}

/** Waits for fonts and the export's runtime to settle before measuring. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load")
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
}
