// Punches captured with no signal are stored with their original device time and replayed once the
// network returns (handoff §6.2, product spec §8.4). Each carries its idempotency key, so a replay
// that races a retry cannot double-punch. Small and synchronous: localStorage is enough for the demo;
// the durable store (IndexedDB behind lib/platform) replaces it later.
import { z } from "zod/mini"

import { ApiError, ClockPunchRequest, staffRepo } from "@/lib/data"

const KEY = "vw-punch-queue"
const Queued = z.object({ kind: z.enum(["in", "out"]), req: ClockPunchRequest })
export type QueuedPunch = z.infer<typeof Queued>

function read(): QueuedPunch[] {
  try {
    const parsed = z.array(Queued).safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function write(items: QueuedPunch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage unavailable: the punch is still synced this session, just not across a reload.
  }
}

export const queuedCount = () => read().length

export function enqueuePunch(item: QueuedPunch): void {
  write([...read(), item])
}

/** Sends queued punches in order; stops at the first failure and leaves the rest queued. */
export async function flushPunches(): Promise<{ sent: number; remaining: number }> {
  const queue = read()
  let sent = 0
  for (const item of queue) {
    try {
      await (item.kind === "in" ? staffRepo.clockIn(item.req) : staffRepo.clockOut(item.req))
    } catch (error) {
      // Still offline: keep this and the rest queued. Any server answer is final for this punch.
      if (error instanceof ApiError && error.status === 0) break
    }
    sent += 1
  }
  const remaining = queue.slice(sent)
  write(remaining)
  return { sent, remaining: remaining.length }
}
