// Route lists from e2e/routes.ts, shared by the budget scripts.
import { readFileSync } from "node:fs"

/** `{ ROUTES, DEV_ROUTES }` parsed from e2e/routes.ts. Throws when a list is missing. */
export function readRoutes(file = "e2e/routes.ts") {
  const source = readFileSync(file, "utf8")
  const list = (name) => {
    const match = new RegExp(String.raw`export const ${name} = \[([^\]]*)\]`).exec(source)
    if (!match) throw new Error(`${name} not found in ${file}`)
    return [...match[1].matchAll(/"(\/[^"]*)"/g)].map((m) => m[1])
  }
  return { ROUTES: list("ROUTES"), DEV_ROUTES: list("DEV_ROUTES") }
}
