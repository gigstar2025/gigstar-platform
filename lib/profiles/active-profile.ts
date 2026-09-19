import "server-only"

import { cookies } from "next/headers"

// The httpOnly cookie that records which of a user's managed profiles is the
// "active" working context in the dashboard. It is a convenience pointer only:
// the authoritative default lives in the database (resolve_default_profile),
// and every server action re-validates that the id still belongs to an active,
// owned profile before trusting it. Nothing security-sensitive is gated on it.
export const ACTIVE_PROFILE_COOKIE = "gigstar_active_profile"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function readActiveProfileCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_PROFILE_COOKIE)?.value ?? null
}

export async function writeActiveProfileCookie(profileId: string): Promise<void> {
  const store = await cookies()
  store.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  })
}

export async function clearActiveProfileCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ACTIVE_PROFILE_COOKIE)
}
