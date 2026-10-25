// The browser's calls to the push endpoints: ask the server for its key, tell it about this device.
import { z } from "zod/mini"

import { api, type Role } from "./api-client"
import { PushConfigDto, type PushSubscribeRequest } from "./push-schemas"

const Ack = z.object({})

export const pushApi = {
  config: () => api("push/config", PushConfigDto, { auth: false }),
  subscribe: (role: Role, subscription: PushSubscribeRequest) =>
    api(`${role}/push`, Ack, { method: "POST", body: subscription, as: role }),
  unsubscribe: (role: Role, endpoint: string) =>
    api(`${role}/push`, Ack, { method: "DELETE", body: { endpoint }, as: role }),
}
