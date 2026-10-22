"use client"

import { useState } from "react"

import { Icon, ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"

const SEED = ["kai.morgan@gmail.com", "ana.ruiz@outlook.com"]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type InviteSheetProps = { open: boolean; onOpenChange: (open: boolean) => void }

/** Invite by email: addresses become removable chips; Enter or comma adds the typed one. */
export function InviteSheet({ open, onOpenChange }: InviteSheetProps) {
  const [emails, setEmails] = useState<string[]>(SEED)
  const [draft, setDraft] = useState("")

  const add = () => {
    const value = draft.trim().replace(/,$/, "")
    if (EMAIL.test(value) && !emails.includes(value)) setEmails((list) => [...list, value])
    setDraft("")
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
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
      <Button
        variant="accent"
        className="text-17"
        disabled={emails.length === 0}
        onClick={() => onOpenChange(false)}
      >
        {emails.length
          ? `Send ${emails.length} invite${emails.length > 1 ? "s" : ""}`
          : "Add an email"}
      </Button>
    </ResponsiveSheet>
  )
}
