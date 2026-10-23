"use client"

import { Icon, ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { sheetSlots, type EventSummary } from "@/lib/live/model"
import { SlotBar, SlotRow } from "./live-parts"

type EventSheetProps = {
  /** The event shown; null closes the sheet. */
  event: EventSummary | null
  onClose: () => void
  onAssign: (eventId: string) => void
  onAddSlot: (eventId: string) => void
  onBroadcast: (eventId: string) => void
  onMessage: (eventId: string) => void
}

/** Phone roster for one event: coverage, every slot with its state, and crew actions. */
export function EventSheet({
  event,
  onClose,
  onAssign,
  onAddSlot,
  onBroadcast,
  onMessage,
}: EventSheetProps) {
  return (
    <ResponsiveSheet
      open={event !== null}
      onOpenChange={(open) => !open && onClose()}
      title={event?.venue ?? "Event"}
      description={event ? `${event.time} · ${event.rel}` : undefined}
      titleHidden
      dismissible={false}
    >
      {event && (
        <>
          <div className="flex items-start gap-3">
            <div aria-hidden="true" className="flex flex-1 flex-col gap-0.75">
              <span className="font-display text-26 leading-x115 font-bold tracking-n025">
                {event.venue}
              </span>
              <span className="text-15 text-fg-2">
                {event.time} · {event.rel}
              </span>
            </div>
            <Button
              variant="secondary"
              aria-label="Close"
              className="size-11 flex-none p-0"
              onClick={onClose}
            >
              <Icon name="close" size={22} />
            </Button>
          </div>
          <SlotBar bar={event.bar} label={event.legend} grow={false} />
          <div className="flex justify-between text-14 font-medium text-fg-2">
            <span>{event.legend}</span>
            <span className="font-semibold text-fg">{event.filledOf}</span>
          </div>
          <ul className="m-0 no-scrollbar flex max-h-[45dvh] list-none flex-col overflow-y-auto p-0">
            {sheetSlots(event).map(({ slot }) => (
              <SlotRow key={slot.id} slot={slot} onAssign={() => onAssign(event.id)} />
            ))}
          </ul>
          <div className="flex gap-2 border-t border-line pt-3">
            <Button
              variant="secondary"
              size="sm"
              className="h-13 flex-1 text-15"
              onClick={() => onAddSlot(event.id)}
            >
              Add slot
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-13 flex-1 text-15"
              onClick={() => onBroadcast(event.id)}
            >
              Broadcast
            </Button>
            <Button
              variant="strong"
              size="sm"
              className="h-13 flex-1 text-15"
              onClick={() => onMessage(event.id)}
            >
              Message crew
            </Button>
          </div>
        </>
      )}
    </ResponsiveSheet>
  )
}
