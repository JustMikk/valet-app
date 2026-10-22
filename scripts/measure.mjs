#!/usr/bin/env node
// measure.mjs — print bounding boxes of elements by exact visible text, in two pages, to find
// pixel differences between the app and the design export.
// Usage: node scripts/measure.mjs <ourUrl> <designUrl> <width> <height> "Text A" "Text B" ...
//        A text prefixed with "^" measures the parent of the element holding that text ("^^" the
//        grandparent), which is how a box (bubble, row, card) is found by its label.
//        [--click-design=Label] [--click-ours=Label]
import { chromium } from "@playwright/test"

const args = process.argv.slice(2)
const flag = (name) =>
  args.filter((a) => a.startsWith(`--${name}=`)).map((a) => a.slice(name.length + 3))
const [oursUrl, designUrl, width, height, ...rest] = args.filter((a) => !a.startsWith("--"))
const texts = rest

const browser = await chromium.launch()
const read = async (url, clicks) => {
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } })
  await page.goto(url, { waitUntil: "load" })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  for (const label of clicks) {
    if (label.startsWith("wait:")) {
      await page.waitForTimeout(Number(label.slice(5)))
      continue
    }
    const byText = page.getByText(label, { exact: true }).first()
    await (
      (await byText.count()) ? byText : page.getByLabel(label, { exact: true }).first()
    ).click()
    await page.waitForTimeout(900)
  }
  const out = {}
  for (const text of texts) {
    out[text] = await page.evaluate((raw) => {
      let up = 0
      while (raw[up] === "^") up++
      const t = raw.slice(up)
      let el = [...document.querySelectorAll("body *")].find(
        (e) => e.children.length === 0 && e.textContent?.trim() === t,
      )
      for (let i = 0; el && i < up; i++) el = el.parentElement
      if (!el) return null
      const r = el.getBoundingClientRect()
      return [
        Math.round(r.x * 10) / 10,
        Math.round((r.y + scrollY) * 10) / 10,
        Math.round(r.width * 10) / 10,
        Math.round(r.height * 10) / 10,
      ]
    }, text)
  }
  await page.close()
  return out
}
const ours = await read(oursUrl, flag("click-ours"))
const design = await read(designUrl, flag("click-design"))
for (const t of texts) {
  const o = ours[t],
    d = design[t]
  const delta = o && d ? o.map((v, i) => Math.round((v - d[i]) * 10) / 10) : "n/a"
  console.log(
    `${t.padEnd(36)} ours ${JSON.stringify(o)}  design ${JSON.stringify(d)}  Δ ${JSON.stringify(delta)}`,
  )
}
await browser.close()
