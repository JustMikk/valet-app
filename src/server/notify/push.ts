// Web Push delivery (RFC 8030, VAPID): the server half of `lib/platform` push. Delivery is best
// effort: a failure never fails the action that caused the notification, a subscription the push
// service reports gone (404 / 410) is deleted, and the whole send is capped so a slow push service
// cannot hold up an API response.
import webpush from "web-push"

import { rows, sql } from "../db/client"
import { env } from "../env"

export type PushRole = "staff" | "admin"
export type PushMessage = { title: string; body: string; href: string }

type Subscription = { id: string; endpoint: string; p256dh: string; auth: string }

const SEND_BUDGET_MS = 3000

/** The public VAPID key the browser subscribes with, or null when push is not configured. */
export function vapidPublicKey(): string | null {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = env()
  return VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY ? VAPID_PUBLIC_KEY : null
}

function configured(): boolean {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env()
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(
    VAPID_SUBJECT ?? "mailto:dispatch@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
  return true
}

async function deliver(subscription: Subscription, payload: string): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
      { TTL: 60 * 60 },
    )
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      await sql()`delete from push_subscriptions where id = ${subscription.id}`
    } else {
      console.warn("Push delivery failed", status ?? error)
    }
  }
}

/** Pushes one message to every device the given people allowed. Never throws. */
export async function pushTo(
  role: PushRole,
  ownerIds: string[],
  message: PushMessage,
): Promise<void> {
  if (ownerIds.length === 0 || !configured()) return
  try {
    const subscriptions = await rows<Subscription>(
      sql()`select id, endpoint, p256dh, auth from push_subscriptions
            where role = ${role} and owner_id = any(${ownerIds}::uuid[])`,
    )
    if (subscriptions.length === 0) return
    const payload = JSON.stringify(message)
    await Promise.race([
      Promise.allSettled(subscriptions.map((s) => deliver(s, payload))),
      new Promise((resolve) => setTimeout(resolve, SEND_BUDGET_MS)),
    ])
  } catch (error) {
    console.warn("Push skipped", error)
  }
}
