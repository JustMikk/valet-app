"use client"

import { Icon } from "@/components/shared"
import type { AvailableStaff } from "@/lib/data"
import { cn } from "@/lib/utils"

type StaffPickerProps = {
  people: AvailableStaff
  selected: readonly string[]
  onChange: (ids: string[]) => void
  /** How many can be chosen (the open spots); the rest of the boxes lock once it is reached. */
  max: number
}

/**
 * Available people as a checklist. The list scrolls inside its own box, so many people never
 * stretch the page, sheet or dialog it sits in.
 */
export function StaffPicker({ people, selected, onChange, max }: StaffPickerProps) {
  const full = selected.length >= max
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <ul
      aria-label="Available people"
      className="m-0 flex max-h-[min(22rem,45dvh)] list-none flex-col overflow-y-auto overscroll-contain border-y border-line p-0"
    >
      {people.map((person) => {
        const on = selected.includes(person.id)
        const locked = full && !on
        return (
          <li key={person.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={locked}
              onClick={() => toggle(person.id)}
              className="box-content flex min-h-15.5 w-full items-center gap-3 border-0 border-b border-line bg-transparent p-0 text-left text-fg last:border-b-0 disabled:opacity-45"
            >
              <span
                aria-hidden="true"
                className="grid size-10 flex-none place-items-center rounded-pill bg-surface-2 text-14 font-semibold"
              >
                {person.initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-16 font-semibold">{person.name}</span>
                <span className="text-13 text-fg-2">{person.note}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mr-1 grid size-7 flex-none place-items-center rounded-r8 text-bg transition-[background-color,box-shadow] duration-150",
                  on ? "bg-fg" : "bg-transparent shadow-[inset_0_0_0_2px_var(--line)]",
                )}
              >
                {on && <Icon name="check" size={20} />}
              </span>
            </button>
          </li>
        )
      })}
      {people.length === 0 && (
        <li className="py-6 text-15 text-fg-2">No one is free for this shift.</li>
      )}
    </ul>
  )
}
