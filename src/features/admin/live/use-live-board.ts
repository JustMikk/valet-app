"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { adminRepo } from "@/lib/data"
import {
  boardPeople,
  deriveBoard,
  first,
  venueName,
  type ActionId,
  type AttentionItem,
} from "@/lib/live/model"

import { useLive, useRefresh } from "../data/queries"

const TOAST_MS = 2400
/** Matches the exit animation (animate-out, 340 ms). */
const LEAVE_MS = 340

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Try again."

/**
 * The Live Board's state: the live events from the server, plus every in-place action a
 * dispatcher can take. Each action calls the API, raises a toast and refreshes the board.
 */
export function useLiveBoard() {
  const query = useLive()
  const refresh = useRefresh()
  const router = useRouter()
  const [messaged, setMessaged] = useState<Record<string, true>>({})
  const [leaving, setLeaving] = useState<Record<string, true>>({})
  const [toast, setToast] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const events = useMemo(() => query.data?.events ?? [], [query.data])
  const board = useMemo(() => deriveBoard(events, messaged), [events, messaged])

  const say = useCallback((text: string) => {
    setToast(text)
    // Only the newest toast keeps the timer.
    timers.current.push(setTimeout(() => setToast((t) => (t === text ? null : t)), TOAST_MS))
  }, [])

  /** Runs an action, saying what happened (or what went wrong) in the toast. */
  const attempt = useCallback(
    async (work: () => Promise<string>) => {
      try {
        say(await work())
      } catch (error) {
        say(messageOf(error))
      }
      await refresh()
    },
    [say, refresh],
  )

  /** Plays the exit animation while the request runs, then clears it. */
  const leave = useCallback(
    async (key: string, work: () => Promise<string>) => {
      setLeaving((l) => ({ ...l, [key]: true }))
      const wait = new Promise<void>((resolve) => setTimeout(resolve, LEAVE_MS))
      await Promise.all([attempt(work), wait])
      setLeaving((l) => {
        const rest = { ...l }
        delete rest[key]
        return rest
      })
    },
    [attempt],
  )

  const eventOf = (id: string) => events.find((e) => e.id === id)

  const assign = (eventId: string) =>
    attempt(async () => {
      const { names } = await adminRepo.assign(eventId)
      return `${names[0]} assigned to ${venueName(eventOf(eventId)?.venue ?? "the event")}`
    })

  const addSlot = (eventId: string) =>
    attempt(async () => `Slot added · headcount ${(await adminRepo.addSlot(eventId)).headcount}`)

  const broadcastEvent = (eventId: string) =>
    attempt(async () => {
      const { recipients } = await adminRepo.broadcastOpen(eventId)
      return `Open slots broadcast to ${recipients} eligible staff`
    })

  /** There is no one-line message to send a whole crew: it goes through the announcement composer. */
  const messageCrew = (eventId: string) => router.push(`/admin/inbox/announce?event=${eventId}`)

  const run = (item: AttentionItem, action: ActionId) => {
    const slot = events.flatMap((e) => e.slots).find((s) => s.id === item.slotId)
    switch (action) {
      case "assign":
        return assign(item.eventId)
      case "broadcast":
        return broadcastEvent(item.eventId)
      case "message":
      case "message-again":
        if (!slot) return
        return attempt(async () => {
          await adminRepo.nudge(slot.id)
          setMessaged((m) => ({ ...m, [slot.id]: true }))
          return `Message delivered to ${first(slot.name)}`
        })
      case "call":
        if (!slot?.facts.tel) return say("No phone number on file")
        window.location.assign(`tel:${slot.facts.tel}`)
        return say("Opening dialer…")
      case "replace":
        if (!slot) return
        return leave(item.key, async () => {
          await adminRepo.removeFromSlot(slot.id)
          return `${slot.name} removed · slot reopened`
        })
      case "approve":
        if (!slot || !item.punchId) return
        return leave(item.key, async () => {
          const { atLabel } = await adminRepo.decide(item.punchId as string, "approve")
          return `${first(slot.name)} clocked in at ${atLabel}`
        })
      case "reject":
        if (!slot || !item.punchId) return
        return leave(item.key, async () => {
          await adminRepo.decide(item.punchId as string, "reject")
          return `Rejected · ${first(slot.name)} notified`
        })
    }
  }

  return {
    ...board,
    events,
    timeline: query.data?.timeline ?? null,
    zone: query.data?.zone ?? "",
    updatedAt: query.data?.serverNow ?? null,
    yesterday: query.data?.yesterday ?? null,
    query,
    leaving,
    toast,
    people: (q: string) => boardPeople(events, q),
    run,
    assign,
    addSlot,
    broadcastEvent,
    messageCrew,
  }
}

export type LiveBoard = ReturnType<typeof useLiveBoard>
