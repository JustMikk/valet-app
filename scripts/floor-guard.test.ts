import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

// The floor guard runs against a throwaway git repo: what it flags on a diff is its contract.
const GUARD = join(process.cwd(), "scripts/floor-guard.mjs")
let repo: string

const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "pipe" })

function write(files: Record<string, string>) {
  for (const [name, content] of Object.entries(files)) writeFileSync(join(repo, name), content)
}

function guard() {
  const result = spawnSync("node", [GUARD, "--base", "HEAD"], { cwd: repo, encoding: "utf8" })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

const TWO_ASSERTIONS = `it("works", () => {
  expect(add(1, 2)).toBe(3)
  expect(add(2, 2)).toBe(4)
})
`

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "guard-"))
  git("init", "-q")
  git("config", "user.email", "guard@test.local")
  git("config", "user.name", "guard")
  git("config", "commit.gpgsign", "false")
  mkdirSync(join(repo, "src"))
  write({ "src/add.test.ts": TWO_ASSERTIONS, "src/add.ts": "export const add = (a, b) => a + b\n" })
  git("add", "-A")
  git("commit", "-q", "-m", "base")
})

afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe("floor guard: assertions", () => {
  it("passes when an assertion is replaced by a stricter one", () => {
    write({
      "src/add.test.ts": `it("works", () => {
  expect(add(1, 2), "one plus two").toStrictEqual(3)
  expect(add(2, 2)).toBe(4)
})
`,
    })
    expect(guard().status).toBe(0)
  })

  it("passes when assertions are added", () => {
    write({
      "src/add.test.ts": `${TWO_ASSERTIONS}it("more", () => {\n  expect(add(0, 0)).toBe(0)\n})\n`,
    })
    expect(guard().status).toBe(0)
  })

  it("flags an assertion deleted without a replacement", () => {
    write({ "src/add.test.ts": `it("works", () => {\n  expect(add(1, 2)).toBe(3)\n})\n` })
    const { status, output } = guard()
    expect(status).toBe(1)
    expect(output).toContain("assertion-removed")
  })

  it("judges assertions by the net count in each file: a net gain passes, a net loss is flagged", () => {
    write({
      "src/add.test.ts": `it("works", () => {
  expect(add(1, 2)).toBe(3)
})
it("other", () => {
  expect(true).toBe(true)
})
it("third", () => {
  expect(add(5, 5)).toBe(10)
})
`,
    })
    // 2 removed (both original lines are reworded or gone), 3 added: net gain passes.
    expect(guard().status).toBe(0)
    write({ "src/add.test.ts": `it("works", () => {\n  expect(add(1, 2)).toBe(3)\n})\n` })
    expect(guard().status).toBe(1)
  })

  it("flags deleting a test file", () => {
    rmSync(join(repo, "src/add.test.ts"))
    const { status, output } = guard()
    expect(status).toBe(1)
    expect(output).toContain("test-deleted")
  })
})

describe("floor guard: suppressions", () => {
  it("flags a new suppression comment in code", () => {
    // Built at runtime so this file does not itself contain a suppression comment.
    const suppression = ["//", "@ts", "-ignore"].join(" ").replace("@ts -", "@ts-")
    write({ "src/add.ts": `${suppression}\nexport const add = (a, b) => a + b\n` })
    const { status, output } = guard()
    expect(status).toBe(1)
    expect(output).toContain("silenced-checker")
  })

  it("passes a clean change", () => {
    write({ "src/add.ts": "export const add = (a, b) => b + a\n" })
    expect(guard().status).toBe(0)
  })
})
