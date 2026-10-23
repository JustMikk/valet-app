import { z } from "zod/mini"

import { SCENARIOS } from "@/server/demo/fixtures"
import { resetDemo } from "@/server/demo/reset"
import { demoEnabled } from "@/server/env"
import { notFound, readBody, route } from "@/server/http/handler"

const ResetRequest = z.object({ scenario: z.enum(SCENARIOS) })

/** Wipes and reseeds the demo database for a scenario. Only when DEMO_MODE=1. */
export const POST = route(async ({ req }) => {
  if (!demoEnabled()) throw notFound()
  const { scenario } = await readBody(req, ResetRequest)
  await resetDemo(scenario)
  return Response.json({ ok: true, scenario })
})
