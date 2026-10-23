"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Icon, PageContainer, PillTabs, useShellMenu } from "@/components/shared"
import { cn } from "@/lib/utils"

import { QueryState } from "../data/query-state"
import { useMessages, useNotifications, useSendMessage } from "../data/queries"
import { ChatBubble } from "./chat-bubble"
import { forTab, type InboxTab } from "./chat-tabs"

const TABS = [
  { value: "chat" as const, label: "Chat" },
  { value: "announcements" as const, label: "Announcements" },
]

/** Single dispatch thread: bubbles, a broadcast with a claimable event, and a composer. */
export function StaffInbox() {
  const router = useRouter()
  const { setNotificationsOpen } = useShellMenu()
  const [draft, setDraft] = useState("")
  const messages = useMessages()
  const unread = useNotifications().data?.unread ?? 0
  const sendMessage = useSendMessage()
  const end = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<InboxTab>("chat")
  const visible = forTab(messages.data ?? [], tab)
  const count = visible.length

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [count, tab])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    sendMessage.mutate(text)
  }

  const canSend = draft.trim().length > 0

  return (
    <PageContainer bottom="flush" className="min-h-full max-w-280">
      <div className="mx-auto flex min-h-full w-full max-w-190 flex-col">
        <div className="flex items-center gap-3.5 border-b border-line pb-4">
          <div className="grid size-13 flex-none place-items-center rounded-r16 bg-white shadow-[inset_0_0_0_1px_var(--line)]">
            <Image
              src="/brand/regency-logo.png"
              alt=""
              width={44}
              height={25}
              className="h-auto w-11"
            />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="font-display text-22 leading-x120 font-semibold tracking-n020">
              Regency Dispatch
            </span>
            <span className="text-14 text-fg-2">
              Jamie, Alex and the dispatch team · usually reply in minutes
            </span>
          </div>
          <button
            type="button"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            onClick={() => setNotificationsOpen(true)}
            className="relative grid size-12 place-items-center rounded-pill border-0 bg-surface text-fg"
          >
            <Icon name="notifications" filled size={24} />
            {unread > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2.25 size-2.25 rounded-pill bg-bad"
              />
            )}
          </button>
        </div>

        <PillTabs label="Inbox" items={TABS} value={tab} onValueChange={setTab} className="mt-4" />

        <div className="flex flex-1 flex-col gap-3.5 pt-4.5 pb-27.5">
          <QueryState query={messages} rows={4}>
            {() =>
              visible.length === 0 ? (
                <p className="m-0 py-10 text-center text-15 text-fg-2">
                  {tab === "announcements"
                    ? "No announcements yet."
                    : "No messages yet. Say hi to dispatch below."}
                </p>
              ) : (
                visible.map((m) =>
                  m.kind === "day" ? (
                    <span
                      key={m.id}
                      className="self-center py-1.5 text-12 font-semibold tracking-p040 text-fg-3"
                    >
                      {m.text}
                    </span>
                  ) : (
                    <ChatBubble key={m.id} message={m} onClaim={() => router.push("/staff/open")} />
                  ),
                )
              )
            }
          </QueryState>
          <div ref={end} aria-hidden="true" />
        </div>

        {tab === "chat" && (
          <div className="absolute right-4 bottom-27 left-4 z-12 flex items-center gap-2 rounded-pill glass p-2 tablet:sticky tablet:right-auto tablet:bottom-0 tablet:left-auto tablet:mb-6">
            <button
              type="button"
              aria-label="Attach photo"
              className="grid size-12 flex-none place-items-center rounded-pill border-0 bg-surface text-fg"
            >
              <Icon name="add_photo_alternate" size={24} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              aria-label="Message dispatch"
              placeholder="Message dispatch"
              className="h-12 min-w-0 flex-1 rounded-pill border-0 bg-surface px-4.5 text-17 text-fg caret-accent outline-none placeholder:text-fg-3 focus:shadow-[inset_0_0_0_1.5px_var(--fg)]"
            />
            <button
              type="button"
              aria-label="Send"
              onClick={send}
              className={cn(
                "grid size-12 flex-none place-items-center rounded-pill border-0 transition-[background-color,color,transform] duration-200 active:scale-92",
                canSend ? "bg-accent text-accent-ink" : "bg-surface text-fg-3",
              )}
            >
              <Icon name="arrow_upward" size={24} />
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
