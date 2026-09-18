import "server-only"

// Server-only feature flags.
//
// Flags are read from non-public environment variables so their state can
// never be bundled into client code or toggled from the browser. A flag is
// ON only when its variable is exactly the string "true"; anything else
// (unset, empty, "false", "0", …) leaves it OFF. This makes "disabled by
// default" the safe, zero-configuration behaviour in every environment.

function flagEnabled(value: string | undefined): boolean {
  return value === "true"
}

// Gates the multi-profile onboarding flow (PR-3). While OFF (the default),
// post-login routing keeps its previous behaviour and never sends a user into
// /onboarding automatically. The /onboarding routes themselves remain
// reachable directly (behind the normal auth guard) so the flow can be
// verified before the flag is switched on.
export const ONBOARDING_FLOW_ENABLED = flagEnabled(process.env.ONBOARDING_FLOW_ENABLED)
