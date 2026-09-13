'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  CalendarDays,
  MapPin,
  Navigation,
  Search,
  Star,
  Ticket,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DISCOVERY_TYPE_LABELS,
  EVENT_KIND_LABELS,
  REGION_CENTERS,
  REGION_ORDER,
  RADIUS_OPTIONS,
  contentInRadius,
  eventsInRadius,
  formatDistance,
  formatEventDate,
  profilesInRadius,
  recommendedProfiles,
  type DiscoveryType,
  type EventStatus,
  type Region,
  type WithDistance,
  type DiscoveryProfile,
} from '@/lib/discovery'

type TypeFilter = 'all' | DiscoveryType

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'dj', label: 'DJs' },
  { key: 'artist', label: 'Artists & Bands' },
  { key: 'venue', label: 'Venues' },
  { key: 'organiser', label: 'Organisers' },
]

const STATUS_STYLES: Record<EventStatus, { label: string; className: string }> = {
  'on-sale': { label: 'On sale', className: 'bg-primary/15 text-primary' },
  'selling-fast': { label: 'Selling fast', className: 'bg-amber-500/15 text-amber-400' },
  'last-tickets': { label: 'Last tickets', className: 'bg-orange-500/15 text-orange-400' },
  'sold-out': { label: 'Sold out', className: 'bg-muted text-muted-foreground' },
  free: { label: 'Free', className: 'bg-emerald-500/15 text-emerald-400' },
  'coming-soon': { label: 'Soon', className: 'bg-muted text-muted-foreground' },
}

const MAX_RESULTS = 12

export function LocationDiscovery() {
  const [region, setRegion] = useState<Region>('hastings')
  const [radius, setRadius] = useState<number>(5)
  const [type, setType] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')

  const center = REGION_CENTERS[region]

  const hits = useMemo(
    () =>
      profilesInRadius({
        region,
        radius,
        type: type === 'all' ? undefined : type,
        search,
      }),
    [region, radius, type, search],
  )
  const recommended = useMemo(
    () => recommendedProfiles(region, radius).slice(0, 3),
    [region, radius],
  )
  const events = useMemo(() => eventsInRadius(region, radius).slice(0, 4), [region, radius])
  const contentCount = useMemo(() => contentInRadius(region, radius).length, [region, radius])

  const shown = hits.slice(0, MAX_RESULTS)

  return (
    <section id="discover-near-you" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
          <Navigation className="size-3.5" />
          Location discovery
        </span>
        <h2 className="text-pretty text-2xl font-semibold sm:text-3xl">Discover talent and events near you</h2>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          Set your location and search radius to find DJs, artists, venues and organisers around you.
          Distances are calculated live, so widening the radius reveals more of the scene.
        </p>
      </header>

      {/* Controls */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</span>
              <div className="inline-flex rounded-full border border-border/60 bg-muted/40 p-1">
                {REGION_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    aria-pressed={region === r}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      region === r
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <MapPin className="size-3.5" />
                    {REGION_CENTERS[r].short}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Within {radius} {radius === 1 ? 'mile' : 'miles'}
              </span>
              <div className="inline-flex rounded-full border border-border/60 bg-muted/40 p-1">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    aria-pressed={radius === r}
                    className={cn(
                      'min-w-11 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      radius === r
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-1 flex-col gap-1.5 lg:max-w-xs">
              <label htmlFor="discover-search" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="discover-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Genre, name or area…"
                  className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                aria-pressed={type === t.key}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  type === t.key
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        <span className="font-medium text-foreground">{hits.length}</span>{' '}
        {hits.length === 1 ? 'profile' : 'profiles'} within {radius} {radius === 1 ? 'mile' : 'miles'} of{' '}
        <span className="font-medium text-foreground">{center.label}</span>
        <span className="hidden sm:inline"> · {events.length} nearby events · {contentCount} recent posts</span>
      </p>

      {/* Recommended */}
      {recommended.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Star className="size-4 text-primary" />
            Recommended near you
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recommended.map((p) => (
              <RecommendedCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className="mt-8">
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No profiles match within {radius} {radius === 1 ? 'mile' : 'miles'}. Try widening the radius or
              clearing your search.
            </p>
            {radius < 25 && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setRadius(25)}>
                Widen to 25 miles
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => (
                <ProfileCard key={p.id} p={p} />
              ))}
            </div>
            {hits.length > shown.length && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Showing {shown.length} of {hits.length} nearby profiles.
              </p>
            )}
          </>
        )}
      </div>

      {/* Nearby events */}
      {events.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Events near you
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {events.map((e) => (
              <NearbyEventCard key={e.id} e={e} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3.5 fill-primary text-primary" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      <span>({reviews})</span>
    </span>
  )
}

function DistanceBadge({ miles }: { miles: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
      <Navigation className="size-3 text-primary" />
      {formatDistance(miles)}
    </span>
  )
}

function ProfileCard({ p }: { p: WithDistance<DiscoveryProfile> }) {
  const body = (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-border">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={p.cover || '/placeholder.svg'}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute right-2 top-2">
          <DistanceBadge miles={p.distance} />
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
          {DISCOVERY_TYPE_LABELS[p.type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <img
          src={p.avatar || '/placeholder.svg'}
          alt=""
          className="-mt-10 size-14 rounded-full object-cover ring-4 ring-card"
        />
        <div className="mt-2 flex items-center gap-1">
          <span className="font-medium">{p.name}</span>
          {p.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {p.area}, {p.town}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <Stars rating={p.rating} reviews={p.reviews} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {formatFollowers(p.followers)}
          </span>
        </div>
        {p.travelRadius && (
          <p className="mt-2 text-xs text-muted-foreground">Travels up to {p.travelRadius} miles</p>
        )}
      </div>
    </div>
  )

  if (p.hasPage && p.pageSlug) {
    return (
      <Link href={`/p/${p.pageSlug}`} className="block h-full">
        {body}
      </Link>
    )
  }
  return body
}

function RecommendedCard({ p }: { p: WithDistance<DiscoveryProfile> }) {
  const body = (
    <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border">
      <img src={p.avatar || '/placeholder.svg'} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate font-medium">{p.name}</span>
          {p.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {DISCOVERY_TYPE_LABELS[p.type]} · {p.area}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Stars rating={p.rating} reviews={p.reviews} />
          <span className="text-xs text-muted-foreground">· {formatDistance(p.distance)}</span>
        </div>
      </div>
    </div>
  )
  if (p.hasPage && p.pageSlug) {
    return (
      <Link href={`/p/${p.pageSlug}`} className="block">
        {body}
      </Link>
    )
  }
  return body
}

function NearbyEventCard({
  e,
}: {
  e: WithDistance<{
    id: string
    slug: string
    title: string
    kind: keyof typeof EVENT_KIND_LABELS
    venueName: string
    town: string
    date: string
    poster: string
    free: boolean
    priceFrom?: number
    status: EventStatus
  }>
}) {
  const status = STATUS_STYLES[e.status]
  return (
    <Link
      href={`/event/${e.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-border"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={e.poster || '/placeholder.svg'}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className={cn('absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-medium', status.className)}>
          {status.label}
        </span>
        <span className="absolute right-2 top-2">
          <DistanceBadge miles={e.distance} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="text-xs text-muted-foreground">{EVENT_KIND_LABELS[e.kind]}</span>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">{e.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          {formatEventDate(e.date)}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {e.venueName}, {e.town}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
          <Ticket className="size-3.5" />
          {e.free ? 'Free entry' : e.priceFrom ? `From £${e.priceFrom}` : 'Tickets'}
        </span>
      </div>
    </Link>
  )
}

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
