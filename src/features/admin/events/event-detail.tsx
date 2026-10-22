"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ConfirmSheet, GlassCard, Icon, PersonAvatar, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EVENT_DETAIL, type RosterRow } from "@/mocks/admin"

import { AdminPage, SectionTitle, SPLIT } from "../common/admin-page"
import { FillSheet } from "./fill-sheet"

const STAT_TONE = { ok: "text-ok", warn: "text-warn", fg: "text-fg" } as const
const SIDE_BUTTON = "h-13.5 gap-2 text-16"

/** One event: coverage stats, crew roster with in-place actions, instructions and shortcuts. */
export function EventDetail() {
  const router = useRouter()
  const [fillOpen, setFillOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const openSpots = EVENT_DETAIL.openSlots.length

  const act = (action: RosterRow["action"]) => {
    if (action === "Review") router.push("/admin/hours")
  }

  return (
    <AdminPage>
      <div className={SPLIT}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Badge tone="ok" className="h-7.5 self-start pr-2.75 pl-2 text-14">
              <Icon name="sensors" filled size={18} />
              Live now · {EVENT_DETAIL.when}
            </Badge>
            <h1 className="m-0 font-display text-44 leading-x100 font-bold tracking-n040">
              {EVENT_DETAIL.venue}
            </h1>
            <span className="text-16 text-fg-2">{EVENT_DETAIL.summary}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {EVENT_DETAIL.stats.map((stat) => (
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
              <Button variant="secondary" size="xs" onClick={() => setFillOpen(true)}>
                <Icon name="person_add" size={20} />
                Add staff
              </Button>
            </div>
            <ul className="m-0 flex list-none flex-col border-t border-line p-0">
              {(EVENT_DETAIL.roster as readonly RosterRow[]).map((person) => (
                <li
                  key={person.name}
                  className="box-content flex min-h-17 items-center gap-3 border-b border-line py-1.5"
                >
                  <PersonAvatar name={person.name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-16 font-semibold">{person.name}</span>
                    <span className="text-14 text-fg-2">{person.detail}</span>
                  </div>
                  <StatusBadge status={person.status} size="sm" />
                  {person.action && (
                    <Button
                      variant="strong"
                      size="xs"
                      className="flex-none"
                      onClick={() => act(person.action)}
                    >
                      {person.action}
                    </Button>
                  )}
                </li>
              ))}
              {EVENT_DETAIL.openSlots.map((posted, i) => (
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
            <p className="m-0 text-15 leading-x155 text-fg-2">{EVENT_DETAIL.instructions}</p>
            <Button variant="secondary" size="xs" className="self-start">
              Edit
            </Button>
          </GlassCard>
          <Button
            variant="secondary"
            className={SIDE_BUTTON}
            nativeButton={false}
            render={<Link href="/admin/inbox/announce" />}
          >
            <Icon name="campaign" filled size={22} />
            Message this crew
          </Button>
          <Button
            variant="secondary"
            className={SIDE_BUTTON}
            nativeButton={false}
            render={<Link href="/admin/venues/detail" />}
          >
            <Icon name="location_on" filled size={22} />
            Venue &amp; geofence
          </Button>
          <Button
            variant="ghost"
            className={cn(SIDE_BUTTON, "text-bad shadow-[inset_0_0_0_1.5px_var(--line)]")}
            onClick={() => setCancelOpen(true)}
          >
            Cancel event
          </Button>
        </div>
      </div>

      <FillSheet open={fillOpen} onOpenChange={setFillOpen} openSpots={openSpots} />
      <ConfirmSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel The Grand Hotel event?"
        consequence="The 6 confirmed crew are notified now and the open spots are removed. This can't be undone."
        confirmLabel="Cancel event"
        cancelLabel="Keep event"
        tone="destructive"
        onConfirm={() => router.push("/admin/events")}
      />
    </AdminPage>
  )
}
