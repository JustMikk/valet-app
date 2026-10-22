import { cn } from "@/lib/utils"

type ToggleSwitchProps = {
  on: boolean
  /** Locked-on switches (always-on notifications) draw in grey instead of green. */
  locked?: boolean
  className?: string
}

/**
 * Visual switch track and knob (52 × 32). Decorative: put it inside the control that owns the
 * state (a `role="switch"` row) so the whole row is the hit target.
 */
export function ToggleSwitch({ on, locked = false, className }: ToggleSwitchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block h-8 w-13 flex-none rounded-pill transition-colors duration-200",
        on ? (locked ? "bg-fg-3-line" : "bg-ok") : "bg-surface-2",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.75 size-6.5 rounded-pill bg-white shadow-knob transition-[left] duration-220 ease-knob",
          on ? "left-5.75" : "left-0.75",
        )}
      />
    </span>
  )
}
