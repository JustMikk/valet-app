"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Icon, PageContainer } from "@/components/shared"
import { cn } from "@/lib/utils"
import { CHAT_MESSAGES } from "@/mocks/staff"

import { ChatBubble } from "./chat-bubble"

type Sent = { id: number; text: string; status: string }

/** Single dispatch thread: bubbles, a broadcast with a claimable event, and a composer. */
export function StaffInbox() {
  const router = useRouter()
  const [draft, setDraft] = useState("")
  const [sent, setSent] = useState<Sent[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const mark = (id: number, status: string) =>
    setSent((all) => all.map((m) => (m.id === id ? { ...m, status } : m)))

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const id = Date.now()
    setDraft("")
    setSent((all) => [...all, { id, text, status: "Sending…" }])
    // Simulated delivery: sending → delivered → read (the real status comes from the backend).
    timers.current.push(
      setTimeout(() => mark(id, "Delivered"), 700),
      setTimeout(() => mark(id, "Read by Jamie"), 2200),
    )
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
            aria-label="Notifications"
            onClick={() => router.push("/staff/notifications")}
            className="relative grid size-12 place-items-center rounded-pill border-0 bg-surface text-fg"
          >
            <Icon name="notifications" filled size={24} />
            <span
              aria-hidden="true"
              className="absolute top-2 right-2.25 size-2.25 rounded-pill bg-bad"
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 pt-4.5 pb-27.5">
          {CHAT_MESSAGES.map((m, i) =>
            m.kind === "day" ? (
              <span
                key={i}
                className="self-center py-1.5 text-12 font-semibold tracking-p040 text-fg-3"
              >
                {m.text}
              </span>
            ) : (
              <ChatBubble key={i} message={m} onClaim={() => router.push("/staff/open")} />
            ),
          )}
          {sent.map((m) => (
            <ChatBubble
              key={m.id}
              message={{ kind: "message", text: m.text, meta: m.status, from: "me" }}
              onClaim={() => {}}
            />
          ))}
        </div>

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
      </div>
    </PageContainer>
  )
}
