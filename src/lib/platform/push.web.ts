// Web Push in the browser: a service worker (`/sw.js`) shows the notification and opens the right
// screen on tap; `PushManager` holds the subscription the server delivers to. Needs a secure context
// (localhost or HTTPS). On iOS push only works for an installed home-screen app.
import type { PushOutcome, PushPermission, PushProvider, PushSubscriptionData } from "./types"

const WORKER_URL = "/sw.js"

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=")
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

function toData(subscription: PushSubscription): PushSubscriptionData | null {
  const json = subscription.toJSON()
  const { p256dh, auth } = json.keys ?? {}
  return json.endpoint && p256dh && auth
    ? { endpoint: json.endpoint, keys: { p256dh, auth } }
    : null
}

async function registration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(WORKER_URL)
  return navigator.serviceWorker.ready
}

export const webPush: PushProvider = {
  permission(): PushPermission {
    return supported() ? Notification.permission : "unsupported"
  },

  async current() {
    if (!supported()) return null
    const existing = await navigator.serviceWorker.getRegistration(WORKER_URL)
    const subscription = await existing?.pushManager.getSubscription()
    return subscription ? toData(subscription) : null
  },

  async subscribe(publicKey): Promise<PushOutcome> {
    if (!supported()) return { ok: false, reason: "unsupported" }
    if ((await Notification.requestPermission()) !== "granted") {
      return { ok: false, reason: "denied" }
    }
    try {
      const reg = await registration()
      let subscription = await reg.pushManager.getSubscription()
      const key = keyBytes(publicKey)
      const held = subscription?.options.applicationServerKey
      // A subscription made with another server key can never be delivered to: start over.
      if (subscription && held && !sameBytes(new Uint8Array(held), key)) {
        await subscription.unsubscribe()
        subscription = null
      }
      subscription ??= await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      })
      const data = toData(subscription)
      return data ? { ok: true, subscription: data } : { ok: false, reason: "failed" }
    } catch {
      return { ok: false, reason: "failed" }
    }
  },

  async unsubscribe() {
    if (!supported()) return null
    const existing = await navigator.serviceWorker.getRegistration(WORKER_URL)
    const subscription = await existing?.pushManager.getSubscription()
    if (!subscription) return null
    const { endpoint } = subscription
    await subscription.unsubscribe()
    return endpoint
  },
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}
