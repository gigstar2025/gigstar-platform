import type { ShowcaseProfile } from './types'
import { eventBySlug } from './events'

// TEMPORARY sample DJ profile.
export const djProfile: ShowcaseProfile = {
  id: 'sp_luna_vega',
  slug: 'luna-vega',
  type: 'dj',
  displayName: 'Luna Vega',
  tagline: 'Melodic house & progressive selector — Manchester',
  avatar: '/images/profile/avatar.png',
  cover: '/images/profile/cover.png',
  location: 'Manchester, UK',
  verified: true,
  featured: true,
  chips: ['Melodic House', 'Progressive', 'Afterhours', 'Vinyl & digital'],
  bio: [
    'Luna Vega is a Manchester-based DJ and radio presenter known for hypnotic, emotionally-driven sets that move between melodic house and deeper progressive territory.',
    'A decade of residencies and festival slots has made her a trusted closer — the name promoters call when a room needs to be taken somewhere.',
  ],
  socials: [
    { platform: 'Instagram', url: '#' },
    { platform: 'SoundCloud', url: '#' },
    { platform: 'Mixcloud', url: '#' },
  ],
  website: '#',
  contactEmail: 'bookings@lunavega.example',
  bookingPrice: 'From £450 / set',
  availability: 'Booking Fri & Sat nights — Spring 2026',
  equipment: ['4× Pioneer CDJ-3000', 'DJM-900NXS2', 'Own needles for vinyl'],
  performanceFormats: ['Club set (2–4h)', 'Extended / all-night-long', 'Festival', 'Radio guest mix'],

  sections: ['about', 'facts', 'featured-event', 'audio', 'videos', 'events', 'gallery', 'reviews', 'related', 'contact'],

  facts: [
    { label: 'Based in', value: 'Manchester' },
    { label: 'Experience', value: '10+ years' },
    { label: 'Typical set', value: '2–4 hours' },
    { label: 'Travels', value: 'UK & Europe' },
  ],
  featuredEvent: eventBySlug('nightform-winter-lights'),
  audio: [
    { id: 'a1', title: 'Afterglow Radio 042 — Winter Special', artwork: '/images/profile/mix-1.png', duration: '1:58:20', platform: 'Mixcloud', url: '#' },
    { id: 'a2', title: 'Sunset Set — Meadows Festival 2025', artwork: '/images/profile/mix-2.png', duration: '1:12:04', platform: 'SoundCloud', url: '#' },
  ],
  videos: [
    { id: 'v1', title: 'Boiler-room style warehouse set', thumbnail: '/images/profile/video-1.png', url: '#', provider: 'YouTube', duration: '58:12' },
  ],
  events: [eventBySlug('nightform-winter-lights'), eventBySlug('nightform-open-air-2026')],
  gallery: [
    { id: 'g1', type: 'image', src: '/images/profile/gallery-1.png', alt: 'Luna Vega performing under blue light' },
    { id: 'g2', type: 'image', src: '/images/profile/gallery-2.png', alt: 'Crowd at a Luna Vega night' },
    { id: 'g3', type: 'image', src: '/images/profile/gallery-3.png', alt: 'Close-up of the DJ booth' },
  ],
  reviews: {
    average: 4.9,
    count: 37,
    items: [
      { id: 'r1', author: 'Nightform', role: 'Promoter', rating: 5, date: '2025-11-16', quote: 'Luna closed Warehouse 013 and completely understood the room. Instant rebook.' },
      { id: 'r2', author: 'The Lumen Rooms', role: 'Venue', rating: 5, date: '2025-09-02', quote: 'Professional, punctual, and the dancefloor was full to the last record.' },
    ],
  },
  related: [
    { slug: 'nightform', relationship: 'Regular promoter' },
    { slug: 'the-lumen-rooms', relationship: 'Resident venue' },
    { slug: 'echo-atlas', relationship: 'Shared bills' },
  ],
}
