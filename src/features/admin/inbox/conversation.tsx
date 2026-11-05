"use client"

import { useState } from "react"

import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"

import { ErrorNotice, QueryState } from "../data/query-state"
import { useReply, useThread } from "../data/queries"

type ConversationProps = { id: string | undefined; onBack?: () => void }

/** The open conversation with a staff member: bubbles and a glass reply bar. */
export function Conversation({ id, onBack }: ConversationProps) {
  const thread = useThread(id)
  const reply = useReply()
  const [draft, setDraft] = useState("")
  const data = thread.data

  const send = () => {
    const text = draft.trim()
    if (!text || !data) return
    reply.mutate({ id: data.id, text }, { onSuccess: () => setDraft("") })
  }

  return (
    <section
      aria-label={data ? `Conversation with ${data.name}` : "Conversation"}
      className="flex min-w-0 flex-col gap-3"
    >
      <QueryState query={thread} rows={2}>
        {(t) => (
          <>
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
                {t.announcement ? <Icon name="campaign" filled size={22} /> : t.initials}
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-17 font-semibold">{t.name}</span>
                <span className="text-13 text-fg-2">{t.subtitle}</span>
              </div>
            </div>
            {t.messages.map((message) => (
              <div
                key={message.id}
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
            {t.messages.length === 0 && (
              <p className="m-0 py-6 text-center text-15 text-fg-2">No messages yet.</p>
            )}
            {reply.error && <ErrorNotice message={reply.error.message} />}
            {t.canReply && (
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
                  aria-label={`Reply to ${t.name.split(" ")[0]}`}
                  placeholder={`Reply to ${t.name.split(" ")[0]}`}
                  className="h-11 min-w-0 flex-1 rounded-pill border-0 bg-surface px-4 text-16 text-fg outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={!draft.trim() || reply.isPending}
                  className="grid size-11 place-items-center rounded-pill border-0 bg-accent text-white transition-transform duration-160 active:scale-94 disabled:bg-surface-2 disabled:text-fg-3"
                >
                  <Icon name="arrow_upward" size={22} />
                </button>
              </form>
            )}
          </>
        )}
      </QueryState>
    </section>
  )
}
