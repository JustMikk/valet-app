import { expect, test } from "@playwright/test"

test("static export serves the home route", async ({ page }) => {
  const response = await page.goto("/")
  expect(response?.ok()).toBe(true)
})
