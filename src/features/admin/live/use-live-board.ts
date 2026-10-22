"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ASSIGN_POOL, LIVE_EVENTS, type LiveEvent, type LiveSlot } from "@/mocks/admin-live"

import {
  boardPeople,
  deriveBoard,
  first,
  venueName,
  type ActionId,
  type AttentionItem,
} from "./live-model"

const TOAST_MS = 2400
/** Matches the exit animation (animate-out, 340 ms). */
const LEAVE_MS = 340

/**
 * The Live Board's state: events and their slots, plus every in-place action an admin can take.
 * Actions mutate local state and raise a toast; the real API replaces this.
 */
export function useLiveBoard() {
  const [events, setEvents] = useState<LiveEvent[]>(LIVE_EVENTS)
  const [messaged, setMessaged] = useState<Record<string, true>>({})
  const [leaving, setLeaving] = useState<Record<string, true>>({})
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const assigned = useRef(0)

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }

  const say = useCallback((text: string) => {
    setToast(text)
    // Only the newest toast keeps the timer.
    timers.current.push(setTimeout(() => setToast((t) => (t === text ? null : t)), TOAST_MS))
  }, [])

  const patchSlot = (eventId: string, index: number, patch: Partial<LiveSlot>) =>
    setEvents((list) =>
      list.map((e) =>
        e.id !== eventId
          ? e
          : { ...e, slots: e.slots.map((s, i) => (i === index ? { ...s, ...patch } : s)) },
      ),
    )

  /** Plays the exit animation, then applies the change. */
  const leave = (key: string, apply: () => void) => {
    setLeaving((l) => ({ ...l, [key]: true }))
    later(() => {
      apply()
      setLeaving((l) => {
        const rest = { ...l }
        delete rest[key]
        return rest
      })
    }, LEAVE_MS)
  }

  const board = useMemo(() => deriveBoard(events, messaged), [events, messaged])

  const assign = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    const index = event?.slots.findIndex((s) => s.state === "open") ?? -1
    if (!event || index < 0) return
    assigned.current += 1
    const who = ASSIGN_POOL[assigned.current % ASSIGN_POOL.length] ?? ASSIGN_POOL[0]
    patchSlot(eventId, index, {
      name: who,
      state: event.live ? "due" : "upcoming",
      meta: "Assigned 6:04 PM by you · notified",
    })
    say(`${who} assigned to ${venueName(event.venue)}`)
  }

  const addSlot = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    setEvents((list) =>
      list.map((e) =>
        e.id !== eventId
          ? e
          : {
              ...e,
              slots: [
                ...e.slots,
                { name: "Open slot", state: "open", meta: "Added 6:04 PM by you" },
              ],
            },
      ),
    )
    say(`Slot added · headcount ${event.slots.length + 1}`)
  }

  const broadcastEvent = (eventId: string) => {
    const open = events.find((e) => e.id === eventId)?.slots.some((s) => s.state === "open")
    say(open ? "Open slots broadcast to 31 eligible staff" : "No open slots to broadcast")
  }

  const messageCrew = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    say(`Message sent to ${event.slots.filter((s) => s.state !== "open").length} crew`)
  }

  const run = (item: AttentionItem, action: ActionId) => {
    const event = events.find((e) => e.id === item.eventId)
    const slot = event?.slots[item.slotIndex]
    switch (action) {
      case "assign":
        return assign(item.eventId)
      case "broadcast":
        return say(
          item.kind === "unfilled"
            ? "Broadcast sent to 38 eligible staff"
            : "Broadcast sent to 31 eligible staff",
        )
      case "message":
      case "message-again":
        if (!slot) return
        setMessaged((m) => ({ ...m, [`${item.eventId}${item.slotIndex}`]: true }))
        return say(`Message delivered to ${first(slot.name)}`)
      case "call":
        return say("Opening dialer…")
      case "replace":
        if (!slot) return
        return leave(item.key, () => {
          patchSlot(item.eventId, item.slotIndex, {
            state: "open",
            name: "Open slot",
            meta: `${slot.name} removed 6:04 PM by you`,
          })
          say(`${slot.name} removed · slot reopened`)
        })
      case "approve":
        if (!slot) return
        return leave(item.key, () => {
          patchSlot(item.eventId, item.slotIndex, {
            state: "override",
            meta: "Approved override · in 5:58 PM (request time) · by you",
          })
          say(`${first(slot.name)} clocked in at 5:58 PM`)
        })
      case "reject":
        if (!slot) return
        return leave(item.key, () => {
          patchSlot(item.eventId, item.slotIndex, {
            state: "due",
            meta: "Override rejected 6:04 PM · notified",
          })
          say(`Rejected · ${first(slot.name)} notified`)
        })
    }
  }

  return {
    ...board,
    events,
    leaving,
    toast,
    people: (query: string) => boardPeople(events, query),
    run,
    assign,
    addSlot,
    broadcastEvent,
    messageCrew,
  }
}

export type LiveBoard = ReturnType<typeof useLiveBoard>
