'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ANYWHERE, REGION_CENTERS, nearestAreaLabel, type GeoPoint, type DiscoveryType } from '@/lib/discovery'
import { categoryType } from '@/lib/home/derive'
import type { FeedCategory } from '@/lib/home/feed-data'

// ---------------------------------------------------------------------------
// DiscoveryProvider — the ONE shared homepage state (location, coordinates,
// radius, category/type, search). Every location-aware homepage section reads
// this context, so a single set of controls drives the feed, the specialist
// discovery sections, the right rail and their counts and headings.
// ---------------------------------------------------------------------------

export type LocationSource = 'default' | 'preset' | 'manual' | 'geo'

export interface ActiveLocation {
  label: string
  lat: number
  lng: number
  source: LocationSource
}

export type GeoStatus = 'idle' | 'loading' | 'error'

export const DEFAULT_LOCATION: ActiveLocation = {
  label: 'Hastings',
  lat: REGION_CENTERS.hastings.lat,
  lng: REGION_CENTERS.hastings.lng,
  source: 'default',
}

export const DEFAULT_RADIUS = 5
export const DEFAULT_CATEGORY: FeedCategory = 'for-you'

interface DiscoveryState {
  location: ActiveLocation
  radius: number
  category: FeedCategory
  search: string
  center: GeoPoint
  activeType: DiscoveryType | null
  geoStatus: GeoStatus
  geoMessage: string | null
  filtersActive: boolean
  areaLabel: string
  radiusPhrase: string
  isAnywhere: boolean
  setLocation: (l: ActiveLocation) => void
  setRadius: (r: number) => void
  setCategory: (c: FeedCategory) => void
  setSearch: (s: string) => void
  useMyLocation: () => void
  clearFilters: () => void
}

const DiscoveryContext = createContext<DiscoveryState | null>(null)

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<ActiveLocation>(DEFAULT_LOCATION)
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)
  const [category, setCategory] = useState<FeedCategory>(DEFAULT_CATEGORY)
  const [search, setSearch] = useState('')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  const setLocation = useCallback((l: ActiveLocation) => {
    setLocationState(l)
    setGeoStatus('idle')
    setGeoMessage(null)
  }, [])

  const useMyLocation = useCallback(() => {
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
        setLocationState({ label: nearestAreaLabel(point), lat: point.lat, lng: point.lng, source: 'geo' })
        setGeoStatus('idle')
        setGeoMessage(null)
      },
      (err) => {
        setGeoStatus('error')
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. Search by town or postcode instead.'
            : err.code === err.TIMEOUT
              ? 'Finding your location timed out. Search by town or postcode instead.'
              : 'We could not find your location. Search by town or postcode instead.',
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }, [])

  const clearFilters = useCallback(() => {
    setLocationState(DEFAULT_LOCATION)
    setRadius(DEFAULT_RADIUS)
    setCategory(DEFAULT_CATEGORY)
    setSearch('')
    setGeoStatus('idle')
    setGeoMessage(null)
  }, [])

  const value = useMemo<DiscoveryState>(() => {
    const isAnywhere = radius === ANYWHERE
    return {
      location,
      radius,
      category,
      search,
      center: { lat: location.lat, lng: location.lng },
      activeType: categoryType(category),
      geoStatus,
      geoMessage,
      filtersActive:
        location.source !== 'default' ||
        radius !== DEFAULT_RADIUS ||
        category !== DEFAULT_CATEGORY ||
        search.trim() !== '',
      areaLabel: location.label,
      radiusPhrase: isAnywhere ? 'anywhere' : `within ${radius} ${radius === 1 ? 'mile' : 'miles'}`,
      isAnywhere,
      setLocation,
      setRadius,
      setCategory,
      setSearch,
      useMyLocation,
      clearFilters,
    }
  }, [location, radius, category, search, geoStatus, geoMessage, setLocation, useMyLocation, clearFilters])

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>
}

export function useDiscovery(): DiscoveryState {
  const v = useContext(DiscoveryContext)
  if (!v) throw new Error('useDiscovery must be used within a DiscoveryProvider')
  return v
}
