// ---------------------------------------------------------------------------
// Homepage derivation layer — the SINGLE source of truth for every
// location-aware homepage section.
//
// Given a geographic centre + radius (plus the active category / search), these
// pure helpers derive the feed, the specialist discovery sections, the right
// rail and their counts from the one structured `lib/discovery` dataset. All
// filtering is live haversine distance, so changing the location or radius
// genuinely changes every section — there is no second static dataset.
// ---------------------------------------------------------------------------

import {
  DISCOVERY_PROFILES,
  DISCOVERY_EVENTS,
  DISCOVERY_CONTENT,
  getDiscoveryProfile,
  haversineMiles,
  formatEventDate,
  type GeoPoint,
  type DiscoveryProfile,
  type DiscoveryEvent,
  type DiscoveryType,
} from '@/lib/discovery'
import {
  FEED_POSTS,
  profileHref,
  type FeedPost,
  type FeedAuthor,
  type FeedEventMeta,
  type PostKind,
  type FeedCategory,
} from '@/lib/home/feed-data'

// --- Shared category <-> profile-type mapping ------------------------------

/** The profile type a feed category narrows to, or null for mixed categories
 *  ("For You" and "Events"). Kept here so the provider and the derivation layer
 *  agree on one mapping. */
export function categoryType(c: FeedCategory): DiscoveryType | null {
  switch (c) {
    case 'djs':
      return 'dj'
    case 'artists':
      return 'artist'
    case 'venues':
      return 'venue'
    case 'organisers':
      return 'organiser'
    default:
      return null
  }
}

export function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// --- Event indexes (built once) --------------------------------------------

function byDate(a: DiscoveryEvent, b: DiscoveryEvent) {
  return a.date.localeCompare(b.date)
}

const EVENTS_BY_VENUE = new Map<string, DiscoveryEvent[]>()
const EVENTS_BY_ORGANISER = new Map<string, DiscoveryEvent[]>()
const EVENTS_BY_LINEUP = new Map<string, DiscoveryEvent[]>()

for (const e of [...DISCOVERY_EVENTS].sort(byDate)) {
  if (e.venueSlug) push(EVENTS_BY_VENUE, e.venueSlug, e)
  if (e.organiserSlug) push(EVENTS_BY_ORGANISER, e.organiserSlug, e)
  for (const s of e.lineupSlugs) push(EVENTS_BY_LINEUP, s, e)
}

function push(map: Map<string, DiscoveryEvent[]>, key: string, e: DiscoveryEvent) {
  const arr = map.get(key)
  if (arr) arr.push(e)
  else map.set(key, [e])
}

function nextEvent(map: Map<string, DiscoveryEvent[]>, slug: string): DiscoveryEvent | undefined {
  return map.get(slug)?.[0]
}

// --- Distance helpers ------------------------------------------------------

export type Scored<T> = T & { distance: number }

function withinType(type: DiscoveryType, center: GeoPoint, radius: number, search: string): Scored<DiscoveryProfile>[] {
  const q = search.trim().toLowerCase()
  return DISCOVERY_PROFILES.filter((p) => p.type === type)
    .map((p) => ({ ...p, distance: haversineMiles(center, p) }))
    .filter((p) => p.distance <= radius)
    .filter((p) => (q ? matchProfile(p, q) : true))
    .sort((a, b) => trendScore(b) - trendScore(a) || a.distance - b.distance)
}

function trendScore(p: Scored<DiscoveryProfile>): number {
  return (p.featured ? 2 : 0) + (p.verified ? 1 : 0) + p.followers / 20000 + p.rating / 5
}

function matchProfile(p: DiscoveryProfile, q: string): boolean {
  return (
    p.name.toLowerCase().includes(q) ||
    p.tags.some((t) => t.includes(q)) ||
    p.genres.some((g) => g.toLowerCase().includes(q)) ||
    p.area.toLowerCase().includes(q) ||
    p.town.toLowerCase().includes(q)
  )
}

/** A public page exists only for the four principal example profiles; other
 *  records link to the profiles directory rather than a 404. */
function cardHref(p: DiscoveryProfile): string {
  return p.hasPage && p.pageSlug ? profileHref(p.pageSlug) : '/profiles'
}

// --- Specialist section cards ----------------------------------------------

export interface DjCard {
  slug: string
  href: string
  displayName: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  followers: string
  preview: string
}

export function djCardsNear(center: GeoPoint, radius: number, search: string, limit = 6): DjCard[] {
  return withinType('dj', center, radius, search)
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      href: cardHref(p),
      displayName: p.name,
      tagline: `${p.genres[0]} — ${p.town}`,
      avatar: p.avatar,
      cover: p.cover,
      verified: p.verified,
      followers: formatFollowers(p.followers),
      preview: p.genres.slice(0, 2).join(' · '),
    }))
}

export interface ArtistCard {
  slug: string
  href: string
  displayName: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  genre: string
  releaseTitle: string
  releaseType: string
  releaseArtwork: string
}

export function artistCardsNear(center: GeoPoint, radius: number, search: string, limit = 6): ArtistCard[] {
  return withinType('artist', center, radius, search)
    .slice(0, limit)
    .map((p) => {
      const ev = nextEvent(EVENTS_BY_LINEUP, p.slug)
      return {
        slug: p.slug,
        href: cardHref(p),
        displayName: p.name,
        tagline: `${p.genres.join(' · ')} — ${p.town}`,
        avatar: p.avatar,
        cover: p.cover,
        verified: p.verified,
        genre: p.genres[0],
        releaseTitle: ev ? ev.title : `${p.genres[0]} — live`,
        releaseType: ev ? `Live · ${formatEventDate(ev.date)}` : `${p.town}`,
        releaseArtwork: ev ? ev.poster : p.cover,
      }
    })
}

export interface VenueCard {
  slug: string
  href: string
  displayName: string
  venueType: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  capacity: string
  nextEventLabel: string
  nextEventHref: string
}

export function venueCardsNear(center: GeoPoint, radius: number, search: string, limit = 6): VenueCard[] {
  return withinType('venue', center, radius, search)
    .slice(0, limit)
    .map((p) => {
      const ev = nextEvent(EVENTS_BY_VENUE, p.slug)
      return {
        slug: p.slug,
        href: cardHref(p),
        displayName: p.name,
        venueType: p.genres[0],
        tagline: `${p.area}, ${p.town}`,
        avatar: p.avatar,
        cover: p.cover,
        verified: p.verified,
        capacity: `${formatFollowers(p.followers)} followers`,
        nextEventLabel: ev ? `${ev.title} — ${formatEventDate(ev.date)}` : 'Now taking bookings',
        nextEventHref: ev ? `/event/${ev.slug}` : cardHref(p),
      }
    })
}

export interface OrganiserCard {
  slug: string
  href: string
  displayName: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  region: string
  nextEventLabel: string
  nextEventHref: string
}

export function organiserCardsNear(center: GeoPoint, radius: number, search: string, limit = 6): OrganiserCard[] {
  return withinType('organiser', center, radius, search)
    .slice(0, limit)
    .map((p) => {
      const ev = nextEvent(EVENTS_BY_ORGANISER, p.slug)
      return {
        slug: p.slug,
        href: cardHref(p),
        displayName: p.name,
        tagline: p.genres[0],
        avatar: p.avatar,
        cover: p.cover,
        verified: p.verified,
        region: `${p.area}, ${p.town}`,
        nextEventLabel: ev ? `${ev.title} — ${formatEventDate(ev.date)}` : 'New dates soon',
        nextEventHref: ev ? `/event/${ev.slug}` : cardHref(p),
      }
    })
}

// --- Events near / right rail ----------------------------------------------

export interface NearbyEvent {
  slug: string
  title: string
  dateLabel: string
  town: string
  venueName: string
  poster: string
  free: boolean
  priceFrom?: number
  status: DiscoveryEvent['status']
  distance: number
}

export function eventsNearHome(center: GeoPoint, radius: number, limit?: number): NearbyEvent[] {
  const list = DISCOVERY_EVENTS.map((e) => ({ ...e, distance: haversineMiles(center, e) }))
    .filter((e) => e.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      dateLabel: formatEventDate(e.date),
      town: e.town,
      venueName: e.venueName,
      poster: e.poster,
      free: e.free,
      priceFrom: e.priceFrom,
      status: e.status,
      distance: e.distance,
    }))
  return limit ? list.slice(0, limit) : list
}

export interface SuggestedProfile {
  slug: string
  href: string
  displayName: string
  typeLabel: string
  avatar: string
  verified: boolean
}

const TYPE_LABELS: Record<DiscoveryType, string> = {
  dj: 'DJ',
  artist: 'Artist / Band',
  venue: 'Venue',
  organiser: 'Event Organiser',
}

export function suggestedProfilesNear(center: GeoPoint, radius: number, limit = 5): SuggestedProfile[] {
  return DISCOVERY_PROFILES.map((p) => ({ ...p, distance: haversineMiles(center, p) }))
    .filter((p) => p.distance <= radius)
    .sort((a, b) => trendScore(b) - trendScore(a) || a.distance - b.distance)
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      href: cardHref(p),
      displayName: p.name,
      typeLabel: TYPE_LABELS[p.type],
      avatar: p.avatar,
      verified: p.verified,
    }))
}

// --- Main social feed ------------------------------------------------------

const CURATED_SLUGS = new Set(FEED_POSTS.map((p) => p.author.slug))

function authorFromProfile(p: DiscoveryProfile): FeedAuthor {
  return {
    name: p.name,
    slug: p.slug,
    type: p.type,
    typeLabel: TYPE_LABELS[p.type],
    avatar: p.avatar,
    verified: p.verified,
    href: p.hasPage && p.pageSlug ? profileHref(p.pageSlug) : '/profiles',
  }
}

function mapKind(kind: string, hasEvent: boolean): PostKind {
  switch (kind) {
    case 'mix':
      return 'audio'
    case 'clip':
      return 'video'
    case 'release':
      return 'release'
    case 'gallery':
      return 'gallery'
    case 'lineup':
      return hasEvent ? 'lineup' : 'photo'
    case 'poster':
    case 'announcement':
    case 'ticket':
      return hasEvent ? 'event' : 'photo'
    default:
      return 'photo'
  }
}

function shapeFor(kind: PostKind): FeedPost['shape'] {
  switch (kind) {
    case 'audio':
    case 'release':
      return 'square'
    case 'event':
    case 'lineup':
      return 'portrait'
    default:
      return 'landscape'
  }
}

function eventMetaFromDiscovery(e: DiscoveryEvent): FeedEventMeta {
  return {
    name: e.title,
    dateLabel: formatEventDate(e.date),
    venue: e.venueName,
    town: e.town,
    price: e.free ? 'Free' : e.priceFrom ? `From £${e.priceFrom}` : 'TBA',
    status: e.status,
    href: `/event/${e.slug}`,
    ticketHref: `/event/${e.slug}`,
  }
}

function contentToPost(c: (typeof DISCOVERY_CONTENT)[number]): FeedPost | null {
  const p = getDiscoveryProfile(c.profileSlug)
  if (!p) return null
  const ev = c.eventId ? DISCOVERY_EVENTS.find((e) => e.id === c.eventId) : undefined
  const kind = mapKind(c.kind, !!ev)
  return {
    id: `gen-${c.id}`,
    kind,
    author: authorFromProfile(p),
    categories: ['for-you'],
    time: c.postedDaysAgo === 1 ? '1d' : `${c.postedDaysAgo}d`,
    location: c.town,
    caption: c.caption,
    tags: c.tags,
    images: [c.image ?? p.cover],
    mediaAlt: `${p.name} — ${c.kind}`,
    shape: shapeFor(kind),
    likes: c.likes,
    commentCount: c.comments,
    shares: Math.max(1, Math.round(c.likes / 12)),
    event: ev ? eventMetaFromDiscovery(ev) : undefined,
    comments: [],
  }
}

function matchPost(post: FeedPost, q: string): boolean {
  return (
    post.caption.toLowerCase().includes(q) ||
    post.author.name.toLowerCase().includes(q) ||
    (post.location?.toLowerCase().includes(q) ?? false) ||
    post.tags.some((t) => t.toLowerCase().includes(q))
  )
}

/** The main social feed, filtered by live distance from `center`, then by the
 *  active category and search. Curated rich posts (for the four example
 *  profiles) lead; location-accurate generated posts fill in the rest. */
export function feedPostsNear(
  center: GeoPoint,
  radius: number,
  category: FeedCategory,
  search: string,
): FeedPost[] {
  const type = categoryType(category)
  const eventsOnly = category === 'events'
  const q = search.trim().toLowerCase()

  const curated = FEED_POSTS.filter((post) => {
    const p = getDiscoveryProfile(post.author.slug)
    return p ? haversineMiles(center, p) <= radius : false
  })

  const generated = DISCOVERY_CONTENT.filter((c) => !CURATED_SLUGS.has(c.profileSlug))
    .map((c) => ({ c, distance: haversineMiles(center, c) }))
    .filter((x) => x.distance <= radius)
    .sort((a, b) => a.c.postedDaysAgo - b.c.postedDaysAgo)
    .map((x) => contentToPost(x.c))
    .filter((p): p is FeedPost => p !== null)

  let all = [...curated, ...generated]

  if (eventsOnly) {
    all = all.filter((p) => p.kind === 'event' || p.kind === 'lineup' || !!p.event)
  } else if (type) {
    all = all.filter((p) => (p.author.type as string) === type)
  }
  if (q) all = all.filter((p) => matchPost(p, q))

  return all
}
