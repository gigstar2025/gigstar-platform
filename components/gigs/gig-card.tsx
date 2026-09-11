import { CalendarDays, MapPin, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatMiles } from '@/lib/geo/distance'
import type { GigWithDistance } from '@/lib/gigs/query'

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function GigCard({ gig }: { gig: GigWithDistance }) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className="shrink-0">
          {gig.genre}
        </Badge>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          <Navigation className="size-3.5" aria-hidden="true" />
          {formatMiles(gig.distanceMiles)}
          <span className="sr-only">away</span>
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-balance text-lg font-semibold leading-tight text-foreground">
          {gig.artist}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {gig.venue}, {gig.town}
          </span>
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <time dateTime={gig.date}>{formatDate(gig.date)}</time>
        </span>
        <span className="text-sm font-semibold text-foreground">{gig.price}</span>
      </div>
    </article>
  )
}
