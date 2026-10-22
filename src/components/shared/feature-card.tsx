import { cn } from "@/lib/utils"

import { Icon } from "./icon"

type FeatureCardProps = {
  /** Small mono label above the title, e.g. "OPEN SHIFTS". */
  overline?: string
  title: string
  body?: string
  /** Call to action; the whole card activates it. */
  cta: string
  onClick: () => void
  /** Makes the card dismissible with a labelled close button. */
  onDismiss?: () => void
  className?: string
}

/**
 * Dark feature card, one per screen (Design System "feature-card", Staff Home "Open shifts"):
 * --hero ground with the tenant-accent glow. The CTA's hit area stretches over the card, so the
 * card is one action and the dismiss button stays a separate control (no nested buttons).
 */
export function FeatureCard({
  overline,
  title,
  body,
  cta,
  onClick,
  onDismiss,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-r24 bg-hero bg-[image:var(--hero-glow)] p-5.5 text-hero-fg",
        className,
      )}
    >
      {overline && (
        <span className="font-mono text-12 font-semibold tracking-p060 text-hero-overline uppercase">
          {overline}
        </span>
      )}
      <span className="font-display text-22 leading-x120 font-semibold tracking-n015">{title}</span>
      {body && <span className="text-15 leading-x140 text-hero-fg-2">{body}</span>}
      <button
        type="button"
        onClick={onClick}
        className="mt-1.5 flex w-fit items-center border-0 bg-transparent p-0 text-17 font-semibold text-hero-fg after:absolute after:inset-0 after:content-['']"
      >
        {cta}
        <Icon name="chevron_right" size={22} />
      </button>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute top-4.5 right-4.5 z-10 grid border-0 bg-transparent p-0 text-hero-fg-3"
        >
          <Icon name="close" size={22} />
        </button>
      )}
    </div>
  )
}

type PagerDotsProps = {
  count: number
  /** Zero-based index of the active page. */
  active: number
  /** What is being paged, for the text equivalent ("Promotion 1 of 3"). */
  label: string
  className?: string
}

/** Carousel position dots with a visually hidden text equivalent. */
export function PagerDots({ count, active, label, className }: PagerDotsProps) {
  return (
    <div className={cn("flex justify-center gap-1.75", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("size-2 rounded-r9", i === active ? "bg-fg" : "bg-line")}
        />
      ))}
      <span className="sr-only">{`${label} ${active + 1} of ${count}`}</span>
    </div>
  )
}
