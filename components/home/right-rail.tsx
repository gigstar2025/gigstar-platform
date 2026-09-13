import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import {
  TRENDING_EVENTS,
  SUGGESTED_PROFILES,
  profileHref,
  eventHref,
} from '@/lib/home/feed-data'
import { FollowButton } from './follow-button'
import { TicketStatus } from './ticket-status'
import { TYPE_LABELS } from '@/lib/profiles/showcase'

// Desktop right rail — trending events and suggested profiles to follow.
export function RightRail() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Trending events</h2>
        <ul className="flex flex-col gap-3">
          {TRENDING_EVENTS.map((e) => (
            <li key={e.slug}>
              <Link href={eventHref(e.slug)} className="group flex items-center gap-3">
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

      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Suggested profiles</h2>
        <ul className="flex flex-col gap-3">
          {SUGGESTED_PROFILES.map((p) => (
            <li key={p.slug} className="flex items-center gap-3">
              <Link href={profileHref(p.slug)} className="shrink-0">
                <img src={p.avatar || '/placeholder.svg'} alt="" className="size-10 rounded-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={profileHref(p.slug)}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                >
                  <span className="truncate">{p.displayName}</span>
                  {p.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{TYPE_LABELS[p.type]}</p>
              </div>
              <FollowButton size="xs" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
