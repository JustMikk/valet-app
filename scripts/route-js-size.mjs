#!/usr/bin/env node
// route-js-size.mjs — CONSTRAINTS.md "Performance: bundle". Gzipped client JS that each
// user-facing route actually loads (the chunks its exported HTML references), against the
// per-route budgets in route-budgets.json. Requires `pnpm build` first.
// Exit codes: 0 within budget, 1 over budget, 2 could not run.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

import { readRoutes } from "./lib/routes.mjs"

const OUT = "out"
const budgets = JSON.parse(readFileSync("route-budgets.json", "utf8"))
const { ROUTES } = readRoutes()

// Every user-facing route needs a budget, and every budget a route: a new route must not slip
// through without a size gate, and a removed one must not leave a stale budget behind.
const missing = ROUTES.filter((route) => !(route in budgets))
const stale = Object.keys(budgets).filter((route) => !ROUTES.includes(route))
if (missing.length || stale.length) {
  if (missing.length) console.error(`route-js-size: no budget for ${missing.join(", ")}`)
  if (stale.length) console.error(`route-js-size: budget for unknown route ${stale.join(", ")}`)
  console.error("route-js-size: keep route-budgets.json in step with ROUTES in e2e/routes.ts")
  process.exit(2)
}

if (!existsSync(OUT)) {
  console.error("route-js-size: out/ missing; run `pnpm build` first")
  process.exit(2)
}

const htmlFor = (route) => join(OUT, route === "/" ? "index.html" : `${route.slice(1)}.html`)
let failed = false
for (const route of ROUTES) {
  const budgetKb = budgets[route]
  const file = htmlFor(route)
  if (!existsSync(file)) {
    console.error(`route-js-size: ${route} has no exported page (${file})`)
    process.exit(2)
  }
  const chunks = [
    ...new Set(readFileSync(file, "utf8").match(/\/_next\/static\/chunks\/[^"']+\.js/g) ?? []),
  ]
  if (chunks.length === 0) {
    // basePath or assetPrefix changes the chunk URLs; measuring 0 kB would pass silently.
    console.error(`route-js-size: no script chunks found in ${file}; check the chunk URL pattern`)
    process.exit(2)
  }
  const bytes = chunks.reduce((sum, c) => sum + gzipSync(readFileSync(join(OUT, c))).length, 0)
  const kb = bytes / 1000
  const line = `${route}: ${kb.toFixed(1)} kB gzipped JS in ${chunks.length} chunks (budget ${budgetKb} kB)`
  if (kb > budgetKb) {
    failed = true
    console.error(`route-js-size: ${line} — over budget`)
  } else console.log(`route-js-size: ${line} — ok`)
}
process.exit(failed ? 1 : 0)
