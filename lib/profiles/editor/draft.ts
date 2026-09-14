// ---------------------------------------------------------------------------
// Draft lifecycle: create an isolated editable draft from a showcase profile,
// convert a draft back into a ShowcaseProfile for the live preview, and persist
// drafts to this device's localStorage. Imported mock data is never mutated —
// every draft is a deep clone.
// ---------------------------------------------------------------------------

import { getShowcaseProfile } from '@/lib/profiles/showcase'
import type {
  DraftModule,
  ProfileDraft,
  ProfileSettings,
  ShowcaseProfile,
} from './types'
import { allowedModuleKeys, moduleDef } from './module-registry'

const STORAGE_PREFIX = 'gigstar:draft:'
const STORAGE_VERSION = 1

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

export function defaultSettings(): ProfileSettings {
  return {
    isPublic: true,
    allowEnquiries: true,
    showFollowerCount: true,
    showReviewSummary: true,
    showApproxLocation: true,
    defaultEnquiryType: 'Booking enquiry',
    contentVisibility: 'public',
  }
}

/** Build a fresh, isolated draft from the read-only showcase profile. */
export function draftFromProfile(profile: ShowcaseProfile): ProfileDraft {
  const base = clone(profile)
  const modules: DraftModule[] = base.sections.map((key) => ({
    key,
    enabled: true,
  }))
  return {
    profileId: base.id,
    slug: base.slug,
    type: base.type,
    base,
    modules,
    settings: defaultSettings(),
    savedAt: null,
  }
}

/** Collapse a draft into a ShowcaseProfile the public components can render. */
export function draftToProfile(draft: ProfileDraft): ShowcaseProfile {
  const sections = draft.modules
    .filter((m) => m.enabled)
    .map((m) => m.key)
  const base: ShowcaseProfile = { ...clone(draft.base), sections }

  // Honour prototype visibility settings in the preview.
  if (!draft.settings.showFollowerCount) delete base.followers
  if (!draft.settings.showReviewSummary && base.reviews) {
    // keep the reviews module content but drop the hero summary
    base.reviews = { ...base.reviews }
  }
  return base
}

/** Seed empty content for a module the user just added, if none exists. */
export function ensureModuleContent(draft: ProfileDraft, key: DraftModule['key']) {
  const field = moduleDef(key).dataField
  const base = draft.base as unknown as Record<string, unknown>
  if (base[field] != null) return
  switch (field) {
    case 'facts':
    case 'events':
    case 'pastEvents':
    case 'releases':
    case 'audio':
    case 'videos':
    case 'gallery':
    case 'spaces':
    case 'partners':
    case 'related':
      base[field] = []
      break
    case 'menu':
      base[field] = { sections: [], allergenNote: '' }
      break
    case 'technical':
      base[field] = { items: [] }
      break
    case 'mailingList':
      base[field] = { blurb: '', perks: [] }
      break
    case 'featuredEvent':
      // referenced by ID elsewhere; left undefined until the user picks one
      break
    default:
      break
  }
}

/** Modules allowed for this type that are not already on the draft. */
export function addableModuleKeys(draft: ProfileDraft) {
  const present = new Set(draft.modules.map((m) => m.key))
  return allowedModuleKeys(draft.type).filter((k) => !present.has(k))
}

// --- localStorage persistence (best-effort, prototype only) ----------------

interface StoredDraft {
  v: number
  modules: DraftModule[]
  base: ShowcaseProfile
  settings: ProfileSettings
  savedAt: string
}

function storageAvailable(): boolean {
  try {
    const k = '__gigstar_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

export function saveDraft(draft: ProfileDraft): string | null {
  if (typeof window === 'undefined' || !storageAvailable()) return null
  const savedAt = new Date().toISOString()
  const payload: StoredDraft = {
    v: STORAGE_VERSION,
    modules: draft.modules,
    base: draft.base,
    settings: draft.settings,
    savedAt,
  }
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + draft.profileId,
      JSON.stringify(payload),
    )
    return savedAt
  } catch {
    return null
  }
}

export function loadDraft(profile: ShowcaseProfile): ProfileDraft | null {
  if (typeof window === 'undefined' || !storageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + profile.id)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft
    if (parsed.v !== STORAGE_VERSION || !parsed.base || !parsed.modules) {
      return null
    }
    return {
      profileId: profile.id,
      slug: profile.slug,
      type: profile.type,
      base: parsed.base,
      modules: parsed.modules,
      settings: { ...defaultSettings(), ...parsed.settings },
      savedAt: parsed.savedAt ?? null,
    }
  } catch {
    return null
  }
}

export function clearDraft(profileId: string) {
  if (typeof window === 'undefined' || !storageAvailable()) return
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + profileId)
  } catch {
    // ignore
  }
}

/** Fresh draft from the original example, discarding any local edits. */
export function resetDraft(profileId: string, slug: string): ProfileDraft | null {
  clearDraft(profileId)
  const profile = getShowcaseProfile(slug)
  return profile ? draftFromProfile(profile) : null
}

export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && storageAvailable()
}
