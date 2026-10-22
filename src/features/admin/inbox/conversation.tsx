"use client"

import { useState } from "react"

import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"
import { THREAD_MESSAGES } from "@/mocks/admin"

type Message = { text: string; meta: string; mine: boolean }

/** The open conversation with a staff member: bubbles and a glass reply bar. */
export function Conversation({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([...THREAD_MESSAGES])
  const [draft, setDraft] = useState("")

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((list) => [...list, { text, meta: "Just now · Jamie", mine: true }])
    setDraft("")
  }

  return (
    <section aria-label="Conversation with Jordan Ellis" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        {onBack && (
          <button
            type="button"
            aria-label="All messages"
            onClick={onBack}
            className="grid size-11 flex-none place-items-center rounded-pill border-0 bg-surface text-fg"
          >
            <Icon name="arrow_back" size={22} />
          </button>
        )}
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-pill bg-surface-2 text-15 font-semibold"
        >
          JE
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-17 font-semibold">Jordan Ellis</span>
          <span className="text-13 text-fg-2">On site · The Grand Hotel</span>
        </div>
      </div>
      {messages.map((message, i) => (
        <div
          key={i}
          className={cn(
            "flex max-w-4/5 animate-rise flex-col gap-1 px-3.75 py-3 text-16 leading-x145",
            message.mine
              ? "self-end rounded-[20px_20px_6px_20px] bg-fg text-bg"
              : "self-start rounded-[20px_20px_20px_6px] bg-surface text-fg",
          )}
        >
          {message.text}
          <span className="text-12 font-medium opacity-60">{message.meta}</span>
        </div>
      ))}
      <form
        className="mt-2 flex gap-2 rounded-pill glass p-2"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Reply to Jordan"
          placeholder="Reply to Jordan"
          className="h-11 min-w-0 flex-1 rounded-pill border-0 bg-surface px-4 text-16 text-fg outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim()}
          className="grid size-11 place-items-center rounded-pill border-0 bg-accent text-accent-ink transition-transform duration-160 active:scale-94 disabled:bg-surface-2 disabled:text-fg-3"
        >
          <Icon name="arrow_upward" size={22} />
        </button>
      </form>
    </section>
  )
}
