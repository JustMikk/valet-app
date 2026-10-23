"use client"

import { useEffect, useId, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Icon } from "@/components/shared"
import { places, type Place } from "@/lib/places"
import { cn } from "@/lib/utils"

const MIN_CHARS = 3
const DEBOUNCE_MS = 300

type PlaceSearchProps = {
  onPick: (place: Place) => void
  /** Shown in the box once something was picked. */
  picked?: string
}

/** The text after it has stopped changing for a moment, so a search runs per pause, not per key. */
function useSettled(value: string): string {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])
  return settled
}

/**
 * Search-as-you-type for a place: results appear under the box as the user types, and choosing one
 * hands back its name, address and coordinates. Keyboard: arrows move, Enter chooses, Escape closes.
 */
export function PlaceSearch({ onPick, picked }: PlaceSearchProps) {
  const listId = useId()
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const term = useSettled(text.trim())

  const search = useQuery({
    queryKey: ["places", term],
    queryFn: ({ signal }) => places.search(term, signal),
    enabled: term.length >= MIN_CHARS,
    staleTime: Infinity,
    retry: 0,
  })
  const results = text.trim().length >= MIN_CHARS ? (search.data ?? []) : []
  const showList = open && text.trim().length >= MIN_CHARS

  const choose = (place: Place) => {
    onPick(place)
    setText("")
    setOpen(false)
  }

  return (
    <div className="relative flex flex-col gap-2">
      <label htmlFor={`${listId}-input`} className="text-15 font-medium">
        Search for the venue
      </label>
      <div className="flex h-14 items-center gap-2.5 rounded-field bg-surface px-4 text-17">
        <Icon name="search" size={22} className="text-fg-2" />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={text}
          placeholder={picked ?? "Name or address, e.g. Ferry Building"}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === "Enter" && showList && results[active]) {
              e.preventDefault()
              choose(results[active])
            } else if (e.key === "Escape") {
              setOpen(false)
            }
          }}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-17 text-fg outline-none placeholder:text-fg-3"
        />
        {search.isFetching && <span className="text-13 text-fg-3">Searching…</span>}
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className="absolute top-full right-0 left-0 z-10 mt-1 flex max-h-72 list-none flex-col overflow-y-auto rounded-r18 bg-sheet p-1.5 shadow-dialog [backdrop-filter:var(--blur-lg)]"
        >
          {results.map((place, i) => (
            <li
              key={place.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the input's blur would close the list before a click lands.
              onMouseDown={(e) => {
                e.preventDefault()
                choose(place)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-r14 px-3 py-2.5",
                i === active && "bg-surface",
              )}
            >
              <span className="text-16 font-semibold">{place.name}</span>
              {place.address && <span className="text-13 text-fg-2">{place.address}</span>}
            </li>
          ))}
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-3 text-14 text-fg-2">
              {search.isError
                ? "Couldn’t search just now. Use your location or type the coordinates below."
                : search.isFetching || term !== text.trim()
                  ? "Searching…"
                  : "No places found. Try a nearby landmark or a street address."}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
