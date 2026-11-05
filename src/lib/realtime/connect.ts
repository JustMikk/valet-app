// Realtime (ADR-023): one Pusher Channels connection per signed-in app, on that person's private
// channel. It carries only "message" and "notification"; each app turns those into refetches.
// With no keys on the server, nothing loads and the apps keep polling.
import type {
  RealtimeAuthRequest,
  RealtimeConfig,
  RealtimeEventName,
} from "@/lib/data/realtime-schemas"
import { REALTIME_EVENTS } from "@/lib/data/realtime-schemas"

export type RealtimeStatus = "off" | "connecting" | "connected" | "unavailable"

type AuthCallback = (error: Error | null, data: { auth: string } | null) => void

type PusherOptions = {
  cluster: string
  channelAuthorization: {
    customHandler: (
      params: { socketId: string; channelName: string },
      callback: AuthCallback,
    ) => void
  }
}

/** The part of pusher-js this uses, so tests can stand in for it. */
export type PusherLike = {
  connection: { bind(event: "state_change", handler: (states: { current: string }) => void): void }
  subscribe(channel: string): { bind(event: string, handler: () => void): void }
  disconnect(): void
}

export type RealtimeDeps = {
  config: () => Promise<RealtimeConfig>
  auth: (request: RealtimeAuthRequest) => Promise<{ auth: string }>
  loadPusher: () => Promise<new (key: string, options: PusherOptions) => PusherLike>
}

const statusOf = (state: string): RealtimeStatus =>
  state === "connected"
    ? "connected"
    : state === "connecting" || state === "initialized"
      ? "connecting"
      : "unavailable"

/** Opens the connection; the returned function closes it. */
export function connectRealtime(
  deps: RealtimeDeps,
  onEvent: (event: RealtimeEventName) => void,
  onStatus: (status: RealtimeStatus) => void,
): () => void {
  let closed = false
  let disconnect = () => {}

  const open = async () => {
    const config = await deps.config()
    if (closed) return
    if (!config) {
      onStatus("off")
      return
    }
    onStatus("connecting")
    const Pusher = await deps.loadPusher()
    if (closed) return
    const pusher = new Pusher(config.key, {
      cluster: config.cluster,
      channelAuthorization: {
        customHandler: ({ socketId, channelName }, callback) => {
          deps.auth({ socketId, channelName }).then(
            (data) => callback(null, data),
            (error: unknown) =>
              callback(error instanceof Error ? error : new Error("Realtime sign-in failed"), null),
          )
        },
      },
    })
    pusher.connection.bind("state_change", ({ current }) => {
      const status = statusOf(current)
      onStatus(status)
      // Anything may have changed while the connection was down: catch up once.
      if (status === "connected") for (const event of REALTIME_EVENTS) onEvent(event)
    })
    const channel = pusher.subscribe(config.channel)
    for (const event of REALTIME_EVENTS) channel.bind(event, () => onEvent(event))
    channel.bind("pusher:subscription_error", () => onStatus("unavailable"))
    disconnect = () => pusher.disconnect()
  }

  open().catch(() => {
    if (!closed) onStatus("off")
  })

  return () => {
    closed = true
    disconnect()
    onStatus("off")
  }
}
