'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { useDiscovery } from './discovery-context'
import { eventsNearHome, suggestedProfilesNear } from '@/lib/home/derive'
import { FollowButton } from './follow-button'
import { TicketStatus } from './ticket-status'

// Desktop right rail — trending events and suggested profiles, both derived
// from the shared discovery state so they track the selected location/radius.
export function RightRail() {
  const { center, radius, areaLabel } = useDiscovery()

  const events = useMemo(() => eventsNearHome(center, radius, 5), [center, radius])
  const profiles = useMemo(() => suggestedProfilesNear(center, radius, 5), [center, radius])

  return (
    <div className="flex flex-col gap-4">
      {events.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Trending near {areaLabel}</h2>
          <ul className="flex flex-col gap-3">
            {events.map((e) => (
              <li key={e.slug}>
                <Link href={`/event/${e.slug}`} className="group flex items-center gap-3">
                  <img
                    src={e.poster || '/placeholder.svg'}
                    alt=""
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:underline">
                      {e.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {e.dateLabel} · {e.town}
                    </span>
                  </span>
                  <TicketStatus status={e.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profiles.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Suggested near {areaLabel}</h2>
          <ul className="flex flex-col gap-3">
            {profiles.map((p) => (
              <li key={p.slug} className="flex items-center gap-3">
                <Link href={p.href} className="shrink-0">
                  <img src={p.avatar || '/placeholder.svg'} alt="" className="size-10 rounded-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={p.href}
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    <span className="truncate">{p.displayName}</span>
                    {p.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{p.typeLabel}</p>
                </div>
                <FollowButton size="xs" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
