import Link from "next/link"
import { CalendarDays, Clock, MapPin, Users } from "lucide-react"
import { cn } from "cn"
import { EventStatusBadge } from "./status-badge"
import { formatEventDate, type ShowcaseEvent } from "@/lib/profiles/showcase/types"

export function EventCard({
  event,
  className,
}: {
  event: ShowcaseEvent
  className?: string
}) {
  return (
    <Link
      href={`/event/${event.slug}`}
      className={cn(
        "group/event flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={event.poster || "/placeholder.svg"}
          alt={`${event.title} poster`}
          className="size-full object-cover transition-transform duration-500 group-hover/event:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute left-3 top-3">
          <EventStatusBadge status={event.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-primary">
          <CalendarDays className="size-3.5" />
          {formatEventDate(event.date)}
        </div>
        <h3 className="text-pretty font-sans text-lg font-semibold leading-tight">
          {event.title}
        </h3>
        <div className="mt-auto flex flex-col gap-1 pt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            {event.venueName}, {event.town}
          </span>
          {event.doorsTime ? (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              Doors {event.doorsTime}
              {event.endTime ? ` – ${event.endTime}` : ""}
            </span>
          ) : null}
          {event.attendance ? (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              {event.attendance}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <span className="font-medium">
            {event.free
              ? "Free"
              : event.priceFrom
                ? `From ${event.priceFrom}`
                : "See tickets"}
          </span>
          <span className="text-primary transition-colors group-hover/event:text-primary/80">
            Details →
          </span>
        </div>
      </div>
    </Link>
  )
}
