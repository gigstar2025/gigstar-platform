// ---------------------------------------------------------------------------
// Single source of truth for which modules each professional profile type may
// use, whether they are required/recommended, whether they can feed the
// GigStar discovery homepage, and how they group in the "Add module" library.
//
// Module identity reuses the public profile's SectionKey so the editor and the
// live preview stay perfectly in sync — no parallel module vocabulary.
// ---------------------------------------------------------------------------

import type { SectionKey, ShowcaseProfile, ShowcaseType } from './types'

export type EditorGroup =
  | 'Recommended'
  | 'Content'
  | 'Events & Booking'
  | 'Media'
  | 'Information'
  | 'Social & Contact'

export const EDITOR_GROUPS: EditorGroup[] = [
  'Recommended',
  'Content',
  'Events & Booking',
  'Media',
  'Information',
  'Social & Contact',
]

export interface ModuleDefinition {
  key: SectionKey
  label: string
  description: string
  example: string
  group: EditorGroup
  allowedProfileTypes: ShowcaseType[]
  required: boolean
  recommendedFor: ShowcaseType[]
  /** Content in this module can surface in the discovery feed. */
  canFeedDiscovery: boolean
  /** May be hidden from the public profile (required modules cannot). */
  canHide: boolean
  /** Which ShowcaseProfile field holds this module's content. */
  dataField: keyof ShowcaseProfile
}

const ALL: ShowcaseType[] = ['dj', 'artist', 'venue', 'organiser']

export const MODULE_REGISTRY: Record<SectionKey, ModuleDefinition> = {
  about: {
    key: 'about',
    label: 'About',
    description: 'Biography and introduction shown near the top of the profile.',
    example: 'Who you are, your story, and what makes you distinctive.',
    group: 'Recommended',
    allowedProfileTypes: ALL,
    required: true,
    recommendedFor: ALL,
    canFeedDiscovery: false,
    canHide: false,
    dataField: 'bio',
  },
  facts: {
    key: 'facts',
    label: 'Quick facts',
    description: 'Scannable key/value highlights at a glance.',
    example: 'Based in, experience, capacity, typical set length.',
    group: 'Information',
    allowedProfileTypes: ALL,
    required: false,
    recommendedFor: ALL,
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'facts',
  },
  'featured-event': {
    key: 'featured-event',
    label: 'Featured event',
    description: 'Spotlight one event, referenced by its shared event ID.',
    example: 'Your next headline show or flagship night.',
    group: 'Events & Booking',
    allowedProfileTypes: ['dj', 'artist', 'organiser'],
    required: false,
    recommendedFor: ['organiser'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'featuredEvent',
  },
  events: {
    key: 'events',
    label: 'Events',
    description: 'Upcoming events, appearances or listings.',
    example: 'Tour dates, appearances, or what is on this month.',
    group: 'Events & Booking',
    allowedProfileTypes: ALL,
    required: false,
    recommendedFor: ['dj', 'artist', 'venue', 'organiser'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'events',
  },
  'past-events': {
    key: 'past-events',
    label: 'Past events',
    description: 'A track record of previous events with highlights.',
    example: 'Sold-out shows and notable past productions.',
    group: 'Events & Booking',
    allowedProfileTypes: ['artist', 'organiser'],
    required: false,
    recommendedFor: ['organiser'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'pastEvents',
  },
  releases: {
    key: 'releases',
    label: 'Releases',
    description: 'Music releases with artwork and streaming links.',
    example: 'Albums, EPs and singles listeners can explore.',
    group: 'Media',
    allowedProfileTypes: ['artist'],
    required: false,
    recommendedFor: ['artist'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'releases',
  },
  audio: {
    key: 'audio',
    label: 'Mixes & audio',
    description: 'Mixes and audio sets with artwork and duration.',
    example: 'Recorded DJ mixes or featured tracks.',
    group: 'Media',
    allowedProfileTypes: ['dj', 'artist'],
    required: false,
    recommendedFor: ['dj'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'audio',
  },
  videos: {
    key: 'videos',
    label: 'Videos',
    description: 'Video clips, live footage and short-form content.',
    example: 'Live sets, music videos, walkthroughs.',
    group: 'Media',
    allowedProfileTypes: ['dj', 'artist', 'venue', 'organiser'],
    required: false,
    recommendedFor: [],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'videos',
  },
  gallery: {
    key: 'gallery',
    label: 'Gallery',
    description: 'Photo gallery with an accessible lightbox.',
    example: 'Performance shots, the space, past nights.',
    group: 'Media',
    allowedProfileTypes: ALL,
    required: false,
    recommendedFor: ['venue', 'organiser'],
    canFeedDiscovery: true,
    canHide: true,
    dataField: 'gallery',
  },
  spaces: {
    key: 'spaces',
    label: 'Spaces for hire',
    description: 'Bookable spaces, each with capacity and facilities.',
    example: 'Main room, mezzanine, private bar.',
    group: 'Information',
    allowedProfileTypes: ['venue'],
    required: false,
    recommendedFor: ['venue'],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'spaces',
  },
  menu: {
    key: 'menu',
    label: 'Sample menu',
    description: 'Food & drink menu grouped into sections.',
    example: 'Small plates, mains, drinks with prices.',
    group: 'Information',
    allowedProfileTypes: ['venue'],
    required: false,
    recommendedFor: [],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'menu',
  },
  technical: {
    key: 'technical',
    label: 'Stage & production',
    description: 'Technical specification, backline and rider notes.',
    example: 'PA, stage size, load-in and engineer availability.',
    group: 'Information',
    allowedProfileTypes: ['venue', 'artist'],
    required: false,
    recommendedFor: [],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'technical',
  },
  reviews: {
    key: 'reviews',
    label: 'Reviews',
    description: 'Ratings and testimonials from past collaborators.',
    example: 'Promoter and venue feedback with a star average.',
    group: 'Information',
    allowedProfileTypes: ALL,
    required: false,
    recommendedFor: [],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'reviews',
  },
  partners: {
    key: 'partners',
    label: 'Partners',
    description: 'Sponsors and partner organisations.',
    example: 'Brands, sponsors and collaborators.',
    group: 'Information',
    allowedProfileTypes: ['organiser'],
    required: false,
    recommendedFor: [],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'partners',
  },
  'mailing-list': {
    key: 'mailing-list',
    label: 'Mailing list',
    description: 'A prototype signup block (no addresses are stored).',
    example: 'Grow an audience for future announcements.',
    group: 'Social & Contact',
    allowedProfileTypes: ['organiser'],
    required: false,
    recommendedFor: ['organiser'],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'mailingList',
  },
  contact: {
    key: 'contact',
    label: 'Contact & enquiry',
    description: 'Booking/enquiry form and contact details.',
    example: 'How promoters and clients get in touch.',
    group: 'Social & Contact',
    allowedProfileTypes: ALL,
    required: true,
    recommendedFor: ALL,
    canFeedDiscovery: false,
    canHide: false,
    dataField: 'contactEmail',
  },
  related: {
    key: 'related',
    label: 'Related profiles',
    description: 'Cross-links to connected GigStar profiles.',
    example: 'Resident venues, regular promoters, shared bills.',
    group: 'Social & Contact',
    allowedProfileTypes: ALL,
    required: false,
    recommendedFor: [],
    canFeedDiscovery: false,
    canHide: true,
    dataField: 'related',
  },
}

/** Per-type label overrides so each profile speaks its own language. */
const TYPE_LABELS: Partial<Record<ShowcaseType, Partial<Record<SectionKey, string>>>> = {
  dj: { audio: 'Mixes', events: 'Events & appearances', facts: 'Quick facts' },
  artist: {
    audio: 'Featured music',
    events: 'Tour dates',
    technical: 'Technical information',
    facts: 'Quick facts',
  },
  venue: {
    events: "What's on",
    facts: 'At a glance',
    technical: 'Stage & production',
  },
  organiser: {
    events: 'Upcoming events',
    facts: 'At a glance',
  },
}

export function moduleLabel(key: SectionKey, type: ShowcaseType): string {
  return TYPE_LABELS[type]?.[key] ?? MODULE_REGISTRY[key].label
}

export function moduleDef(key: SectionKey): ModuleDefinition {
  return MODULE_REGISTRY[key]
}

export function isAllowed(key: SectionKey, type: ShowcaseType): boolean {
  return MODULE_REGISTRY[key].allowedProfileTypes.includes(type)
}

/** All module keys a given profile type may use, in a stable display order. */
export function allowedModuleKeys(type: ShowcaseType): SectionKey[] {
  return (Object.keys(MODULE_REGISTRY) as SectionKey[]).filter((k) =>
    isAllowed(k, type),
  )
}
