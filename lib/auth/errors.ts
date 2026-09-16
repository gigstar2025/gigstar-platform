// Generic, user-facing auth copy. These strings never reveal technical detail
// or whether a given email exists — the technical cause is logged server-side
// only (see the callback route and server actions). Centralised so every auth
// surface stays consistent.

export const GENERIC_SIGN_IN_ERROR =
  "We couldn't complete sign-in. The link may have expired or already been used. Please try signing in again."

export const GENERIC_CREDENTIALS_ERROR = "Invalid email or password."

export const GENERIC_RESEND_MESSAGE =
  "If that address still needs confirming, we've sent a new link. Please check your inbox."
