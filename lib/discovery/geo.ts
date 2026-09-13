// ---------------------------------------------------------------------------
// Geographic primitives for GigStar location discovery.
//
// Two demonstration test centres (Hastings and London) with a set of realistic
// neighbourhood / town anchors spread across each region. Distances are always
// CALCULATED from coordinates with the haversine formula — never hard-coded —
// so changing the radius genuinely changes which profiles, events and content
// appear.
// ---------------------------------------------------------------------------

export type Region = 'hastings' | 'london'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface RegionCenter extends GeoPoint {
  key: Region
  label: string
  short: string
}

export const REGION_CENTERS: Record<Region, RegionCenter> = {
  hastings: {
    key: 'hastings',
    label: 'Hastings town centre',
    short: 'Hastings',
    lat: 50.8543,
    lng: 0.5735,
  },
  london: {
    key: 'london',
    label: 'Soho, Central London',
    short: 'London',
    lat: 51.5137,
    lng: -0.134,
  },
}

export const REGION_ORDER: Region[] = ['hastings', 'london']

export const RADIUS_OPTIONS = [1, 5, 10, 25] as const
export type RadiusOption = (typeof RADIUS_OPTIONS)[number]

// --- Distance --------------------------------------------------------------

const EARTH_RADIUS_MILES = 3958.8

export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'here'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

// --- Deterministic helpers (stable mock variety, no Math.random) -----------

export function hashStr(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function pickFrom<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length]
}

export function round5(n: number): number {
  return Number(n.toFixed(5))
}

/** Small deterministic coordinate jitter (~±0.15 mi) so co-located profiles
 *  get individual coordinates rather than sharing one point. */
export function jitter(seed: number, axis: 'lat' | 'lng'): number {
  const s = axis === 'lat' ? seed : seed >> 5
  return ((s % 61) / 61 - 0.5) * 0.006
}

// --- Area anchors ----------------------------------------------------------
// Each anchor is a real neighbourhood / town with approximate coordinates.
// The trailing comment is the rough distance from that region's centre, purely
// as an authoring reference — the app never displays these numbers directly.

export interface Area {
  region: Region
  area: string
  town: string
  lat: number
  lng: number
}

export const AREAS = {
  // Hastings region ---------------------------------------------------------
  'hastings-centre': { region: 'hastings', area: 'Town Centre', town: 'Hastings', lat: 50.8543, lng: 0.5735 }, // 0.0
  'old-town': { region: 'hastings', area: 'Old Town', town: 'Hastings', lat: 50.856, lng: 0.592 }, // ~0.8
  'the-stade': { region: 'hastings', area: 'The Stade', town: 'Hastings', lat: 50.8551, lng: 0.5966 }, // ~1.0
  'st-leonards': { region: 'hastings', area: 'St Leonards-on-Sea', town: 'St Leonards', lat: 50.86, lng: 0.547 }, // ~1.2
  silverhill: { region: 'hastings', area: 'Silverhill', town: 'Hastings', lat: 50.876, lng: 0.556 }, // ~1.7
  ore: { region: 'hastings', area: 'Ore', town: 'Hastings', lat: 50.874, lng: 0.608 }, // ~2.0
  'west-st-leonards': { region: 'hastings', area: 'West St Leonards', town: 'St Leonards', lat: 50.856, lng: 0.523 }, // ~2.2
  bexhill: { region: 'hastings', area: 'Bexhill-on-Sea', town: 'Bexhill', lat: 50.841, lng: 0.472 }, // ~4.5
  'bexhill-west': { region: 'hastings', area: 'West Bexhill', town: 'Bexhill', lat: 50.838, lng: 0.46 }, // ~5.1
  battle: { region: 'hastings', area: 'Battle', town: 'Battle', lat: 50.919, lng: 0.486 }, // ~5.9
  rye: { region: 'hastings', area: 'Rye', town: 'Rye', lat: 50.952, lng: 0.733 }, // ~9.7
  robertsbridge: { region: 'hastings', area: 'Robertsbridge', town: 'Robertsbridge', lat: 50.986, lng: 0.475 }, // ~10.0
  eastbourne: { region: 'hastings', area: 'Eastbourne', town: 'Eastbourne', lat: 50.769, lng: 0.29 }, // ~13.7
  'tunbridge-wells': { region: 'hastings', area: 'Tunbridge Wells', town: 'Royal Tunbridge Wells', lat: 51.132, lng: 0.263 }, // ~23.5
  ashford: { region: 'hastings', area: 'Ashford', town: 'Ashford', lat: 51.148, lng: 0.875 }, // ~24.2
  brighton: { region: 'hastings', area: 'Brighton', town: 'Brighton', lat: 50.8225, lng: -0.1372 }, // ~31 (outside 25)

  // London region -----------------------------------------------------------
  soho: { region: 'london', area: 'Soho', town: 'London', lat: 51.5137, lng: -0.134 }, // 0.0
  'covent-garden': { region: 'london', area: 'Covent Garden', town: 'London', lat: 51.5129, lng: -0.1226 }, // ~0.5
  fitzrovia: { region: 'london', area: 'Fitzrovia', town: 'London', lat: 51.519, lng: -0.137 }, // ~0.4
  mayfair: { region: 'london', area: 'Mayfair', town: 'London', lat: 51.51, lng: -0.15 }, // ~0.7
  camden: { region: 'london', area: 'Camden', town: 'London', lat: 51.539, lng: -0.1426 }, // ~1.8
  islington: { region: 'london', area: 'Islington', town: 'London', lat: 51.5362, lng: -0.103 }, // ~2.0
  shoreditch: { region: 'london', area: 'Shoreditch', town: 'London', lat: 51.5265, lng: -0.079 }, // ~2.5
  clapham: { region: 'london', area: 'Clapham', town: 'London', lat: 51.462, lng: -0.138 }, // ~3.6
  brixton: { region: 'london', area: 'Brixton', town: 'London', lat: 51.4613, lng: -0.1156 }, // ~3.7
  peckham: { region: 'london', area: 'Peckham', town: 'London', lat: 51.474, lng: -0.069 }, // ~3.9
  hackney: { region: 'london', area: 'Hackney', town: 'London', lat: 51.545, lng: -0.0553 }, // ~4.0
  greenwich: { region: 'london', area: 'Greenwich', town: 'London', lat: 51.4826, lng: -0.0077 }, // ~5.8
  stratford: { region: 'london', area: 'Stratford', town: 'London', lat: 51.5416, lng: -0.0042 }, // ~5.9
  wembley: { region: 'london', area: 'Wembley', town: 'London', lat: 51.556, lng: -0.2795 }, // ~6.9
  richmond: { region: 'london', area: 'Richmond', town: 'Richmond', lat: 51.4613, lng: -0.3037 }, // ~8.1
  croydon: { region: 'london', area: 'Croydon', town: 'Croydon', lat: 51.3762, lng: -0.0982 }, // ~9.6
  barnet: { region: 'london', area: 'Barnet', town: 'Barnet', lat: 51.652, lng: -0.2 }, // ~10.0
  watford: { region: 'london', area: 'Watford', town: 'Watford', lat: 51.656, lng: -0.396 }, // ~15
  slough: { region: 'london', area: 'Slough', town: 'Slough', lat: 51.5105, lng: -0.595 }, // ~20
  sevenoaks: { region: 'london', area: 'Sevenoaks', town: 'Sevenoaks', lat: 51.272, lng: 0.19 }, // ~22
  guildford: { region: 'london', area: 'Guildford', town: 'Guildford', lat: 51.236, lng: -0.57 }, // ~27 (outside 25)
  reading: { region: 'london', area: 'Reading', town: 'Reading', lat: 51.4543, lng: -0.9781 }, // ~36 (outside 25)
} satisfies Record<string, Area>

export type AreaKey = keyof typeof AREAS
