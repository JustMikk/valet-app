import { cn } from "@/lib/utils"

type StepProgressProps = { steps: readonly string[]; current: number }

/** "Step 2 of 4 · When" over a row of bars, one per step; steps up to the current one are filled. */
export function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((label, i) => (
          <span
            key={label}
            className={cn(
              "h-1 flex-1 rounded-pill transition-colors duration-300",
              i <= current ? "bg-fg" : "bg-surface-2",
            )}
          />
        ))}
      </div>
      <p className="m-0 text-14 font-semibold text-fg-2">
        Step {current + 1} of {steps.length} · {steps[current]}
      </p>
    </div>
  )
}
