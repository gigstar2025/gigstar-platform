// ---------------------------------------------------------------------------
// Structured record shapes for the location-discovery demonstration dataset.
//
// TEMPORARY mock layer: no database, API or auth. Each shape maps cleanly onto
// a future PostgreSQL schema (profiles, content, events) with lat/lng columns
// so radius queries can move server-side unchanged.
// ---------------------------------------------------------------------------

import type { Region } from './geo'

export type DiscoveryType = 'dj' | 'artist' | 'venue' | 'organiser'

/**
 * Where a discovery record comes from:
 *  - 'live'    — a real, published profile fetched from the database.
 *  - 'example' — a mock demonstration record from the seed dataset.
 * Kept explicit so the homepage can surface real profiles in search while
 * still visibly distinguishing the example content from genuine listings.
 */
export type DiscoverySource = 'live' | 'example'

export const DISCOVERY_TYPE_LABELS: Record<DiscoveryType, string> = {
  dj: 'DJ',
  artist: 'Artist / Band',
  venue: 'Venue',
  organiser: 'Event Organiser',
}

export interface DiscoveryProfile {
  id: string
  slug: string
  name: string
  type: DiscoveryType
  region: Region
  /** Neighbourhood / area label, e.g. "Old Town". */
  area: string
  /** Settlement, e.g. "Hastings". */
  town: string
  lat: number
  lng: number
  avatar: string
  cover: string
  description: string
  genres: string[]
  tags: string[]
  verified: boolean
  featured: boolean
  followers: number
  rating: number
  reviews: number
  /** DJs & artists: how far they will travel to perform (miles). */
  travelRadius?: number
  /** Whether a full public profile page exists for this record. */
  hasPage: boolean
  pageSlug?: string
  /** Live (real, published) vs example (seed) record. */
  source: DiscoverySource
}

export type ContentKind =
  | 'photo'
  | 'clip'
  | 'mix'
  | 'release'
  | 'gallery'
  | 'announcement'
  | 'poster'
  | 'lineup'
  | 'ticket'
  | 'past-photo'
  | 'text'

export interface DiscoveryContent {
  id: string
  profileSlug: string
  kind: ContentKind
  caption: string
  image?: string
  tags: string[]
  postedDaysAgo: number
  likes: number
  comments: number
  /** Optional connections; location is inherited from these when present. */
  eventId?: string
  venueSlug?: string
  // Resolved location (inherited from event -> venue -> source profile).
  lat: number
  lng: number
  region: Region
  town: string
}

export type EventKind =
  | 'club-night'
  | 'live-band'
  | 'festival'
  | 'restaurant'
  | 'dj-event'
  | 'community'
  | 'album-launch'
  | 'open-mic'

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  'club-night': 'Club night',
  'live-band': 'Live band',
  festival: 'Festival',
  restaurant: 'Restaurant entertainment',
  'dj-event': 'DJ event',
  community: 'Community event',
  'album-launch': 'Album launch',
  'open-mic': 'Open-mic',
}

export type EventStatus =
  | 'on-sale'
  | 'selling-fast'
  | 'last-tickets'
  | 'sold-out'
  | 'free'
  | 'coming-soon'

export interface DiscoveryEvent {
  id: string
  slug: string
  title: string
  kind: EventKind
  region: Region
  area: string
  town: string
  lat: number
  lng: number
  date: string // ISO yyyy-mm-dd
  venueSlug?: string
  venueName: string
  organiserSlug?: string
  poster: string
  priceFrom?: number
  free: boolean
  status: EventStatus
  /** Slugs of connected DJ / artist profiles on the bill. */
  lineupSlugs: string[]
}
