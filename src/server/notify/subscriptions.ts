// Device push subscriptions: which browsers each person allowed. One endpoint belongs to one
// person; subscribing again from the same browser just moves it to whoever is signed in.
import type { PushSubscribeRequest } from "@/lib/data/push-schemas"

import { sql } from "../db/client"
import type { PushRole } from "./push"

export async function saveSubscription(
  role: PushRole,
  ownerId: string,
  subscription: PushSubscribeRequest,
): Promise<void> {
  await sql()`insert into push_subscriptions (role, owner_id, endpoint, p256dh, auth)
              values (${role}, ${ownerId}, ${subscription.endpoint}, ${subscription.keys.p256dh},
                      ${subscription.keys.auth})
              on conflict (endpoint)
              do update set role = excluded.role, owner_id = excluded.owner_id,
                            p256dh = excluded.p256dh, auth = excluded.auth`
  // The worker allowed push on a real device: the staff profile and dispatch's "alerts off" agree.
  if (role === "staff") await sql()`update staff set push_enabled = true where id = ${ownerId}`
}

export async function removeSubscription(
  role: PushRole,
  ownerId: string,
  endpoint: string,
): Promise<void> {
  await sql()`delete from push_subscriptions
              where endpoint = ${endpoint} and role = ${role} and owner_id = ${ownerId}`
}
