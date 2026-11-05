"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Icon, PillTabs } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useBreakpoint } from "@/hooks/use-breakpoint"
import type { Thread } from "@/lib/data"
import { cn } from "@/lib/utils"

import { TABLE_CARD } from "../common/data-table"
import { Pager, usePager } from "../common/pager"
import { AdminHead, AdminPage } from "../common/admin-page"
import { QueryState } from "../data/query-state"
import { useInbox } from "../data/queries"
import { Conversation } from "./conversation"
import { NewMessageSheet } from "./new-message-sheet"

type InboxTab = "messages" | "announcements"

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
        "flex min-h-17 w-full items-center gap-3 border-0 border-b border-line px-4 py-1.5 text-left text-fg transition-colors duration-160 last:border-b-0",
        selected ? "bg-surface" : "bg-transparent hover:bg-surface/60",
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
          <span className="flex-none text-13 font-medium text-fg-3">{thread.time}</span>
        </span>
        <span className="truncate text-14 text-fg-2">{thread.last}</span>
      </span>
      {thread.unread && (
        <span role="img" aria-label="Unread" className="size-2.5 flex-none rounded-r9 bg-accent" />
      )}
    </button>
  )
}

/**
 * Admin inbox: thread list and conversation side by side from tablet; one at a time on phone.
 * The open thread lives in `?thread=` so a person's "Message" button can land on it.
 */
export function AdminInbox() {
  const router = useRouter()
  const phone = useBreakpoint() === "phone"
  const inbox = useInbox()
  const requested = useSearchParams().get("thread") ?? undefined
  const [picked, setPicked] = useState<InboxTab | null>(null)
  const [newMessageOpen, setNewMessageOpen] = useState(false)

  const threads = inbox.data?.threads ?? []
  // Opening a thread from elsewhere (a person's Message button) lands on the tab it belongs to.
  const requestedThread = threads.find((t) => t.id === requested)
  const tab: InboxTab = picked ?? (requestedThread?.announcement ? "announcements" : "messages")
  const shown = threads.filter((t) => t.announcement === (tab === "announcements"))
  const pager = usePager(shown, 7)
  const unreadIn = (announcement: boolean) =>
    threads.filter((t) => t.announcement === announcement && t.unread).length
  const tabs = [
    { value: "messages" as const, label: "Chats", count: unreadIn(false) || undefined },
    { value: "announcements" as const, label: "Announcements", count: unreadIn(true) || undefined },
  ]

  const open = requested !== undefined
  const showList = !phone || !open
  const showThread = !phone || open
  const selected = requested ?? (phone ? undefined : shown[0]?.id)
  const data = inbox.data

  // Phone: the filters sit over the list; from tablet they live in the top bar.
  const tabsFor = (className?: string) => (
    <PillTabs
      className={className}
      label="Inbox"
      items={tabs}
      value={tab}
      onValueChange={(next) => {
        setPicked(next)
        // The open thread belongs to the other tab: show that tab's first one instead.
        if (requestedThread && requestedThread.announcement !== (next === "announcements")) {
          router.replace("/admin/inbox")
        }
      }}
    />
  )

  return (
    <AdminPage>
      {!(phone && open) && (
        <AdminHead
          title="Inbox"
          sub={data ? (data.unread ? `${data.unread} unread` : "All caught up") : "…"}
          cta={{
            label: "Announce",
            icon: "campaign",
            onClick: () => router.push("/admin/inbox/announce"),
          }}
          tools={tabsFor()}
        />
      )}
      <div className="grid items-start gap-6 tablet:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)] desktop:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
        {showList && (
          <div className="flex flex-col gap-3.5">
            <Button
              variant="secondary"
              className="h-12 gap-2 text-16"
              onClick={() => setNewMessageOpen(true)}
            >
              <Icon name="add_circle" size={22} />
              New message
            </Button>
            {tabsFor("tablet:hidden")}
            <div className={TABLE_CARD}>
              <div className="flex flex-col">
                <QueryState query={inbox} rows={4}>
                  {() =>
                    shown.length === 0 ? (
                      <p className="m-0 py-8 text-center text-15 text-fg-2">
                        {tab === "announcements"
                          ? "No announcements sent yet."
                          : "No chats with staff yet."}
                      </p>
                    ) : (
                      pager.rows.map((thread) => (
                        <ThreadRow
                          key={thread.id}
                          thread={thread}
                          selected={!phone && thread.id === selected}
                          onOpen={() => router.replace(`/admin/inbox?thread=${thread.id}`)}
                        />
                      ))
                    )
                  }
                </QueryState>
              </div>
              <Pager {...pager} />
            </div>
          </div>
        )}
        {showThread && selected && (
          <Conversation
            key={selected}
            id={selected}
            onBack={phone ? () => router.replace("/admin/inbox") : undefined}
          />
        )}
      </div>
      <NewMessageSheet
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onPick={(staffId) => {
          setPicked("messages")
          router.replace(`/admin/inbox?thread=${staffId}`)
        }}
      />
    </AdminPage>
  )
}
