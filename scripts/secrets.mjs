#!/usr/bin/env node
// secrets.mjs — CONSTRAINTS.md "Secrets" for the edit loop and pre-commit.
// Scans exactly what could be committed: staged changes, unstaged changes to tracked files, and
// untracked files that git does not ignore. `gitleaks git --pre-commit` alone misses the first and
// the last. Values are always redacted.
// Exit codes: 0 clean, 1 leak found, 2 could not run.
import { execFileSync, spawnSync } from "node:child_process"
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

const BASE = ["--redact", "--no-banner", "--log-level", "warn"]

const run = (args) => {
  const r = spawnSync("gitleaks", args, { stdio: "inherit" })
  if (r.error) {
    console.error("secrets: could not run gitleaks — " + r.error.message)
    process.exit(2)
  }
  return r.status ?? 2
}

let status = 0
const record = (code) => {
  if (code === 1) status = 1
  else if (code !== 0) {
    console.error("secrets: gitleaks exited with " + code)
    process.exit(2)
  }
}

record(run(["git", "--pre-commit", "--staged", ...BASE]))
record(run(["git", "--pre-commit", ...BASE]))

const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
if (untracked.length) {
  const dir = mkdtempSync(join(tmpdir(), "secrets-"))
  try {
    for (const file of untracked) {
      mkdirSync(join(dir, dirname(file)), { recursive: true })
      copyFileSync(file, join(dir, file))
    }
    record(run(["dir", dir, ...BASE]))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

console.log(status === 0 ? "secrets: clean" : "secrets: leak(s) found (values redacted)")
process.exit(status)
