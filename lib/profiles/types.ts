// Core profile + module type system for GigStar public profiles.
// A single unified profile supports many roles and optional, reusable modules.
// Designed to map cleanly onto a PostgreSQL schema + file storage later.

export type ProfileRole =
  | 'dj'
  | 'solo-artist'
  | 'band'
  | 'promoter'
  | 'venue-owner'
  | 'venue'
  | 'radio-presenter'
  | 'other'

export const ROLE_LABELS: Record<ProfileRole, string> = {
  dj: 'DJ',
  'solo-artist': 'Solo Artist',
  band: 'Band',
  promoter: 'Promoter',
  'venue-owner': 'Venue Owner',
  venue: 'Venue',
  'radio-presenter': 'Radio Presenter',
  other: 'Industry Pro',
}

export interface SocialLink {
  platform: string
  url: string
}

export type ModuleType = 'mixes' | 'videos' | 'radio' | 'gallery' | 'gigs'

export const MODULE_META: Record<
  ModuleType,
  { label: string; description: string }
> = {
  mixes: { label: 'Mixes', description: 'Audio sets from SoundCloud or Mixcloud' },
  videos: { label: 'Videos', description: 'Performance clips from YouTube or Vimeo' },
  radio: { label: 'Live Radio', description: 'On-air status and live stream' },
  gallery: { label: 'Photo Gallery', description: 'Photos of artists, venues or events' },
  gigs: { label: 'Gig Dates', description: 'Upcoming shows and ticket links' },
}

// --- Module item shapes ---

export type MixProvider = 'soundcloud' | 'mixcloud' | 'other'

export interface MixItem {
  id: string
  title: string
  description?: string
  /** Placeholder path or blob URL once storage is connected. */
  artwork?: string
  /** External embed/link, preferred over direct hosting for this milestone. */
  embedUrl?: string
  provider?: MixProvider
}

export type VideoProvider = 'youtube' | 'vimeo' | 'other'

export interface VideoItem {
  id: string
  title: string
  description?: string
  thumbnail?: string
  embedUrl?: string
  provider?: VideoProvider
}

export interface RadioInfo {
  onAir: boolean
  showTitle: string
  stationName: string
  /** External live-stream URL. Audio never auto-plays. */
  streamUrl: string
  schedule: string
}

export interface PhotoItem {
  id: string
  src?: string
  caption?: string
  /** Required for accessibility; describes the image for screen readers. */
  alt: string
}

export type GigStatus = 'on-sale' | 'sold-out' | 'cancelled'

export interface GigDate {
  id: string
  date: string // ISO yyyy-mm-dd
  time?: string // e.g. "20:00"
  title: string
  venue: string
  town: string
  ticketUrl?: string
  status: GigStatus
}

// --- Modules (discriminated union). Order is the array index. ---

interface ModuleBase {
  id: string
  title: string
  hidden: boolean
}

export interface MixesModule extends ModuleBase {
  type: 'mixes'
  items: MixItem[]
}

export interface VideosModule extends ModuleBase {
  type: 'videos'
  items: VideoItem[]
}

export interface RadioModule extends ModuleBase {
  type: 'radio'
  radio: RadioInfo
}

export interface GalleryModule extends ModuleBase {
  type: 'gallery'
  photos: PhotoItem[]
}

export interface GigsModule extends ModuleBase {
  type: 'gigs'
  gigs: GigDate[]
}

export type ProfileModule =
  | MixesModule
  | VideosModule
  | RadioModule
  | GalleryModule
  | GigsModule

export interface Profile {
  id: string
  slug: string
  displayName: string
  avatar?: string
  cover?: string
  bio: string
  location: string
  genres: string[]
  roles: ProfileRole[]
  socials: SocialLink[]
  website?: string
  /** Contact/booking destination (email or URL). */
  contact?: string
  modules: ProfileModule[]
}

/** Build an empty module of a given type with sensible defaults. */
export function createEmptyModule(type: ModuleType, id: string): ProfileModule {
  const base = { id, title: MODULE_META[type].label, hidden: false }
  switch (type) {
    case 'mixes':
      return { ...base, type, items: [] }
    case 'videos':
      return { ...base, type, items: [] }
    case 'radio':
      return {
        ...base,
        type,
        radio: {
          onAir: false,
          showTitle: '',
          stationName: '',
          streamUrl: '',
          schedule: '',
        },
      }
    case 'gallery':
      return { ...base, type, photos: [] }
    case 'gigs':
      return { ...base, type, gigs: [] }
  }
}
