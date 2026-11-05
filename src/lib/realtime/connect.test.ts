import { describe, expect, it, vi } from "vitest"

import type { RealtimeEventName } from "@/lib/data/realtime-schemas"

import { connectRealtime, type PusherLike, type RealtimeDeps, type RealtimeStatus } from "./connect"

type Handler = (...args: never[]) => void

/** A stand-in for pusher-js: records what the app asked for and lets the test drive events. */
function fakePusher() {
  const bound = new Map<string, Handler>()
  const state: { key?: string; options?: unknown; channel?: string; disconnected: boolean } = {
    disconnected: false,
  }
  class FakePusher implements PusherLike {
    connection = {
      bind: (event: string, handler: Handler) => {
        bound.set(`connection:${event}`, handler)
      },
    }
    constructor(key: string, options: unknown) {
      state.key = key
      state.options = options
    }
    subscribe(channel: string) {
      state.channel = channel
      return {
        bind: (event: string, handler: Handler) => {
          bound.set(event, handler)
        },
      }
    }
    disconnect() {
      state.disconnected = true
    }
  }
  const fire = (event: string, ...args: unknown[]) =>
    (bound.get(event) as ((...a: unknown[]) => void) | undefined)?.(...args)
  return { FakePusher, state, fire }
}

const config = { key: "pk", cluster: "us2", channel: "private-staff-1" }

function setup(overrides: Partial<RealtimeDeps> = {}) {
  const pusher = fakePusher()
  const events: RealtimeEventName[] = []
  const statuses: RealtimeStatus[] = []
  const deps: RealtimeDeps = {
    config: async () => config,
    auth: async () => ({ auth: "pk:signature" }),
    loadPusher: async () => pusher.FakePusher,
    ...overrides,
  }
  const close = connectRealtime(
    deps,
    (event) => events.push(event),
    (status) => statuses.push(status),
  )
  return { pusher, events, statuses, close }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("connectRealtime", () => {
  it("joins the channel the server named and passes on its events", async () => {
    const { pusher, events } = setup()
    await settle()
    expect(pusher.state.key).toBe("pk")
    expect(pusher.state.options).toMatchObject({ cluster: "us2" })
    expect(pusher.state.channel).toBe("private-staff-1")
    pusher.fire("message")
    pusher.fire("notification")
    expect(events).toEqual(["message", "notification"])
  })

  it("reports the connection state, and refreshes everything whenever it (re)connects", async () => {
    const { pusher, events, statuses } = setup()
    await settle()
    pusher.fire("connection:state_change", { current: "connected" })
    pusher.fire("connection:state_change", { current: "unavailable" })
    pusher.fire("connection:state_change", { current: "connected" })
    expect(statuses).toEqual(["connecting", "connected", "unavailable", "connected"])
    expect(events).toEqual(["message", "notification", "message", "notification"])
  })

  it("signs the subscription through the server", async () => {
    const auth = vi.fn(async () => ({ auth: "pk:signature" }))
    const { pusher } = setup({ auth })
    await settle()
    const { customHandler } = (
      pusher.state.options as {
        channelAuthorization: {
          customHandler: (
            params: { socketId: string; channelName: string },
            callback: (error: Error | null, data: unknown) => void,
          ) => void
        }
      }
    ).channelAuthorization
    const callback = vi.fn()
    customHandler({ socketId: "1.2", channelName: "private-staff-1" }, callback)
    await settle()
    expect(auth).toHaveBeenCalledWith({ socketId: "1.2", channelName: "private-staff-1" })
    expect(callback).toHaveBeenCalledWith(null, { auth: "pk:signature" })
  })

  it("marks a refused subscription unavailable, so the app keeps polling", async () => {
    const { pusher, statuses } = setup()
    await settle()
    pusher.fire("pusher:subscription_error")
    expect(statuses.at(-1)).toBe("unavailable")
  })

  it("stays off and loads nothing when the server has no keys", async () => {
    const loadPusher = vi.fn()
    const { statuses } = setup({ config: async () => null, loadPusher })
    await settle()
    expect(loadPusher).not.toHaveBeenCalled()
    expect(statuses).toEqual(["off"])
  })

  it("stays off when the config can't be read", async () => {
    const { statuses } = setup({ config: async () => Promise.reject(new Error("offline")) })
    await settle()
    expect(statuses).toEqual(["off"])
  })

  it("disconnects when closed", async () => {
    const { pusher, close, statuses } = setup()
    await settle()
    close()
    expect(pusher.state.disconnected).toBe(true)
    expect(statuses.at(-1)).toBe("off")
  })

  it("never connects if closed before the config arrives", async () => {
    const loadPusher = vi.fn()
    const { close } = setup({ loadPusher })
    close()
    await settle()
    expect(loadPusher).not.toHaveBeenCalled()
  })
})
