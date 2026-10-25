// Runs the Next.js CLI in server mode (demo API enabled): node scripts/next-server.mjs dev|build|start
// A tiny launcher instead of a cross-env dependency; `VALET_TARGET` is read by next.config.ts.
import { spawn } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const nextBin = require.resolve("next/dist/bin/next")

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, VALET_TARGET: "server" },
})

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal))
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
