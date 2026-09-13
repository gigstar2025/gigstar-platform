// ---------------------------------------------------------------------------
// ~120 linked content records generated across the 60 profiles (two per
// profile). Each record belongs to a source profile and may also connect to an
// event or venue; its location is INHERITED from the connected event, then the
// connected venue, then the source profile — mirroring how real published
// content would resolve its location.
// ---------------------------------------------------------------------------

import { hashStr, pickFrom } from './geo'
import { DISCOVERY_PROFILES, getDiscoveryProfile } from './profiles'
import { DISCOVERY_EVENTS } from './events'
import type {
  ContentKind,
  DiscoveryContent,
  DiscoveryEvent,
  DiscoveryProfile,
  DiscoveryType,
} from './types'

const CONTENT_IMG: Record<DiscoveryType, string[]> = {
  dj: ['/images/profile/mix-1.png', '/images/profile/mix-2.png', '/images/profile/video-1.png', '/images/profile/gallery-1.png', '/images/profile/gallery-2.png'],
  artist: ['/images/showcase/artist/gallery-1.png', '/images/showcase/artist/gallery-2.png', '/images/showcase/artist/release-1.png', '/images/showcase/artist/release-2.png', '/images/showcase/artist/band.png'],
  venue: ['/images/showcase/venue/hall.png', '/images/showcase/venue/bar.png', '/images/showcase/venue/restaurant.png', '/images/showcase/venue/exterior.png'],
  organiser: ['/images/showcase/event/poster.png', '/images/showcase/event/openair.png', '/images/showcase/event/warehouse.png', '/images/showcase/organiser/past-1.png'],
}

interface Spec {
  kind: ContentKind
  linkEvent: boolean
  caption: (p: DiscoveryProfile, e?: DiscoveryEvent) => string
}

const SPECS: Record<DiscoveryType, [Spec, Spec]> = {
  dj: [
    { kind: 'mix', linkEvent: false, caption: (p) => `New ${p.genres[0].toLowerCase()} mix is live — recorded in ${p.area}. Play it loud.` },
    { kind: 'clip', linkEvent: true, caption: (p, e) => (e ? `Clip from my set at ${e.title} — ${e.venueName}. What a room.` : `Warm-up clip from the ${p.area} residency.`) },
  ],
  artist: [
    { kind: 'release', linkEvent: false, caption: (p) => `Our new ${p.genres[0].toLowerCase()} single is out everywhere now. Two years in the making.` },
    { kind: 'clip', linkEvent: true, caption: (p, e) => (e ? `Live from ${e.title} at ${e.venueName}. Thank you ${e.town}.` : `Rehearsal footage ahead of the next run of shows.`) },
  ],
  venue: [
    { kind: 'gallery', linkEvent: false, caption: (p) => `A look inside ${p.name} — ${p.genres[0].toLowerCase()} in the heart of ${p.area}.` },
    { kind: 'announcement', linkEvent: true, caption: (p, e) => (e ? `Just announced: ${e.title}, live at ${p.name}. Tickets on sale now.` : `Now taking bookings for private events at ${p.name}.`) },
  ],
  organiser: [
    { kind: 'poster', linkEvent: true, caption: (p, e) => (e ? `${e.title} — our next date. Line-up locked, tickets moving fast.` : `Season launch: new dates across ${p.area} coming soon.`) },
    { kind: 'past-photo', linkEvent: false, caption: (p) => `Looking back at a huge night with ${p.name}. On to the next one.` },
  ],
}

/** Map each profile slug to the first event it connects to (organiser, venue
 *  or line-up), so event-linked content can inherit that event's location. */
const EVENT_FOR_PROFILE = (() => {
  const map = new Map<string, DiscoveryEvent>()
  const consider = (slug: string | undefined, e: DiscoveryEvent) => {
    if (slug && !map.has(slug)) map.set(slug, e)
  }
  for (const e of DISCOVERY_EVENTS) {
    consider(e.organiserSlug, e)
    consider(e.venueSlug, e)
    for (const s of e.lineupSlugs) consider(s, e)
  }
  return map
})()

export const DISCOVERY_CONTENT: DiscoveryContent[] = DISCOVERY_PROFILES.flatMap((p) => {
  const connected = EVENT_FOR_PROFILE.get(p.slug)
  return SPECS[p.type].map((spec, j): DiscoveryContent => {
    const linkEvent = spec.linkEvent ? connected : undefined
    // Location inheritance: event -> venue -> source profile.
    let lat = p.lat
    let lng = p.lng
    let region = p.region
    let town = p.town
    let venueSlug: string | undefined = p.type === 'venue' ? p.slug : undefined
    if (linkEvent) {
      lat = linkEvent.lat
      lng = linkEvent.lng
      region = linkEvent.region
      town = linkEvent.town
      venueSlug = linkEvent.venueSlug ?? venueSlug
    } else if (venueSlug) {
      const v = getDiscoveryProfile(venueSlug)
      if (v) {
        lat = v.lat
        lng = v.lng
        region = v.region
        town = v.town
      }
    }
    const h = hashStr(`${p.slug}-${spec.kind}-${j}`)
    return {
      id: `c-${p.slug}-${j}`,
      profileSlug: p.slug,
      kind: spec.kind,
      caption: spec.caption(p, linkEvent),
      image: pickFrom(CONTENT_IMG[p.type], h),
      tags: p.genres.slice(0, 2).map((g) => `#${g.toLowerCase().replace(/[^a-z0-9]+/g, '')}`),
      postedDaysAgo: 1 + (h % 30),
      likes: 20 + (h % 1800),
      comments: h % 60,
      eventId: linkEvent?.id,
      venueSlug,
      lat,
      lng,
      region,
      town,
    }
  })
})
