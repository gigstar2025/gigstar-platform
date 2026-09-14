// ---------------------------------------------------------------------------
// A single, clearly-fictional demo account that "manages" all four example
// profiles as Owner. This stands in for the future account → membership model
// without building any real authentication.
// ---------------------------------------------------------------------------

import { SHOWCASE_PROFILES } from '@/lib/profiles/showcase'
import type { ManagedProfile } from './types'

export const DEMO_ACCOUNT = {
  name: 'Demo Manager',
  email: 'demo@gigstar.example',
  note: 'Demonstration account — no login required. All four profiles are shown with the Owner role.',
}

export const MANAGED_PROFILES: ManagedProfile[] = SHOWCASE_PROFILES.map((p) => ({
  id: p.id,
  slug: p.slug,
  type: p.type,
  displayName: p.displayName,
  avatar: p.avatar,
  role: 'Owner',
}))

/** Curated in-repo images offered by the prototype media library, by shape. */
export interface MediaAsset {
  src: string
  label: string
  shape: 'square' | 'wide' | 'portrait'
}

export const MEDIA_LIBRARY: MediaAsset[] = [
  { src: '/images/profile/avatar.png', label: 'Portrait avatar', shape: 'square' },
  { src: '/images/profile/cover.png', label: 'Stage cover', shape: 'wide' },
  { src: '/images/profile/mix-1.png', label: 'Mix artwork 1', shape: 'square' },
  { src: '/images/profile/mix-2.png', label: 'Mix artwork 2', shape: 'square' },
  { src: '/images/profile/gallery-1.png', label: 'Gallery — performance', shape: 'wide' },
  { src: '/images/profile/gallery-2.png', label: 'Gallery — crowd', shape: 'wide' },
  { src: '/images/profile/gallery-3.png', label: 'Gallery — booth', shape: 'wide' },
  { src: '/images/profile/video-1.png', label: 'Video thumbnail', shape: 'wide' },
]
