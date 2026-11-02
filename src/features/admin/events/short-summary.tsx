"use client"

import { useState } from "react"

import { adminRepo, type EventList } from "@/lib/data"

import { SummaryBar } from "../common/summary-bar"

/** Short-staffed tab: how many people the shown events are short, and broadcast them all. */
export function ShortSummary({ list }: { list: EventList }) {
  const [state, setState] = useState<"idle" | "sending" | string>("idle")
  const events = list.days.flatMap((day) => day.items).filter((e) => e.need > e.confirmed)
  if (events.length === 0) return null
  const short = events.reduce((total, e) => total + (e.need - e.confirmed), 0)

  const broadcastAll = async () => {
    setState("sending")
    try {
      const sent = await Promise.all(events.map((e) => adminRepo.broadcastOpen(e.id)))
      const reached = sent.reduce((total, r) => total + r.recipients, 0)
      setState(`Open slots broadcast for ${events.length} events (${reached} staff reached).`)
    } catch (error) {
      setState(error instanceof Error ? error.message : "Something went wrong. Try again.")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <SummaryBar
        icon="campaign"
        tone="warn"
        action={{ label: "Broadcast all", onClick: broadcastAll, disabled: state === "sending" }}
      >
        {events.length} {events.length === 1 ? "event is" : "events are"} short {short}{" "}
        {short === 1 ? "person" : "people"}. Broadcast the open slots to eligible staff.
      </SummaryBar>
      {state !== "idle" && state !== "sending" && (
        <p role="status" className="m-0 text-14 font-semibold text-fg-2">
          {state}
        </p>
      )}
    </div>
  )
}
