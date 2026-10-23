"use client"

import { cn } from "@/lib/utils"

import { FIELD_CONTROL, FormField } from "../common/form-field"

export type When = { date: string; start: string; end: string; name: string }

type EventWhenStepProps = { value: When; onChange: (next: When) => void }

/** Step: which day, from when to when, and what the event is called. */
export function EventWhenStep({ value, onChange }: EventWhenStepProps) {
  const set = (patch: Partial<When>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Date" icon="calendar_month" htmlFor="f-date">
        <input
          id="f-date"
          type="date"
          required
          value={value.date}
          onChange={(e) => set({ date: e.target.value })}
          className={FIELD_CONTROL}
        />
      </FormField>
      <div className="flex gap-2.5">
        <FormField label="Starts" icon="schedule" htmlFor="f-start">
          <input
            id="f-start"
            type="time"
            required
            value={value.start}
            onChange={(e) => set({ start: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
        <FormField label="Ends" icon="schedule" htmlFor="f-end">
          <input
            id="f-end"
            type="time"
            required
            value={value.end}
            onChange={(e) => set({ end: e.target.value })}
            className={FIELD_CONTROL}
          />
        </FormField>
      </div>
      <FormField label="Event name" icon="edit" htmlFor="f-name">
        <input
          id="f-name"
          required
          maxLength={80}
          value={value.name}
          placeholder="Sunday brunch"
          onChange={(e) => set({ name: e.target.value })}
          className={cn(FIELD_CONTROL, "placeholder:text-fg-3")}
        />
      </FormField>
    </div>
  )
}
