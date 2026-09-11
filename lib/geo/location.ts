import 'server-only'

import { cookies, headers } from 'next/headers'
import type { Coords } from './distance'
import { findTown, nearestTown, TOWNS, type Town } from './towns'

export const LOCATION_COOKIE = 'gigstar_location'
export const RADIUS_COOKIE = 'gigstar_radius'
export const DEV_TOWN_COOKIE = 'gigstar_dev_town'

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const
export const DEFAULT_RADIUS = 25

export type LocationSource =
  | 'auto'
  | 'manual-town'
  | 'manual-postcode'
  | 'precise'
  | 'dev'

export type ResolvedLocation = {
  label: string
  lat: number
  lng: number
  source: LocationSource
  /** Extra context such as the matched postcode. */
  detail?: string
}

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

/**
 * True if the string looks like a full UK postcode (e.g. "E4 8SP").
 */
export function isFullPostcode(value: string): boolean {
  return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(value.trim())
}

/**
 * True if the string looks like a UK outward code only (e.g. "E4", "SW1A").
 */
export function isOutcode(value: string): boolean {
  return /^[A-Za-z]{1,2}\d[A-Za-z\d]?$/.test(value.trim())
}

export function looksLikePostcode(value: string): boolean {
  return isFullPostcode(value) || isOutcode(value)
}

export type PostcodeResult =
  | { ok: true; coords: Coords; label: string }
  | { ok: false; reason: 'invalid' | 'error' }

/**
 * Resolve a UK postcode or outward code to coordinates using Postcodes.io.
 * No API key required and no paid mapping service involved.
 */
export async function resolvePostcode(input: string): Promise<PostcodeResult> {
  const value = input.trim()
  const encoded = encodeURIComponent(value.replace(/\s+/g, ' '))
  const endpoint = isFullPostcode(value)
    ? `https://api.postcodes.io/postcodes/${encoded}`
    : `https://api.postcodes.io/outcodes/${encodeURIComponent(value.replace(/\s+/g, ''))}`

  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (res.status === 404) return { ok: false, reason: 'invalid' }
    if (!res.ok) return { ok: false, reason: 'error' }

    const json = (await res.json()) as {
      result?: { latitude?: number; longitude?: number }
    }
    const lat = json.result?.latitude
    const lng = json.result?.longitude
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return { ok: false, reason: 'invalid' }
    }

    const coords = { lat, lng }
    return { ok: true, coords, label: nearestTown(coords).name }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/**
 * Turn raw coordinates from the browser's Geolocation API into a recognisable
 * UK place using Postcodes.io reverse geocoding (no API key, no paid service).
 *
 * Privacy: we deliberately return a generalised place centroid and name here.
 * The caller persists only this coarse result, never the device's raw GPS fix,
 * and GigStar never continuously tracks the visitor.
 */
export async function reverseGeocode(
  coords: Coords,
): Promise<{ label: string; coords: Coords }> {
  const endpoint = `https://api.postcodes.io/postcodes?lat=${coords.lat}&lon=${coords.lng}&limit=1`
  try {
    const res = await fetch(endpoint, { cache: 'no-store' })
    if (res.ok) {
      const json = (await res.json()) as {
        result?: Array<{
          latitude?: number
          longitude?: number
          admin_district?: string
          parish?: string
          admin_ward?: string
          region?: string
        }> | null
      }
      const match = json.result?.[0]
      if (match && typeof match.latitude === 'number' && typeof match.longitude === 'number') {
        const label =
          match.admin_district ||
          match.parish ||
          match.admin_ward ||
          match.region ||
          nearestTown(coords).name
        return { label, coords: { lat: match.latitude, lng: match.longitude } }
      }
    }
  } catch {
    // fall through to the fixed-list fallback below
  }

  // Fallback: snap to the closest recognised town from our fixed list.
  const town = nearestTown(coords)
  return { label: town.name, coords: { lat: town.lat, lng: town.lng } }
}

function parseCookieLocation(raw: string | undefined): ResolvedLocation | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ResolvedLocation>
    if (
      typeof parsed.label === 'string' &&
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      typeof parsed.source === 'string'
    ) {
      return parsed as ResolvedLocation
    }
  } catch {
    // fall through to null
  }
  return null
}

/**
 * Read Vercel's server-side geolocation headers, if present.
 * These only exist on Vercel's edge network, never on localhost.
 */
async function getAutoCoords(): Promise<Coords | null> {
  const headerList = await headers()
  const lat = Number.parseFloat(headerList.get('x-vercel-ip-latitude') ?? '')
  const lng = Number.parseFloat(headerList.get('x-vercel-ip-longitude') ?? '')
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return { lat, lng }
  }
  return null
}

/**
 * Resolve the active location using the precedence:
 *   1. A manually chosen town/postcode (remembered in a cookie).
 *   2. A development-only simulated town (never honoured in production).
 *   3. Vercel's automatic geolocation headers.
 * Returns null when none are available, so the UI can show the fallback.
 */
export async function getActiveLocation(): Promise<ResolvedLocation | null> {
  const cookieStore = await cookies()

  const manual = parseCookieLocation(cookieStore.get(LOCATION_COOKIE)?.value)
  if (manual) return manual

  if (isDevEnvironment()) {
    const devTownName = cookieStore.get(DEV_TOWN_COOKIE)?.value
    if (devTownName) {
      const town = findTown(devTownName)
      if (town) {
        return { label: town.name, lat: town.lat, lng: town.lng, source: 'dev' }
      }
    }
  }

  const autoCoords = await getAutoCoords()
  if (autoCoords) {
    const town = nearestTown(autoCoords)
    return { label: town.name, lat: autoCoords.lat, lng: autoCoords.lng, source: 'auto' }
  }

  return null
}

export async function getRadius(): Promise<number> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(RADIUS_COOKIE)?.value
  const value = Number.parseInt(raw ?? '', 10)
  if (RADIUS_OPTIONS.includes(value as (typeof RADIUS_OPTIONS)[number])) {
    return value
  }
  return DEFAULT_RADIUS
}

export function getTownNames(): string[] {
  return TOWNS.map((t) => t.name)
}

export type { Town }
