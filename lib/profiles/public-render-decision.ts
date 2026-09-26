export type PublicRenderDecision = "modular" | "showcase" | "demo" | "not-found"

/**
 * Whether the demo/sample profile fallback may stand in for a real profile.
 *
 * The fallback exists so non-production environments can preview showcase
 * content. In production it must never silently mask a real profile slug,
 * so it is disabled unless an operator explicitly opts in.
 */
export function isDemoFallbackAllowed(
  env: { vercelEnv?: string | null; demoFallbackFlag?: string | null } = {},
): boolean {
  const flag = env.demoFallbackFlag
  if (flag === "1" || flag === "true") return true
  return (env.vercelEnv ?? "development") !== "production"
}

/**
 * Decide how to render a public profile page.
 *
 * - modular:   the real DB-backed modular profile was found -> render it.
 * - showcase:  modular flow is OFF (legacy marketing site) -> render the
 *              showcase entry for this slug; these ARE the real content there.
 * - demo:      modular flow is ON but the profile was not found, and demo
 *              fallback is allowed (non-production/opt-in) -> render showcase
 *              content behind a visible "demo example" label.
 * - not-found: modular flow is ON, no profile found, and demo fallback is not
 *              allowed (production) -> 404 instead of silently showing samples.
 */
export function decidePublicRender(input: {
  modularFlow: boolean
  modularFound: boolean
  isShowcaseSlug: boolean
  demoFallbackAllowed: boolean
}): PublicRenderDecision {
  if (input.modularFlow && input.modularFound) return "modular"

  if (!input.modularFlow) {
    return input.isShowcaseSlug ? "showcase" : "not-found"
  }

  if (input.demoFallbackAllowed && input.isShowcaseSlug) return "demo"

  return "not-found"
}
