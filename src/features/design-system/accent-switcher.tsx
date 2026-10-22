"use client"

import { ACCENT_OPTIONS } from "@/lib/tenant"
import { cn } from "@/lib/utils"

type AccentSwitcherProps = {
  value: string
  onChange: (hex: string) => void
}

/** Tenant accent picker in the Admin Settings style: 48 px swatches, selected = ring. */
export function AccentSwitcher({ value, onChange }: AccentSwitcherProps) {
  return (
    <div role="group" aria-label="Tenant accent" className="flex items-center gap-3">
      <span className="text-14 font-semibold text-fg">Tenant accent</span>
      {ACCENT_OPTIONS.map(({ hex, name }) => {
        const selected = hex === value.toUpperCase()
        return (
          <button
            key={hex}
            type="button"
            aria-label={`Accent ${name}`}
            aria-pressed={selected}
            onClick={() => onChange(hex)}
            className={cn(
              "size-12 rounded-pill border-0 transition-shadow duration-200",
              selected
                ? "shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--fg)]"
                : "shadow-[var(--swatch-edge)]",
            )}
            // The swatch is the data itself: each button is filled with its tenant color.
            style={{ backgroundColor: hex }}
          />
        )
      })}
    </div>
  )
}
