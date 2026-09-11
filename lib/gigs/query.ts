import type { Coords } from '@/lib/geo/distance'
import { haversineMiles } from '@/lib/geo/distance'
import type { Gig } from './data'

export type GigWithDistance = Gig & { distanceMiles: number }

/**
 * Return only the gigs whose venue falls within `radiusMiles` of `center`,
 * annotated with their distance and sorted by distance, then by date.
 */
export function queryGigs(gigs: Gig[], center: Coords, radiusMiles: number): GigWithDistance[] {
  return gigs
    .map((gig) => ({ ...gig, distanceMiles: haversineMiles(center, gig.coords) }))
    .filter((gig) => gig.distanceMiles <= radiusMiles)
    .sort((a, b) => {
      if (a.distanceMiles !== b.distanceMiles) return a.distanceMiles - b.distanceMiles
      return a.date.localeCompare(b.date)
    })
}
