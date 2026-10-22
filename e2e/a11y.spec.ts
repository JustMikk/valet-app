import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { ROUTES } from "./routes"

// CONSTRAINTS.md "Accessibility": zero critical or serious WCAG 2.1 AA violations,
// on every route, at every viewport project (phone, tablet, desktop).
for (const route of ROUTES) {
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
