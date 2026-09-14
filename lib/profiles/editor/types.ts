// ---------------------------------------------------------------------------
// Phase Three — frontend-only profile editor prototype.
//
// The editor drives the SAME rich `ShowcaseProfile` model that powers the four
// public example profiles. Each public "section" (SectionKey) is treated as an
// editable module. A ProfileDraft is an isolated, editable clone of a showcase
// profile plus module order/visibility and prototype settings. Nothing here
// touches the imported mock data — drafts live only in local component state
// and (optionally) this device's localStorage.
// ---------------------------------------------------------------------------

import type {
  SectionKey,
  ShowcaseProfile,
  ShowcaseType,
} from '@/lib/profiles/showcase/types'

/** Future account roles. This phase always renders the demo user as Owner. */
export type ProfileRole =
  | 'Owner'
  | 'Administrator'
  | 'Editor'
  | 'Event Manager'
  | 'Content Contributor'
  | 'View-only Analyst'

/** Prototype, profile-scoped settings (no billing/security here). */
export interface ProfileSettings {
  isPublic: boolean
  allowEnquiries: boolean
  showFollowerCount: boolean
  showReviewSummary: boolean
  showApproxLocation: boolean
  defaultEnquiryType: string
  contentVisibility: 'public' | 'followers'
}

/** Order + visibility for a single module. Superset of `base.sections`: it
 *  also retains hidden modules so their content is preserved for restore. */
export interface DraftModule {
  key: SectionKey
  enabled: boolean
}

export interface ProfileDraft {
  profileId: string
  slug: string
  type: ShowcaseType
  /** Editable clone of the showcase profile; all module content lives here. */
  base: ShowcaseProfile
  /** Ordered module list (enabled = shown on public profile). */
  modules: DraftModule[]
  settings: ProfileSettings
  /** ISO timestamp of the last local save, or null if never saved. */
  savedAt: string | null
}

/** Lightweight descriptor for the managed-profile selector. */
export interface ManagedProfile {
  id: string
  slug: string
  type: ShowcaseType
  displayName: string
  avatar: string
  role: ProfileRole
}

export type EditorSectionId =
  | 'overview'
  | 'identity'
  | 'modules'
  | 'content'
  | 'contact'
  | 'social'
  | 'preview'
  | 'settings'

export type { SectionKey, ShowcaseProfile, ShowcaseType }
