"use client"

import { useState } from "react"

import { ResponsiveSheet } from "@/components/shared"
import { Button } from "@/components/ui/button"

import { FIELD_CONTROL, FormField } from "../common/form-field"
import { ErrorNotice } from "../data/query-state"
import { useUpdateEvent } from "../data/queries"

type Editable = { date: string; start: string; end: string; name: string }

type Props = {
  eventId: string
  initial: Editable
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Edit the event's date, time window and name. The crew is notified when the time changes. */
export function EditEventSheet({ eventId, initial, open, onOpenChange }: Props) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit event details"
      description="Changing the time or name notifies all assigned staff."
    >
      {open && <EditForm eventId={eventId} initial={initial} onDone={() => onOpenChange(false)} />}
    </ResponsiveSheet>
  )
}

function EditForm({
  eventId,
  initial,
  onDone,
}: {
  eventId: string
  initial: Editable
  onDone: () => void
}) {
  const update = useUpdateEvent()
  const [form, setForm] = useState<Editable>(initial)
  const set = (patch: Partial<Editable>) => setForm((v) => ({ ...v, ...patch }))

  const changed =
    form.date !== initial.date ||
    form.start !== initial.start ||
    form.end !== initial.end ||
    form.name !== initial.name

  const save = () => {
    const patch: Record<string, string> = {}
    if (form.date !== initial.date) patch.date = form.date
    if (form.start !== initial.start) patch.start = form.start
    if (form.end !== initial.end) patch.end = form.end
    if (form.name !== initial.name) patch.name = form.name
    update.mutate({ id: eventId, patch }, { onSuccess: onDone })
  }

  return (
    <>
      <FormField label="Date" icon="calendar_month" htmlFor="ee-date">
        <input
          id="ee-date"
          type="date"
          required
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
          className={FIELD_CONTROL}
        />
      </FormField>
      <div className="flex gap-2.5">
        <FormField label="Starts" icon="schedule" htmlFor="ee-start">
          <input
            id="ee-start"
            type="time"
            required
            value={form.start}
            onChange={(e) => set({ start: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Ends" icon="schedule" htmlFor="ee-end">
          <input
            id="ee-end"
            type="time"
            required
            value={form.end}
            onChange={(e) => set({ end: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>
      <FormField label="Event name" icon="edit" htmlFor="ee-name">
        <input
          id="ee-name"
          required
          maxLength={80}
          value={form.name}
          placeholder="Wedding, Gala, Corporate dinner…"
          onChange={(e) => set({ name: e.target.value })}
          className={`${FIELD_CONTROL} placeholder:text-fg-3`}
        />
      </FormField>
      {update.error && <ErrorNotice message={update.error.message} />}
      <Button
        variant="accent"
        className="text-17"
        disabled={!changed || update.isPending}
        onClick={save}
      >
        {changed ? "Save and notify crew" : "No changes"}
      </Button>
    </>
  )
}
