'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  CalendarDays,
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Star,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ANYWHERE,
  DISCOVERY_TYPE_LABELS,
  EVENT_KIND_LABELS,
  RADIUS_CHOICES,
  REGION_CENTERS,
  contentNear,
  eventsNear,
  formatDistance,
  formatEventDate,
  nearestAreaLabel,
  profilesNear,
  recommendedNear,
  searchLocationSuggestions,
  type DiscoveryType,
  type EventStatus,
  type WithDistance,
  type DiscoveryProfile,
} from '@/lib/discovery'

type TypeFilter = 'all' | DiscoveryType

type LocationSource = 'default' | 'preset' | 'manual' | 'geo'

interface ActiveLocation {
  label: string
  lat: number
  lng: number
  source: LocationSource
}

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

const DEFAULT_LOCATION: ActiveLocation = {
  label: 'Hastings',
  lat: REGION_CENTERS.hastings.lat,
  lng: REGION_CENTERS.hastings.lng,
  source: 'default',
}

const PRESETS: { label: string; lat: number; lng: number }[] = [
  { label: REGION_CENTERS.hastings.short, lat: REGION_CENTERS.hastings.lat, lng: REGION_CENTERS.hastings.lng },
  { label: REGION_CENTERS.london.short, lat: REGION_CENTERS.london.lat, lng: REGION_CENTERS.london.lng },
]

const DEFAULT_RADIUS = 5
const DEFAULT_TYPE: TypeFilter = 'all'

export function LocationDiscovery() {
  const [location, setLocation] = useState<ActiveLocation>(DEFAULT_LOCATION)
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)
  const [type, setType] = useState<TypeFilter>(DEFAULT_TYPE)
  const [search, setSearch] = useState('')

  const [locInput, setLocInput] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [geoMessage, setGeoMessage] = useState<string | null>(null)
  const locBoxRef = useRef<HTMLDivElement>(null)

  const center = useMemo(() => ({ lat: location.lat, lng: location.lng }), [location.lat, location.lng])
  const typeArg = type === 'all' ? undefined : type

  const hits = useMemo(
    () => profilesNear({ center, radius, type: typeArg, search }),
    [center, radius, typeArg, search],
  )
  const recommended = useMemo(() => recommendedNear(center, radius).slice(0, 3), [center, radius])
  const events = useMemo(() => eventsNear(center, radius).slice(0, 4), [center, radius])
  const contentCount = useMemo(() => contentNear(center, radius).length, [center, radius])

  const suggestions = useMemo(() => searchLocationSuggestions(locInput), [locInput])
  const shown = hits.slice(0, MAX_RESULTS)

  // Smallest radius above the current one that would surface results.
  const nextRadiusWithResults = useMemo(() => {
    if (hits.length > 0) return null
    return (
      RADIUS_CHOICES.find(
        (c) => c.value > radius && profilesNear({ center, radius: c.value, type: typeArg, search }).length > 0,
      ) ?? null
    )
  }, [hits.length, radius, center, typeArg, search])

  const filtersActive =
    location.source !== 'default' || radius !== DEFAULT_RADIUS || type !== DEFAULT_TYPE || search.trim() !== ''

  // Close the suggestion dropdown on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (locBoxRef.current && !locBoxRef.current.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function applyPreset(preset: { label: string; lat: number; lng: number }) {
    setLocation({ label: preset.label, lat: preset.lat, lng: preset.lng, source: 'preset' })
    setGeoStatus('idle')
    setGeoMessage(null)
    setLocInput('')
    setSuggestOpen(false)
  }

  function chooseSuggestion(s: { label: string; sublabel: string; lat: number; lng: number }) {
    setLocation({ label: s.label, lat: s.lat, lng: s.lng, source: 'manual' })
    setLocInput('')
    setSuggestOpen(false)
    setGeoStatus('idle')
    setGeoMessage(null)
  }

  function useMyLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoMessage('Geolocation is not supported here. Search by town or postcode instead.')
      return
    }
    setGeoStatus('loading')
    setGeoMessage(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation({ label: nearestAreaLabel(point), lat: point.lat, lng: point.lng, source: 'geo' })
        setGeoStatus('idle')
      },
      (err) => {
        setGeoStatus('error')
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. Search by town or postcode instead.'
            : 'We could not find your location. Search by town or postcode instead.',
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  function clearFilters() {
    setLocation(DEFAULT_LOCATION)
    setRadius(DEFAULT_RADIUS)
    setType(DEFAULT_TYPE)
    setSearch('')
    setLocInput('')
    setSuggestOpen(false)
    setGeoStatus('idle')
    setGeoMessage(null)
  }

  const radiusPhrase = radius === ANYWHERE ? 'anywhere' : `within ${radius} ${radius === 1 ? 'mile' : 'miles'}`

  return (
    <section id="discover-near-you" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
          <Navigation className="size-3.5" />
          Location discovery
        </span>
        <h2 className="text-pretty text-2xl font-semibold sm:text-3xl">Discover talent and events near you</h2>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          Set your location and search radius to find DJs, artists, venues and organisers around you. Distances are
          calculated live, so widening the radius reveals more of the scene.
        </p>
      </header>

      {/* Controls */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Location */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => {
                  const active = location.source === 'preset' && location.label === p.label
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <MapPin className="size-3.5" />
                      {p.label}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={useMyLocation}
                  aria-pressed={location.source === 'geo'}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    location.source === 'geo'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {geoStatus === 'loading' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="size-3.5" />
                  )}
                  {geoStatus === 'loading' ? 'Finding your location…' : 'Use my location'}
                </button>
              </div>

              {/* Manual town / postcode entry */}
              <div ref={locBoxRef} className="relative">
                <label htmlFor="discover-location" className="sr-only">
                  Town, city or postcode
                </label>
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="discover-location"
                  type="text"
                  autoComplete="off"
                  value={locInput}
                  onChange={(e) => {
                    setLocInput(e.target.value)
                    setSuggestOpen(true)
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    if (e.key === 'Enter' && suggestions[0]) {
                      e.preventDefault()
                      chooseSuggestion(suggestions[0])
                    } else if (e.key === 'Escape') {
                      setSuggestOpen(false)
                    }
                  }}
                  placeholder="Town, city or postcode"
                  role="combobox"
                  aria-expanded={suggestOpen && suggestions.length > 0}
                  aria-controls="discover-location-list"
                  className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                {suggestOpen && suggestions.length > 0 && (
                  <ul
                    id="discover-location-list"
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-lg"
                  >
                    {suggestions.map((s) => (
                      <li key={s.id} role="option" aria-selected={false}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            chooseSuggestion(s)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{s.label}</span>
                          <span className="text-xs text-muted-foreground">{s.sublabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {location.source === 'default' && (
                <p className="text-xs text-muted-foreground">
                  Showing example content near <span className="font-medium text-foreground">Hastings</span> — change it
                  anytime.
                </p>
              )}
              {geoStatus === 'error' && geoMessage && (
                <p role="alert" className="text-xs text-destructive">
                  {geoMessage}
                </p>
              )}
            </div>

            {/* Radius + keyword */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Radius · {radiusPhrase}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RADIUS_CHOICES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setRadius(c.value)}
                    aria-pressed={radius === c.value}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      radius === c.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {c.short}
                  </button>
                ))}
              </div>

              <label htmlFor="discover-search" className="sr-only">
                Search DJs, artists, venues or events
              </label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="discover-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search DJs, artists, venues or events"
                  className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
            </div>
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        <span className="font-medium text-foreground">{hits.length}</span>{' '}
        {hits.length === 1 ? 'profile' : 'profiles'} {radiusPhrase}
        {radius === ANYWHERE ? ' near ' : ' of '}
        <span className="font-medium text-foreground">{location.label}</span>
        <span className="hidden sm:inline">
          {' '}
          · {events.length} nearby events · {contentCount} recent posts
        </span>
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
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center sm:p-10">
            <p className="text-sm font-medium">No results found {radiusPhrase} of {location.label}.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextRadiusWithResults
                ? `Try a wider radius to see more of the scene.`
                : `Try a different location, widen the radius, or clear your filters.`}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {nextRadiusWithResults && (
                <Button size="sm" onClick={() => setRadius(nextRadiusWithResults.value)}>
                  {nextRadiusWithResults.value === ANYWHERE
                    ? 'Search anywhere'
                    : `Increase to ${nextRadiusWithResults.short}`}
                </Button>
              )}
              {radius !== ANYWHERE && (
                <Button size="sm" variant="outline" onClick={() => setRadius(ANYWHERE)}>
                  Search anywhere
                </Button>
              )}
              {filtersActive && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
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
          loading="lazy"
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
          loading="lazy"
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
      <img
        src={p.avatar || '/placeholder.svg'}
        alt=""
        loading="lazy"
        className="size-14 shrink-0 rounded-lg object-cover"
      />
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
          loading="lazy"
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
