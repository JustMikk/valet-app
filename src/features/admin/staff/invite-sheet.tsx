"use client"

import { useState } from "react"

import { Icon, PillTabs, ResponsiveSheet, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { formatPhone, phoneKey } from "@/lib/contact/contact"
import type { InviteEntry, InviteResult } from "@/lib/data"

import { ErrorNotice } from "../data/query-state"
import { useInvite } from "../data/queries"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Mode = "email" | "phone"
const MODES = [
  { value: "email" as const, label: "By email" },
  { value: "phone" as const, label: "By phone" },
]

const labelOf = (entry: InviteEntry) =>
  "email" in entry ? entry.email : `${entry.name} · ${formatPhone(entry.phone)}`
const keyOf = (entry: InviteEntry) =>
  "email" in entry ? entry.email : (phoneKey(entry.phone) ?? entry.phone)

type InviteSheetProps = { open: boolean; onOpenChange: (open: boolean) => void }

/**
 * Invite by email or by phone (ADR-025): each person becomes a removable chip. By email, Enter or a
 * comma adds the address; by phone, a name goes with the number. They sign in with what they were
 * invited with.
 */
export function InviteSheet({ open, onOpenChange }: InviteSheetProps) {
  const [mode, setMode] = useState<Mode>("email")
  const [entries, setEntries] = useState<InviteEntry[]>([])
  const [draft, setDraft] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [skipped, setSkipped] = useState<string[]>([])
  const [texts, setTexts] = useState<Pick<InviteResult, "texted" | "notTexted"> | null>(null)
  const invite = useInvite()

  const push = (entry: InviteEntry) =>
    setEntries((list) => (list.some((e) => keyOf(e) === keyOf(entry)) ? list : [...list, entry]))

  const addEmail = () => {
    const value = draft.trim().replace(/,$/, "").toLowerCase()
    if (EMAIL.test(value)) push({ email: value })
    setDraft("")
  }

  const phoneOk = phoneKey(phone) !== null
  const addPhone = () => {
    if (!phoneOk || !name.trim()) return
    push({ phone: formatPhone(phone), name: name.trim() })
    setName("")
    setPhone("")
  }

  const send = () =>
    invite.mutate(entries, {
      onSuccess: (result) => {
        setEntries([])
        setSkipped(result.skipped)
        // Stay open to say what was texted (ADR-026) or skipped; otherwise there is nothing to add.
        const texted = result.texted > 0 || result.notTexted.length > 0
        setTexts(texted ? { texted: result.texted, notTexted: result.notTexted } : null)
        if (result.skipped.length === 0 && !texted) onOpenChange(false)
      },
    })

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSkipped([])
          setTexts(null)
        }
        onOpenChange(next)
      }}
      title="Invite staff"
      description="They sign in with the email or phone number you invite them with. No app store needed."
    >
      <PillTabs label="Invite by" size="sm" items={MODES} value={mode} onValueChange={setMode} />

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map((entry) => (
            <span
              key={keyOf(entry)}
              className="inline-flex h-8.5 items-center gap-1 rounded-pill bg-surface pr-1.5 pl-3 text-14 font-medium"
            >
              <Icon name={"email" in entry ? "mail" : "call"} size={16} className="text-fg-2" />
              {labelOf(entry)}
              <button
                type="button"
                aria-label={`Remove ${labelOf(entry)}`}
                onClick={() => setEntries((list) => list.filter((e) => keyOf(e) !== keyOf(entry)))}
                className="grid size-6 place-items-center rounded-pill border-0 bg-transparent text-fg-2"
              >
                <Icon name="close" size={16} />
              </button>
            </span>
          ))}
        </div>
      )}

      {mode === "email" ? (
        <div className="flex min-h-14 items-center rounded-field bg-surface px-3 py-2 shadow-[inset_0_0_0_2px_var(--fg)]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addEmail()
              }
            }}
            onBlur={addEmail}
            type="email"
            aria-label="Add email"
            placeholder="Add email…"
            className="min-w-30 flex-1 border-0 bg-transparent p-0 text-15 text-fg outline-none placeholder:text-fg-3"
          />
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            addPhone()
          }}
        >
          <TextField
            label="Name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kevin Nguyen"
          />
          <TextField
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(713) 555-0120"
            error={phone.trim() && !phoneOk ? "Enter a full phone number" : undefined}
          />
          <Button
            type="submit"
            variant="secondary"
            className="gap-1.5 text-16"
            disabled={!phoneOk || !name.trim()}
          >
            <Icon name="person_add" size={20} />
            Add to the list
          </Button>
        </form>
      )}

      {skipped.length > 0 && (
        <p role="status" className="m-0 text-14 leading-x140 font-medium text-fg-2">
          {skipped.join(", ")} {skipped.length === 1 ? "is" : "are"} already on your team.
        </p>
      )}
      {texts && (
        <div role="status" className="flex flex-col gap-1 text-14 leading-x140 font-medium">
          {texts.texted > 0 && (
            <span className="flex items-center gap-1.5 text-ok">
              <Icon name="check_circle" filled size={18} />
              Texted {texts.texted} invite{texts.texted > 1 ? "s" : ""}.
            </span>
          )}
          {texts.notTexted.map((miss) => (
            <span key={miss.who} className="flex items-center gap-1.5 text-warn">
              <Icon name="error" filled size={18} />
              Not texted to {miss.who}: {miss.reason}.
            </span>
          ))}
        </div>
      )}
      {invite.error && <ErrorNotice message={invite.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={entries.length === 0 || invite.isPending}
        onClick={send}
      >
        {entries.length
          ? `Send ${entries.length} invite${entries.length > 1 ? "s" : ""}`
          : mode === "email"
            ? "Add an email"
            : "Add a name and phone"}
      </Button>
    </ResponsiveSheet>
  )
}
