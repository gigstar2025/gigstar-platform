'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ProfileDraft, ShowcaseProfile } from '@/lib/profiles/editor/types'
import {
  draftFromProfile,
  loadDraft,
  resetDraft,
  saveDraft,
} from '@/lib/profiles/editor/draft'

function serialize(draft: ProfileDraft): string {
  return JSON.stringify({
    modules: draft.modules,
    base: draft.base,
    settings: draft.settings,
  })
}

export interface DraftController {
  draft: ProfileDraft
  dirty: boolean
  savedAt: string | null
  /** Apply an immutable update to the draft. */
  update: (recipe: (draft: ProfileDraft) => ProfileDraft) => void
  /** Persist to this device's localStorage. Returns true on success. */
  save: () => boolean
  /** Revert to the last saved/loaded clean state. */
  discard: () => void
  /** Discard local edits and rebuild from the original example data. */
  resetToExample: () => void
}

/**
 * Owns the editable draft for a single profile. A draft is loaded from this
 * device's localStorage if present, otherwise created fresh from the read-only
 * example. "Dirty" means the draft differs from the last saved/loaded state.
 */
export function useProfileDraft(profile: ShowcaseProfile): DraftController {
  const [draft, setDraft] = useState<ProfileDraft>(
    () => loadDraft(profile) ?? draftFromProfile(profile),
  )
  // Clean baseline used for dirty detection; updated on save/discard/reset.
  const baselineRef = useRef<string>(serialize(draft))
  const [savedAt, setSavedAt] = useState<string | null>(draft.savedAt)
  const [tick, setTick] = useState(0)

  const dirty = useMemo(
    () => serialize(draft) !== baselineRef.current,
    // tick forces recompute when baselineRef changes without a draft change
    [draft, tick],
  )

  const update = useCallback((recipe: (d: ProfileDraft) => ProfileDraft) => {
    setDraft((prev) => recipe(prev))
  }, [])

  const save = useCallback(() => {
    const stamp = saveDraft(draft)
    if (stamp) {
      baselineRef.current = serialize(draft)
      setSavedAt(stamp)
      setTick((t) => t + 1)
      return true
    }
    return false
  }, [draft])

  const discard = useCallback(() => {
    const clean = loadDraft(profile) ?? draftFromProfile(profile)
    setDraft(clean)
    baselineRef.current = serialize(clean)
    setSavedAt(clean.savedAt)
    setTick((t) => t + 1)
  }, [profile])

  const resetToExample = useCallback(() => {
    const fresh = resetDraft(profile.id, profile.slug) ?? draftFromProfile(profile)
    setDraft(fresh)
    baselineRef.current = serialize(fresh)
    setSavedAt(null)
    setTick((t) => t + 1)
  }, [profile])

  return { draft, dirty, savedAt, update, save, discard, resetToExample }
}
