import { CalendarDays, MapPin, Ticket, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModuleShell, ModuleEmptyState } from '@/components/profile/module-shell'
import type { GigDate, GigsModule as GigsModuleType } from '@/lib/profiles/types'

function formatGigDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: GigDate['status'] }) {
  if (status === 'sold-out') {
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">Sold out</Badge>
  }
  if (status === 'cancelled') {
    return (
      <Badge variant="secondary" className="text-muted-foreground line-through">
        Cancelled
      </Badge>
    )
  }
  return <Badge className="bg-primary/15 text-primary hover:bg-primary/15">On sale</Badge>
}

export function GigsModule({ module }: { module: GigsModuleType }) {
  return (
    <ModuleShell
      title={module.title}
      icon={<CalendarDays className="size-5 text-primary" aria-hidden="true" />}
    >
      {module.gigs.length === 0 ? (
        <ModuleEmptyState message="No upcoming gigs listed yet." />
      ) : (
        <ul className="flex flex-col gap-3">
          {module.gigs.map((gig) => {
            const cancelled = gig.status === 'cancelled'
            return (
              <li
                key={gig.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      <time dateTime={gig.date}>{formatGigDate(gig.date)}</time>
                      {gig.time && <span className="text-muted-foreground">· {gig.time}</span>}
                    </span>
                    <StatusBadge status={gig.status} />
                  </div>
                  <h3
                    className={
                      cancelled
                        ? 'truncate text-lg font-semibold text-muted-foreground line-through'
                        : 'truncate text-lg font-semibold text-foreground'
                    }
                  >
                    {gig.title}
                  </h3>
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {gig.venue}, {gig.town}
                    </span>
                  </p>
                </div>
                {gig.ticketUrl && gig.status === 'on-sale' ? (
                  <Button
                    nativeButton={false}
                    render={<a href={gig.ticketUrl} target="_blank" rel="noopener noreferrer" />}
                    className="shrink-0"
                  >
                    <Ticket className="size-4" aria-hidden="true" />
                    Get tickets
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button variant="secondary" disabled className="shrink-0">
                    {gig.status === 'sold-out' ? 'Sold out' : 'Unavailable'}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </ModuleShell>
  )
}
