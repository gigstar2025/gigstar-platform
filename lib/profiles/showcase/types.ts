// ---------------------------------------------------------------------------
// Rich, type-driven data model for GigStar public "showcase" profiles.
//
// A single ShowcaseProfile shape powers four account types (DJ, artist/band,
// venue, event organiser). Which sections appear — and in what order — is
// driven by the `sections` array plus the presence of optional data, so the
// four pages share one framework without being identical.
//
// TEMPORARY: all content here is local placeholder data for layout review.
// It maps cleanly onto a PostgreSQL schema + file storage later.
// ---------------------------------------------------------------------------

export type ShowcaseType = 'dj' | 'artist' | 'venue' | 'organiser'

export const TYPE_LABELS: Record<ShowcaseType, string> = {
  dj: 'DJ',
  artist: 'Artist / Band',
  venue: 'Venue',
  organiser: 'Event Organiser',
}

/** Primary call-to-action label per profile type. */
export const PRIMARY_CTA: Record<ShowcaseType, string> = {
  dj: 'Book this DJ',
  artist: 'Book this artist',
  venue: 'Enquire about this venue',
  organiser: 'Contact organiser',
}

export type SectionKey =
  | 'about'
  | 'facts'
  | 'featured-event'
  | 'events'
  | 'past-events'
  | 'releases'
  | 'audio'
  | 'videos'
  | 'gallery'
  | 'spaces'
  | 'menu'
  | 'technical'
  | 'reviews'
  | 'partners'
  | 'mailing-list'
  | 'contact'
  | 'related'

export interface SocialLink {
  platform: string
  url: string
}

export interface FactItem {
  label: string
  value: string
}

/** Wide status vocabulary shared by event cards across all profile types. */
export type EventStatus =
  | 'on-sale'
  | 'free'
  | 'selling-fast'
  | 'last-tickets'
  | 'sold-out'
  | 'coming-soon'

export interface ShowcaseEvent {
  id: string
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  doorsTime?: string
  endTime?: string
  venueName: string
  venueSlug?: string
  town: string
  description: string
  /** Portrait poster image. */
  poster: string
  priceFrom?: string
  free?: boolean
  status: EventStatus
  ticketUrl?: string
  lineup?: string[]
  /** Slugs of showcase profiles connected to this event. */
  relatedProfiles?: string[]
  attendance?: string
}

export interface Review {
  id: string
  author: string
  role: string
  rating: number // 1–5
  date: string
  quote: string
}

export interface ReviewSummary {
  average: number
  count: number
  items: Review[]
}

export interface MediaItem {
  id: string
  type: 'image' | 'video'
  src: string
  /** Poster frame for videos. */
  thumb?: string
  alt: string
  caption?: string
}

export interface AudioTrack {
  id: string
  title: string
  artwork: string
  duration: string
  platform: string
  url: string
}

export interface VideoItem {
  id: string
  title: string
  thumbnail: string
  url: string
  provider: string
  duration?: string
}

export type ReleaseType = 'Album' | 'EP' | 'Single'

export interface MusicRelease {
  id: string
  title: string
  type: ReleaseType
  releaseDate: string
  artwork: string
  trackCount?: number
  featuredTrack?: string
  listenUrl?: string
  buyUrl?: string
  services?: { name: string; url: string }[]
}

export interface VenueSpace {
  id: string
  name: string
  image: string
  capacity: string
  layouts: string[]
  suitableFor: string[]
  facilities: string[]
  hirePrice: string
}

export interface MenuItem {
  name: string
  description?: string
  price: string
  veg?: boolean
  vegan?: boolean
}

export interface MenuSection {
  name: string
  items: MenuItem[]
}

export interface SampleMenu {
  sections: MenuSection[]
  allergenNote: string
  downloadUrl?: string
}

export interface TechnicalDetails {
  items: FactItem[]
  formats?: string[]
  riderUrl?: string
}

export interface Partner {
  name: string
  kind: string
}

/** Reference to another showcase profile for "related profiles" cards. */
export interface RelatedRef {
  slug: string
  relationship: string
}

export interface ShowcaseProfile {
  id: string
  slug: string
  type: ShowcaseType
  displayName: string
  tagline: string
  /** Avatar (person/band) or logo (venue/organiser). */
  avatar: string
  cover: string
  location: string
  verified?: boolean
  featured?: boolean
  /** Approximate follower count shown in the hero (e.g. "18.4k"). */
  followers?: string
  /** Genre / style / venue-type / event-category chips shown in the hero. */
  chips: string[]
  bio: string[]
  socials: SocialLink[]
  website?: string
  contactEmail: string

  /** Section render order; a section is skipped if its data is absent. */
  sections: SectionKey[]

  facts?: FactItem[]
  featuredEvent?: ShowcaseEvent
  events?: ShowcaseEvent[]
  pastEvents?: ShowcaseEvent[]
  releases?: MusicRelease[]
  members?: string[]
  label?: string
  audio?: AudioTrack[]
  videos?: VideoItem[]
  gallery?: MediaItem[]
  spaces?: VenueSpace[]
  menu?: SampleMenu
  technical?: TechnicalDetails
  reviews?: ReviewSummary
  partners?: Partner[]
  mailingList?: { blurb: string; perks: string[] }
  related?: RelatedRef[]

  /** Optional profile-type extras surfaced in the About/details area. */
  bookingPrice?: string
  availability?: string
  equipment?: string[]
  performanceFormats?: string[]
  address?: string[]
}

export function formatEventDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
