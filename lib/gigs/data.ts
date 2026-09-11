import type { Coords } from '@/lib/geo/distance'

export type Gig = {
  id: string
  artist: string
  genre: string
  venue: string
  town: string
  /** Venue coordinates used for radius filtering. */
  coords: Coords
  /** ISO date (YYYY-MM-DD) of the performance. */
  date: string
  price: string
}

/**
 * TEMPORARY sample data spread across clearly different UK locations so the
 * radius filtering and distance sorting can be exercised end to end. Replace
 * with real venue-backed data once the events system is wired up.
 */
export const GIGS: Gig[] = [
  // Greater London / Essex cluster
  {
    id: 'lea-valley-lights',
    artist: 'Lea Valley Lights',
    genre: 'Indie',
    venue: 'The Assembly Rooms',
    town: 'Chingford',
    coords: { lat: 51.6323, lng: 0.0089 },
    date: '2026-09-26',
    price: '£12',
  },
  {
    id: 'northbank-collective',
    artist: 'Northbank Collective',
    genre: 'Jazz',
    venue: 'Copper & Brass',
    town: 'Walthamstow',
    coords: { lat: 51.5886, lng: -0.0198 },
    date: '2026-10-03',
    price: '£15',
  },
  {
    id: 'velvet-static',
    artist: 'Velvet Static',
    genre: 'Alt Rock',
    venue: 'The Roundhouse',
    town: 'Camden',
    coords: { lat: 51.543, lng: -0.1503 },
    date: '2026-10-10',
    price: '£22',
  },
  {
    id: 'midnight-format',
    artist: 'Midnight Format',
    genre: 'Electronic',
    venue: 'Village Underground',
    town: 'Shoreditch',
    coords: { lat: 51.5265, lng: -0.0784 },
    date: '2026-09-19',
    price: '£18',
  },
  {
    id: 'pier-pressure',
    artist: 'Pier Pressure',
    genre: 'Synth Pop',
    venue: 'Concorde 2',
    town: 'Brighton',
    coords: { lat: 50.8195, lng: -0.1357 },
    date: '2026-10-17',
    price: '£16',
  },
  // Midlands
  {
    id: 'canal-street-choir',
    artist: 'Canal Street Choir',
    genre: 'Folk',
    venue: 'The Sunflower Lounge',
    town: 'Birmingham',
    coords: { lat: 52.4779, lng: -1.9026 },
    date: '2026-10-24',
    price: '£10',
  },
  {
    id: 'ironbridge-echo',
    artist: 'Ironbridge Echo',
    genre: 'Post Rock',
    venue: 'Rock City',
    town: 'Nottingham',
    coords: { lat: 52.9556, lng: -1.1511 },
    date: '2026-11-07',
    price: '£20',
  },
  // North
  {
    id: 'cotton-district',
    artist: 'Cotton District',
    genre: 'Indie',
    venue: 'Band on the Wall',
    town: 'Manchester',
    coords: { lat: 53.4849, lng: -2.2349 },
    date: '2026-11-14',
    price: '£19',
  },
  {
    id: 'mersey-tide',
    artist: 'Mersey Tide',
    genre: 'Soul',
    venue: 'The Cavern Club',
    town: 'Liverpool',
    coords: { lat: 53.4058, lng: -2.9873 },
    date: '2026-11-21',
    price: '£14',
  },
  {
    id: 'headrow-hymns',
    artist: 'Headrow Hymns',
    genre: 'Gospel',
    venue: 'Brudenell Social Club',
    town: 'Leeds',
    coords: { lat: 53.8091, lng: -1.5731 },
    date: '2026-12-05',
    price: '£13',
  },
  // South West / Wales
  {
    id: 'harbour-noise',
    artist: 'Harbour Noise',
    genre: 'Punk',
    venue: 'The Fleece',
    town: 'Bristol',
    coords: { lat: 51.4522, lng: -2.5881 },
    date: '2026-10-31',
    price: '£11',
  },
  {
    id: 'severn-signals',
    artist: 'Severn Signals',
    genre: 'Electronic',
    venue: 'Clwb Ifor Bach',
    town: 'Cardiff',
    coords: { lat: 51.4812, lng: -3.1795 },
    date: '2026-11-28',
    price: '£17',
  },
  // Scotland
  {
    id: 'clyde-current',
    artist: 'Clyde Current',
    genre: 'Rock',
    venue: 'King Tut’s Wah Wah Hut',
    town: 'Glasgow',
    coords: { lat: 55.8648, lng: -4.2649 },
    date: '2026-12-12',
    price: '£21',
  },
  {
    id: 'old-town-drone',
    artist: 'Old Town Drone',
    genre: 'Ambient',
    venue: 'Sneaky Pete’s',
    town: 'Edinburgh',
    coords: { lat: 55.9472, lng: -3.1912 },
    date: '2026-12-19',
    price: '£15',
  },
]
