#!/usr/bin/env node
// route-js-size.mjs — CONSTRAINTS.md "Performance: bundle". Gzipped client JS that each
// user-facing route actually loads (the chunks its exported HTML references), against the
// per-route budgets in route-budgets.json. Requires `pnpm build` first.
// Exit codes: 0 within budget, 1 over budget, 2 could not run.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const OUT = "out"
const budgets = JSON.parse(readFileSync("route-budgets.json", "utf8"))

if (!existsSync(OUT)) {
  console.error("route-js-size: out/ missing; run `pnpm build` first")
  process.exit(2)
}

const htmlFor = (route) => join(OUT, route === "/" ? "index.html" : `${route.slice(1)}.html`)
let failed = false
for (const [route, budgetKb] of Object.entries(budgets)) {
  const file = htmlFor(route)
  if (!existsSync(file)) {
    console.error(`route-js-size: ${route} has no exported page (${file})`)
    process.exit(2)
  }
  const chunks = [
    ...new Set(readFileSync(file, "utf8").match(/\/_next\/static\/chunks\/[^"']+\.js/g) ?? []),
  ]
  const bytes = chunks.reduce((sum, c) => sum + gzipSync(readFileSync(join(OUT, c))).length, 0)
  const kb = bytes / 1000
  const line = `${route}: ${kb.toFixed(1)} kB gzipped JS in ${chunks.length} chunks (budget ${budgetKb} kB)`
  if (kb > budgetKb) {
    failed = true
    console.error(`route-js-size: ${line} — over budget`)
  } else console.log(`route-js-size: ${line} — ok`)
}
process.exit(failed ? 1 : 0)
