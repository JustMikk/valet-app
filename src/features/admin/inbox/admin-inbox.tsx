"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon } from "@/components/shared"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import { cn } from "@/lib/utils"
import { THREADS, type Thread } from "@/mocks/admin"

import { AdminHead, AdminPage } from "../common/admin-page"
import { Conversation } from "./conversation"

function ThreadRow({
  thread,
  selected,
  onOpen,
}: {
  thread: Thread
  selected: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-current={selected || undefined}
      onClick={onOpen}
      className={cn(
        "box-content flex min-h-18 w-full items-center gap-3 border-0 border-b border-line py-1.5 text-left text-fg tablet:px-3",
        selected ? "bg-surface tablet:rounded-r16" : "bg-transparent",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 flex-none place-items-center rounded-pill text-15 font-semibold",
          thread.announcement ? "bg-accent-soft text-accent-text" : "bg-surface-2",
        )}
      >
        {thread.announcement ? <Icon name="campaign" filled size={22} /> : thread.initials}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <span className="flex-1 truncate text-16 font-semibold">{thread.name}</span>
          <span className="text-13 font-medium text-fg-3">{thread.time}</span>
        </span>
        <span className="truncate text-14 text-fg-2">{thread.last}</span>
      </span>
      {thread.unread && (
        <span role="img" aria-label="Unread" className="size-2.5 flex-none rounded-r9 bg-accent" />
      )}
    </button>
  )
}

/** Admin inbox: thread list and conversation side by side from tablet; one at a time on phone. */
export function AdminInbox() {
  const router = useRouter()
  const phone = useBreakpoint() === "phone"
  const [selected, setSelected] = useState(0)
  const [open, setOpen] = useState(false)

  const showList = !phone || !open
  const showThread = !phone || open

  return (
    <AdminPage>
      {!(phone && open) && (
        <AdminHead
          title="Inbox"
          sub="2 unread"
          cta={{
            label: "Announce",
            icon: "campaign",
            onClick: () => router.push("/admin/inbox/announce"),
          }}
        />
      )}
      <div className="grid items-start gap-7 tablet:grid-cols-[minmax(17.5rem,22.5rem)_minmax(0,1fr)]">
        {showList && (
          <div className="flex flex-col border-t border-line">
            {THREADS.map((thread, i) => (
              <ThreadRow
                key={thread.name}
                thread={thread}
                selected={!phone && i === selected}
                onOpen={() => {
                  setSelected(i)
                  setOpen(true)
                }}
              />
            ))}
          </div>
        )}
        {showThread && <Conversation onBack={phone ? () => setOpen(false) : undefined} />}
      </div>
    </AdminPage>
  )
}
