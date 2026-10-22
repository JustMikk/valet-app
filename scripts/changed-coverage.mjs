#!/usr/bin/env node
// changed-coverage.mjs — coverage of the lines this change touched (CONSTRAINTS.md).
// Reads coverage/lcov.info written by `vitest run --coverage` (no second test run) and
// intersects it with the added lines in src/ since the merge base.
// Usage: node scripts/changed-coverage.mjs [--min 80] [--base <ref>]
// Exit codes: 0 pass, 1 below the minimum, 2 could not run.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const min = Number(arg("--min", "80"))
const git = (args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  } catch {
    return null
  }
}
const bail = (msg) => {
  console.error("changed-coverage: " + msg)
  process.exit(2)
}

const top = git(["rev-parse", "--show-toplevel"])?.trim()
if (!top) bail("not inside a git work tree")
process.chdir(top)
if (!existsSync("coverage/lcov.info")) bail("coverage/lcov.info missing; run `pnpm test:coverage`")

const base = arg(
  "--base",
  git(["rev-parse", "--verify", "--quiet", "origin/main"]) ? "origin/main" : "main",
)
const branch = git(["rev-parse", "--abbrev-ref", "HEAD"])?.trim()
const mergeBase =
  branch === base ? git(["rev-parse", "HEAD"])?.trim() : git(["merge-base", base, "HEAD"])?.trim()
if (!mergeBase) bail("no merge base against " + base)

// Added lines per file (tracked changes + untracked files), limited to source under src/.
const changed = new Map()
const add = (file, line) => {
  if (!changed.has(file)) changed.set(file, new Set())
  changed.get(file).add(line)
}
const diff = git(["diff", "--unified=0", mergeBase, "--", "src"])
if (diff === null) bail("could not diff against " + mergeBase)
let file = ""
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ ")) file = line.slice(4).replace(/^b\//, "")
  const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line)
  if (hunk && file !== "/dev/null") {
    const start = Number(hunk[1])
    const count = hunk[2] === undefined ? 1 : Number(hunk[2])
    for (let n = start; n < start + count; n++) add(file, n)
  }
}
for (const f of (git(["ls-files", "--others", "--exclude-standard", "--", "src"]) ?? "")
  .split("\n")
  .filter(Boolean)) {
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((_, i) => add(f, i + 1))
}

// Line hits from lcov: SF:<path> ... DA:<line>,<hits> ... end_of_record
const hits = new Map()
let current = null
for (const raw of readFileSync("coverage/lcov.info", "utf8").split("\n")) {
  const line = raw.trim()
  if (line.startsWith("SF:")) {
    current = line.slice(3).replace(/\\/g, "/")
    const i = current.indexOf("src/")
    current = i > -1 ? current.slice(i) : current
    hits.set(current, new Map())
  } else if (line.startsWith("DA:") && current) {
    const [n, h] = line.slice(3).split(",").map(Number)
    hits.get(current).set(n, h)
  }
}

// Only lines lcov considers executable count; files lcov never saw are excluded by config.
let covered = 0,
  total = 0
const misses = []
for (const [f, lines] of changed) {
  const fileHits = hits.get(f)
  if (!fileHits) continue
  for (const n of lines) {
    if (!fileHits.has(n)) continue
    total++
    if (fileHits.get(n) > 0) covered++
    else misses.push(`${f}:${n}`)
  }
}

if (total === 0) {
  console.log("changed-coverage: no executable changed lines in src/")
  process.exit(0)
}
const pct = (covered / total) * 100
const verdict = `${pct.toFixed(1)}% of ${total} changed executable lines covered (min ${min}%)`
if (pct >= min) {
  console.log("changed-coverage: " + verdict)
  process.exit(0)
}
console.error("changed-coverage: " + verdict)
for (const m of misses.slice(0, 30)) console.error("  uncovered " + m)
process.exit(1)
