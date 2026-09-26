// ---------------------------------------------------------------------------
// Live discovery profiles.
//
// Bridges REAL published profiles (the public_profiles view — public + active
// only, hidden/draft rows are excluded at the database) into the same
// DiscoveryProfile shape the homepage search already understands. This is how
// genuine profiles like /p/tony-blackburn become findable in homepage search,
// alongside — but clearly distinguished from — the example seed dataset.
//
// Server-only: uses the request-bound Supabase client so RLS still applies.
// ---------------------------------------------------------------------------

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { REGION_CENTERS, haversineMiles, type Region } from './geo'
import type { DiscoveryProfile, DiscoveryType } from './types'

const LIVE_TYPES: readonly DiscoveryType[] = ['dj', 'artist', 'venue', 'organiser']

// Default imagery per type — real profiles carry their media inside modules,
// not in the coarse public_profiles projection, so discovery cards fall back
// to the same type-appropriate art the example dataset uses.
const DEFAULT_IMG: Record<DiscoveryType, { avatar: string; cover: string }> = {
  dj: { avatar: '/images/profile/avatar.png', cover: '/images/profile/cover.png' },
  artist: { avatar: '/images/showcase/artist/band.png', cover: '/images/showcase/artist/cover.png' },
  venue: { avatar: '/images/showcase/venue/bar.png', cover: '/images/showcase/venue/cover.png' },
  organiser: { avatar: '/images/showcase/organiser/cover.png', cover: '/images/showcase/organiser/cover.png' },
}

const KM_TO_MILES = 0.621371

interface PublicProfileRow {
  id: string
  slug: string
  type: string
  display_name: string
  tagline: string | null
  verification_status: string | null
  location_label: string | null
  location_lat: number | null
  location_lon: number | null
  travel_radius_km: number | null
  avatar_url: string | null
}

function isDiscoveryType(t: string): t is DiscoveryType {
  return (LIVE_TYPES as readonly string[]).includes(t)
}

/** Nearest test region to a point — cosmetic only; homepage queries use coords. */
function nearestRegion(lat: number, lng: number): Region {
  let best: Region = 'hastings'
  let bestDistance = Number.POSITIVE_INFINITY
  for (const key of Object.keys(REGION_CENTERS) as Region[]) {
    const c = REGION_CENTERS[key]
    const d = haversineMiles({ lat, lng }, { lat: c.lat, lng: c.lng })
    if (d < bestDistance) {
      bestDistance = d
      best = key
    }
  }
  return best
}

function toDiscoveryProfile(row: PublicProfileRow): DiscoveryProfile | null {
  if (!isDiscoveryType(row.type)) return null

  // Real profiles should always have a coarse centroid; fall back to a sensible
  // UK default so a profile missing coordinates is still reachable under a wide
  // ("Anywhere") search rather than silently dropped by distance filtering.
  const lat = row.location_lat ?? REGION_CENTERS.london.lat
  const lng = row.location_lon ?? REGION_CENTERS.london.lng
  const label = row.location_label?.trim() || 'Location hidden'

  const tags = [row.type, row.location_label ?? '']
    .filter(Boolean)
    .map((t) => t.toLowerCase())

  const travelRadius =
    row.travel_radius_km != null ? Math.round(row.travel_radius_km * KM_TO_MILES) : undefined

  return {
    id: `live-${row.id}`,
    slug: row.slug,
    name: row.display_name,
    type: row.type,
    region: nearestRegion(lat, lng),
    area: label,
    town: label,
    lat,
    lng,
    avatar: row.avatar_url ?? DEFAULT_IMG[row.type].avatar,
    cover: DEFAULT_IMG[row.type].cover,
    description: row.tagline ?? '',
    genres: [],
    tags,
    verified: row.verification_status === 'verified',
    featured: false,
    followers: 0,
    rating: 0,
    reviews: 0,
    travelRadius,
    hasPage: true,
    pageSlug: row.slug,
    source: 'live',
  }
}

/**
 * Fetch all published profiles as DiscoveryProfile records. Never throws:
 * a failure here must not take down the homepage, so it logs and returns [].
 */
export async function fetchLiveDiscoveryProfiles(): Promise<DiscoveryProfile[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('public_profiles')
      .select(
        'id, slug, type, display_name, tagline, verification_status, location_label, location_lat, location_lon, travel_radius_km, avatar_url',
      )
      .order('published_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.log('[v0] fetchLiveDiscoveryProfiles error:', error.message)
      return []
    }

    return (data ?? [])
      .map((row) => toDiscoveryProfile(row as PublicProfileRow))
      .filter((p): p is DiscoveryProfile => p !== null)
  } catch (err) {
    console.log('[v0] fetchLiveDiscoveryProfiles threw:', (err as Error).message)
    return []
  }
}
