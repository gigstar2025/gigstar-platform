import type { ShowcaseProfile, ShowcaseType } from './types'
import { djProfile } from './dj'
import { artistProfile } from './artist'
import { venueProfile } from './venue'
import { organiserProfile } from './organiser'

export * from './types'
export { SHOWCASE_EVENTS, getShowcaseEvent } from './events'

export const SHOWCASE_PROFILES: ShowcaseProfile[] = [
  djProfile,
  artistProfile,
  venueProfile,
  organiserProfile,
]

export function getShowcaseProfile(slug: string): ShowcaseProfile | undefined {
  return SHOWCASE_PROFILES.find((p) => p.slug === slug)
}

export function getProfilesByType(type: ShowcaseType): ShowcaseProfile[] {
  return SHOWCASE_PROFILES.filter((p) => p.type === type)
}

export function summarizeProfile(p: ShowcaseProfile) {
  return {
    slug: p.slug,
    type: p.type,
    displayName: p.displayName,
    tagline: p.tagline,
    avatar: p.avatar,
    cover: p.cover,
    location: p.location,
    chips: p.chips,
    verified: p.verified,
    featured: p.featured,
  }
}
