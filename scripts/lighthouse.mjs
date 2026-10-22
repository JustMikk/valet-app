#!/usr/bin/env node
// lighthouse.mjs — CONSTRAINTS.md "Performance: page".
// Serves the static export (out/) and runs Lighthouse with its default mobile profile
// (mid-range Android emulation, simulated slow 4G + 4x CPU throttling) on every route
// in ROUTES of e2e/routes.ts, gating on the median of 5 runs. Requires `pnpm build` first.
// Exit codes: 0 within budget, 1 over budget, 2 could not run.
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"

import lighthouse from "lighthouse"
import { chromium } from "@playwright/test"

import { readRoutes } from "./lib/routes.mjs"

const BUDGET = { lcpMs: 2500, cls: 0.1, tbtMs: 200 }
const PORT = 3200
const OUT = "out"

if (!existsSync(OUT)) {
  console.error("lighthouse: out/ missing; run `pnpm build` first")
  process.exit(2)
}
// User-facing routes only (ROUTES); dev reference routes (DEV_ROUTES) are outside the budget.
let routes
try {
  routes = readRoutes().ROUTES
} catch (e) {
  console.error("lighthouse: " + (e instanceof Error ? e.message : String(e)))
  process.exit(2)
}

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
}
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0])
  const candidates = [url, `${url}.html`, join(url, "index.html")]
  for (const c of candidates) {
    const file = normalize(join(OUT, c))
    if (file.startsWith(normalize(OUT)) && existsSync(file) && !file.endsWith(OUT)) {
      try {
        const body = readFileSync(file)
        res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" })
        return res.end(body)
      } catch {
        // A directory path: fall through to the next candidate.
        continue
      }
    }
  }
  res.writeHead(404).end()
})
await new Promise((r) => server.listen(PORT, r))

const DEBUG_PORT = 9223
// Playwright's bundled Chromium, exposed over CDP for Lighthouse (no extra launcher dependency).
const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] })
// Median of RUNS per route, as Lighthouse CI does: a single lab run swings with machine load.
const RUNS = 5
const median = (xs) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)]
let failed = false
try {
  for (const route of routes) {
    const samples = []
    for (let i = 0; i < RUNS; i++) {
      const result = await lighthouse(`http://localhost:${PORT}${route}`, {
        port: DEBUG_PORT,
        onlyCategories: ["performance"],
        output: "json",
        logLevel: "error",
      })
      const a = result?.lhr.audits
      if (!a) throw new Error("no Lighthouse result for " + route)
      samples.push({
        lcp: a["largest-contentful-paint"].numericValue,
        cls: a["cumulative-layout-shift"].numericValue,
        tbt: a["total-blocking-time"].numericValue,
      })
    }
    if (process.env.LIGHTHOUSE_VERBOSE) {
      console.log(
        `lighthouse: ${route} LCP samples: ${samples.map((s) => Math.round(s.lcp)).join(", ")}`,
      )
    }
    const lcp = median(samples.map((s) => s.lcp))
    const cls = median(samples.map((s) => s.cls))
    const tbt = median(samples.map((s) => s.tbt))
    const over = [
      lcp > BUDGET.lcpMs && `LCP ${Math.round(lcp)}ms > ${BUDGET.lcpMs}ms`,
      cls > BUDGET.cls && `CLS ${cls.toFixed(3)} > ${BUDGET.cls}`,
      tbt > BUDGET.tbtMs && `TBT ${Math.round(tbt)}ms > ${BUDGET.tbtMs}ms`,
    ].filter(Boolean)
    const line = `${route}: LCP ${Math.round(lcp)}ms · CLS ${cls.toFixed(3)} · TBT ${Math.round(tbt)}ms`
    if (over.length) {
      failed = true
      console.error(`lighthouse: ${line} — over budget: ${over.join(", ")}`)
    } else console.log(`lighthouse: ${line} — ok`)
  }
} catch (e) {
  console.error("lighthouse: could not run — " + (e instanceof Error ? e.message : String(e)))
  failed = null
} finally {
  await browser.close()
  server.close()
}
process.exit(failed === null ? 2 : failed ? 1 : 0)
