// Server-only configuration, validated once (handoff §7: Zod at every boundary). Nothing outside
// src/server may import this (dependency-cruiser rule server-is-private).
import { z } from "zod/mini"

const Env = z.object({
  DATABASE_URL: z.string().check(z.minLength(1)),
  SESSION_SECRET: z.string().check(z.minLength(32)),
  /** "1" enables the demo shortcuts: /api/auth/demo and /api/demo/*. */
  DEMO_MODE: z.optional(z.string()),
  /** Seconds before dispatch "approves" a pending out-of-fence clock-in request in the demo. */
  DEMO_AUTO_APPROVE_SECS: z.optional(z.string()),
})
export type Env = z.infer<typeof Env>

let cached: Env | null = null

export function env(): Env {
  if (cached) return cached
  const parsed = Env.safeParse(process.env)
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")
    throw new Error(`Invalid server environment: ${names}. See .env.example.`)
  }
  cached = parsed.data
  return cached
}

export function demoEnabled(): boolean {
  return env().DEMO_MODE === "1"
}

export function autoApproveSecs(): number {
  const parsed = Number(env().DEMO_AUTO_APPROVE_SECS)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 10
}
