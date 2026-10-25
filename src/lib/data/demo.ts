// Demo-only control: reseed the database for a scenario (POST /api/demo/reset, DEMO_MODE=1).
import { z } from "zod/mini"

import { api } from "./api-client"

export type DemoScenario = "before" | "due" | "onshift"

export async function resetDemoData(scenario: DemoScenario): Promise<void> {
  await api("demo/reset", z.object({ ok: z.boolean() }), {
    method: "POST",
    body: { scenario },
    auth: false,
  })
}
