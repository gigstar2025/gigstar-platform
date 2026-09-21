// ---------------------------------------------------------------------------
// Authoritative module vocabulary for GigStar modular profiles (PR-5a).
//
// These keys match `profile_module_definitions.key` in the database EXACTLY,
// so the database, the editor and the public profile page all speak a single
// vocabulary. Historically two competing systems existed:
//
//   * lib/profiles/types.ts       — ModuleType = 'mixes' | 'videos' | ...
//                                   (note: "mixes", not "audio")
//   * lib/profiles/showcase/types — SectionKey = 'audio' | 'videos' | ...
//                                   (a superset used by the showcase editor)
//
// This module is the reconciliation point. `moduleKeyFromLegacyType` and
// `moduleKeyFromSectionKey` safely map the old vocabularies onto the canonical
// database keys so no existing content is stranded.
// ---------------------------------------------------------------------------

import type { ModuleType } from "../types"

/** Canonical module keys — identical to profile_module_definitions.key. */
export type ModuleKey = "audio" | "videos" | "radio" | "gallery" | "gigs"

export const MODULE_KEYS: readonly ModuleKey[] = [
  "audio",
  "videos",
  "radio",
  "gallery",
  "gigs",
] as const

export type ProfileType = "dj" | "artist" | "venue" | "organiser"

export interface ModuleDefinition {
  key: ModuleKey
  label: string
  description: string
  category: "Media" | "Events & Booking"
  /** Profile types allowed to add this module. */
  appliesTo: ProfileType[]
  /** At most one instance per profile (all five are singletons). */
  isSingleton: boolean
  /**
   * Advisory ordering hint for the editor. The DATABASE `default_position`
   * column is authoritative at write time (the save RPC reads it); this value
   * mirrors the seeded defaults for client-side sorting before a save.
   */
  defaultPosition: number
  recommendedFor: ProfileType[]
  /** Whether the module may be hidden from the public profile. */
  canHide: boolean
}

/**
 * The five optional content modules. Values mirror the seeded rows in
 * migrations 0005 (audio, videos, gallery) and 0014 (radio, gigs).
 */
export const MODULE_REGISTRY: Record<ModuleKey, ModuleDefinition> = {
  audio: {
    key: "audio",
    label: "Mixes & audio",
    description: "Mixes and audio sets embedded from SoundCloud or Mixcloud.",
    category: "Media",
    appliesTo: ["dj", "artist"],
    isSingleton: true,
    defaultPosition: 80,
    recommendedFor: ["dj"],
    canHide: true,
  },
  videos: {
    key: "videos",
    label: "Videos",
    description: "Video clips and live footage embedded from YouTube or Vimeo.",
    category: "Media",
    appliesTo: ["dj", "artist", "venue", "organiser"],
    isSingleton: true,
    defaultPosition: 70,
    recommendedFor: [],
    canHide: true,
  },
  radio: {
    key: "radio",
    label: "Live radio / on-air",
    description: "Link out to a live radio stream or on-air show, with optional schedule.",
    category: "Media",
    appliesTo: ["dj", "artist"],
    isSingleton: true,
    defaultPosition: 85,
    recommendedFor: ["dj"],
    canHide: true,
  },
  gallery: {
    key: "gallery",
    label: "Photo gallery",
    description: "Photo gallery with an accessible lightbox.",
    category: "Media",
    appliesTo: ["dj", "artist", "venue", "organiser"],
    isSingleton: true,
    defaultPosition: 60,
    recommendedFor: ["venue", "organiser"],
    canHide: true,
  },
  gigs: {
    key: "gigs",
    label: "Gig dates",
    description: "Upcoming and past gig dates with venue, town and ticket links.",
    category: "Events & Booking",
    appliesTo: ["dj", "artist", "organiser"],
    isSingleton: true,
    defaultPosition: 45,
    recommendedFor: ["dj", "artist"],
    canHide: true,
  },
}

/** Type guard: is an arbitrary string a canonical module key? */
export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value)
}

/** Definition lookup that never returns undefined for a known key. */
export function moduleDefinition(key: ModuleKey): ModuleDefinition {
  return MODULE_REGISTRY[key]
}

/** Is a module allowed for a given profile type? */
export function moduleAppliesTo(key: ModuleKey, type: ProfileType): boolean {
  return MODULE_REGISTRY[key].appliesTo.includes(type)
}

/** All module keys a profile type may use, in advisory display order. */
export function modulesForProfileType(type: ProfileType): ModuleKey[] {
  return [...MODULE_KEYS]
    .filter((k) => moduleAppliesTo(k, type))
    .sort((a, b) => MODULE_REGISTRY[b].defaultPosition - MODULE_REGISTRY[a].defaultPosition)
}

// ---------------------------------------------------------------------------
// Legacy vocabulary reconciliation.
// ---------------------------------------------------------------------------

/**
 * Map the legacy `ModuleType` (lib/profiles/types.ts) onto canonical keys.
 * The only non-identity mapping is `mixes` -> `audio`.
 */
const LEGACY_MODULE_TYPE_TO_KEY: Record<ModuleType, ModuleKey> = {
  mixes: "audio",
  videos: "videos",
  radio: "radio",
  gallery: "gallery",
  gigs: "gigs",
}

export function moduleKeyFromLegacyType(type: ModuleType): ModuleKey {
  return LEGACY_MODULE_TYPE_TO_KEY[type]
}

/**
 * Map a showcase `SectionKey`-style string onto a canonical module key when it
 * corresponds to one of the five modular modules, else null. The showcase
 * already uses `audio`/`videos`/`gallery` verbatim; `radio` and `gigs` are new
 * in the converged vocabulary and have no showcase-section equivalent.
 */
export function moduleKeyFromSectionKey(section: string): ModuleKey | null {
  return isModuleKey(section) ? section : null
}
