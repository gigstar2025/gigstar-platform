// ---------------------------------------------------------------------------
// Public API for the location-discovery dataset: aggregations plus the query
// helpers that power the homepage search, feed, radius filtering and
// recommendations. All distances are computed live from coordinates via the
// haversine helper, so radius changes genuinely change the results.
// ---------------------------------------------------------------------------

import {
  REGION_CENTERS,
  haversineMiles,
  type GeoPoint,
  type Region,
} from './geo'
import { DISCOVERY_PROFILES } from './profiles'
import { DISCOVERY_EVENTS } from './events'
import { DISCOVERY_CONTENT } from './content'
import type {
  DiscoveryContent,
  DiscoveryEvent,
  DiscoveryProfile,
  DiscoveryType,
} from './types'

export * from './geo'
export * from './types'
export { DISCOVERY_PROFILES, getDiscoveryProfile } from './profiles'
export { DISCOVERY_EVENTS, getDiscoveryEvent } from './events'
export { DISCOVERY_CONTENT } from './content'

export type WithDistance<T> = T & { distance: number }

export interface ProfileQuery {
  region: Region
  radius: number
  type?: DiscoveryType
  search?: string
}

function matchesSearch(p: DiscoveryProfile, term: string): boolean {
  const q = term.trim().toLowerCase()
  if (!q) return true
  return (
    p.name.toLowerCase().includes(q) ||
    p.tags.some((t) => t.includes(q)) ||
    p.genres.some((g) => g.toLowerCase().includes(q)) ||
    p.area.toLowerCase().includes(q) ||
    p.town.toLowerCase().includes(q)
  )
}

function sortByDistance<T extends { distance: number }>(a: T, b: T): number {
  return a.distance - b.distance
}

/** Profiles in a region within `radius` miles of its centre, nearest first. */
export function profilesInRadius(query: ProfileQuery): WithDistance<DiscoveryProfile>[] {
  const center = REGION_CENTERS[query.region]
  return DISCOVERY_PROFILES.filter((p) => p.region === query.region)
    .filter((p) => (query.type ? p.type === query.type : true))
    .filter((p) => (query.search ? matchesSearch(p, query.search) : true))
    .map((p) => ({ ...p, distance: haversineMiles(center, p) }))
    .filter((p) => p.distance <= query.radius)
    .sort(sortByDistance)
}

/** Recommended profiles near a region centre: featured / high-rating first. */
export function recommendedProfiles(region: Region, radius: number): WithDistance<DiscoveryProfile>[] {
  const center = REGION_CENTERS[region]
  return DISCOVERY_PROFILES.filter((p) => p.region === region)
    .map((p) => ({ ...p, distance: haversineMiles(center, p) }))
    .filter((p) => p.distance <= radius)
    .sort((a, b) => {
      const score = (p: WithDistance<DiscoveryProfile>) =>
        (p.featured ? 2 : 0) + (p.verified ? 1 : 0) + p.rating / 5
      return score(b) - score(a) || a.distance - b.distance
    })
}

/** Events in a region within `radius` miles of its centre, nearest first. */
export function eventsInRadius(region: Region, radius: number): WithDistance<DiscoveryEvent>[] {
  const center = REGION_CENTERS[region]
  return DISCOVERY_EVENTS.filter((e) => e.region === region)
    .map((e) => ({ ...e, distance: haversineMiles(center, e) }))
    .filter((e) => e.distance <= radius)
    .sort(sortByDistance)
}

/** Content in a region within `radius` miles of its centre, newest first. */
export function contentInRadius(region: Region, radius: number): WithDistance<DiscoveryContent>[] {
  const center = REGION_CENTERS[region]
  return DISCOVERY_CONTENT.filter((c) => c.region === region)
    .map((c) => ({ ...c, distance: haversineMiles(center, c as GeoPoint) }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
}

// --- Arbitrary-point queries -----------------------------------------------
// Region-agnostic variants used by the homepage controls so a manually entered
// town, an example postcode, or a browser-geolocation point all filter the
// whole dataset by live distance — not just one region's records.

export interface NearQuery {
  center: GeoPoint
  radius: number
  type?: DiscoveryType
  search?: string
}

export function profilesNear(q: NearQuery): WithDistance<DiscoveryProfile>[] {
  return DISCOVERY_PROFILES.filter((p) => (q.type ? p.type === q.type : true))
    .filter((p) => (q.search ? matchesSearch(p, q.search) : true))
    .map((p) => ({ ...p, distance: haversineMiles(q.center, p) }))
    .filter((p) => p.distance <= q.radius)
    .sort(sortByDistance)
}

export function recommendedNear(center: GeoPoint, radius: number): WithDistance<DiscoveryProfile>[] {
  return DISCOVERY_PROFILES.map((p) => ({ ...p, distance: haversineMiles(center, p) }))
    .filter((p) => p.distance <= radius)
    .sort((a, b) => {
      const score = (p: WithDistance<DiscoveryProfile>) =>
        (p.featured ? 2 : 0) + (p.verified ? 1 : 0) + p.rating / 5
      return score(b) - score(a) || a.distance - b.distance
    })
}

export function eventsNear(center: GeoPoint, radius: number): WithDistance<DiscoveryEvent>[] {
  return DISCOVERY_EVENTS.map((e) => ({ ...e, distance: haversineMiles(center, e) }))
    .filter((e) => e.distance <= radius)
    .sort(sortByDistance)
}

export function contentNear(center: GeoPoint, radius: number): WithDistance<DiscoveryContent>[] {
  return DISCOVERY_CONTENT.map((c) => ({ ...c, distance: haversineMiles(center, c as GeoPoint) }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
}

export function countByType(region: Region, radius: number): Record<DiscoveryType | 'all', number> {
  const hits = profilesInRadius({ region, radius })
  return {
    all: hits.length,
    dj: hits.filter((p) => p.type === 'dj').length,
    artist: hits.filter((p) => p.type === 'artist').length,
    venue: hits.filter((p) => p.type === 'venue').length,
    organiser: hits.filter((p) => p.type === 'organiser').length,
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic formatting so server and client render identically.
// Intl short-date output for en-GB varies across ICU versions (comma vs no comma),
// which causes React hydration mismatches.
export function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}
