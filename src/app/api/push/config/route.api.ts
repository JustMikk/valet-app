import { PushConfigDto } from "@/lib/data/push-schemas"
import { ok, route } from "@/server/http/handler"
import { vapidPublicKey } from "@/server/notify/push"

/** Public: the key is meant to be seen. `null` means push is not configured on this server. */
export const GET = route(async () => ok(PushConfigDto, { publicKey: vapidPublicKey() }))
