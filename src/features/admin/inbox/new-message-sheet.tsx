"use client"

import { ResponsiveSheet } from "@/components/shared"

import { useStaff } from "../data/queries"

type NewMessageSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (staffId: string) => void
}

/** Pick a valet to start a 1:1 conversation with, from the inbox itself. */
export function NewMessageSheet({ open, onOpenChange, onPick }: NewMessageSheetProps) {
  const staff = useStaff()
  const people = (staff.data?.rows ?? []).filter((person) => person.bucket !== "inactive")

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="New message">
      <ul
        aria-label="Staff"
        className="m-0 flex max-h-[min(22rem,45dvh)] list-none flex-col overflow-y-auto overscroll-contain border-y border-line p-0"
      >
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => {
                onPick(person.id)
                onOpenChange(false)
              }}
              className="box-content flex min-h-15.5 w-full items-center gap-3 border-0 border-b border-line bg-transparent p-0 text-left text-fg last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="grid size-10 flex-none place-items-center rounded-pill bg-surface-2 text-14 font-semibold"
              >
                {person.initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-16 font-semibold">{person.name}</span>
                <span className="truncate text-13 text-fg-2">{person.email}</span>
              </span>
            </button>
          </li>
        ))}
        {people.length === 0 && <li className="py-6 text-15 text-fg-2">No staff yet.</li>}
      </ul>
    </ResponsiveSheet>
  )
}
