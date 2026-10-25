"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { ConfirmSheet, GlassCard, Icon, PersonAvatar, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EventDetail as EventData, RosterRow } from "@/lib/data"
import { cn } from "@/lib/utils"

import { AdminPage, SectionTitle, SPLIT } from "../common/admin-page"
import { ErrorNotice, QueryState } from "../data/query-state"
import { useCancelEvent, useEvent } from "../data/queries"
import { EditEventSheet } from "./edit-event-sheet"
import { EditInstructionsSheet } from "./edit-instructions-sheet"
import { FillSheet } from "./fill-sheet"

const STAT_TONE = { ok: "text-ok", warn: "text-warn", fg: "text-fg" } as const
const SIDE_BUTTON = "h-13.5 gap-2 text-16"

/** One event: coverage stats, crew roster with in-place actions, instructions and shortcuts. */
export function EventDetail() {
  const id = useSearchParams().get("id") ?? undefined
  const event = useEvent(id)
  return (
    <AdminPage>
      <QueryState query={event} rows={4}>
        {(data) => <EventBody event={data} />}
      </QueryState>
    </AdminPage>
  )
}

function RosterAction({ person }: { person: RosterRow }) {
  const router = useRouter()
  if (!person.action) return null
  const props =
    person.action === "Call" && person.tel
      ? { nativeButton: false as const, render: <a href={`tel:${person.tel}`} /> }
      : { onClick: () => router.push("/admin/live") }
  return (
    <Button variant="strong" size="xs" className="flex-none" {...props}>
      {person.action}
    </Button>
  )
}

function EventBody({ event }: { event: EventData }) {
  const router = useRouter()
  const [fillOpen, setFillOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editDetailsOpen, setEditDetailsOpen] = useState(false)
  const cancel = useCancelEvent()
  const openSpots = event.openSlots.length

  return (
    <>
      <div className={SPLIT}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Badge
              tone={event.badge.live ? "ok" : "neutral"}
              className="h-7.5 self-start pr-2.75 pl-2 text-14"
            >
              <Icon name={event.badge.live ? "sensors" : "event"} filled size={18} />
              {event.badge.label}
            </Badge>
            <h1 className="m-0 font-display text-44 leading-x100 font-bold tracking-n040">
              {event.venue}
            </h1>
            <span className="text-16 text-fg-2">{event.summary}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {event.stats.map((stat) => (
              <GlassCard key={stat.label} className="flex flex-col gap-1 rounded-r20 px-4 py-3.5">
                <span
                  className={cn(
                    "font-display text-32 leading-x100 font-bold tracking-n030",
                    STAT_TONE[stat.tone],
                  )}
                >
                  {stat.n}
                </span>
                <span className="text-13 font-medium text-fg-2">{stat.label}</span>
              </GlassCard>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <SectionTitle>Crew</SectionTitle>
              {openSpots > 0 && !event.cancelled && (
                <Button variant="secondary" size="xs" onClick={() => setFillOpen(true)}>
                  <Icon name="person_add" size={20} />
                  Add staff
                </Button>
              )}
            </div>
            <ul className="m-0 flex list-none flex-col border-t border-line p-0">
              {event.roster.map((person) => (
                <li
                  key={person.id}
                  className="box-content flex min-h-17 items-center gap-3 border-b border-line py-1.5"
                >
                  <PersonAvatar name={person.name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-16 font-semibold">{person.name}</span>
                    <span className="text-14 text-fg-2">{person.detail}</span>
                  </div>
                  <StatusBadge status={person.status} size="sm" />
                  <RosterAction person={person} />
                </li>
              ))}
              {event.openSlots.map((posted, i) => (
                <li
                  key={i}
                  className="box-content flex min-h-17 items-center gap-3 border-b border-line"
                >
                  <PersonAvatar open />
                  <span className="flex-1 text-16 font-medium text-fg-2">
                    Open spot · posted to staff
                  </span>
                  <span className="text-13 font-medium text-fg-3">{posted}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <GlassCard className="flex flex-col gap-3 rounded-r24 p-5">
            <h2 className="m-0 font-display text-18 font-semibold">Instructions for crew</h2>
            <p className="m-0 text-15 leading-x155 text-fg-2">
              {event.instructions || "No instructions yet."}
            </p>
            {!event.cancelled && (
              <Button
                variant="secondary"
                size="xs"
                className="self-start"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            )}
          </GlassCard>
          <Button
            variant="secondary"
            className={SIDE_BUTTON}
            nativeButton={false}
            render={<Link href={`/admin/inbox/announce?event=${event.id}`} />}
          >
            <Icon name="campaign" filled size={22} />
            Message this crew
          </Button>
          <Button
            variant="secondary"
            className={SIDE_BUTTON}
            nativeButton={false}
            render={<Link href={`/admin/venues/detail?id=${event.venueId}`} />}
          >
            <Icon name="location_on" filled size={22} />
            Venue &amp; geofence
          </Button>
          {event.editable && !event.cancelled && (
            <Button
              variant="secondary"
              className={SIDE_BUTTON}
              onClick={() => setEditDetailsOpen(true)}
            >
              <Icon name="edit_calendar" filled size={22} />
              Edit date &amp; time
            </Button>
          )}
          {cancel.error && <ErrorNotice message={cancel.error.message} />}
          {!event.cancelled && (
            <Button
              variant="ghost"
              className={cn(SIDE_BUTTON, "text-bad shadow-[inset_0_0_0_1.5px_var(--line)]")}
              onClick={() => setCancelOpen(true)}
            >
              Cancel event
            </Button>
          )}
        </div>
      </div>

      <FillSheet
        eventId={event.id}
        open={fillOpen}
        onOpenChange={setFillOpen}
        openSpots={openSpots}
      />
      <EditInstructionsSheet
        eventId={event.id}
        instructions={event.instructions}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {event.editable && (
        <EditEventSheet
          eventId={event.id}
          initial={event.editable}
          open={editDetailsOpen}
          onOpenChange={setEditDetailsOpen}
        />
      )}
      <ConfirmSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel ${event.venue} event?`}
        consequence={`The ${event.confirmedCount} confirmed crew are notified now and the open spots are removed. This can't be undone.`}
        confirmLabel="Cancel event"
        cancelLabel="Keep event"
        tone="destructive"
        onConfirm={() => cancel.mutate(event.id, { onSuccess: () => router.push("/admin/events") })}
      />
    </>
  )
}
