import { z } from "zod/mini"

import { demoEnabled } from "@/server/env"
import { notFound, readBody, readId, staffRoute } from "@/server/http/handler"
import { approvePunch } from "@/server/staff/clock"

const ApproveRequest = z.object({ punchId: z.string() })

/** Stands in for dispatch approving the caller's pending clock-in request. Only when DEMO_MODE=1. */
export const POST = staffRoute(async ({ req, staffId }) => {
  if (!demoEnabled()) throw notFound()
  const { punchId } = await readBody(req, ApproveRequest)
  return Response.json({ approved: await approvePunch(staffId, readId(punchId)) })
})
