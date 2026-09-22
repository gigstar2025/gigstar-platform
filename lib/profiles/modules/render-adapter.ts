// ---------------------------------------------------------------------------
// Render adapter: converts persisted module content (the canonical DB shapes in
// content.ts, keyed audio/videos/radio/gallery/gigs) into the `ProfileModule`
// discriminated union that the public render components consume (keyed
// mixes/videos/radio/gallery/gigs — note the legacy "mixes" name for audio).
//
// This is the single reconciliation point between the two vocabularies for
// RENDERING. It is pure and dependency-free so it can be unit-tested and reused
// by both the public page and the editor preview. Content is re-validated with
// the same validators used at save time; anything invalid yields null so one
// bad row can never crash a public profile page.
// ---------------------------------------------------------------------------

import type { ModuleKey } from "./registry"
import {
  validateModuleContent,
  type AudioContent,
  type GalleryContent,
  type GigsContent,
  type RadioContent,
  type VideosContent,
} from "./content"
import { MODULE_META } from "../types"
import type {
  GigDate as RenderGigDate,
  GigStatus as RenderGigStatus,
  MixItem,
  PhotoItem,
  ProfileModule,
  RadioInfo,
  VideoItem,
} from "../types"

/** DB module key -> render union discriminant. */
const KEY_TO_RENDER_TYPE = {
  audio: "mixes",
  videos: "videos",
  radio: "radio",
  gallery: "gallery",
  gigs: "gigs",
} as const

/**
 * The persisted gig status vocabulary is richer than the render union. Only
 * "sold-out" has a direct render equivalent; every "still available" state
 * collapses to "on-sale" (the render layer shows a ticket CTA for that). There
 * is no persisted "cancelled", so the render layer never receives one here.
 */
export function mapGigStatus(status: GigsContent["gigs"][number]["status"]): RenderGigStatus {
  return status === "sold-out" ? "sold-out" : "on-sale"
}

/**
 * Convert one persisted module (key + content) to a renderable `ProfileModule`.
 * Returns null when content fails validation for the key.
 *
 * `id` and `hidden` come from the owning `profile_modules` row; callers that
 * only have content can omit them and receive stable defaults.
 */
export function moduleToRenderModule(
  key: ModuleKey,
  content: unknown,
  opts: { id?: string; hidden?: boolean } = {},
): ProfileModule | null {
  const result = validateModuleContent(key, content)
  if (!result.ok) return null

  const type = KEY_TO_RENDER_TYPE[key]
  const id = opts.id ?? `module_${key}`
  const hidden = opts.hidden ?? false

  switch (key) {
    case "audio": {
      const value = result.value as AudioContent
      const items: MixItem[] = value.items.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        artwork: m.artwork,
        embedUrl: m.embedUrl,
        provider: m.provider,
      }))
      return { id, type: "mixes", title: MODULE_META.mixes.label, hidden, items }
    }
    case "videos": {
      const value = result.value as VideosContent
      const items: VideoItem[] = value.items.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        embedUrl: v.embedUrl,
        provider: v.provider,
      }))
      return { id, type: "videos", title: MODULE_META.videos.label, hidden, items }
    }
    case "radio": {
      const value = result.value as RadioContent
      const radio: RadioInfo = {
        onAir: value.radio.onAir ?? false,
        showTitle: value.radio.showTitle ?? "",
        stationName: value.radio.stationName,
        streamUrl: value.radio.streamUrl,
        schedule: value.radio.schedule ?? "",
      }
      const title = value.radio.showTitle?.trim() || MODULE_META.radio.label
      return { id, type: "radio", title, hidden, radio }
    }
    case "gallery": {
      const value = result.value as GalleryContent
      const photos: PhotoItem[] = value.photos.map((p) => ({
        id: p.id,
        src: p.src,
        caption: p.caption,
        alt: p.alt,
      }))
      return { id, type: "gallery", title: MODULE_META.gallery.label, hidden, photos }
    }
    case "gigs": {
      const value = result.value as GigsContent
      const gigs: RenderGigDate[] = value.gigs.map((g) => ({
        id: g.id,
        date: g.date,
        title: g.title,
        venue: g.venueName,
        town: g.town,
        ticketUrl: g.ticketUrl,
        status: mapGigStatus(g.status),
      }))
      return { id, type: "gigs", title: MODULE_META.gigs.label, hidden, gigs }
    }
  }
}
