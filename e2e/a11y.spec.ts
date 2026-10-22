import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { DEV_ROUTES, ROUTES } from "./routes"

const CHECKED = [...ROUTES, ...DEV_ROUTES]

// CONSTRAINTS.md "Accessibility": zero critical or serious WCAG 2.1 AA violations,
// on every route, at every viewport project (phone, tablet, desktop).
for (const route of CHECKED) {
  test(`no critical or serious axe violations on ${route}`, async ({ page }) => {
    await page.goto(route)
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
    const blocking = violations.filter((v) => v.impact === "critical" || v.impact === "serious")
    expect(
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.helpUrl}`),
    ).toEqual([])
  })
}

// CONSTRAINTS.md "Accessibility": keyboard operable with visible focus (handoff §7). Tabs through
// the first controls of every route and checks each focused element draws an indicator.
for (const route of CHECKED) {
  test(`keyboard focus is visible on ${route}`, async ({ page }) => {
    await page.goto(route)
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab")
      const focus = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const style = getComputedStyle(el)
        return {
          name: `${el.tagName.toLowerCase()} ${(el.textContent ?? "").trim().slice(0, 30)}`,
          visible:
            (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) ||
            style.boxShadow !== "none",
        }
      })
      if (!focus) break
      expect(focus.visible, `focus indicator on ${focus.name}`).toBe(true)
    }
  })
}
