// The browser's calls to the realtime endpoints (ADR-023): where to listen, and the signature for
// joining that private channel.
import { api, type Role } from "./api-client"
import { RealtimeAuthDto, RealtimeConfigDto, type RealtimeAuthRequest } from "./realtime-schemas"

export const realtimeApi = {
  config: (role: Role) => api(`${role}/realtime`, RealtimeConfigDto, { as: role }),
  auth: (role: Role, request: RealtimeAuthRequest) =>
    api(`${role}/realtime`, RealtimeAuthDto, { method: "POST", body: request, as: role }),
}
