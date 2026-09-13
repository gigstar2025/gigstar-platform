// ---------------------------------------------------------------------------
// TEMPORARY mock data for the GigStar homepage social feed prototype.
//
// This is a frontend-only demonstration layer. Content is derived from the
// existing showcase profiles/events plus social-flavoured fields (captions,
// tags, engagement counts, comments). It maps cleanly onto real
// profile-publishes-content relationships later:
//
//   professional profile -> publishes content -> appears in this feed ->
//   visitor opens the linked profile or event
//
// No database, API, or auth is involved. All engagement is session-only.
// ---------------------------------------------------------------------------

import type { ShowcaseType } from '@/lib/profiles/showcase'
import {
  SHOWCASE_PROFILES,
  SHOWCASE_EVENTS,
  summarizeProfile,
  type ShowcaseEvent,
} from '@/lib/profiles/showcase'

export type FeedCategory =
  | 'for-you'
  | 'djs'
  | 'artists'
  | 'venues'
  | 'events'
  | 'organisers'

export const CATEGORIES: { key: FeedCategory; label: string }[] = [
  { key: 'for-you', label: 'For You' },
  { key: 'djs', label: 'DJs' },
  { key: 'artists', label: 'Artists & Bands' },
  { key: 'venues', label: 'Venues' },
  { key: 'events', label: 'Events' },
  { key: 'organisers', label: 'Organisers' },
]

export function profileHref(slug: string) {
  return `/p/${slug}`
}
export function eventHref(slug: string) {
  return `/event/${slug}`
}

/** Link any card of a given type to a real example profile of that type. */
const REAL_PROFILE_BY_TYPE: Record<ShowcaseType, string> = {
  dj: 'luna-vega',
  artist: 'echo-atlas',
  venue: 'the-lumen-rooms',
  organiser: 'nightform',
}
export function exampleHrefForType(type: ShowcaseType) {
  return profileHref(REAL_PROFILE_BY_TYPE[type])
}

export interface FeedAuthor {
  name: string
  slug: string
  type: ShowcaseType
  typeLabel: string
  avatar: string
  verified: boolean
  href: string
}

const PROFILE = Object.fromEntries(
  SHOWCASE_PROFILES.map((p) => [p.slug, p]),
)

function author(slug: string): FeedAuthor {
  const p = PROFILE[slug]
  const labels: Record<ShowcaseType, string> = {
    dj: 'DJ',
    artist: 'Artist / Band',
    venue: 'Venue',
    organiser: 'Event Organiser',
  }
  return {
    name: p.displayName,
    slug: p.slug,
    type: p.type,
    typeLabel: labels[p.type],
    avatar: p.avatar,
    verified: Boolean(p.verified),
    href: profileHref(p.slug),
  }
}

export interface FeedComment {
  id: string
  author: string
  avatar: string
  text: string
  time: string
}

export type PostKind =
  | 'video'
  | 'audio'
  | 'gallery'
  | 'event'
  | 'release'
  | 'photo'
  | 'lineup'

export interface FeedEventMeta {
  name: string
  dateLabel: string
  venue: string
  town: string
  price: string
  status: ShowcaseEvent['status']
  href: string
  ticketHref: string
}

export interface FeedReleaseMeta {
  title: string
  type: string
  artwork: string
}

export interface FeedPost {
  id: string
  kind: PostKind
  author: FeedAuthor
  categories: FeedCategory[]
  time: string
  location?: string
  caption: string
  tags: string[]
  /** One or more landscape/portrait/square media. First is primary. */
  images: string[]
  mediaAlt: string
  /** portrait | square | landscape — controls the media aspect ratio. */
  shape: 'portrait' | 'square' | 'landscape'
  duration?: string
  likes: number
  commentCount: number
  shares: number
  event?: FeedEventMeta
  release?: FeedReleaseMeta
  comments: FeedComment[]
}

const AV = {
  luna: PROFILE['luna-vega'].avatar,
  echo: PROFILE['echo-atlas'].avatar,
  lumen: PROFILE['the-lumen-rooms'].avatar,
  night: PROFILE['nightform'].avatar,
}

function eventMeta(slug: string): FeedEventMeta {
  const e = SHOWCASE_EVENTS.find((x) => x.slug === slug)!
  const dateLabel = new Date(`${e.date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return {
    name: e.title,
    dateLabel,
    venue: e.venueName,
    town: e.town,
    price: e.free ? 'Free' : e.priceFrom ? `From ${e.priceFrom}` : 'TBA',
    status: e.status,
    href: eventHref(e.slug),
    ticketHref: e.ticketUrl ?? '#tickets',
  }
}

export const FEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    kind: 'audio',
    author: author('luna-vega'),
    categories: ['for-you', 'djs'],
    time: '2h',
    location: 'Manchester',
    caption:
      'New mix is live — Afterglow Radio 042, a two-hour late-night journey through melodic house and progressive. Play it loud.',
    tags: ['#melodichouse', '#mixcloud', '#afterglowradio'],
    images: ['/images/profile/mix-1.png'],
    mediaAlt: 'Afterglow Radio 042 mix artwork',
    shape: 'square',
    duration: '1:58:20',
    likes: 1284,
    commentCount: 3,
    shares: 92,
    comments: [
      { id: 'c1', author: 'Nightform', avatar: AV.night, text: 'Absolute closer energy. See you Feb 27.', time: '1h' },
      { id: 'c2', author: 'Echo Atlas', avatar: AV.echo, text: 'The breakdown at 47:00 🔥', time: '54m' },
    ],
  },
  {
    id: 'post-2',
    kind: 'release',
    author: author('echo-atlas'),
    categories: ['for-you', 'artists'],
    time: '5h',
    location: 'Manchester',
    caption:
      'Parallel Lines is out now everywhere. Eleven tracks, two years in the making. Thank you for listening.',
    tags: ['#newmusic', '#parallellines', '#altelectronic'],
    images: ['/images/showcase/artist/release-1.png'],
    mediaAlt: 'Parallel Lines album artwork',
    shape: 'square',
    likes: 2043,
    commentCount: 2,
    shares: 210,
    release: { title: 'Parallel Lines', type: 'Album', artwork: '/images/showcase/artist/release-1.png' },
    comments: [
      { id: 'c1', author: 'The Lumen Rooms', avatar: AV.lumen, text: 'Northern Lights on repeat in the bar all week.', time: '3h' },
      { id: 'c2', author: 'Luna Vega', avatar: AV.luna, text: 'Such a record. Congrats team.', time: '2h' },
    ],
  },
  {
    id: 'post-3',
    kind: 'event',
    author: author('nightform'),
    categories: ['for-you', 'events', 'organisers'],
    time: '8h',
    location: 'Manchester',
    caption:
      'We are taking over every room of The Lumen Rooms. Echo Atlas live, Luna Vega closing the basement. Tickets selling fast.',
    tags: ['#nightform', '#winterlights', '#manchester'],
    images: ['/images/showcase/event/poster.png'],
    mediaAlt: 'Nightform Winter Lights Launch poster',
    shape: 'portrait',
    likes: 876,
    commentCount: 2,
    shares: 143,
    event: eventMeta('nightform-winter-lights'),
    comments: [
      { id: 'c1', author: 'Echo Atlas', avatar: AV.echo, text: 'Cannot wait for this one.', time: '6h' },
      { id: 'c2', author: 'Luna Vega', avatar: AV.luna, text: 'Basement is going to be special.', time: '5h' },
    ],
  },
  {
    id: 'post-4',
    kind: 'gallery',
    author: author('the-lumen-rooms'),
    categories: ['for-you', 'venues'],
    time: '12h',
    location: 'Northern Quarter, Manchester',
    caption:
      'A look inside all three floors ahead of a huge weekend. Main Hall, the Mezzanine and the candlelit Cellar. Which room is yours?',
    tags: ['#venue', '#livemusic', '#northernquarter'],
    images: ['/images/showcase/venue/hall.png', '/images/showcase/venue/bar.png', '/images/showcase/venue/restaurant.png'],
    mediaAlt: 'Interiors of The Lumen Rooms',
    shape: 'landscape',
    likes: 654,
    commentCount: 1,
    shares: 48,
    comments: [
      { id: 'c1', author: 'Nightform', avatar: AV.night, text: 'Best rooms in the city.', time: '9h' },
    ],
  },
  {
    id: 'post-5',
    kind: 'video',
    author: author('luna-vega'),
    categories: ['for-you', 'djs'],
    time: 'Yesterday',
    location: 'Depot Mayfield',
    caption:
      'Warehouse Sessions 013 — six hours, two rooms, one of my favourite nights of the year. Full set clip below.',
    tags: ['#warehouse', '#djset', '#melodictechno'],
    images: ['/images/profile/video-1.png'],
    mediaAlt: 'Luna Vega performing a warehouse set',
    shape: 'landscape',
    duration: '58:12',
    likes: 1932,
    commentCount: 2,
    shares: 176,
    comments: [
      { id: 'c1', author: 'Nightform', avatar: AV.night, text: 'The room was electric. Instant rebook.', time: '20h' },
      { id: 'c2', author: 'The Lumen Rooms', avatar: AV.lumen, text: 'Unreal energy.', time: '18h' },
    ],
  },
  {
    id: 'post-6',
    kind: 'lineup',
    author: author('nightform'),
    categories: ['for-you', 'events', 'organisers'],
    time: 'Yesterday',
    location: 'Platt Fields Park',
    caption:
      'Nightform Open Air 2026 — phase one line-up. Three stages across the park. Echo Atlas live and Luna Vega confirmed. More TBA.',
    tags: ['#festival', '#openair', '#lineup'],
    images: ['/images/showcase/event/openair.png'],
    mediaAlt: 'Nightform Open Air 2026 poster',
    shape: 'portrait',
    likes: 1420,
    commentCount: 1,
    shares: 305,
    event: eventMeta('nightform-open-air-2026'),
    comments: [
      { id: 'c1', author: 'Echo Atlas', avatar: AV.echo, text: 'Summer sorted.', time: '22h' },
    ],
  },
  {
    id: 'post-7',
    kind: 'video',
    author: author('echo-atlas'),
    categories: ['for-you', 'artists'],
    time: '2d',
    location: 'Manchester',
    caption:
      'The official video for Northern Lights is here. Directed and shot across a single night in the city we love.',
    tags: ['#musicvideo', '#northernlights', '#livemusic'],
    images: ['/images/showcase/artist/gallery-1.png'],
    mediaAlt: 'Echo Atlas Northern Lights official video',
    shape: 'landscape',
    duration: '4:12',
    likes: 2571,
    commentCount: 1,
    shares: 288,
    comments: [
      { id: 'c1', author: 'Luna Vega', avatar: AV.luna, text: 'The visuals are stunning.', time: '1d' },
    ],
  },
  {
    id: 'post-8',
    kind: 'event',
    author: author('the-lumen-rooms'),
    categories: ['for-you', 'events', 'venues'],
    time: '2d',
    location: 'Northern Quarter, Manchester',
    caption:
      'Sunday Jazz & Roast returns this weekend. Live trio, our full roast menu, all ages welcome. Free entry — just turn up.',
    tags: ['#jazz', '#sundayroast', '#freeentry'],
    images: ['/images/showcase/event/jazz.png'],
    mediaAlt: 'Sunday Jazz and Roast poster',
    shape: 'portrait',
    likes: 421,
    commentCount: 1,
    shares: 33,
    event: eventMeta('lumen-sunday-jazz'),
    comments: [
      { id: 'c1', author: 'Nightform', avatar: AV.night, text: 'Perfect Sunday.', time: '1d' },
    ],
  },
  {
    id: 'post-9',
    kind: 'photo',
    author: author('luna-vega'),
    categories: ['for-you', 'djs'],
    time: '3d',
    location: 'Manchester',
    caption: 'That moment when the whole room moves together. Thank you Manchester.',
    tags: ['#crowd', '#nightlife'],
    images: ['/images/profile/gallery-1.png'],
    mediaAlt: 'Crowd at a Luna Vega night',
    shape: 'landscape',
    likes: 988,
    commentCount: 1,
    shares: 27,
    comments: [
      { id: 'c1', author: 'The Lumen Rooms', avatar: AV.lumen, text: 'Full to the last record.', time: '2d' },
    ],
  },
  {
    id: 'post-10',
    kind: 'gallery',
    author: author('nightform'),
    categories: ['for-you', 'organisers'],
    time: '4d',
    location: 'Manchester',
    caption:
      'Looking back at Warehouse Sessions 013 and NYE: Ascension. Two sold-out nights we will be chasing for a while.',
    tags: ['#pastevents', '#warehouse', '#nye'],
    images: ['/images/showcase/organiser/cover.png', '/images/showcase/event/warehouse.png', '/images/showcase/organiser/past-1.png'],
    mediaAlt: 'Photos from past Nightform events',
    shape: 'landscape',
    likes: 1102,
    commentCount: 1,
    shares: 61,
    comments: [
      { id: 'c1', author: 'Luna Vega', avatar: AV.luna, text: 'Best-run nights in the city.', time: '3d' },
    ],
  },
  {
    id: 'post-11',
    kind: 'audio',
    author: author('echo-atlas'),
    categories: ['for-you', 'artists'],
    time: '5d',
    location: 'Manchester',
    caption: 'Revisiting the Undertow EP while we finish the next record. Preview the title track below.',
    tags: ['#ep', '#undertow', '#synthpop'],
    images: ['/images/showcase/artist/release-2.png'],
    mediaAlt: 'Undertow EP artwork',
    shape: 'square',
    duration: '3:44',
    likes: 733,
    commentCount: 1,
    shares: 44,
    comments: [
      { id: 'c1', author: 'Luna Vega', avatar: AV.luna, text: 'Underrated EP honestly.', time: '4d' },
    ],
  },
  {
    id: 'post-12',
    kind: 'photo',
    author: author('the-lumen-rooms'),
    categories: ['for-you', 'venues'],
    time: '6d',
    location: 'Northern Quarter, Manchester',
    caption: 'Doors open, lights on. The Lumen Rooms after dark.',
    tags: ['#venue', '#manchester'],
    images: ['/images/showcase/venue/exterior.png'],
    mediaAlt: 'The Lumen Rooms exterior at night',
    shape: 'landscape',
    likes: 512,
    commentCount: 1,
    shares: 19,
    comments: [
      { id: 'c1', author: 'Echo Atlas', avatar: AV.echo, text: 'Home venue. Always a good night.', time: '5d' },
    ],
  },
]

// --- Profile highlights (stories-style row) --------------------------------

export interface Highlight {
  id: string
  label: string
  image: string
  live?: boolean
}

export const HIGHLIGHTS: Highlight[] = [
  { id: 'h1', label: 'Live Now', image: '/images/profile/video-1.png', live: true },
  { id: 'h2', label: 'DJ Sets', image: '/images/profile/gallery-1.png' },
  { id: 'h3', label: 'New Music', image: '/images/showcase/artist/release-1.png' },
  { id: 'h4', label: 'Tonight', image: '/images/showcase/event/poster.png' },
  { id: 'h5', label: 'Venues', image: '/images/showcase/venue/hall.png' },
  { id: 'h6', label: 'Festivals', image: '/images/showcase/event/openair.png' },
  { id: 'h7', label: 'Tickets', image: '/images/showcase/event/echo-tour.png' },
  { id: 'h8', label: 'Warehouse', image: '/images/showcase/event/warehouse.png' },
]

// --- Short-form vertical video reels ---------------------------------------

export interface Reel {
  id: string
  title: string
  authorSlug: string
  authorName: string
  authorType: ShowcaseType
  poster: string
  views: string
  tag: string
}

export const REELS: Reel[] = [
  { id: 'r1', title: 'Warehouse closing set', authorSlug: 'luna-vega', authorName: 'Luna Vega', authorType: 'dj', poster: '/images/profile/video-1.png', views: '48.2k', tag: 'DJ Set' },
  { id: 'r2', title: 'Northern Lights live', authorSlug: 'echo-atlas', authorName: 'Echo Atlas', authorType: 'artist', poster: '/images/showcase/artist/gallery-1.png', views: '31.7k', tag: 'Live' },
  { id: 'r3', title: 'Three-floor venue tour', authorSlug: 'the-lumen-rooms', authorName: 'The Lumen Rooms', authorType: 'venue', poster: '/images/showcase/venue/hall.png', views: '12.4k', tag: 'Venue Tour' },
  { id: 'r4', title: 'Open Air trailer', authorSlug: 'nightform', authorName: 'Nightform', authorType: 'organiser', poster: '/images/showcase/event/openair.png', views: '64.9k', tag: 'Trailer' },
  { id: 'r5', title: 'Crowd moment', authorSlug: 'luna-vega', authorName: 'Luna Vega', authorType: 'dj', poster: '/images/profile/gallery-2.png', views: '22.1k', tag: 'Crowd' },
  { id: 'r6', title: 'Studio session', authorSlug: 'echo-atlas', authorName: 'Echo Atlas', authorType: 'artist', poster: '/images/showcase/artist/gallery-2.png', views: '18.6k', tag: 'Studio' },
]

// --- Section data derived from showcase profiles ---------------------------

export const EVENTS_NEAR_YOU = SHOWCASE_EVENTS.filter((e) => e.status !== 'sold-out').slice(0, 4)

export const TRENDING_DJS = [
  {
    ...summarizeProfile(PROFILE['luna-vega']),
    followers: '18.4k',
    preview: 'Afterglow Radio 042',
  },
  {
    slug: 'luna-vega',
    type: 'dj' as ShowcaseType,
    displayName: 'Halogen',
    tagline: 'Melodic techno — Leeds',
    avatar: '/images/profile/gallery-3.png',
    cover: '/images/showcase/event/warehouse.png',
    location: 'Leeds, UK',
    chips: ['Melodic Techno', 'Hypnotic'],
    verified: false,
    featured: false,
    followers: '9.2k',
    preview: 'Basement Tapes 07',
  },
  {
    slug: 'luna-vega',
    type: 'dj' as ShowcaseType,
    displayName: 'Marla Dune',
    tagline: 'Disco & house — Manchester',
    avatar: '/images/profile/gallery-2.png',
    cover: '/images/profile/gallery-1.png',
    location: 'Manchester, UK',
    chips: ['Disco', 'House'],
    verified: true,
    featured: false,
    followers: '14.0k',
    preview: 'Sunset Edits Vol. 3',
  },
]

export interface ArtistCard {
  slug: string
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
export const FEATURED_ARTISTS: ArtistCard[] = [
  {
    slug: 'echo-atlas',
    displayName: 'Echo Atlas',
    tagline: 'Alternative electronic four-piece — Manchester',
    avatar: PROFILE['echo-atlas'].avatar,
    cover: PROFILE['echo-atlas'].cover,
    verified: true,
    genre: 'Alt-Electronic',
    releaseTitle: 'Parallel Lines',
    releaseType: 'Album · 2025',
    releaseArtwork: '/images/showcase/artist/release-1.png',
  },
  {
    slug: 'echo-atlas',
    displayName: 'Violet Hours',
    tagline: 'Indie / dream-pop — Leeds',
    avatar: '/images/profile/gallery-2.png',
    cover: '/images/showcase/artist/gallery-1.png',
    verified: false,
    genre: 'Dream-pop',
    releaseTitle: 'Slow Tide',
    releaseType: 'EP · 2025',
    releaseArtwork: '/images/showcase/artist/release-2.png',
  },
  {
    slug: 'echo-atlas',
    displayName: 'Kite Season',
    tagline: 'Synth-pop trio — Liverpool',
    avatar: '/images/profile/gallery-3.png',
    cover: '/images/showcase/artist/gallery-2.png',
    verified: true,
    genre: 'Synth-pop',
    releaseTitle: 'Neon Fields',
    releaseType: 'Single · 2026',
    releaseArtwork: '/images/showcase/artist/release-1.png',
  },
]

export interface VenueCard {
  slug: string
  displayName: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  venueType: string
  capacity: string
  nextEventLabel: string
  nextEventHref: string
}
export const POPULAR_VENUES: VenueCard[] = [
  {
    slug: 'the-lumen-rooms',
    displayName: 'The Lumen Rooms',
    tagline: 'Northern Quarter, Manchester',
    avatar: PROFILE['the-lumen-rooms'].avatar,
    cover: PROFILE['the-lumen-rooms'].cover,
    verified: true,
    venueType: 'Live-music bar & restaurant',
    capacity: '420 standing',
    nextEventLabel: 'Winter Lights — Fri 27 Feb',
    nextEventHref: eventHref('nightform-winter-lights'),
  },
  {
    slug: 'the-lumen-rooms',
    displayName: 'Depot Mayfield',
    tagline: 'Warehouse event space — Manchester',
    avatar: '/images/showcase/event/warehouse.png',
    cover: '/images/showcase/organiser/cover.png',
    verified: true,
    venueType: 'Warehouse & festival space',
    capacity: '10,000 capacity',
    nextEventLabel: 'Open Air 2026 — Sat 4 Jul',
    nextEventHref: eventHref('nightform-open-air-2026'),
  },
  {
    slug: 'the-lumen-rooms',
    displayName: 'The Blue Room',
    tagline: 'Jazz & cocktail bar — Manchester',
    avatar: '/images/showcase/venue/bar.png',
    cover: '/images/showcase/venue/restaurant.png',
    verified: false,
    venueType: 'Jazz & cocktail bar',
    capacity: '120 seated',
    nextEventLabel: 'Sunday Jazz & Roast',
    nextEventHref: eventHref('lumen-sunday-jazz'),
  },
]

export interface OrganiserCard {
  slug: string
  displayName: string
  tagline: string
  avatar: string
  cover: string
  verified: boolean
  region: string
  nextEventLabel: string
  nextEventHref: string
}
export const FEATURED_ORGANISERS: OrganiserCard[] = [
  {
    slug: 'nightform',
    displayName: 'Nightform',
    tagline: 'Independent promoter & event series',
    avatar: PROFILE['nightform'].avatar,
    cover: PROFILE['nightform'].cover,
    verified: true,
    region: 'Manchester & North West',
    nextEventLabel: 'Winter Lights — Fri 27 Feb',
    nextEventHref: eventHref('nightform-winter-lights'),
  },
  {
    slug: 'nightform',
    displayName: 'Aurora Presents',
    tagline: 'Live & electronic shows',
    avatar: '/images/showcase/artist/gallery-1.png',
    cover: '/images/showcase/artist/cover.png',
    verified: true,
    region: 'Yorkshire',
    nextEventLabel: 'Echo Atlas Live — London',
    nextEventHref: eventHref('echo-atlas-parallel-lines-london'),
  },
  {
    slug: 'nightform',
    displayName: 'Lowkey Collective',
    tagline: 'DIY parties & fundraisers',
    avatar: '/images/showcase/event/jazz.png',
    cover: '/images/showcase/event/warehouse.png',
    verified: false,
    region: 'Greater Manchester',
    nextEventLabel: 'Basement Social',
    nextEventHref: '/profiles',
  },
]

export const SUGGESTED_PROFILES = SHOWCASE_PROFILES.map(summarizeProfile)

export const TRENDING_EVENTS = SHOWCASE_EVENTS.slice(0, 5).map((e) => ({
  slug: e.slug,
  title: e.title,
  poster: e.poster,
  town: e.town,
  dateLabel: new Date(`${e.date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  }),
  status: e.status,
}))
