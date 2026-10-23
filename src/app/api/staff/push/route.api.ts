import { PushSubscribeRequest, PushUnsubscribeRequest } from "@/lib/data/push-schemas"
import { readBody, staffRoute } from "@/server/http/handler"
import { removeSubscription, saveSubscription } from "@/server/notify/subscriptions"

export const POST = staffRoute(async ({ req, staffId }) => {
  await saveSubscription("staff", staffId, await readBody(req, PushSubscribeRequest))
  return Response.json({ ok: true })
})

export const DELETE = staffRoute(async ({ req, staffId }) => {
  const { endpoint } = await readBody(req, PushUnsubscribeRequest)
  await removeSubscription("staff", staffId, endpoint)
  return Response.json({ ok: true })
})
