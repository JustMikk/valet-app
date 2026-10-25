import type { ReactNode } from "react"

import { Icon } from "@/components/shared"
import type { IconName } from "@/lib/icons/icon-names"

/** Class for the bare input / select inside a `FormField`. */
export const FIELD_CONTROL =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-17 text-fg outline-none"

type FormFieldProps = { label: string; icon: IconName; htmlFor: string; children: ReactNode }

/** Admin form row: label over a 56 px surface field with a leading icon (the New event pattern). */
export function FormField({ label, icon, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-15 font-medium">
        {label}
      </label>
      <div className="flex h-14 items-center gap-2.5 rounded-field bg-surface px-4 text-17">
        <Icon name={icon} size={22} className="text-fg-2" />
        {children}
      </div>
    </div>
  )
}
