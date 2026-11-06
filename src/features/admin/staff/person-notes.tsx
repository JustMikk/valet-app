"use client"

import { useState } from "react"

import { Icon, TextField } from "@/components/shared"
import { Button } from "@/components/ui/button"
import type { StaffNote } from "@/lib/data"

import { ErrorNotice } from "../data/query-state"
import { useStaffNoteActions } from "../data/person-queries"

/** Admins' private notes on a valet: what the numbers don't show. Valets never see these. */
export function PersonNotes({ staffId, notes }: { staffId: string; notes: StaffNote[] }) {
  const { add, remove } = useStaffNoteActions(staffId)
  const [draft, setDraft] = useState("")
  const body = draft.trim()

  return (
    <div className="flex max-w-170 flex-col gap-4">
      <form
        className="flex flex-col gap-2.5"
        onSubmit={(event) => {
          event.preventDefault()
          if (body) add.mutate(body, { onSuccess: () => setDraft("") })
        }}
      >
        <TextField
          multiline
          label="Add a note"
          description="Only admins see notes. Good for praise, warnings and things to remember."
          rows={3}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="submit"
          variant="strong"
          className="self-start text-16"
          disabled={!body || add.isPending}
        >
          Save note
        </Button>
      </form>
      {(add.error ?? remove.error) && (
        <ErrorNotice message={(add.error ?? remove.error)?.message ?? ""} />
      )}
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {notes.map((note) => (
          <li
            key={note.id}
            className="flex items-start gap-3 rounded-r20 border border-line bg-elev p-4"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-15 [overflow-wrap:anywhere] whitespace-pre-line">
                {note.body}
              </span>
              <span className="text-12 text-fg-3">
                {note.author} · {note.when}
              </span>
            </span>
            <Button
              variant="ghost"
              size="xs"
              aria-label="Delete note"
              disabled={remove.isPending}
              onClick={() => remove.mutate(note.id)}
            >
              <Icon name="close" size={18} />
            </Button>
          </li>
        ))}
        {notes.length === 0 && <li className="py-6 text-15 text-fg-2">No notes yet.</li>}
      </ul>
    </div>
  )
}
