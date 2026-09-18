import "server-only"

import { cookies } from "next/headers"
import type { ProfileType } from "@/lib/db/types"
import { ONBOARDING_DRAFT_COOKIE } from "./constants"

// The not-yet-persisted field values for the current onboarding attempt. This
// lives in an httpOnly, same-site cookie so the flow is resumable from server
// state across reloads without any client-side storage. It intentionally holds
// only coarse, publicly-safe data (a town centroid, never a precise device
// fix); the sensitive columns are never touched here.
export type OnboardingDraft = {
  type?: ProfileType
  displayName?: string
  tagline?: string
  locationLabel?: string
  lat?: number
  lng?: number
  slug?: string
}

const MAX_COOKIE_BYTES = 3500

export async function readDraft(): Promise<OnboardingDraft> {
  const store = await cookies()
  const raw = store.get(ONBOARDING_DRAFT_COOKIE)?.value
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as OnboardingDraft
    if (parsed && typeof parsed === "object") return parsed
  } catch {
    // Corrupt cookie — treat as an empty draft.
  }
  return {}
}

// Merge a patch into the existing draft. Must be called from a Server Action
// or Route Handler (Next.js only allows cookie writes there).
export async function mergeDraft(patch: OnboardingDraft): Promise<OnboardingDraft> {
  const store = await cookies()
  const current = await readDraft()
  const next: OnboardingDraft = { ...current, ...patch }
  const serialized = JSON.stringify(next)
  if (serialized.length <= MAX_COOKIE_BYTES) {
    store.set(ONBOARDING_DRAFT_COOKIE, serialized, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24, // one day is plenty for an onboarding session
    })
  }
  return next
}

export async function clearDraft(): Promise<void> {
  const store = await cookies()
  store.delete(ONBOARDING_DRAFT_COOKIE)
}
