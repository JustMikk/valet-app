// Vendor edit (DESIGN_INTAKE): `cn` comes from @/lib/utils (knows the token scales), and the pulse
// stops under prefers-reduced-motion.
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
