#!/usr/bin/env node
// shot.mjs — screenshot a running page (or a design export) for visual comparison.
// Usage: node scripts/shot.mjs <url|design-file> <out.png> [width=390] [height=844] [theme=light]
//                              [--click="Label" ...] [--full]
//   url:    http://localhost:3000/staff  (the dev server must already be running)
//   design: http://localhost:8765/Staff%20PWA.dc.html (the exported design served over HTTP;
//           a local static server on the designs folder is needed for its child pages to load)
//   --click clicks the element with that exact text, in order, to reach other screens of the
//   design (or of the app); --full captures the whole scroll height of the document.
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { chromium } from "@playwright/test"

const args = process.argv.slice(2)
const clicks = args
  .filter((a) => a.startsWith("--click="))
  .map((a) => a.slice(8).replace(/^"|"$/g, ""))
const full = args.includes("--full")
const [target, out, width = "390", height = "844", theme = "light"] = args.filter(
  (a) => !a.startsWith("--"),
)
if (!target || !out) {
  console.error(
    "usage: node scripts/shot.mjs <url|file> <out.png> [width] [height] [theme] [--click=Label]",
  )
  process.exit(2)
}

const url = existsSync(target) ? pathToFileURL(resolve(target)).href : target
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  colorScheme: theme === "dark" ? "dark" : "light",
})
await context.addInitScript((t) => {
  try {
    localStorage.setItem("vw-theme", t)
  } catch {
    // storage unavailable: the page falls back to the system scheme
  }
}, theme)
const page = await context.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
await page.goto(url, { waitUntil: "load" })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1200)
for (const label of clicks) {
  // "wait:2500" pauses (ms); anything else is clicked by exact text, then by ARIA label.
  if (label.startsWith("wait:")) {
    await page.waitForTimeout(Number(label.slice(5)))
    continue
  }
  const byText = page.getByText(label, { exact: true }).first()
  await ((await byText.count()) ? byText : page.getByLabel(label, { exact: true }).first()).click()
  await page.waitForTimeout(900)
}
await page.screenshot({ path: out, fullPage: full })
if (errors.length) console.error("page errors:", errors)
await browser.close()
