import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import type { EventStatus } from "@/lib/profiles/showcase/types"

const STATUS: Record<
  EventStatus,
  { label: string; className: string }
> = {
  "on-sale": { label: "On sale", className: "bg-primary/15 text-primary" },
  free: { label: "Free entry", className: "bg-emerald-500/15 text-emerald-300" },
  "selling-fast": {
    label: "Selling fast",
    className: "bg-amber-500/15 text-amber-300",
  },
  "last-tickets": {
    label: "Last tickets",
    className: "bg-orange-500/15 text-orange-300",
  },
  "sold-out": {
    label: "Sold out",
    className: "bg-muted text-muted-foreground line-through decoration-1",
  },
  "coming-soon": {
    label: "Coming soon",
    className: "bg-secondary text-secondary-foreground",
  },
}

export function EventStatusBadge({
  status,
  className,
}: {
  status: EventStatus
  className?: string
}) {
  const s = STATUS[status]
  return (
    <Badge className={cn("border-0 font-medium", s.className, className)}>
      {s.label}
    </Badge>
  )
}
