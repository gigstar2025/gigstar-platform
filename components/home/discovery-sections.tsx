'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BadgeCheck, MapPin, Users, CalendarDays, Music2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeading } from './section-heading'
import { FollowButton } from './follow-button'
import { useDiscovery } from './discovery-context'
import {
  djCardsNear,
  artistCardsNear,
  venueCardsNear,
  organiserCardsNear,
  eventsNearHome,
} from '@/lib/home/derive'
import { TicketStatus } from './ticket-status'

const SECTION = 'mx-auto w-full max-w-6xl px-4 py-10 sm:px-6'

function Verified({ show }: { show: boolean }) {
  return show ? <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" /> : null
}

function Cover({ src, href }: { src: string; href: string }) {
  return (
    <Link href={href} className="relative block aspect-[16/10] overflow-hidden">
      <img
        src={src || '/placeholder.svg'}
        alt=""
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
    </Link>
  )
}

/** Radius-aware subtitle that avoids awkward phrasing when "Anywhere" is set. */
function useRadiusSubtitle(base: string) {
  const { radius, isAnywhere } = useDiscovery()
  return isAnywhere ? base : `${base} · within ${radius} ${radius === 1 ? 'mile' : 'miles'}`
}

export function EventsNearYou() {
  const { center, radius, areaLabel } = useDiscovery()
  const events = useMemo(() => eventsNearHome(center, radius, 8), [center, radius])
  const subtitle = useRadiusSubtitle('Live listings and tickets')
  if (events.length === 0) return null

  return (
    <section id="events-near-you" className={SECTION}>
      <SectionHeading
        title={`Events near ${areaLabel}`}
        subtitle={subtitle}
        actionLabel="See all events"
        actionHref="/gigs"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {events.slice(0, 4).map((e) => {
          const price = e.free ? 'Free' : e.priceFrom ? `From ${e.priceFrom}` : 'TBA'
          const sold = e.status === 'sold-out'
          const href = `/event/${e.slug}`
          return (
            <div key={e.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Link href={href} className="relative block aspect-[3/4] overflow-hidden">
                <img
                  src={e.poster || '/placeholder.svg'}
                  alt={e.title}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3">
                  <TicketStatus status={e.status} />
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-medium leading-snug text-balance">
                  <Link href={href} className="hover:underline">
                    {e.title}
                  </Link>
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {e.dateLabel}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {e.venueName}, {e.town}
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
                      <Ticket className="size-3.5" />
                      Tickets
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function TrendingDjs() {
  const { center, radius, search, areaLabel } = useDiscovery()
  const djs = useMemo(() => djCardsNear(center, radius, search), [center, radius, search])
  const subtitle = useRadiusSubtitle('The selectors moving crowds right now')
  if (djs.length === 0) return null

  return (
    <section id="trending-djs" className={SECTION}>
      <SectionHeading
        title={`Trending DJs near ${areaLabel}`}
        subtitle={subtitle}
        actionLabel="Browse DJs"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {djs.map((dj) => (
          <div key={dj.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={dj.cover} href={dj.href} />
            <div className="flex flex-1 flex-col p-4">
              <img
                src={dj.avatar || '/placeholder.svg'}
                alt=""
                className="-mt-12 size-14 rounded-full object-cover ring-4 ring-card"
              />
              <div className="mt-2 flex items-center gap-1">
                <Link href={dj.href} className="font-medium hover:underline">
                  {dj.displayName}
                </Link>
                <Verified show={dj.verified} />
              </div>
              <p className="text-xs text-muted-foreground">{dj.tagline}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Music2 className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">{dj.preview}</span>
              </p>
              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{dj.followers}</span> followers
                </span>
                <FollowButton size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function FeaturedArtists() {
  const { center, radius, search, areaLabel } = useDiscovery()
  const artists = useMemo(() => artistCardsNear(center, radius, search), [center, radius, search])
  const subtitle = useRadiusSubtitle('New releases and live acts to book')
  if (artists.length === 0) return null

  return (
    <section id="featured-artists" className={SECTION}>
      <SectionHeading
        title={`Artists & bands near ${areaLabel}`}
        subtitle={subtitle}
        actionLabel="Browse artists"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((a) => (
          <div key={a.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={a.cover} href={a.href} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <img src={a.avatar || '/placeholder.svg'} alt="" className="size-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Link href={a.href} className="truncate font-medium hover:underline">
                      {a.displayName}
                    </Link>
                    <Verified show={a.verified} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{a.genre}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2.5">
                <img src={a.releaseArtwork || '/placeholder.svg'} alt="" className="size-10 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.releaseTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.releaseType}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  nativeButton={false}
                  render={<Link href={a.href} />}
                >
                  View profile
                </Button>
                <FollowButton size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PopularVenues() {
  const { center, radius, search, areaLabel } = useDiscovery()
  const venues = useMemo(() => venueCardsNear(center, radius, search), [center, radius, search])
  const subtitle = useRadiusSubtitle('Spaces hosting the best nights out')
  if (venues.length === 0) return null

  return (
    <section id="popular-venues" className={SECTION}>
      <SectionHeading
        title={`Venues around ${areaLabel}`}
        subtitle={subtitle}
        actionLabel="Browse venues"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <div key={v.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={v.cover} href={v.href} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-1">
                <Link href={v.href} className="font-medium hover:underline">
                  {v.displayName}
                </Link>
                <Verified show={v.verified} />
              </div>
              <p className="text-xs text-muted-foreground">{v.venueType}</p>
              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {v.tagline}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5 shrink-0" />
                  {v.capacity}
                </span>
                <Link href={v.nextEventHref} className="flex items-center gap-1.5 text-primary hover:underline">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {v.nextEventLabel}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  nativeButton={false}
                  render={<Link href={v.href} />}
                >
                  View venue
                </Button>
                <FollowButton size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function FeaturedOrganisers() {
  const { center, radius, search, areaLabel } = useDiscovery()
  const organisers = useMemo(() => organiserCardsNear(center, radius, search), [center, radius, search])
  const subtitle = useRadiusSubtitle('The promoters behind the line-ups')
  if (organisers.length === 0) return null

  return (
    <section id="featured-organisers" className={SECTION}>
      <SectionHeading
        title={`Organisers near ${areaLabel}`}
        subtitle={subtitle}
        actionLabel="Browse organisers"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organisers.map((o) => (
          <div key={o.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={o.cover} href={o.href} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <img src={o.avatar || '/placeholder.svg'} alt="" className="size-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Link href={o.href} className="truncate font-medium hover:underline">
                      {o.displayName}
                    </Link>
                    <Verified show={o.verified} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{o.tagline}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {o.region}
                </span>
                <Link href={o.nextEventHref} className="flex items-center gap-1.5 text-primary hover:underline">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {o.nextEventLabel}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  nativeButton={false}
                  render={<Link href={o.href} />}
                >
                  View profile
                </Button>
                <FollowButton size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
