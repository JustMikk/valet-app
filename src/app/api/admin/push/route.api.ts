import { PushSubscribeRequest, PushUnsubscribeRequest } from "@/lib/data/push-schemas"
import { readBody, adminRoute } from "@/server/http/handler"
import { removeSubscription, saveSubscription } from "@/server/notify/subscriptions"

export const POST = adminRoute(async ({ req, adminId }) => {
  await saveSubscription("admin", adminId, await readBody(req, PushSubscribeRequest))
  return Response.json({ ok: true })
})

export const DELETE = adminRoute(async ({ req, adminId }) => {
  const { endpoint } = await readBody(req, PushUnsubscribeRequest)
  await removeSubscription("admin", adminId, endpoint)
  return Response.json({ ok: true })
})
