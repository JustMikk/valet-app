#!/usr/bin/env node
// build-icon-font.mjs — downloads a Material Symbols Rounded font subset to exactly the names in
// src/components/shared/icon-names.ts (ADR-007). The full font is 5.4 MB; the subset keeps
// ligatures, the FILL 0..1 / wght 400..700 / opsz 20..48 axes and GRAD 0, which is what the
// design export requests from Google Fonts. Output is committed so builds stay offline.
// Usage: pnpm icons:build
import { readFileSync, writeFileSync } from "node:fs"

const NAMES_FILE = "src/components/shared/icon-names.ts"
const FONT_OUT = "src/fonts/material-symbols-rounded.woff2"
const MANIFEST_OUT = "src/fonts/material-symbols-rounded.json"
// Google Fonts serves woff2 only to browsers it recognises.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

const source = readFileSync(NAMES_FILE, "utf8")
const block = source.slice(source.indexOf("["), source.indexOf("] as const"))
const names = [...block.matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]).sort()
if (names.length === 0) {
  console.error("icons: no names found in " + NAMES_FILE)
  process.exit(2)
}

const css = await fetch(
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..700,0..1,0" +
    `&icon_names=${names.join(",")}&display=block`,
  { headers: { "user-agent": USER_AGENT } },
).then((r) => {
  if (!r.ok) throw new Error(`Google Fonts CSS request failed: ${r.status}`)
  return r.text()
})
const url = /src:\s*url\(([^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1]
if (!url) {
  console.error("icons: no woff2 URL in Google Fonts response")
  process.exit(2)
}
const font = Buffer.from(await (await fetch(url)).arrayBuffer())
writeFileSync(FONT_OUT, font)
writeFileSync(MANIFEST_OUT, JSON.stringify({ names }, null, 2) + "\n")
console.log(`icons: ${names.length} glyphs, ${(font.length / 1024).toFixed(1)} KiB → ${FONT_OUT}`)
