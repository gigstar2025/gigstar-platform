import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TicketStatus } from './ticket-status'
import { formatEventDate, type ShowcaseEvent } from '@/lib/profiles/showcase'

// EventCard — portrait poster + details + ticket CTA. Ticket buttons link to
// the existing /event/[slug] route (prototype).
export function EventCard({ event }: { event: ShowcaseEvent }) {
  const price = event.free ? 'Free' : event.priceFrom ? `From ${event.priceFrom}` : 'TBA'
  const sold = event.status === 'sold-out'
  const href = `/event/${event.slug}`

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <Link href={href} className="relative block aspect-[3/4] overflow-hidden">
        <img
          src={event.poster || '/placeholder.svg'}
          alt={event.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <TicketStatus status={event.status} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium leading-snug text-balance">
          <Link href={href} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          {formatEventDate(event.date)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {event.venueName}, {event.town}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-semibold text-foreground">{price}</span>
          {sold ? (
            <Button size="sm" variant="secondary" disabled>
              Sold out
            </Button>
          ) : (
            <Button size="sm" nativeButton={false} render={<Link href={href} />}>
              Get tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
