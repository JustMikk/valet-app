import { staffRoute } from "@/server/http/handler"
import { completeOnboarding } from "@/server/staff/profile"

export const POST = staffRoute(async ({ staffId }) => {
  await completeOnboarding(staffId)
  return Response.json({ ok: true })
})
