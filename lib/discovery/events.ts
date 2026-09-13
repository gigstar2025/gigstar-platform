// ---------------------------------------------------------------------------
// 30 mock events — 15 in the Hastings region, 15 in London — across a mixture
// of club nights, live bands, festivals, restaurant entertainment, DJ events,
// community events, album launches and open-mics.
//
// Coordinates are inherited from the event's area anchor (which matches the
// hosting venue's location where a venue profile is connected), so events
// filter by radius alongside profiles and content.
// ---------------------------------------------------------------------------

import { AREAS, hashStr, jitter, pickFrom, round5, type AreaKey } from './geo'
import type { DiscoveryEvent, EventKind, EventStatus } from './types'

const POSTERS = [
  '/images/showcase/event/poster.png',
  '/images/showcase/event/openair.png',
  '/images/showcase/event/warehouse.png',
  '/images/showcase/event/jazz.png',
  '/images/showcase/event/echo-tour.png',
  '/images/showcase/artist/release-1.png',
  '/images/showcase/artist/release-2.png',
]

interface EOpts {
  date: string
  status: EventStatus
  venueSlug?: string
  organiserSlug?: string
  lineup?: string[]
  priceFrom?: number
  free?: boolean
  poster?: string
}

function mk(
  slug: string,
  title: string,
  kind: EventKind,
  areaKey: AreaKey,
  venueName: string,
  opts: EOpts,
): DiscoveryEvent {
  const area = AREAS[areaKey]
  const h = hashStr(slug)
  return {
    id: `e-${slug}`,
    slug,
    title,
    kind,
    region: area.region,
    area: area.area,
    town: area.town,
    lat: round5(area.lat + jitter(h, 'lat')),
    lng: round5(area.lng + jitter(h, 'lng')),
    date: opts.date,
    venueSlug: opts.venueSlug,
    venueName,
    organiserSlug: opts.organiserSlug,
    poster: opts.poster ?? pickFrom(POSTERS, h),
    priceFrom: opts.free ? undefined : opts.priceFrom,
    free: !!opts.free,
    status: opts.status,
    lineupSlugs: opts.lineup ?? [],
  }
}

export const DISCOVERY_EVENTS: DiscoveryEvent[] = [
  // ===== HASTINGS ===========================================================
  mk('crypt-basement-social', 'Basement Social', 'club-night', 'old-town', 'The Crypt', { date: '2026-03-14', status: 'selling-fast', venueSlug: 'the-crypt-hastings', organiserSlug: 'nightform', lineup: ['tidal-frequency', 'shingle-sound'], priceFrom: 12 }),
  mk('stade-folk-night', 'Old Town Folk Night', 'live-band', 'the-stade', 'The Stade Hall', { date: '2026-03-21', status: 'on-sale', venueSlug: 'the-stade-hall', organiserSlug: 'old-town-sessions', lineup: ['the-smugglers-band', 'the-fishwives'], priceFrom: 10 }),
  mk('coastline-seafront-festival', 'Seafront Festival', 'festival', 'the-stade', 'The Stade Open Space', { date: '2026-07-11', status: 'on-sale', organiserSlug: 'coastline-events', lineup: ['echo-atlas', 'tidal-frequency', 'marina-mix'], priceFrom: 45 }),
  mk('marine-court-supper-jazz', 'Supper Club Jazz', 'restaurant', 'st-leonards', 'Marine Court Club', { date: '2026-03-27', status: 'free', venueSlug: 'marine-court-club', lineup: ['pier-pressure'], free: true }),
  mk('bexhill-beach-disco', 'Beach Disco', 'dj-event', 'bexhill', 'The Seafront Pavilion', { date: '2026-06-06', status: 'on-sale', venueSlug: 'the-seafront-pavilion', organiserSlug: 'seaside-socials', lineup: ['marina-mix', 'ore-valley-dj'], priceFrom: 15 }),
  mk('anchor-open-mic', 'Anchor Open Mic', 'open-mic', 'old-town', 'The Anchor Rooms', { date: '2026-03-18', status: 'free', venueSlug: 'the-anchor-rooms', free: true }),
  mk('echo-atlas-parallel-lines-hastings', 'Echo Atlas — Parallel Lines', 'album-launch', 'st-leonards', 'Marine Court Club', { date: '2026-04-04', status: 'last-tickets', venueSlug: 'marine-court-club', organiserSlug: 'coastline-events', lineup: ['echo-atlas'], priceFrom: 18 }),
  mk('anchor-community-singaround', 'Community Singaround', 'community', 'old-town', 'The Anchor Rooms', { date: '2026-03-29', status: 'free', venueSlug: 'the-anchor-rooms', lineup: ['the-fishwives'], free: true }),
  mk('pier-pavilion-bass-night', 'Pavilion Bass Night', 'club-night', 'hastings-centre', 'The Pier Pavilion', { date: '2026-05-02', status: 'sold-out', venueSlug: 'the-pier-pavilion', organiserSlug: 'nightform', lineup: ['cliff-edge-sound', 'groyne-audio'], priceFrom: 20 }),
  mk('battle-brass-hall', 'Battle Brass at the Hall', 'live-band', 'battle', 'Battle Memorial Hall', { date: '2026-04-18', status: 'on-sale', organiserSlug: '1066-live', lineup: ['battle-brass', 'cinque-selectors'], priceFrom: 14 }),
  mk('marine-court-americana', 'Americana Supper', 'restaurant', 'st-leonards', 'Marine Court Club', { date: '2026-05-16', status: 'free', venueSlug: 'marine-court-club', lineup: ['coast-road'], free: true }),
  mk('stade-day-party', 'Stade Day Party', 'dj-event', 'the-stade', 'The Stade Open Space', { date: '2026-06-20', status: 'selling-fast', organiserSlug: 'seaside-socials', lineup: ['dj-harbour-lights', 'pier-pressure'], priceFrom: 12 }),
  mk('eastbourne-electric-festival', 'Eastbourne Electric', 'festival', 'eastbourne', 'Princes Park', { date: '2026-08-01', status: 'on-sale', organiserSlug: 'eastbourne-electric', lineup: ['cliff-edge-sound', 'marina-mix'], priceFrom: 38 }),
  mk('rye-cellar-folk-social', 'Rye Cellar Folk Social', 'community', 'rye', 'Rye Cellar', { date: '2026-04-25', status: 'free', venueSlug: 'rye-cellar', lineup: ['saltmarsh'], free: true }),
  mk('rye-cellar-live', 'Saltmarsh & Amber Tide (Live)', 'live-band', 'rye', 'Rye Cellar', { date: '2026-05-23', status: 'on-sale', venueSlug: 'rye-cellar', organiserSlug: 'coastline-events', lineup: ['saltmarsh', 'amber-tide'], priceFrom: 12 }),

  // ===== LONDON =============================================================
  mk('warehouse-e5-after-dark', 'After Dark: Opening', 'club-night', 'hackney', 'Warehouse E5', { date: '2026-03-13', status: 'selling-fast', venueSlug: 'warehouse-e5', organiserSlug: 'after-dark-collective', lineup: ['luna-vega', 'dusk-signal'], priceFrom: 22 }),
  mk('lumen-riff-city-live', 'Riff City Live', 'live-band', 'peckham', 'The Lumen Rooms', { date: '2026-03-20', status: 'on-sale', venueSlug: 'the-lumen-rooms', organiserSlug: 'riff-city-promotions', lineup: ['echo-district', 'the-paper-tigers'], priceFrom: 16 }),
  mk('after-dark-open-air', 'After Dark Open Air', 'festival', 'stratford', 'East Bank Green', { date: '2026-07-25', status: 'on-sale', organiserSlug: 'after-dark-collective', lineup: ['luna-vega', 'neon-fox', 'marla-dune'], priceFrom: 55 }),
  mk('brass-vault-supper-jazz', 'Brass Vault Supper Jazz', 'restaurant', 'soho', 'The Brass Vault', { date: '2026-03-26', status: 'free', venueSlug: 'the-brass-vault', organiserSlug: 'capital-jazz-co', lineup: ['brass-union'], free: true }),
  mk('warehouse-e5-open-decks', 'Open Decks Session', 'dj-event', 'hackney', 'Warehouse E5', { date: '2026-04-10', status: 'on-sale', venueSlug: 'warehouse-e5', organiserSlug: 'open-decks-london', lineup: ['saint-tempo', 'vela-sound'], priceFrom: 14 }),
  mk('lumen-sunday-soul', 'Sunday Soul Kitchen', 'restaurant', 'peckham', 'The Lumen Rooms', { date: '2026-03-22', status: 'free', venueSlug: 'the-lumen-rooms', lineup: ['midnight-choir'], free: true }),
  mk('camden-paper-tigers-launch', 'The Paper Tigers — Album Launch', 'album-launch', 'camden', 'Camden Underground', { date: '2026-04-11', status: 'last-tickets', venueSlug: 'camden-underground', organiserSlug: 'riff-city-promotions', lineup: ['the-paper-tigers'], priceFrom: 18 }),
  mk('brixton-block-social', 'Brixton Block Social', 'community', 'brixton', 'Windrush Square', { date: '2026-05-09', status: 'free', organiserSlug: 'sundown-socials', lineup: ['northbank-collective'], free: true }),
  mk('camden-underground-dnb', 'Underground: Drum & Bass', 'club-night', 'camden', 'Camden Underground', { date: '2026-04-24', status: 'on-sale', venueSlug: 'camden-underground', organiserSlug: 'after-dark-collective', lineup: ['orbit-audio'], priceFrom: 15 }),
  mk('reading-riverside-live', 'Riverside Live', 'live-band', 'reading', 'Riverside Rooms', { date: '2026-06-13', status: 'on-sale', venueSlug: 'riverside-rooms', lineup: ['clara-mae'], priceFrom: 14 }),
  mk('sundown-summer-social', 'Sundown Summer Social', 'festival', 'brixton', 'Brockwell Park', { date: '2026-07-04', status: 'on-sale', organiserSlug: 'sundown-socials', lineup: ['marla-dune', 'halcyon-jones'], priceFrom: 30 }),
  mk('selby-afro-house', 'Afro House at The Selby', 'dj-event', 'watford', 'The Selby', { date: '2026-05-30', status: 'selling-fast', venueSlug: 'the-selby', lineup: ['dj-sable'], priceFrom: 16 }),
  mk('wax-and-vine-vinyl-supper', 'Vinyl Supper', 'restaurant', 'fitzrovia', 'Wax & Vine', { date: '2026-04-03', status: 'free', venueSlug: 'wax-and-vine', lineup: ['brass-union'], free: true }),
  mk('brass-vault-open-mic', 'Brass Vault Open Mic', 'open-mic', 'soho', 'The Brass Vault', { date: '2026-03-19', status: 'free', venueSlug: 'the-brass-vault', organiserSlug: 'capital-jazz-co', free: true }),
  mk('nightjar-lowkey', 'Lowkey at The Nightjar', 'club-night', 'shoreditch', 'The Nightjar Rooms', { date: '2026-04-17', status: 'on-sale', venueSlug: 'the-nightjar-rooms', organiserSlug: 'lowkey-collective', lineup: ['luna-vega'], priceFrom: 12 }),
]

export function getDiscoveryEvent(slug: string): DiscoveryEvent | undefined {
  return DISCOVERY_EVENTS.find((e) => e.slug === slug)
}
