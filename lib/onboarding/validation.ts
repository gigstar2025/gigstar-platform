// Pure, dependency-free onboarding validation. Imported by BOTH the client
// step components (for instant feedback) and the server actions (as the
// authoritative gate). The database RPCs remain the ultimate guard — these
// checks only produce friendly errors before a round-trip.

import type { ProfileType } from "@/lib/db/types"
import { PROFILE_TYPE_OPTIONS } from "./constants"

export const DISPLAY_NAME_MIN = 2
export const DISPLAY_NAME_MAX = 80
export const TAGLINE_MAX = 120
export const SLUG_MIN = 3
export const SLUG_MAX = 40

// Matches the DB slug shape in migration 0011: lowercase alphanumeric groups
// separated by single hyphens, no leading/trailing/double hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Strip ASCII/Unicode control characters that should never appear in a name.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g

export function isProfileType(value: unknown): value is ProfileType {
  return (
    typeof value === "string" &&
    PROFILE_TYPE_OPTIONS.some((option) => option.value === value)
  )
}

export function normalizeDisplayName(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim()
}

export function validateDisplayName(raw: string): string | null {
  const value = normalizeDisplayName(raw)
  if (value.length < DISPLAY_NAME_MIN) return "Enter a name of at least 2 characters."
  if (value.length > DISPLAY_NAME_MAX) return `Keep the name to ${DISPLAY_NAME_MAX} characters or fewer.`
  return null
}

export function normalizeTagline(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim()
}

export function validateTagline(raw: string): string | null {
  const value = normalizeTagline(raw)
  if (value.length > TAGLINE_MAX) return `Keep the tagline to ${TAGLINE_MAX} characters or fewer.`
  return null
}

// Derive a slug suggestion from arbitrary text (e.g. a display name).
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop diacritics
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics become hyphens
    .replace(/^-+|-+$/g, "") // trim hyphens
    .replace(/-{2,}/g, "-") // collapse runs
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "") // re-trim after slicing
}

// Local slug-shape check (format + length only). Reserved words, live-slug and
// slug-history collisions are checked server-side by slug_available().
export function validateSlugShape(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  if (value.length < SLUG_MIN) return "Handles need at least 3 characters."
  if (value.length > SLUG_MAX) return `Handles can be at most ${SLUG_MAX} characters.`
  if (!SLUG_PATTERN.test(value)) {
    return "Use lowercase letters, numbers and single hyphens only."
  }
  return null
}
