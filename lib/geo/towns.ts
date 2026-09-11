import type { Coords } from './distance'
import { haversineMiles } from './distance'

export type Town = {
  name: string
  lat: number
  lng: number
}

/**
 * Curated list of recognisable UK towns and city districts used to label a
 * visitor's location. Keeping this as a fixed list guarantees the heading
 * always shows a recognisable place name rather than a raw geocoder string.
 */
export const TOWNS: Town[] = [
  { name: 'Chingford', lat: 51.6323, lng: 0.0089 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Camden', lat: 51.539, lng: -0.1426 },
  { name: 'Shoreditch', lat: 51.5265, lng: -0.0784 },
  { name: 'Croydon', lat: 51.3762, lng: -0.0982 },
  { name: 'Romford', lat: 51.5752, lng: 0.1834 },
  { name: 'Ilford', lat: 51.559, lng: 0.0741 },
  { name: 'Watford', lat: 51.6565, lng: -0.3903 },
  { name: 'Brighton', lat: 50.8225, lng: -0.1372 },
  { name: 'Reading', lat: 51.4543, lng: -0.9781 },
  { name: 'Oxford', lat: 51.752, lng: -1.2577 },
  { name: 'Cambridge', lat: 52.2053, lng: 0.1218 },
  { name: 'Milton Keynes', lat: 52.0406, lng: -0.7594 },
  { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
  { name: 'Bath', lat: 51.3811, lng: -2.359 },
  { name: 'Cardiff', lat: 51.4816, lng: -3.1791 },
  { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
  { name: 'Coventry', lat: 52.4068, lng: -1.5197 },
  { name: 'Leicester', lat: 52.6369, lng: -1.1398 },
  { name: 'Nottingham', lat: 52.9548, lng: -1.1581 },
  { name: 'Sheffield', lat: 53.3811, lng: -1.4701 },
  { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
  { name: 'Liverpool', lat: 53.4084, lng: -2.9916 },
  { name: 'York', lat: 53.96, lng: -1.0873 },
  { name: 'Newcastle upon Tyne', lat: 54.9783, lng: -1.6178 },
  { name: 'Southampton', lat: 50.9097, lng: -1.4044 },
  { name: 'Portsmouth', lat: 50.8198, lng: -1.088 },
  { name: 'Bournemouth', lat: 50.7192, lng: -1.8808 },
  { name: 'Norwich', lat: 52.6309, lng: 1.2974 },
  { name: 'Exeter', lat: 50.7184, lng: -3.5339 },
  { name: 'Plymouth', lat: 50.3755, lng: -4.1427 },
  { name: 'Hull', lat: 53.7676, lng: -0.3274 },
  { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
  { name: 'Aberdeen', lat: 57.1497, lng: -2.0943 },
  { name: 'Belfast', lat: 54.5973, lng: -5.9301 },
]

/**
 * Nearest recognisable town to an arbitrary coordinate.
 */
export function nearestTown(coords: Coords): Town {
  let best = TOWNS[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const town of TOWNS) {
    const distance = haversineMiles(coords, town)
    if (distance < bestDistance) {
      bestDistance = distance
      best = town
    }
  }
  return best
}

/**
 * Case-insensitive exact/partial match of a typed town name.
 */
export function findTown(query: string): Town | null {
  const normalised = query.trim().toLowerCase()
  if (!normalised) return null
  const exact = TOWNS.find((t) => t.name.toLowerCase() === normalised)
  if (exact) return exact
  const partial = TOWNS.find((t) => t.name.toLowerCase().includes(normalised))
  return partial ?? null
}
