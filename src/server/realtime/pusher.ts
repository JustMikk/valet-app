// Realtime over Pusher Channels (ADR-023). After a write, the affected people's apps hear
// "message" or "notification" on their private channel and refetch at once instead of waiting for
// the next poll. Only the event name travels; content is always read through the signed-in API.
import { createHash, createHmac } from "node:crypto"

import { env } from "../env"

export type RealtimeEvent = "message" | "notification"

export type PusherKeys = { appId: string; key: string; secret: string; cluster: string }

// The demo's own Pusher app, built in so a deploy needs no variables (owner decision, ADR-023).
// The repository is public, so this secret is public: the four PUSHER_* variables override it,
// and regenerating the secret in Pusher retires this one.
const DEMO_KEYS: PusherKeys = {
  appId: "2209882",
  key: "7447f154b15cfc6ec652",
  secret: "dd9afa9d11caf70324f9",
  cluster: "us2",
}

export function pusherKeys(): PusherKeys | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = env()
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return DEMO_KEYS
  return { appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER }
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
const CHANNEL = new RegExp(`^private-(staff|admins)-(${UUID})$`)

/** One channel per staff member, one per tenant shared by its admins. */
export const staffChannel = (staffId: string) => `private-staff-${staffId}`
export const adminChannel = (tenantId: string) => `private-admins-${tenantId}`

/** Whose channel it is: a staff id, or the tenant id of an admins channel; null for anything else. */
export function channelOwner(channel: string): { role: "staff" | "admin"; id: string } | null {
  const match = CHANNEL.exec(channel)
  if (!match) return null
  return { role: match[1] === "staff" ? "staff" : "admin", id: match[2] }
}

const hmac = (secret: string, text: string) =>
  createHmac("sha256", secret).update(text).digest("hex")

/** Pusher's private-channel signature: "key:hmac(socket_id:channel)". */
export function channelAuth(
  keys: Pick<PusherKeys, "key" | "secret">,
  socketId: string,
  channel: string,
): string {
  return `${keys.key}:${hmac(keys.secret, `${socketId}:${channel}`)}`
}

/** The signed URL of Pusher's "trigger events" REST call (auth_version 1.0). */
export function triggerRequest(keys: PusherKeys, body: string, timestamp: number): string {
  const path = `/apps/${keys.appId}/events`
  const query = [
    `auth_key=${keys.key}`,
    `auth_timestamp=${timestamp}`,
    "auth_version=1.0",
    `body_md5=${createHash("md5").update(body).digest("hex")}`,
  ].join("&")
  const signature = hmac(keys.secret, `POST\n${path}\n${query}`)
  return `https://api-${keys.cluster}.pusher.com${path}?${query}&auth_signature=${signature}`
}

// Pusher accepts up to 100 channels per trigger.
const BATCH = 100

/** Never throws and waits at most two seconds: realtime only speeds up what polling would show. */
export async function publish(channels: string[], event: RealtimeEvent): Promise<void> {
  const keys = pusherKeys()
  const unique = [...new Set(channels)]
  if (!keys || unique.length === 0) return
  const batches: string[][] = []
  for (let i = 0; i < unique.length; i += BATCH) batches.push(unique.slice(i, i + BATCH))
  await Promise.all(
    batches.map(async (batch) => {
      const body = JSON.stringify({ name: event, channels: batch, data: "{}" })
      try {
        const response = await fetch(triggerRequest(keys, body, Math.floor(Date.now() / 1000)), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          signal: AbortSignal.timeout(2000),
        })
        if (!response.ok) console.warn("Realtime publish failed", response.status)
      } catch (error) {
        console.warn("Realtime publish skipped", error)
      }
    }),
  )
}

export const publishToStaff = (staffIds: string[], event: RealtimeEvent) =>
  publish(staffIds.map(staffChannel), event)

export const publishToAdmins = (tenantId: string, event: RealtimeEvent) =>
  publish([adminChannel(tenantId)], event)
