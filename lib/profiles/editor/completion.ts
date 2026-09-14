// ---------------------------------------------------------------------------
// Profile completion is computed from required + recommended content, never a
// hard-coded number. Each check links back to the editor section that resolves
// it so the overview can deep-link users to what is missing.
// ---------------------------------------------------------------------------

import type { EditorSectionId, ProfileDraft } from './types'
import { MODULE_REGISTRY, isAllowed, moduleLabel } from './module-registry'
import { moduleHasContent } from './validation'

export interface CompletionCheck {
  id: string
  label: string
  done: boolean
  section: EditorSectionId
  optional: boolean
}

export interface CompletionResult {
  percent: number
  checks: CompletionCheck[]
  incomplete: CompletionCheck[]
}

export function computeCompletion(draft: ProfileDraft): CompletionResult {
  const { base } = draft
  const checks: CompletionCheck[] = []

  // Identity essentials.
  checks.push({ id: 'name', label: 'Display name', done: base.displayName.trim().length > 0, section: 'identity', optional: false })
  checks.push({ id: 'tagline', label: 'Tagline', done: base.tagline.trim().length > 0, section: 'identity', optional: false })
  checks.push({ id: 'location', label: 'Public location', done: base.location.trim().length > 0, section: 'identity', optional: false })
  checks.push({ id: 'avatar', label: 'Profile image', done: Boolean(base.avatar), section: 'identity', optional: false })
  checks.push({ id: 'cover', label: 'Cover image', done: Boolean(base.cover), section: 'identity', optional: true })
  checks.push({ id: 'bio', label: 'About text', done: base.bio.some((p) => p.trim().length > 0), section: 'content', optional: false })
  checks.push({ id: 'contact', label: 'Contact email', done: base.contactEmail.trim().length > 0, section: 'contact', optional: false })
  checks.push({ id: 'chips', label: 'Genres or categories', done: base.chips.length > 0, section: 'identity', optional: true })

  // Recommended modules for this profile type that are enabled + have content.
  const enabled = new Set(draft.modules.filter((m) => m.enabled).map((m) => m.key))
  for (const def of Object.values(MODULE_REGISTRY)) {
    if (def.required) continue
    if (!isAllowed(def.key, draft.type)) continue
    if (!def.recommendedFor.includes(draft.type)) continue
    const done = enabled.has(def.key) && moduleHasContent(draft, def.dataField)
    checks.push({
      id: `mod-${def.key}`,
      label: `${moduleLabel(def.key, draft.type)} module`,
      done,
      section: 'modules',
      optional: true,
    })
  }

  const done = checks.filter((c) => c.done).length
  const percent = Math.round((done / checks.length) * 100)
  return {
    percent,
    checks,
    incomplete: checks.filter((c) => !c.done),
  }
}
