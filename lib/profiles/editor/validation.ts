// ---------------------------------------------------------------------------
// Frontend validation utilities for the profile editor prototype. Pure
// functions returning field-keyed error maps so panels can show inline errors
// and an error summary.
// ---------------------------------------------------------------------------

import type { ProfileDraft } from './types'

export type Errors = Record<string, string>

export function isValidUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return true // empty handled separately by "required" checks
  if (v === '#') return true // placeholder links used by demo data
  try {
    const url = new URL(v.startsWith('http') ? v : `https://${v}`)
    return Boolean(url.hostname) && url.hostname.includes('.')
  } catch {
    return false
  }
}

export function isValidEmail(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/** Validate the identity + contact fields. Keys map to editor field ids. */
export function validateIdentity(draft: ProfileDraft): Errors {
  const e: Errors = {}
  const { base } = draft

  if (!base.displayName.trim()) e.displayName = 'Display name is required.'
  if (!base.location.trim()) e.location = 'Public location is required.'
  if (!base.tagline.trim()) e.tagline = 'A short tagline helps people place you.'

  if (base.website && !isValidUrl(base.website)) {
    e.website = 'Enter a valid website URL (e.g. https://example.com).'
  }
  if (!isValidEmail(base.contactEmail)) {
    e.contactEmail = 'Enter a valid contact email address.'
  }
  if (!base.contactEmail.trim()) {
    e.contactEmail = 'A contact email is required so people can reach you.'
  }

  base.socials.forEach((s, i) => {
    if (s.url && !isValidUrl(s.url)) {
      e[`social-${i}`] = `Enter a valid URL for ${s.platform || 'this link'}.`
    }
  })

  return e
}

/** True when a module currently has meaningful content. */
export function moduleHasContent(draft: ProfileDraft, dataField: keyof ProfileDraft['base']): boolean {
  const value = draft.base[dataField]
  if (value == null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object') {
    // menu / technical / mailingList
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.sections)) return (obj.sections as unknown[]).length > 0
    if (Array.isArray(obj.items)) return (obj.items as unknown[]).length > 0
    if (typeof obj.blurb === 'string') return (obj.blurb as string).trim().length > 0
    return Object.keys(obj).length > 0
  }
  return true
}

export function hasErrors(errors: Errors): boolean {
  return Object.keys(errors).length > 0
}
