#!/usr/bin/env node
// shot.mjs — screenshot a running page (or a design export file) for visual comparison.
// Usage: node scripts/shot.mjs <url|design-file> <out.png> [width=390] [height=844] [theme=light]
//   url:         http://localhost:3000/staff
//   design file: docs/inputs/designs/Staff PWA.dc.html (opened from disk, defaults as exported)
// The dev server must already be running for URLs.
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { chromium } from "@playwright/test"

const [target, out, width = "390", height = "844", theme = "light"] = process.argv.slice(2)
if (!target || !out) {
  console.error("usage: node scripts/shot.mjs <url|design-file> <out.png> [width] [height] [theme]")
  process.exit(2)
}

const url = existsSync(target) ? pathToFileURL(resolve(target)).href : target
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  colorScheme: theme === "dark" ? "dark" : "light",
  // Exported designs follow the preference stored by the app; ours reads the same key.
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
await page.screenshot({ path: out, fullPage: false })
if (errors.length) console.error("page errors:", errors)
await browser.close()
