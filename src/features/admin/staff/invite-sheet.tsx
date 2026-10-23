"use client"

import { useState } from "react"

import { Icon, ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { ErrorNotice } from "../data/query-state"
import { useInvite } from "../data/queries"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type InviteSheetProps = { open: boolean; onOpenChange: (open: boolean) => void }

/** Invite by email: addresses become removable chips; Enter or comma adds the typed one. */
export function InviteSheet({ open, onOpenChange }: InviteSheetProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [skipped, setSkipped] = useState<string[]>([])
  const invite = useInvite()

  const add = () => {
    const value = draft.trim().replace(/,$/, "").toLowerCase()
    if (EMAIL.test(value) && !emails.includes(value)) setEmails((list) => [...list, value])
    setDraft("")
  }

  const send = () =>
    invite.mutate(emails, {
      onSuccess: (result) => {
        setEmails([])
        setSkipped(result.skipped)
        if (result.skipped.length === 0) onOpenChange(false)
      },
    })

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setSkipped([])
        onOpenChange(next)
      }}
      title="Invite staff"
      description="They get an email link to join Regency. No app store needed."
    >
      <div className="flex min-h-14 flex-wrap items-center gap-1.5 rounded-field bg-surface px-3 py-2 shadow-[inset_0_0_0_2px_var(--fg)]">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex h-8.5 items-center gap-1 rounded-pill bg-elev pr-1.5 pl-3 text-14 font-medium"
          >
            {email}
            <button
              type="button"
              aria-label={`Remove ${email}`}
              onClick={() => setEmails((list) => list.filter((e) => e !== email))}
              className="grid size-6 place-items-center rounded-pill border-0 bg-transparent text-fg-2"
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          type="email"
          aria-label="Add email"
          placeholder="Add email…"
          className="min-w-30 flex-1 border-0 bg-transparent p-0 text-15 text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      {skipped.length > 0 && (
        <p role="status" className="m-0 text-14 leading-x140 font-medium text-fg-2">
          {skipped.join(", ")} {skipped.length === 1 ? "is" : "are"} already on your team.
        </p>
      )}
      {invite.error && <ErrorNotice message={invite.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={emails.length === 0 || invite.isPending}
        onClick={send}
      >
        {emails.length
          ? `Send ${emails.length} invite${emails.length > 1 ? "s" : ""}`
          : "Add an email"}
      </Button>
    </ResponsiveSheet>
  )
}
