// ---------------------------------------------------------------------------
// Typed content shapes + validators for the five modular profile modules.
//
// These mirror the JSON Schemas stored in profile_module_definitions.content_schema
// by migration 0014. The database keeps the schema for future enforcement; this
// module is the runtime validator the app uses BEFORE persisting draft content,
// so invalid content never reaches the save RPC. Keeping this pure (no
// server-only or Supabase imports) makes it unit-testable in isolation.
// ---------------------------------------------------------------------------

import type { ModuleKey } from "./registry"

export interface ValidationError {
  path: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] }

// --- Content shapes (canonical) -------------------------------------------

export type MixProvider = "soundcloud" | "mixcloud" | "other"
export interface AudioMix {
  id: string
  title: string
  embedUrl: string
  description?: string
  artwork?: string
  provider?: MixProvider
}
export interface AudioContent {
  items: AudioMix[]
}

export type VideoProvider = "youtube" | "vimeo" | "other"
export interface VideoClip {
  id: string
  title: string
  embedUrl: string
  thumbnail?: string
  provider?: VideoProvider
}
export interface VideosContent {
  items: VideoClip[]
}

export interface RadioContent {
  radio: {
    stationName: string
    streamUrl: string
    showTitle?: string
    schedule?: string
    onAir?: boolean
  }
}

export interface GalleryPhoto {
  id: string
  alt: string
  src?: string
  caption?: string
}
export interface GalleryContent {
  photos: GalleryPhoto[]
}

export type GigStatus =
  | "on-sale"
  | "free"
  | "selling-fast"
  | "last-tickets"
  | "sold-out"
  | "coming-soon"
export interface GigDate {
  id: string
  title: string
  date: string
  venueName: string
  town: string
  status: GigStatus
  ticketUrl?: string
}
export interface GigsContent {
  gigs: GigDate[]
}

export type ModuleContentByKey = {
  audio: AudioContent
  videos: VideosContent
  radio: RadioContent
  gallery: GalleryContent
  gigs: GigsContent
}

// --- Small, dependency-free validation helpers ----------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isHttpUrl(v: unknown): boolean {
  if (typeof v !== "string") return false
  try {
    const u = new URL(v)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function reqString(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
  max: number,
): string {
  const raw = obj[key]
  if (typeof raw !== "string" || raw.trim().length === 0) {
    errors.push({ path: `${path}.${key}`, message: "required non-empty string" })
    return ""
  }
  if (raw.length > max) {
    errors.push({ path: `${path}.${key}`, message: `must be <= ${max} chars` })
  }
  return raw
}

function optString(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
  max: number,
): string | undefined {
  const raw = obj[key]
  if (raw === undefined) return undefined
  if (typeof raw !== "string") {
    errors.push({ path: `${path}.${key}`, message: "must be a string" })
    return undefined
  }
  if (raw.length > max) {
    errors.push({ path: `${path}.${key}`, message: `must be <= ${max} chars` })
  }
  return raw
}

function reqUrl(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const raw = obj[key]
  if (!isHttpUrl(raw)) {
    errors.push({ path: `${path}.${key}`, message: "required http(s) URL" })
    return ""
  }
  return raw as string
}

function optUrl(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  const raw = obj[key]
  if (raw === undefined) return undefined
  if (!isHttpUrl(raw)) {
    errors.push({ path: `${path}.${key}`, message: "must be an http(s) URL" })
    return undefined
  }
  return raw as string
}

function optEnum<T extends string>(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
  allowed: readonly T[],
): T | undefined {
  const raw = obj[key]
  if (raw === undefined) return undefined
  if (typeof raw !== "string" || !(allowed as readonly string[]).includes(raw)) {
    errors.push({ path: `${path}.${key}`, message: `must be one of ${allowed.join(", ")}` })
    return undefined
  }
  return raw as T
}

function reqEnum<T extends string>(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
  allowed: readonly T[],
): T {
  const raw = obj[key]
  if (typeof raw !== "string" || !(allowed as readonly string[]).includes(raw)) {
    errors.push({ path: `${path}.${key}`, message: `must be one of ${allowed.join(", ")}` })
    return allowed[0]
  }
  return raw as T
}

function reqArray(
  errors: ValidationError[],
  obj: Record<string, unknown>,
  key: string,
  path: string,
  maxItems: number,
): unknown[] {
  const raw = obj[key]
  if (!Array.isArray(raw)) {
    errors.push({ path: `${path}.${key}`, message: "required array" })
    return []
  }
  if (raw.length > maxItems) {
    errors.push({ path: `${path}.${key}`, message: `must have <= ${maxItems} items` })
  }
  return raw
}

// --- Per-module validators -------------------------------------------------

function validateAudio(input: unknown): ValidationResult<AudioContent> {
  const errors: ValidationError[] = []
  if (!isObject(input)) return fail("content", "must be an object")
  const items = reqArray(errors, input, "items", "content", 50)
  const out: AudioMix[] = items.map((raw, i) => {
    const p = `content.items[${i}]`
    if (!isObject(raw)) {
      errors.push({ path: p, message: "must be an object" })
      return { id: "", title: "", embedUrl: "" }
    }
    return {
      id: reqString(errors, raw, "id", p, 64),
      title: reqString(errors, raw, "title", p, 160),
      embedUrl: reqUrl(errors, raw, "embedUrl", p),
      description: optString(errors, raw, "description", p, 600),
      artwork: optUrl(errors, raw, "artwork", p),
      provider: optEnum(errors, raw, "provider", p, ["soundcloud", "mixcloud", "other"] as const),
    }
  })
  return finish(errors, { items: out })
}

function validateVideos(input: unknown): ValidationResult<VideosContent> {
  const errors: ValidationError[] = []
  if (!isObject(input)) return fail("content", "must be an object")
  const items = reqArray(errors, input, "items", "content", 50)
  const out: VideoClip[] = items.map((raw, i) => {
    const p = `content.items[${i}]`
    if (!isObject(raw)) {
      errors.push({ path: p, message: "must be an object" })
      return { id: "", title: "", embedUrl: "" }
    }
    return {
      id: reqString(errors, raw, "id", p, 64),
      title: reqString(errors, raw, "title", p, 160),
      embedUrl: reqUrl(errors, raw, "embedUrl", p),
      thumbnail: optUrl(errors, raw, "thumbnail", p),
      provider: optEnum(errors, raw, "provider", p, ["youtube", "vimeo", "other"] as const),
    }
  })
  return finish(errors, { items: out })
}

function validateRadio(input: unknown): ValidationResult<RadioContent> {
  const errors: ValidationError[] = []
  if (!isObject(input)) return fail("content", "must be an object")
  const radio = input.radio
  if (!isObject(radio)) return fail("content.radio", "required object")
  const value: RadioContent = {
    radio: {
      stationName: reqString(errors, radio, "stationName", "content.radio", 160),
      streamUrl: reqUrl(errors, radio, "streamUrl", "content.radio"),
      showTitle: optString(errors, radio, "showTitle", "content.radio", 160),
      schedule: optString(errors, radio, "schedule", "content.radio", 240),
      onAir: radio.onAir === undefined ? undefined : Boolean(radio.onAir),
    },
  }
  return finish(errors, value)
}

function validateGallery(input: unknown): ValidationResult<GalleryContent> {
  const errors: ValidationError[] = []
  if (!isObject(input)) return fail("content", "must be an object")
  const photos = reqArray(errors, input, "photos", "content", 60)
  const out: GalleryPhoto[] = photos.map((raw, i) => {
    const p = `content.photos[${i}]`
    if (!isObject(raw)) {
      errors.push({ path: p, message: "must be an object" })
      return { id: "", alt: "" }
    }
    return {
      id: reqString(errors, raw, "id", p, 64),
      alt: reqString(errors, raw, "alt", p, 300),
      // src is an optional URL in PR-5a; Supabase Storage uploads are PR-5c.
      src: optUrl(errors, raw, "src", p),
      caption: optString(errors, raw, "caption", p, 300),
    }
  })
  return finish(errors, { photos: out })
}

const GIG_STATUSES = [
  "on-sale",
  "free",
  "selling-fast",
  "last-tickets",
  "sold-out",
  "coming-soon",
] as const

function validateGigs(input: unknown): ValidationResult<GigsContent> {
  const errors: ValidationError[] = []
  if (!isObject(input)) return fail("content", "must be an object")
  const gigs = reqArray(errors, input, "gigs", "content", 100)
  const out: GigDate[] = gigs.map((raw, i) => {
    const p = `content.gigs[${i}]`
    if (!isObject(raw)) {
      errors.push({ path: p, message: "must be an object" })
      return { id: "", title: "", date: "", venueName: "", town: "", status: "on-sale" }
    }
    const date = reqString(errors, raw, "date", p, 10)
    if (date && !ISO_DATE.test(date)) {
      errors.push({ path: `${p}.date`, message: "must be an ISO date (yyyy-mm-dd)" })
    }
    return {
      id: reqString(errors, raw, "id", p, 64),
      title: reqString(errors, raw, "title", p, 200),
      date,
      venueName: reqString(errors, raw, "venueName", p, 200),
      town: reqString(errors, raw, "town", p, 160),
      status: reqEnum(errors, raw, "status", p, GIG_STATUSES),
      ticketUrl: optUrl(errors, raw, "ticketUrl", p),
    }
  })
  return finish(errors, { gigs: out })
}

// --- helpers used by validators -------------------------------------------

function fail<T>(path: string, message: string): ValidationResult<T> {
  return { ok: false, errors: [{ path, message }] }
}

function finish<T>(errors: ValidationError[], value: T): ValidationResult<T> {
  return errors.length === 0 ? { ok: true, value } : { ok: false, errors }
}

const VALIDATORS: {
  [K in ModuleKey]: (input: unknown) => ValidationResult<ModuleContentByKey[K]>
} = {
  audio: validateAudio,
  videos: validateVideos,
  radio: validateRadio,
  gallery: validateGallery,
  gigs: validateGigs,
}

/**
 * Validate module content against the canonical shape for `key`.
 * Returns a typed, normalised value on success or a list of errors.
 */
export function validateModuleContent<K extends ModuleKey>(
  key: K,
  input: unknown,
): ValidationResult<ModuleContentByKey[K]> {
  return VALIDATORS[key](input)
}
