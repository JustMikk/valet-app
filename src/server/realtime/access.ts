// Who may listen where (ADR-023): a staff member only on their own channel, an admin only on their
// tenant's admins channel. The server hands out the channel name and signs nothing else.
import type { RealtimeAuthRequest, RealtimeConfig } from "@/lib/data/realtime-schemas"

import { rows, sql } from "../db/client"
import { ApiError } from "../http/handler"
import { adminChannel, channelAuth, channelOwner, pusherKeys, staffChannel } from "./pusher"

type Who = { role: "staff" | "admin"; id: string }

async function channelFor(who: Who): Promise<string> {
  if (who.role === "staff") return staffChannel(who.id)
  const [admin] = await rows<{ tenant_id: string }>(
    sql()`select tenant_id from admins where id = ${who.id}`,
  )
  if (!admin) throw new ApiError(401, "unauthorized", "Sign in to continue.")
  return adminChannel(admin.tenant_id)
}

export async function realtimeConfig(who: Who): Promise<RealtimeConfig> {
  const keys = pusherKeys()
  if (!keys) return null
  return { key: keys.key, cluster: keys.cluster, channel: await channelFor(who) }
}

export async function realtimeAuth(
  who: Who,
  request: RealtimeAuthRequest,
): Promise<{ auth: string }> {
  const keys = pusherKeys()
  if (!keys) throw new ApiError(404, "realtime_off", "Realtime is not set up.")
  const owner = channelOwner(request.channelName)
  const mine = owner?.role === who.role && request.channelName === (await channelFor(who))
  if (!mine) throw new ApiError(403, "forbidden", "That isn't available to you.")
  return { auth: channelAuth(keys, request.socketId, request.channelName) }
}
