import type { ShowcaseProfile } from './types'
import { eventBySlug } from './events'

// TEMPORARY sample venue profile.
export const venueProfile: ShowcaseProfile = {
  id: 'sp_lumen_rooms',
  slug: 'the-lumen-rooms',
  type: 'venue',
  displayName: 'The Lumen Rooms',
  tagline: 'Live-music bar & restaurant — Northern Quarter, Manchester',
  avatar: '/images/showcase/venue/exterior.png',
  cover: '/images/showcase/venue/cover.png',
  location: 'Northern Quarter, Manchester',
  verified: true,
  featured: true,
  chips: ['Live Music', 'Bar', 'Restaurant', 'Private Hire'],
  bio: [
    'The Lumen Rooms is a three-floor live-music bar and restaurant in the heart of Manchester’s Northern Quarter, hosting everything from intimate jazz brunches to sold-out club nights.',
    'With a dedicated stage, in-house PA and a kitchen open until late, it’s built for promoters, artists and private hires alike.',
  ],
  socials: [
    { platform: 'Instagram', url: '#' },
    { platform: 'Facebook', url: '#' },
  ],
  website: '#',
  contactEmail: 'events@thelumenrooms.example',
  followers: '9.2k',
  address: ['48 Tib Street', 'Northern Quarter', 'Manchester', 'M4 1LA'],

  sections: ['about', 'facts', 'events', 'spaces', 'gallery', 'menu', 'technical', 'reviews', 'related', 'contact'],

  facts: [
    { label: 'Capacity', value: '420 standing' },
    { label: 'Floors', value: '3' },
    { label: 'Kitchen', value: 'Open till 11pm' },
    { label: 'Nearest', value: 'Piccadilly Gardens' },
  ],
  events: [eventBySlug('nightform-winter-lights'), eventBySlug('echo-atlas-parallel-lines-manchester'), eventBySlug('lumen-sunday-jazz')],
  spaces: [
    { id: 's1', name: 'The Main Hall', image: '/images/showcase/venue/hall.png', capacity: '420 standing / 180 seated', layouts: ['Standing', 'Cabaret', 'Theatre'], suitableFor: ['Club nights', 'Live gigs', 'Launches'], facilities: ['Full stage & PA', 'Lighting rig', 'Green room', 'Box office'], hirePrice: 'From £900 / night' },
    { id: 's2', name: 'The Mezzanine', image: '/images/showcase/venue/bar.png', capacity: '120 standing', layouts: ['Standing', 'Lounge'], suitableFor: ['Private parties', 'DJ sets', 'Receptions'], facilities: ['Private bar', 'Booth seating', 'DJ setup'], hirePrice: 'From £400 / night' },
    { id: 's3', name: 'The Cellar', image: '/images/showcase/venue/restaurant.png', capacity: '80 standing', layouts: ['Standing', 'Dining'], suitableFor: ['Intimate gigs', 'Supper clubs', 'Listening sessions'], facilities: ['Vintage sound system', 'Candlelit dining', 'Step-free access'], hirePrice: 'From £300 / night' },
  ],
  gallery: [
    { id: 'g1', type: 'image', src: '/images/showcase/venue/cover.png', alt: 'The Lumen Rooms main room' },
    { id: 'g2', type: 'image', src: '/images/showcase/venue/hall.png', alt: 'The main hall with stage' },
    { id: 'g3', type: 'image', src: '/images/showcase/venue/bar.png', alt: 'The cocktail bar' },
    { id: 'g4', type: 'image', src: '/images/showcase/venue/exterior.png', alt: 'Venue exterior at night' },
    { id: 'g5', type: 'image', src: '/images/showcase/venue/restaurant.png', alt: 'The restaurant dining area' },
  ],
  menu: {
    sections: [
      { name: 'Small plates', items: [
        { name: 'Padrón peppers', description: 'Sea salt, lemon', price: '£6.5', veg: true, vegan: true },
        { name: 'Salt & pepper squid', description: 'Sriracha mayo', price: '£8.0' },
        { name: 'Whipped feta & honey', description: 'Warm flatbread', price: '£7.5', veg: true },
      ] },
      { name: 'Mains', items: [
        { name: 'Lumen smash burger', description: 'Double patty, house sauce, fries', price: '£14.0' },
        { name: 'Wild mushroom orzo', description: 'Truffle, parmesan', price: '£13.5', veg: true },
        { name: 'Buttermilk chicken', description: 'Slaw, skin-on fries', price: '£15.0' },
      ] },
    ],
    allergenNote: 'Full allergen information available on request. Please tell staff of any allergies before ordering.',
    downloadUrl: '#',
  },
  technical: {
    items: [
      { label: 'PA', value: 'Funktion-One Resolution 4' },
      { label: 'Mixer', value: 'Allen & Heath dLive' },
      { label: 'DJ', value: '4× CDJ-3000 + DJM-900NXS2' },
      { label: 'Stage', value: '6m × 4m, 400mm riser' },
      { label: 'Access', value: 'Ground-floor load-in, step-free' },
    ],
    formats: ['Live band', 'DJ / electronic', 'Spoken word', 'Corporate AV'],
    riderUrl: '#',
  },
  reviews: {
    average: 4.7,
    count: 128,
    items: [
      { id: 'r1', author: 'Rae Sol', role: 'Echo Atlas', rating: 5, date: '2025-10-04', quote: 'The room sounds incredible and the team run a tight ship. Our favourite Manchester date.' },
      { id: 'r2', author: 'Nightform', role: 'Promoter', rating: 5, date: '2025-11-16', quote: 'Flexible on production, brilliant staff, and the bar keeps the crowd happy all night.' },
      { id: 'r3', author: 'Priya M.', role: 'Private hire', rating: 4, date: '2025-08-22', quote: 'Hired the Mezzanine for a launch — smooth from enquiry to close.' },
    ],
  },
  related: [
    { slug: 'nightform', relationship: 'Resident promoter' },
    { slug: 'echo-atlas', relationship: 'Regular performers' },
    { slug: 'luna-vega', relationship: 'Resident DJ' },
  ],
}
