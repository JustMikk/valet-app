import { route } from "@/server/http/handler"
import { smsConfig } from "@/server/sms/config"
import { applyStatus, callbackIsFromTwilio, statusUpdate } from "@/server/sms/status"

/** Twilio status callback (form-encoded). 403 unless signed by Twilio for this URL; else 204. */
export const POST = route(async ({ req }) => {
  const params = Object.fromEntries(new URLSearchParams(await req.text()))
  if (!callbackIsFromTwilio(smsConfig(), params, req.headers.get("x-twilio-signature"))) {
    return new Response(null, { status: 403 })
  }
  const update = statusUpdate(params)
  if (update) await applyStatus(update)
  return new Response(null, { status: 204 })
})
