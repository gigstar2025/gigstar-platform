import Link from 'next/link'
import { BadgeCheck, MapPin, Users, CalendarDays, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventCard } from './event-card'
import { SectionHeading } from './section-heading'
import { FollowButton } from './follow-button'
import {
  EVENTS_NEAR_YOU,
  TRENDING_DJS,
  FEATURED_ARTISTS,
  POPULAR_VENUES,
  FEATURED_ORGANISERS,
  profileHref,
} from '@/lib/home/feed-data'

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

export function EventsNearYou() {
  return (
    <section id="events-near-you" className={SECTION}>
      <SectionHeading
        title="Events near you"
        subtitle="Manchester & the North West"
        actionLabel="See all events"
        actionHref="/gigs"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {EVENTS_NEAR_YOU.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  )
}

export function TrendingDjs() {
  return (
    <section id="trending-djs" className={SECTION}>
      <SectionHeading
        title="Trending DJs"
        subtitle="The selectors moving crowds right now"
        actionLabel="Browse DJs"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRENDING_DJS.map((dj, i) => (
          <div key={i} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={dj.cover} href={profileHref(dj.slug)} />
            <div className="flex flex-1 flex-col p-4">
              <img
                src={dj.avatar || '/placeholder.svg'}
                alt=""
                className="-mt-12 size-14 rounded-full object-cover ring-4 ring-card"
              />
              <div className="mt-2 flex items-center gap-1">
                <Link href={profileHref(dj.slug)} className="font-medium hover:underline">
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
  return (
    <section id="featured-artists" className={SECTION}>
      <SectionHeading
        title="Featured artists & bands"
        subtitle="New releases and live acts to book"
        actionLabel="Browse artists"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_ARTISTS.map((a, i) => (
          <div key={i} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={a.cover} href={profileHref(a.slug)} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <img src={a.avatar || '/placeholder.svg'} alt="" className="size-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Link href={profileHref(a.slug)} className="truncate font-medium hover:underline">
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
                  <p className="text-xs text-muted-foreground">{a.releaseType}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  nativeButton={false}
                  render={<Link href={profileHref(a.slug)} />}
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
  return (
    <section id="popular-venues" className={SECTION}>
      <SectionHeading
        title="Popular venues"
        subtitle="Spaces hosting the best nights out"
        actionLabel="Browse venues"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POPULAR_VENUES.map((v, i) => (
          <div key={i} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={v.cover} href={profileHref(v.slug)} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-1">
                <Link href={profileHref(v.slug)} className="font-medium hover:underline">
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
                  render={<Link href={profileHref(v.slug)} />}
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
  return (
    <section id="featured-organisers" className={SECTION}>
      <SectionHeading
        title="Featured organisers"
        subtitle="The promoters behind the line-ups"
        actionLabel="Browse organisers"
        actionHref="/profiles"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_ORGANISERS.map((o, i) => (
          <div key={i} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Cover src={o.cover} href={profileHref(o.slug)} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-3">
                <img src={o.avatar || '/placeholder.svg'} alt="" className="size-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <Link href={profileHref(o.slug)} className="truncate font-medium hover:underline">
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
                  render={<Link href={profileHref(o.slug)} />}
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
