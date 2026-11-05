"use client"

import { useState } from "react"

import {
  AttentionCard,
  Icon,
  NotificationBell,
  StatusBadge,
  ToastPill,
  UnderlineTabPanel,
  UnderlineTabs,
  useShellMenu,
} from "@/components/shared"
import type { IconName } from "@/lib/icons/icon-names"
import { cn } from "@/lib/utils"

import { useNotifications } from "../data/queries"
import { EventSheet } from "./event-sheet"
import { attentionActions, PhoneStats, SlotBar } from "./live-parts"
import { People, Timeline } from "./live-phone-tabs"
import type { EventSummary } from "@/lib/live/model"
import type { LiveBoard } from "./use-live-board"

type Tab = "events" | "timeline" | "people"
const TABS: { value: Tab; label: string; icon: IconName }[] = [
  { value: "events", label: "Events", icon: "calendar_month" },
  { value: "timeline", label: "Timeline", icon: "schedule" },
  { value: "people", label: "People", icon: "group" },
]

const ROW_PRESS = "transition-[transform,background-color] duration-160 active:scale-97"

/**
 * Phone event row, kept to two lines and the bar: venue and (only when something is wrong) its
 * status, then time and fill. Relative time and the on-site/open breakdown live in the event
 * sheet; the bar's label still says them in words.
 */
function EventRow({ event, onOpen }: { event: EventSummary; onOpen: () => void }) {
  const problem = event.health.status.tone !== "ok"
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full animate-rise flex-col gap-2.5 border-0 border-b border-line bg-transparent py-4 text-left text-fg",
        ROW_PRESS,
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <span className="min-w-0 text-17 leading-x125 font-semibold">{event.venue}</span>
          {problem && <StatusBadge status={event.health.status} size="sm" className="flex-none" />}
        </div>
        <span className="flex items-center gap-1.5 text-14 text-fg-2">
          <Icon name="schedule" filled size={16} className="text-accent-text" />
          <span>
            {event.time} · <b className="font-semibold text-fg">{event.filledOf}</b>
          </span>
        </span>
      </div>
      <SlotBar bar={event.bar} label={event.legend} />
    </button>
  )
}

/** Live Board for phone and tablet: the "need you" count, attention cards and three views. */
export function LivePhone({ board }: { board: LiveBoard }) {
  const menu = useShellMenu()
  const unread = useNotifications().data?.unread ?? 0
  const [tab, setTab] = useState<Tab>("events")
  const [openId, setOpenId] = useState<string | null>(null)
  const { pulse } = board
  const selected = board.summaries.find((e) => e.id === openId) ?? null

  return (
    <div className="relative min-h-full">
      <div className="mx-auto box-border flex w-full max-w-180 flex-col gap-6 px-5 pt-[calc(var(--safe-top)+10px)] pb-35">
        <div className="sticky top-(--safe-top) z-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => menu.setOpen(true)}
            className="flex h-14 items-center gap-3 rounded-pill border-0 glass pr-5.5 pl-4.5 text-fg"
          >
            <Icon name="menu" filled weight={600} size={26} />
            <span className="text-19 leading-x100 font-semibold tracking-n010">Live Board</span>
          </button>
          <div className="flex items-center gap-2.5">
            <NotificationBell unread={unread} variant="glass" />
            <button
              type="button"
              aria-label="Find a person"
              onClick={() => setTab("people")}
              className="grid size-14 place-items-center rounded-pill border-0 glass text-fg"
            >
              <Icon name="search" filled size={26} />
            </button>
          </div>
        </div>

        <h1 className="sr-only">Live Board</h1>
        <PhoneStats pulse={pulse} yesterday={board.yesterday} />

        <UnderlineTabs
          label="Live Board view"
          items={TABS}
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="gap-6"
          listClassName="-mx-5 gap-6 px-5"
        >
          <UnderlineTabPanel value="events" className="flex flex-col gap-6">
            {board.attention.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {board.attention.map((item, i) => (
                  <div
                    key={item.key}
                    style={{
                      animationDelay: board.leaving[item.key] ? undefined : `${80 + i * 70}ms`,
                    }}
                    className={cn(
                      "overflow-hidden rounded-card",
                      board.leaving[item.key] ? "animate-out" : "animate-rise",
                    )}
                  >
                    <AttentionCard
                      variant="solid"
                      primary="bad"
                      tone={item.tone}
                      icon={item.icon}
                      title={item.title}
                      meta={item.sub}
                      selfie={item.selfie}
                      selfieUrl={item.selfieUrl}
                      actions={attentionActions(item, board.run)}
                      className="gap-3.5 rounded-card p-4"
                    />
                  </div>
                ))}
              </div>
            )}
            <section className="flex flex-col gap-1.5" aria-labelledby="all-events">
              <h2
                id="all-events"
                className="m-0 mt-1 font-display text-22 font-semibold tracking-n020"
              >
                All events
              </h2>
              <div className="flex flex-col border-t border-line">
                {board.summaries.map((event) => (
                  <EventRow key={event.id} event={event} onOpen={() => setOpenId(event.id)} />
                ))}
              </div>
            </section>
          </UnderlineTabPanel>
          <UnderlineTabPanel value="timeline">
            <Timeline board={board} onOpen={setOpenId} />
          </UnderlineTabPanel>
          <UnderlineTabPanel value="people">
            <People board={board} />
          </UnderlineTabPanel>
        </UnderlineTabs>
      </div>

      <EventSheet
        event={selected}
        onClose={() => setOpenId(null)}
        onAssign={board.assign}
        onAddSlot={board.addSlot}
        onBroadcast={board.broadcastEvent}
        onMessage={board.messageCrew}
      />
      <ToastPill message={board.toast} />
    </div>
  )
}
