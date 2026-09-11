'use server'

import { cookies } from 'next/headers'
import {
  DEV_TOWN_COOKIE,
  DEFAULT_RADIUS,
  LOCATION_COOKIE,
  RADIUS_COOKIE,
  RADIUS_OPTIONS,
  isDevEnvironment,
  looksLikePostcode,
  resolvePostcode,
  reverseGeocode,
  type ResolvedLocation,
} from '@/lib/geo/location'
import { findTown } from '@/lib/geo/towns'

const ONE_YEAR = 60 * 60 * 24 * 365

const baseCookie = {
  path: '/',
  maxAge: ONE_YEAR,
  sameSite: 'lax' as const,
  httpOnly: true,
}

export type LocationFormState = {
  status: 'idle' | 'success' | 'invalid-postcode' | 'not-found' | 'error'
  message?: string
}

async function writeLocation(location: ResolvedLocation) {
  const cookieStore = await cookies()
  cookieStore.set(LOCATION_COOKIE, JSON.stringify(location), baseCookie)
}

/**
 * Handle the "search by town or postcode" form. A successful lookup is
 * remembered in a cookie so it overrides automatic detection on later visits.
 */
export async function applyLocation(
  _prev: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const query = String(formData.get('query') ?? '').trim()
  if (!query) {
    return { status: 'error', message: 'Enter a UK town or postcode to continue.' }
  }

  if (looksLikePostcode(query)) {
    const result = await resolvePostcode(query)
    if (!result.ok) {
      if (result.reason === 'invalid') {
        return {
          status: 'invalid-postcode',
          message: `We couldn't find the postcode “${query}”. Check it and try again.`,
        }
      }
      return {
        status: 'error',
        message: 'Postcode lookup is temporarily unavailable. Please try again shortly.',
      }
    }
    await writeLocation({
      label: result.label,
      lat: result.coords.lat,
      lng: result.coords.lng,
      source: 'manual-postcode',
      detail: query.toUpperCase(),
    })
    return { status: 'success' }
  }

  const town = findTown(query)
  if (!town) {
    return {
      status: 'not-found',
      message: `We don't have “${query}” on the map yet. Try a nearby town or a UK postcode.`,
    }
  }

  await writeLocation({
    label: town.name,
    lat: town.lat,
    lng: town.lng,
    source: 'manual-town',
  })
  return { status: 'success' }
}

/**
 * Handle the "Use my precise location" flow. The browser supplies raw
 * coordinates from the Geolocation API; we reverse-geocode them to a
 * recognisable UK place and persist only that coarse result (never the raw
 * device fix). A success overrides any IP estimate and persists via cookie.
 */
export async function applyPreciseLocation(
  lat: number,
  lng: number,
): Promise<LocationFormState> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { status: 'error', message: 'We could not read a valid position from your device.' }
  }

  const place = await reverseGeocode({ lat, lng })
  await writeLocation({
    label: place.label,
    lat: place.coords.lat,
    lng: place.coords.lng,
    source: 'precise',
  })
  return { status: 'success' }
}

export async function setRadius(radius: number): Promise<void> {
  const cookieStore = await cookies()
  const safe = RADIUS_OPTIONS.includes(radius as (typeof RADIUS_OPTIONS)[number])
    ? radius
    : DEFAULT_RADIUS
  cookieStore.set(RADIUS_COOKIE, String(safe), baseCookie)
}

/**
 * Forget a manually chosen location so automatic detection takes over again.
 */
export async function clearLocation(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(LOCATION_COOKIE)
}

/**
 * Development-only helper to simulate a detected town. Never has any effect in
 * production, and also clears any manual override so the simulation is visible.
 */
export async function setDevTown(town: string): Promise<void> {
  if (!isDevEnvironment()) return
  const cookieStore = await cookies()
  if (!town) {
    cookieStore.delete(DEV_TOWN_COOKIE)
    return
  }
  cookieStore.delete(LOCATION_COOKIE)
  cookieStore.set(DEV_TOWN_COOKIE, town, baseCookie)
}
