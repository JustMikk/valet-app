// Wire format for realtime (ADR-023): where a signed-in person's app listens, and the signature
// that lets it join that private channel. Shared by the server and the client.
import { z } from "zod/mini"

/** Null when the server has no Pusher keys: the apps keep polling. */
export const RealtimeConfigDto = z.nullable(
  z.object({ key: z.string(), cluster: z.string(), channel: z.string() }),
)
export type RealtimeConfig = z.infer<typeof RealtimeConfigDto>

export const RealtimeAuthRequest = z.object({
  socketId: z.string().check(z.regex(/^\d+\.\d+$/)),
  channelName: z.string().check(z.minLength(1), z.maxLength(200)),
})
export type RealtimeAuthRequest = z.infer<typeof RealtimeAuthRequest>

export const RealtimeAuthDto = z.object({ auth: z.string() })

/** What the server says changed; the app refetches the matching screens. */
export const REALTIME_EVENTS = ["message", "notification"] as const
export type RealtimeEventName = (typeof REALTIME_EVENTS)[number]
