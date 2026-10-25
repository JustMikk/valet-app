// Wire format for device push (Web Push, RFC 8030): the public key a browser subscribes with, and
// the subscription it sends back. Shared by the server and the client like every other DTO.
import { z } from "zod/mini"

const str = z.string().check(z.minLength(1), z.maxLength(2048))

export const PushConfigDto = z.object({ publicKey: z.nullable(z.string()) })
export type PushConfig = z.infer<typeof PushConfigDto>

export const PushSubscribeRequest = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: str, auth: str }),
})
export type PushSubscribeRequest = z.infer<typeof PushSubscribeRequest>

export const PushUnsubscribeRequest = z.object({ endpoint: z.url() })
