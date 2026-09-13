import type { ShowcaseProfile } from './types'
import { eventBySlug } from './events'

// TEMPORARY sample artist / band profile.
export const artistProfile: ShowcaseProfile = {
  id: 'sp_echo_atlas',
  slug: 'echo-atlas',
  type: 'artist',
  displayName: 'Echo Atlas',
  tagline: 'Alternative electronic four-piece — Manchester',
  avatar: '/images/showcase/artist/band.png',
  cover: '/images/showcase/artist/cover.png',
  location: 'Manchester, UK',
  verified: true,
  featured: true,
  chips: ['Alt-Electronic', 'Post-Rock', 'Live Band', 'Synth-driven'],
  bio: [
    'Echo Atlas are a four-piece from Manchester building widescreen, synth-driven songs that sit between alternative rock and electronic music.',
    'Since forming in 2021 they have released two EPs and their debut album Parallel Lines, earning airplay on BBC 6 Music and a growing reputation for immersive live shows.',
  ],
  members: ['Rae Sol — vocals, synths', 'Marlow Finch — guitar', 'Dev Aziz — bass', 'Cass Turner — drums, production'],
  label: 'Halflight Records',
  socials: [
    { platform: 'Instagram', url: '#' },
    { platform: 'Spotify', url: '#' },
    { platform: 'Bandcamp', url: '#' },
    { platform: 'YouTube', url: '#' },
  ],
  website: '#',
  contactEmail: 'hello@echoatlas.example',
  bookingPrice: 'From £1,200 / show',
  availability: 'Touring Parallel Lines — Spring 2026',
  performanceFormats: ['Full live band (60–90 min)', 'Stripped-back trio', 'DJ / hybrid set'],

  sections: ['about', 'facts', 'featured-event', 'releases', 'videos', 'events', 'gallery', 'partners', 'mailing-list', 'related', 'contact'],

  facts: [
    { label: 'Formed', value: '2021' },
    { label: 'Members', value: '4' },
    { label: 'Label', value: 'Halflight Records' },
    { label: 'For fans of', value: 'Jungle, LCD, Bonobo' },
  ],
  featuredEvent: eventBySlug('echo-atlas-parallel-lines-manchester'),
  releases: [
    { id: 'rel1', title: 'Parallel Lines', type: 'Album', releaseDate: '2025-10-03', artwork: '/images/showcase/artist/release-1.png', trackCount: 11, featuredTrack: 'Northern Lights', listenUrl: '#', services: [{ name: 'Spotify', url: '#' }, { name: 'Apple Music', url: '#' }, { name: 'Bandcamp', url: '#' }] },
    { id: 'rel2', title: 'Undertow', type: 'EP', releaseDate: '2024-05-17', artwork: '/images/showcase/artist/release-2.png', trackCount: 4, featuredTrack: 'Undertow', listenUrl: '#', services: [{ name: 'Spotify', url: '#' }, { name: 'Bandcamp', url: '#' }] },
  ],
  videos: [
    { id: 'v1', title: 'Northern Lights (Official Video)', thumbnail: '/images/showcase/artist/gallery-1.png', url: '#', provider: 'YouTube', duration: '4:12' },
    { id: 'v2', title: 'Live at YES, Manchester', thumbnail: '/images/showcase/artist/gallery-2.png', url: '#', provider: 'YouTube', duration: '6:48' },
  ],
  events: [eventBySlug('echo-atlas-parallel-lines-manchester'), eventBySlug('echo-atlas-parallel-lines-london'), eventBySlug('nightform-winter-lights')],
  gallery: [
    { id: 'g1', type: 'image', src: '/images/showcase/artist/gallery-1.png', alt: 'Echo Atlas performing live' },
    { id: 'g2', type: 'image', src: '/images/showcase/artist/gallery-2.png', alt: 'Echo Atlas in the studio' },
    { id: 'g3', type: 'image', src: '/images/showcase/artist/cover.png', alt: 'Echo Atlas press photo' },
  ],
  partners: [
    { name: 'Halflight Records', kind: 'Label' },
    { name: 'Fender', kind: 'Instrument partner' },
    { name: 'Nightform', kind: 'Promoter' },
  ],
  mailingList: {
    blurb: 'Join the list for presale codes, new music and tour dates before anyone else.',
    perks: ['48h ticket presale access', 'Unreleased demos', 'Members-only livestreams'],
  },
  related: [
    { slug: 'nightform', relationship: 'Books our shows' },
    { slug: 'the-lumen-rooms', relationship: 'Home venue' },
    { slug: 'luna-vega', relationship: 'Shared bills' },
  ],
}
