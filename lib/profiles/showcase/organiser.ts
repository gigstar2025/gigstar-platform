import type { ShowcaseProfile } from './types'
import { eventBySlug } from './events'

// TEMPORARY sample event organiser / promoter profile.
export const organiserProfile: ShowcaseProfile = {
  id: 'sp_nightform',
  slug: 'nightform',
  type: 'organiser',
  displayName: 'Nightform',
  tagline: 'Independent promoter & event series — Manchester',
  avatar: '/images/showcase/organiser/past-1.png',
  cover: '/images/showcase/organiser/cover.png',
  location: 'Manchester, UK',
  verified: true,
  featured: true,
  chips: ['Club Nights', 'Festivals', 'Live Electronic', 'Warehouse'],
  bio: [
    'Nightform is an independent Manchester promoter behind some of the North West’s most talked-about electronic events — from intimate warehouse sessions to a 4,000-capacity open-air festival.',
    'The team curate line-ups, run production and handle ticketing end-to-end, working closely with venues and artists across the city.',
  ],
  socials: [
    { platform: 'Instagram', url: '#' },
    { platform: 'Resident Advisor', url: '#' },
  ],
  website: '#',
  contactEmail: 'team@nightform.example',
  followers: '24.1k',

  sections: ['about', 'facts', 'featured-event', 'events', 'past-events', 'gallery', 'partners', 'reviews', 'mailing-list', 'related', 'contact'],

  facts: [
    { label: 'Founded', value: '2019' },
    { label: 'Events / year', value: '30+' },
    { label: 'Biggest event', value: '4,000 cap' },
    { label: 'Home city', value: 'Manchester' },
  ],
  featuredEvent: eventBySlug('nightform-winter-lights'),
  events: [eventBySlug('nightform-winter-lights'), eventBySlug('nightform-open-air-2026')],
  pastEvents: [eventBySlug('nightform-nye-ascension'), eventBySlug('nightform-warehouse-013')],
  gallery: [
    { id: 'g1', type: 'image', src: '/images/showcase/organiser/cover.png', alt: 'Nightform festival crowd' },
    { id: 'g2', type: 'image', src: '/images/showcase/organiser/past-1.png', alt: 'Warehouse event lights' },
    { id: 'g3', type: 'image', src: '/images/showcase/event/warehouse.png', alt: 'Warehouse rave' },
  ],
  partners: [
    { name: 'The Lumen Rooms', kind: 'Venue partner' },
    { name: 'Depot Mayfield', kind: 'Venue partner' },
    { name: 'Skiddle', kind: 'Ticketing' },
    { name: 'Red Bull', kind: 'Sponsor' },
  ],
  reviews: {
    average: 4.8,
    count: 64,
    items: [
      { id: 'r1', author: 'Luna Vega', role: 'DJ', rating: 5, date: '2025-11-16', quote: 'The best-run nights in the city. Production, crowd, hospitality — all spot on.' },
      { id: 'r2', author: 'The Lumen Rooms', role: 'Venue', rating: 5, date: '2025-12-01', quote: 'A dream to work with. They sell out and treat the building with respect.' },
    ],
  },
  mailingList: {
    blurb: 'Get on the guest list for presales and secret warehouse locations.',
    perks: ['First access to every presale', 'Secret-location drops', 'Members-only ballots'],
  },
  related: [
    { slug: 'echo-atlas', relationship: 'Headline act' },
    { slug: 'luna-vega', relationship: 'Resident DJ' },
    { slug: 'the-lumen-rooms', relationship: 'Venue partner' },
  ],
}
