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
// every stop of each route and requires that focusing an element changes how it is drawn: its
// outline or box-shadow must differ from the same element blurred (a resting shadow alone, as on
// glass chrome, does not count).
const MAX_STOPS = 300

for (const route of CHECKED) {
  test(`keyboard focus is visible on ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" })

    // Reads the focused element's look, blurs it, reads again, then restores focus.
    const probe = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const look = () => {
          const s = getComputedStyle(el)
          return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow].join("|")
        }
        const focused = look()
        el.blur()
        const resting = look()
        el.focus()
        return {
          name: `${el.tagName.toLowerCase()} ${(el.textContent ?? "").trim().slice(0, 30)}`,
          focused,
          resting,
        }
      })

    let stops = 0
    for (; stops < MAX_STOPS; stops++) {
      await page.keyboard.press("Tab")
      const result = await probe()
      if (!result) break // focus left the page content: the Tab cycle is complete
      expect(result.focused, `focus indicator on ${result.name}`).not.toBe(result.resting)
    }
    test.info().annotations.push({ type: "keyboard stops", description: String(stops) })
    // The showcase renders every control, so it must be reachable; a product route with no
    // controls yet (the placeholder root) legitimately has none.
    if ((DEV_ROUTES as readonly string[]).includes(route)) {
      expect(stops, "found keyboard stops").toBeGreaterThan(40)
    }
    expect(stops, "Tab cycle did not complete").toBeLessThan(MAX_STOPS)
  })
}
