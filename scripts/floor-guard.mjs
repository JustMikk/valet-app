#!/usr/bin/env node
// floor-guard.mjs — diff-scoped enforcement of the CONSTRAINTS.md floor.
// Adapted from the agent-skills constraint-driven-development reference (floor-guard.md).
// Usage: node scripts/floor-guard.mjs [--base <ref>] [--warn-bar-change]
// Code findings (suppressions, stubs, skips, removed tests/assertions) always block.
// Bar changes (new exceptions, removed or loosened thresholds) block unless --warn-bar-change,
// which the pre-commit hook passes so the owner can review them in the PR. CI passes it only
// when the owner has labelled the PR "constraints-change-approved".
// Default base: origin/main if it exists, else main. On main itself the guard checks
// uncommitted work against HEAD.
// Exit codes: 0 clean, 1 floor violation, 2 the guard could not run.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

const git = (args, { diffExit = false } = {}) => {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      // Large diffs (added design exports, lockfiles) overflow the 1 MB default.
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (e) {
    return diffExit && e.status === 1 && typeof e.stdout === "string" ? e.stdout : null
  }
}
const bail = (msg) => {
  console.error("floor-guard: " + msg)
  process.exit(2)
}

const top = git(["rev-parse", "--show-toplevel"])?.trim()
if (!top) bail("not inside a git work tree")
process.chdir(top)

const base = (() => {
  const i = process.argv.indexOf("--base")
  if (i > -1) return process.argv[i + 1]
  return git(["rev-parse", "--verify", "--quiet", "origin/main"]) ? "origin/main" : "main"
})()

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"])?.trim()
const mergeBase =
  branch === base ? git(["rev-parse", "HEAD"])?.trim() : git(["merge-base", base, "HEAD"])?.trim()
if (!mergeBase) bail("no merge base against " + base)

// .constraintsignore: one path prefix per line; "#" starts a comment.
const ignored = existsSync(".constraintsignore")
  ? readFileSync(".constraintsignore", "utf8")
      .split("\n")
      .map((l) => l.replace(/#.*/, "").trim())
      .filter(Boolean)
  : []
const isIgnored = (f) => ignored.some((p) => f === p || f.startsWith(p.endsWith("/") ? p : p + "/"))

const tracked = git(["diff", "--unified=0", mergeBase, "--"])
if (tracked === null) bail("could not diff against " + mergeBase)
const untrackedFiles = git(["ls-files", "--others", "--exclude-standard"])
if (untrackedFiles === null) bail("could not list untracked files")
const untracked = untrackedFiles
  .split("\n")
  .filter((f) => f && !isIgnored(f))
  .map((f) => {
    const d = git(["diff", "--no-index", "--unified=0", "/dev/null", f], { diffExit: true })
    if (d === null) bail("could not diff untracked file " + f)
    return d
  })
  .join("\n")
const diff = tracked + "\n" + untracked

const added = [],
  removed = [],
  deleted = []
const pathOf = (s) => s.replace(/^[ab]\//, "")
let file = "",
  oldFile = "",
  inHeader = false
for (const line of diff.split("\n")) {
  if (line.startsWith("diff ")) inHeader = true
  else if (line.startsWith("@@")) inHeader = false
  else if (inHeader) {
    if (line.startsWith("--- ")) oldFile = pathOf(line.slice(4))
    else if (line.startsWith("+++ ")) {
      const newFile = pathOf(line.slice(4))
      file = newFile === "/dev/null" ? oldFile : newFile
      if (newFile === "/dev/null") deleted.push(file)
    }
  } else if (isIgnored(file) || file === "scripts/floor-guard.mjs") continue
  else if (line.startsWith("+")) added.push({ file, text: line.slice(1) })
  else if (line.startsWith("-")) removed.push({ file, text: line.slice(1) })
}

const findings = []
const flag = (rule, f, text) => findings.push({ rule, file: f, text: text.trim().slice(0, 120) })
const isTest = (f) => /\.(test|spec)\.|_test\.|test_/.test(f)
const isConstraints = (f) => /CONSTRAINTS\.md$/.test(f)
// Suppression/stub/skip patterns apply to code; docs may name them (CONSTRAINTS.md does).
const isCode = (f) => /\.(m|c)?[jt]sx?$|\.css$/.test(f)

const SUPPRESSIONS =
  /@ts-ignore|@ts-nocheck|eslint-disable|biome-ignore|# *noqa|# *type: *ignore|istanbul ignore|v8 ignore|c8 ignore|nosemgrep|gitleaks:allow|Stryker disable/
const STUBS =
  /throw new (Error|NotImplemented).*[Nn]ot implemented|catch\s*\(\w*\)\s*\{\s*\}|catch\s*\{\s*\}|\bTODO\b|\bFIXME\b/
const SKIPS = /\.(skip|todo|fixme)\b|\bxit\(|\bxdescribe\(/

for (const { file, text } of added) {
  if (isCode(file)) {
    if (SUPPRESSIONS.test(text)) flag("silenced-checker", file, text)
    if (STUBS.test(text)) flag("unfinished-work", file, text)
    if (SKIPS.test(text)) flag("test-made-easier", file, text)
  }
  if (isConstraints(file) && /^\| *(W|E)\d+ *\|/.test(text)) flag("new-exception", file, text)
  // Exempting a path from the guard lowers the bar too: it must be loud.
  if (file === ".constraintsignore" && text.replace(/#.*/, "").trim())
    flag("new-exception", file, text)
}

for (const f of deleted) if (isTest(f)) flag("test-deleted", f, "file deleted")
// A test file must not end up with fewer assertion lines than it had. Rewording or strengthening
// an assertion removes one line and adds one, which is fine; deleting one is not. Counting net
// per file is deliberately shallow (a swap for a weaker assertion still passes): that is what
// review is for. Deleted files are caught by test-deleted above.
const ASSERTION = /\b(expect|assert|should)\b/
const assertionLines = (lines, file) =>
  lines.filter((l) => l.file === file && ASSERTION.test(l.text)).map((l) => l.text)
for (const file of new Set(removed.filter((l) => isTest(l.file)).map((l) => l.file))) {
  if (deleted.includes(file)) continue
  const gone = assertionLines(removed, file)
  const gained = assertionLines(added, file)
  if (gone.length > gained.length) {
    flag(
      "assertion-removed",
      file,
      `${gone.length - gained.length} fewer assertion line(s), e.g. ${gone[0]}`,
    )
  }
}

const ruleKey = (t) => {
  const s = t.trim()
  if (s.startsWith("|"))
    return (
      s
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)[0] ?? ""
    )
  if (/^[-*] /.test(s)) return s.slice(2).split(":")[0].trim()
  return null
}
const isException = (t) => /^\| *(W|E)\d+ *\|/.test(t.trim())
const MIN_BEFORE = /(>=|>|≥|at least|minimum|\bmin\b|no less than|not fall|not drop)\s*$/
const MAX_BEFORE =
  /(<=|<|≤|at most|maximum|\bmax\b|no more than|under|below|not grow|not exceed)\s*$/
const MIN_AFTER = /^\s*\S*\s*(or more|or higher|must not fall|must not drop)/
const MAX_AFTER = /^\s*\S*\s*(or less|or lower|must not grow|must not exceed)/
const thresholds = (t) => {
  const out = [],
    re = /\d+(?:\.\d+)?/g
  let m
  while ((m = re.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 24), m.index).toLowerCase()
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 40).toLowerCase()
    const dir =
      MIN_BEFORE.test(before) || MIN_AFTER.test(after)
        ? "min"
        : MAX_BEFORE.test(before) || MAX_AFTER.test(after)
          ? "max"
          : null
    out.push({ n: Number(m[0]), dir })
  }
  return out
}
const removedRules = removed.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null)
const addedRules = added.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null)
for (const r of removedRules) {
  const a = addedRules.find((x) => ruleKey(x.text) === ruleKey(r.text))
  if (!a) {
    if (!isException(r.text)) flag("rule-removed", r.file, r.text)
    continue
  }
  const before = thresholds(r.text),
    after = thresholds(a.text)
  let verdict = null
  for (const dir of ["min", "max", null]) {
    const was = before.filter((x) => x.dir === dir),
      now = after.filter((x) => x.dir === dir)
    was.forEach((b, i) => {
      const n = now[i]
      if (verdict) return
      if (!n) verdict = "threshold-removed"
      else if (n.n === b.n) return
      else if (dir === "min" ? n.n < b.n : dir === "max" ? n.n > b.n : true) {
        verdict = dir ? "threshold-loosened" : "threshold-changed"
      }
    })
  }
  if (verdict) flag(verdict, r.file, r.text + "  ->  " + a.text)
}

const BAR_RULES = new Set([
  "new-exception",
  "rule-removed",
  "threshold-removed",
  "threshold-loosened",
  "threshold-changed",
])
const warnBar = process.argv.includes("--warn-bar-change")
const blocking = findings.filter((f) => !(warnBar && BAR_RULES.has(f.rule)))
const warnings = findings.filter((f) => warnBar && BAR_RULES.has(f.rule))

if (warnings.length) {
  console.warn("floor-guard: " + warnings.length + " bar change(s) need owner approval in review:")
  for (const f of warnings) console.warn(`  [${f.rule}] ${f.file}: ${f.text}`)
}
if (blocking.length === 0) {
  console.log("floor-guard: " + (warnings.length ? "no blocking violations" : "clean"))
  process.exit(0)
}
console.error("floor-guard: " + blocking.length + " floor violation(s):")
for (const f of blocking) console.error(`  [${f.rule}] ${f.file}: ${f.text}`)
if (blocking.some((f) => f.rule === "rule-removed")) {
  console.error(
    "\nA rule-removed finding can also mean the rule's label changed: rename a rule in one commit and change its thresholds in another.",
  )
}
console.error(
  "\nEach is a move that lowers the bar. Fix the code, or route it through a tracked exception.",
)
process.exit(1)
