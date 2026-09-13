import type { ShowcaseEvent } from './types'

// TEMPORARY sample events shared across showcase profiles and the event detail
// page. Cross-profile links use the `relatedProfiles` slug references.

export const SHOWCASE_EVENTS: ShowcaseEvent[] = [
  {
    id: 'ev_lumen_launch',
    slug: 'nightform-winter-lights',
    title: 'Nightform: Winter Lights Launch',
    date: '2026-02-27',
    doorsTime: '20:00',
    endTime: '03:00',
    venueName: 'The Lumen Rooms',
    venueSlug: 'the-lumen-rooms',
    town: 'Manchester',
    description:
      'Nightform takes over every room of The Lumen Rooms for a full-building launch party — Echo Atlas performing live in the main hall, Luna Vega closing the basement, and Kite Machine on the mezzanine.',
    poster: '/images/showcase/event/poster.png',
    priceFrom: '£18.50',
    status: 'selling-fast',
    ticketUrl: '#tickets',
    lineup: ['Echo Atlas (live)', 'Luna Vega', 'Kite Machine'],
    relatedProfiles: ['nightform', 'echo-atlas', 'luna-vega', 'the-lumen-rooms'],
    attendance: 'Capacity 420',
  },
  {
    id: 'ev_echo_mcr',
    slug: 'echo-atlas-parallel-lines-manchester',
    title: 'Echo Atlas: Parallel Lines Tour — Manchester',
    date: '2026-03-14',
    doorsTime: '19:30',
    venueName: 'The Lumen Rooms',
    venueSlug: 'the-lumen-rooms',
    town: 'Manchester',
    description:
      'The hometown date of the Parallel Lines album tour, with full live band, visuals and a support set from Kite Machine.',
    poster: '/images/showcase/event/echo-tour.png',
    priceFrom: '£22.00',
    status: 'on-sale',
    ticketUrl: '#tickets',
    lineup: ['Echo Atlas', 'Kite Machine'],
    relatedProfiles: ['echo-atlas', 'the-lumen-rooms'],
  },
  {
    id: 'ev_echo_ldn',
    slug: 'echo-atlas-parallel-lines-london',
    title: 'Echo Atlas: Parallel Lines Tour — London',
    date: '2026-03-21',
    doorsTime: '19:30',
    venueName: 'Village Underground',
    town: 'London',
    description:
      'The Parallel Lines tour lands in Shoreditch for a sold-out night of the record performed front to back.',
    poster: '/images/showcase/event/echo-tour.png',
    status: 'sold-out',
    lineup: ['Echo Atlas'],
    relatedProfiles: ['echo-atlas'],
  },
  {
    id: 'ev_openair',
    slug: 'nightform-open-air-2026',
    title: 'Nightform Open Air 2026',
    date: '2026-06-13',
    doorsTime: '14:00',
    endTime: '23:00',
    venueName: 'Platt Fields Park',
    town: 'Manchester',
    description:
      'Nightform’s flagship day festival returns with three stages of melodic house, live electronica and disco across the park.',
    poster: '/images/showcase/event/openair.png',
    priceFrom: '£39.50',
    status: 'on-sale',
    ticketUrl: '#tickets',
    lineup: ['Echo Atlas (live)', 'Luna Vega', 'Special guests TBA'],
    relatedProfiles: ['nightform', 'echo-atlas', 'luna-vega'],
    attendance: 'Capacity 4,000',
  },
  {
    id: 'ev_jazz',
    slug: 'lumen-sunday-jazz',
    title: 'Sunday Jazz & Roast',
    date: '2026-03-01',
    doorsTime: '13:00',
    endTime: '17:00',
    venueName: 'The Lumen Rooms',
    venueSlug: 'the-lumen-rooms',
    town: 'Manchester',
    description:
      'A weekly afternoon of live trio jazz paired with the kitchen’s Sunday roast menu. Relaxed, all ages welcome.',
    poster: '/images/showcase/event/jazz.png',
    free: true,
    status: 'free',
    lineup: ['The Lumen House Trio'],
    relatedProfiles: ['the-lumen-rooms'],
  },
  {
    id: 'ev_warehouse',
    slug: 'nightform-warehouse-013',
    title: 'Nightform: Warehouse Sessions 013',
    date: '2025-11-15',
    venueName: 'Depot Mayfield',
    town: 'Manchester',
    description:
      'The thirteenth edition of the after-dark warehouse series — six hours across two rooms of hypnotic, melodic techno.',
    poster: '/images/showcase/event/warehouse.png',
    status: 'sold-out',
    lineup: ['Luna Vega', 'Echo Atlas (DJ set)', 'Halogen'],
    relatedProfiles: ['nightform', 'luna-vega', 'echo-atlas'],
    attendance: '1,200 attended',
  },
  {
    id: 'ev_nye',
    slug: 'nightform-nye-ascension',
    title: 'Nightform NYE: Ascension',
    date: '2025-12-31',
    venueName: 'Albert Hall',
    town: 'Manchester',
    description:
      'A sold-out New Year’s Eve spectacular in the historic Albert Hall with production, aerial performers and a midnight live set.',
    poster: '/images/showcase/event/warehouse.png',
    status: 'sold-out',
    lineup: ['Echo Atlas (live)', 'Luna Vega', 'Guest headliner'],
    relatedProfiles: ['nightform', 'echo-atlas', 'luna-vega'],
    attendance: '1,800 attended',
  },
]

export function getShowcaseEvent(slug: string): ShowcaseEvent | undefined {
  return SHOWCASE_EVENTS.find((e) => e.slug === slug)
}

export function eventBySlug(slug: string): ShowcaseEvent {
  const found = getShowcaseEvent(slug)
  if (!found) throw new Error(`Unknown showcase event: ${slug}`)
  return found
}
