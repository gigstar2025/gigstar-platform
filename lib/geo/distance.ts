export type Coords = { lat: number; lng: number }

const EARTH_RADIUS_MILES = 3958.8

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

/**
 * Great-circle distance between two coordinates in miles.
 */
export function haversineMiles(a: Coords, b: Coords): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Human-friendly miles label: one decimal under 10 miles, whole numbers above.
 */
export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
