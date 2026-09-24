// ---------------------------------------------------------------------------
// 60 mock professional profiles across the Hastings and London test regions.
//
// Records are authored compactly through `mk()`, which derives a stable id,
// jittered per-profile coordinates (from its area anchor), imagery, follower
// counts and ratings deterministically from the slug — so the dataset stays
// varied without 60 hand-written blocks. Only the four principal example
// profiles (page: true) have complete public pages at /p/[slug]; the rest exist
// to power homepage search, feeds, location filtering and recommendations.
// ---------------------------------------------------------------------------

import { AREAS, hashStr, jitter, pickFrom, round5, type AreaKey } from './geo'
import type { DiscoveryProfile, DiscoveryType } from './types'

const IMG: Record<DiscoveryType, { avatar: string[]; cover: string[] }> = {
  dj: {
    avatar: ['/images/profile/avatar.png', '/images/profile/gallery-2.png', '/images/profile/gallery-3.png'],
    cover: ['/images/profile/cover.png', '/images/profile/gallery-1.png', '/images/showcase/event/warehouse.png', '/images/profile/mix-1.png', '/images/profile/mix-2.png'],
  },
  artist: {
    avatar: ['/images/showcase/artist/band.png', '/images/profile/gallery-3.png', '/images/profile/gallery-2.png'],
    cover: ['/images/showcase/artist/cover.png', '/images/showcase/artist/gallery-1.png', '/images/showcase/artist/gallery-2.png', '/images/showcase/artist/release-1.png'],
  },
  venue: {
    avatar: ['/images/showcase/venue/bar.png', '/images/showcase/venue/exterior.png', '/images/showcase/venue/restaurant.png'],
    cover: ['/images/showcase/venue/cover.png', '/images/showcase/venue/hall.png', '/images/showcase/venue/exterior.png', '/images/showcase/venue/restaurant.png'],
  },
  organiser: {
    avatar: ['/images/showcase/organiser/cover.png', '/images/showcase/artist/gallery-1.png', '/images/showcase/event/jazz.png'],
    cover: ['/images/showcase/organiser/cover.png', '/images/showcase/event/openair.png', '/images/showcase/event/warehouse.png', '/images/showcase/organiser/past-1.png'],
  },
}

function describe(type: DiscoveryType, name: string, area: string, regionLabel: string, genres: string[]): string {
  const g = genres[0]
  switch (type) {
    case 'dj':
      return `${name} is a ${g.toLowerCase()} DJ based in ${area}, playing clubs, bars and parties across ${regionLabel}.`
    case 'artist':
      return `${name} is a ${g.toLowerCase()} act from ${area}, ${regionLabel} — pairing live shows with a steady stream of new music.`
    case 'venue':
      return `${name} is a ${g.toLowerCase()} in ${area} hosting live music, DJs and events through the week.`
    case 'organiser':
      return `${name} programmes ${g.toLowerCase()} across ${area} and the wider ${regionLabel} scene.`
  }
}

function deriveTags(type: DiscoveryType, genres: string[], area: string, town: string): string[] {
  return [type, ...genres, area, town].map((t) => t.toLowerCase())
}

interface Opts {
  verified?: boolean
  featured?: boolean
  travel?: number
  page?: boolean
  avatar?: string
  cover?: string
}

function mk(
  slug: string,
  name: string,
  type: DiscoveryType,
  areaKey: AreaKey,
  genres: string[],
  opts: Opts = {},
): DiscoveryProfile {
  const area = AREAS[areaKey]
  const h = hashStr(slug)
  const regionLabel = area.region === 'london' ? 'London' : 'the Hastings area'
  const followersBase = 300 + (h % 16000)
  const followers = opts.verified ? followersBase + 8000 : followersBase
  const rating = (40 + (h % 11)) / 10 // 4.0 – 5.0
  const reviews = 6 + (h % 170)
  const travelRadius =
    opts.travel ?? (type === 'dj' ? 30 : type === 'artist' ? 45 : undefined)
  return {
    id: `p-${slug}`,
    slug,
    name,
    type,
    region: area.region,
    area: area.area,
    town: area.town,
    lat: round5(area.lat + jitter(h, 'lat')),
    lng: round5(area.lng + jitter(h, 'lng')),
    avatar: opts.avatar ?? pickFrom(IMG[type].avatar, h),
    cover: opts.cover ?? pickFrom(IMG[type].cover, h >> 2),
    description: describe(type, name, area.area, regionLabel, genres),
    genres,
    tags: deriveTags(type, genres, area.area, area.town),
    verified: !!opts.verified,
    featured: !!opts.featured,
    followers,
    rating,
    reviews,
    travelRadius,
    hasPage: !!opts.page,
    pageSlug: opts.page ? slug : undefined,
    source: 'example',
  }
}

export const DISCOVERY_PROFILES: DiscoveryProfile[] = [
  // ===== LONDON =============================================================
  // -- DJs --
  mk('luna-vega', 'Luna Vega', 'dj', 'shoreditch', ['Melodic House', 'Melodic Techno'], { verified: true, featured: true, travel: 150, page: true, avatar: '/images/profile/avatar.png', cover: '/images/profile/cover.png' }),
  mk('dusk-signal', 'Dusk Signal', 'dj', 'hackney', ['Techno', 'Warehouse'], { verified: true }),
  mk('marla-dune', 'Marla Dune', 'dj', 'peckham', ['Disco', 'House'], { featured: true }),
  mk('orbit-audio', 'Orbit Audio', 'dj', 'camden', ['Drum & Bass', 'Jungle']),
  mk('neon-fox', 'Neon Fox', 'dj', 'brixton', ['House', 'Tech House'], { verified: true }),
  mk('saint-tempo', 'Saint Tempo', 'dj', 'islington', ['UK Garage', 'Bassline']),
  mk('vela-sound', 'Vela Sound', 'dj', 'croydon', ['Bassline', 'Grime']),
  mk('halcyon-jones', 'Halcyon Jones', 'dj', 'wembley', ['Funk', 'Soul']),
  mk('dj-sable', 'DJ Sable', 'dj', 'slough', ['Amapiano', 'Afro House']),
  // -- Artists / bands --
  mk('the-paper-tigers', 'The Paper Tigers', 'artist', 'camden', ['Indie Rock'], { verified: true }),
  mk('violet-hours', 'Violet Hours', 'artist', 'barnet', ['Dream-pop', 'Shoegaze']),
  mk('brass-union', 'Brass Union', 'artist', 'soho', ['Jazz', 'Funk'], { verified: true, featured: true }),
  mk('echo-district', 'Echo District', 'artist', 'shoreditch', ['Alt-electronic']),
  mk('clara-mae', 'Clara Mae', 'artist', 'greenwich', ['Singer-songwriter', 'Folk']),
  mk('northbank-collective', 'Northbank Collective', 'artist', 'stratford', ['Afrobeat', 'Soul'], { verified: true }),
  mk('midnight-choir', 'Midnight Choir', 'artist', 'guildford', ['Soul', 'Gospel']),
  // -- Venues --
  mk('the-lumen-rooms', 'The Lumen Rooms', 'venue', 'peckham', ['Live-music bar'], { verified: true, featured: true, page: true, avatar: '/images/showcase/venue/exterior.png', cover: '/images/showcase/venue/cover.png' }),
  mk('the-brass-vault', 'The Brass Vault', 'venue', 'soho', ['Jazz club'], { verified: true }),
  mk('warehouse-e5', 'Warehouse E5', 'venue', 'hackney', ['Warehouse space']),
  mk('the-selby', 'The Selby', 'venue', 'watford', ['Grand hall'], { verified: true }),
  mk('riverside-rooms', 'Riverside Rooms', 'venue', 'reading', ['Riverside venue']),
  mk('camden-underground', 'Camden Underground', 'venue', 'camden', ['Basement club'], { verified: true }),
  mk('the-nightjar-rooms', 'The Nightjar Rooms', 'venue', 'shoreditch', ['Cocktail & live bar']),
  mk('wax-and-vine', 'Wax & Vine', 'venue', 'fitzrovia', ['Wine & vinyl bar']),
  // -- Organisers --
  mk('after-dark-collective', 'After Dark Collective', 'organiser', 'shoreditch', ['Club nights'], { verified: true, featured: true }),
  mk('riff-city-promotions', 'Riff City Promotions', 'organiser', 'camden', ['Live gigs']),
  mk('sundown-socials', 'Sundown Socials', 'organiser', 'sevenoaks', ['Day parties'], { verified: true }),
  mk('capital-jazz-co', 'Capital Jazz Co.', 'organiser', 'soho', ['Jazz series']),
  mk('open-decks-london', 'Open Decks London', 'organiser', 'hackney', ['Community', 'Open decks']),
  mk('lowkey-collective', 'Lowkey Collective', 'organiser', 'islington', ['DIY parties']),

  // ===== HASTINGS ===========================================================
  // -- DJs --
  mk('tidal-frequency', 'Tidal Frequency', 'dj', 'old-town', ['Coastal House', 'House'], { featured: true }),
  mk('pier-pressure', 'Pier Pressure', 'dj', 'the-stade', ['Disco', 'Nu-Disco']),
  mk('shingle-sound', 'Shingle Sound', 'dj', 'st-leonards', ['Deep House'], { verified: true }),
  mk('groyne-audio', 'Groyne Audio', 'dj', 'brighton', ['Techno']),
  mk('cinque-selectors', 'Cinque Selectors', 'dj', 'battle', ['Soul', 'Funk']),
  mk('ore-valley-dj', 'Ore Valley', 'dj', 'ore', ['UK Garage']),
  mk('marina-mix', 'Marina Mix', 'dj', 'st-leonards', ['House', 'Balearic'], { verified: true }),
  mk('cliff-edge-sound', 'Cliff Edge Sound', 'dj', 'hastings-centre', ['Bass', 'Dubstep']),
  mk('dj-harbour-lights', 'DJ Harbour Lights', 'dj', 'the-stade', ['Coastal Disco', 'Disco']),
  // -- Artists / bands --
  mk('echo-atlas', 'Echo Atlas', 'artist', 'st-leonards', ['Alt-electronic'], { verified: true, featured: true, travel: 200, page: true, avatar: '/images/showcase/artist/band.png', cover: '/images/showcase/artist/cover.png' }),
  mk('the-fishwives', 'The Fishwives', 'artist', 'old-town', ['Folk', 'Sea Shanty']),
  mk('saltmarsh', 'Saltmarsh', 'artist', 'rye', ['Indie Folk']),
  mk('the-smugglers-band', 'The Smugglers', 'artist', 'the-stade', ['Folk Rock'], { verified: true }),
  mk('amber-tide', 'Amber Tide', 'artist', 'tunbridge-wells', ['Dream-pop']),
  mk('battle-brass', 'Battle Brass', 'artist', 'battle', ['Brass Band']),
  mk('coast-road', 'Coast Road', 'artist', 'ashford', ['Americana', 'Country']),
  // -- Venues --
  mk('the-anchor-rooms', 'The Anchor Rooms', 'venue', 'old-town', ['Pub venue'], { verified: true }),
  mk('the-stade-hall', 'The Stade Hall', 'venue', 'the-stade', ['Community hall']),
  mk('marine-court-club', 'Marine Court Club', 'venue', 'st-leonards', ['Art-deco club'], { verified: true, featured: true }),
  mk('the-pier-pavilion', 'The Pier Pavilion', 'venue', 'hastings-centre', ['Seafront pavilion'], { verified: true }),
  mk('the-seafront-pavilion', 'The Seafront Pavilion', 'venue', 'bexhill', ['Pavilion']),
  mk('the-crypt-hastings', 'The Crypt', 'venue', 'old-town', ['Basement club']),
  mk('rye-cellar', 'Rye Cellar', 'venue', 'rye', ['Cellar bar']),
  mk('the-driftwood', 'The Driftwood', 'venue', 'west-st-leonards', ['Beach bar']),
  // -- Organisers --
  mk('nightform', 'Nightform', 'organiser', 'old-town', ['Club & festival promoter'], { verified: true, featured: true, page: true, avatar: '/images/showcase/organiser/cover.png', cover: '/images/showcase/organiser/past-1.png' }),
  mk('coastline-events', 'Coastline Events', 'organiser', 'st-leonards', ['Festivals'], { verified: true }),
  mk('old-town-sessions', 'Old Town Sessions', 'organiser', 'old-town', ['Community gigs']),
  mk('1066-live', '1066 Live', 'organiser', 'battle', ['Live promotions']),
  mk('seaside-socials', 'Seaside Socials', 'organiser', 'the-stade', ['Day parties']),
  mk('eastbourne-electric', 'Eastbourne Electric', 'organiser', 'eastbourne', ['Electronic events']),
]

export function getDiscoveryProfile(slug: string): DiscoveryProfile | undefined {
  return DISCOVERY_PROFILES.find((p) => p.slug === slug)
}
