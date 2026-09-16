import "server-only"

// Single source of truth for where an authenticated user lands after signing
// in or confirming their email. Both the password sign-in flow and the email
// confirmation callback resolve their destination here (via /auth/post-login),
// so routing logic lives in exactly one place.
//
// PR-1 scope: returns a safe, always-valid interim destination (the public
// homepage). Real users previously landed on /dev/foundation, which returns a
// hard 404 in Production (Phase Five hardening) — this removes that dead end.
//
// Planned expansion (documented so the call sites can stay unchanged):
//   - PR-2 adds user_accounts.default_profile_id plus the membership/attempt
//     schema this resolver will read.
//   - PR-3 adds /onboarding/* — the "no accessible profile" branch (case a)
//     routes there.
//   - PR-4 adds /profiles/manage — the ambiguous / invalid-default branch
//     (case d) routes there.
//   - PR-5 makes /profile/[slug] database-backed so a user with profiles
//     (cases b/c) can be routed to a specific profile: its public page when
//     published, or the private owner preview when still a draft.
//
// The function is intentionally async now so those database-backed branches
// can be added later without touching any caller.
export async function resolvePostLoginDestination(): Promise<string> {
  return "/"
}
