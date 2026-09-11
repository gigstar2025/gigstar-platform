import type { Profile } from './types'

// ---------------------------------------------------------------------------
// TEMPORARY sample data for the profile milestone.
// This is local, in-memory placeholder content only. It will be replaced by a
// PostgreSQL-backed store once authentication and the database are connected.
// ---------------------------------------------------------------------------

export const SAMPLE_PROFILES: Profile[] = [
  {
    id: 'p_luna',
    slug: 'luna-vega',
    displayName: 'Luna Vega',
    avatar: '/images/profile/avatar.png',
    cover: '/images/profile/cover.png',
    bio: 'Manchester-based DJ, producer and radio presenter weaving deep house, melodic techno and late-night grooves. Resident at Warehouse Project and host of Afterglow Radio.',
    location: 'Manchester',
    genres: ['Deep House', 'Melodic Techno', 'Disco'],
    roles: ['dj', 'solo-artist', 'radio-presenter'],
    socials: [
      { platform: 'Instagram', url: 'https://instagram.com/lunavega' },
      { platform: 'SoundCloud', url: 'https://soundcloud.com/lunavega' },
      { platform: 'Bluesky', url: 'https://bsky.app/profile/lunavega' },
    ],
    website: 'https://lunavega.example',
    contact: 'bookings@lunavega.example',
    modules: [
      {
        id: 'm_radio',
        type: 'radio',
        title: 'Afterglow Radio',
        hidden: false,
        radio: {
          onAir: true,
          showTitle: 'Afterglow — Sunset Session',
          stationName: 'Reform Radio',
          streamUrl: 'https://reformradio.example/live',
          schedule: 'Every Friday, 18:00–20:00 GMT',
        },
      },
      {
        id: 'm_mixes',
        type: 'mixes',
        title: 'Mixes',
        hidden: false,
        items: [
          {
            id: 'mix_1',
            title: 'Warehouse Project — Closing Set',
            description: 'Two hours of hypnotic melodic techno recorded live in Manchester.',
            artwork: '/images/profile/mix-1.png',
            embedUrl: 'https://soundcloud.com/lunavega/warehouse-closing',
            provider: 'soundcloud',
          },
          {
            id: 'mix_2',
            title: 'Afterglow 042 — Late Night Grooves',
            description: 'A deep, dubby journey for the small hours.',
            artwork: '/images/profile/mix-2.png',
            embedUrl: 'https://www.mixcloud.com/lunavega/afterglow-042/',
            provider: 'mixcloud',
          },
        ],
      },
      {
        id: 'm_videos',
        type: 'videos',
        title: 'Videos',
        hidden: false,
        items: [
          {
            id: 'vid_1',
            title: 'Live at Parklife Festival',
            description: 'Main stage sunset set, summer 2025.',
            thumbnail: '/images/profile/video-1.png',
            embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            provider: 'youtube',
          },
        ],
      },
      {
        id: 'm_gigs',
        type: 'gigs',
        title: 'Gig Dates',
        hidden: false,
        gigs: [
          {
            id: 'gig_1',
            date: '2026-02-14',
            time: '22:00',
            title: 'Afterglow Valentine Special',
            venue: 'Hidden Basement',
            town: 'Manchester',
            ticketUrl: 'https://tickets.example/afterglow-valentine',
            status: 'on-sale',
          },
          {
            id: 'gig_2',
            date: '2026-03-07',
            time: '21:00',
            title: 'Melodic Nights',
            venue: 'Corsica Studios',
            town: 'London',
            ticketUrl: 'https://tickets.example/melodic-nights',
            status: 'sold-out',
          },
          {
            id: 'gig_3',
            date: '2026-03-21',
            time: '20:00',
            title: 'Spring Warm-Up (Postponed)',
            venue: 'The Sugarmill',
            town: 'Stoke-on-Trent',
            status: 'cancelled',
          },
        ],
      },
      {
        id: 'm_gallery',
        type: 'gallery',
        title: 'Photo Gallery',
        hidden: false,
        photos: [
          {
            id: 'ph_1',
            src: '/images/profile/gallery-1.png',
            caption: 'Parklife Festival main stage, 2025',
            alt: 'Festival crowd with hands raised at golden hour in front of a stage',
          },
          {
            id: 'ph_2',
            src: '/images/profile/gallery-2.png',
            caption: 'Mixing at Hidden Basement',
            alt: 'Close-up of hands adjusting a DJ mixer under warm club lighting',
          },
          {
            id: 'ph_3',
            src: '/images/profile/gallery-3.png',
            caption: 'Soundcheck before doors',
            alt: 'Empty intimate live music venue with a lit stage and a microphone',
          },
        ],
      },
    ],
  },
]

export function getProfileBySlug(slug: string): Profile | undefined {
  return SAMPLE_PROFILES.find((p) => p.slug === slug)
}

export const DEMO_PROFILE_SLUG = 'luna-vega'
