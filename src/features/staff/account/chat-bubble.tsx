import { Icon } from "@/components/shared"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/mocks/staff"

type MessageItem = Extract<ChatMessage, { kind: "message" }>

const BUBBLE = {
  them: "self-start rounded-[20px_20px_20px_6px] bg-surface text-fg",
  me: "self-end rounded-[20px_20px_6px_20px] bg-fg text-bg",
  broadcast:
    "self-start rounded-[20px_20px_20px_6px] bg-accent-soft text-fg shadow-[inset_0_0_0_1px_var(--accent)]",
} as const

type ChatBubbleProps = {
  message: MessageItem
  onClaim: () => void
}

/** One chat message: sender, bubble (them / me / broadcast), attachments and delivery meta. */
export function ChatBubble({ message: m, onClaim }: ChatBubbleProps) {
  return (
    <div className="flex animate-rise flex-col gap-1">
      {m.who && <span className="px-1.5 text-12 font-semibold text-fg-2">{m.who}</span>}
      <div
        className={cn(
          // box-content: the design's max-width limits the text column; padding adds on top of it.
          "box-content flex flex-col gap-2 px-3.75 py-3 text-16 leading-x145",
          m.from === "broadcast" ? "max-w-[90%]" : "max-w-[82%]",
          BUBBLE[m.from],
        )}
      >
        {m.ref && (
          <span className="flex items-center gap-1.5 text-12 font-semibold opacity-75">
            <Icon name="event" size={15} loose />
            {m.ref}
          </span>
        )}
        {m.img && (
          <div
            role="img"
            aria-label="Parking map photo"
            className="grid h-37.5 place-items-center rounded-r14 font-mono text-12 font-medium text-fg-2 bg-stripes"
          >
            {m.img}
          </div>
        )}
        <span>{m.text}</span>
        {m.event && (
          <button
            type="button"
            onClick={onClaim}
            className="mt-1 flex items-center gap-2.5 rounded-r14 border-0 bg-elev px-3.5 py-3 text-left text-fg"
          >
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-15 font-semibold">{m.event}</span>
              <span className="text-13 text-fg-2">Sat Oct 31 · 7 PM – 1 AM · 4 spots</span>
            </span>
            <span className="text-14 font-semibold text-accent-text">Claim</span>
          </button>
        )}
      </div>
      <span
        className={cn(
          "px-1.5 text-12 font-medium text-fg-3",
          m.from === "me" ? "self-end" : "self-start",
        )}
      >
        {m.meta}
      </span>
    </div>
  )
}
