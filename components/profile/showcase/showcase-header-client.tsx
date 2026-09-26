import type { ShowcaseProfile } from '@/lib/profiles/showcase/types'
import { ShowcaseHeader } from './showcase-header'

/**
 * Public showcase header.
 *
 * These `/p/<demo-slug>` pages are static marketing examples. Real, editable
 * profiles now have server-backed images (see the avatar uploader in the
 * DB-backed profile editor and `public_profiles.avatar_url`), which replaced
 * the earlier browser-local demo overlay that rendered images saved only in
 * one device's localStorage. This component now simply renders the static
 * example header.
 */
export function ShowcaseHeaderClient({ profile }: { profile: ShowcaseProfile }) {
  return <ShowcaseHeader profile={profile} />
}
