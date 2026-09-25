/**
 * Confirmation email — domain logic shared by the admin editor and the
 * (gated) live publish path.
 *
 * IMPORTANT — the confirmation link contract:
 * The app verifies email confirmations at `/auth/confirm`, which reads
 * `token_hash` and `type` from the query string and calls
 * `supabase.auth.verifyOtp({ token_hash, type })`. For new signups `type` is
 * `signup`. The Supabase "Confirm signup" template must therefore link to:
 *
 *     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 *
 * The `{{ .TokenHash }}` template variable is what makes the link authenticate.
 * To make it impossible for an admin to accidentally break auth, the link is
 * NOT part of the editable wording — admins edit subject + body copy only, and
 * the link block below is always composed into the final email at publish time.
 */

export const CONFIRMATION_TEMPLATE_KEY = "confirmation" as const

/**
 * The ONLY Supabase project ref the live publish path is permitted to write to.
 * This is the confirmed `gigstar-production` project. The publish path targets
 * this ref explicitly (not whatever the runtime SUPABASE_URL happens to be), and
 * refuses to run if the configured/derived ref differs — so the live template of
 * a wrong project (e.g. the DEV project the sandbox points at) can never be
 * overwritten by mistake.
 */
export const PRODUCTION_PROJECT_REF = "dyshjxdznhswctluhzmc" as const

/** The exact, non-editable confirmation URL (Supabase template variables). */
export const CONFIRMATION_LINK_HREF =
  "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup"

/**
 * Wraps the admin-authored wording with the fixed confirmation link block.
 * This is what gets pushed to Supabase as the live template content.
 */
export function composeConfirmationEmailHtml(bodyHtml: string): string {
  return [
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;color:#111;">`,
    bodyHtml,
    `<p style="margin:24px 0;">`,
    `<a href="${CONFIRMATION_LINK_HREF}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Confirm your email</a>`,
    `</p>`,
    `<p style="font-size:12px;color:#666;">If the button does not work, copy and paste this link into your browser:<br/>${CONFIRMATION_LINK_HREF}</p>`,
    `</div>`,
  ].join("\n")
}

/**
 * Renders a preview of the composed email with the Supabase template variables
 * filled in with sample values, so admins can see the real layout. The actual
 * token is injected by Supabase at send time.
 */
export function previewConfirmationEmailHtml(bodyHtml: string, siteUrl: string): string {
  return composeConfirmationEmailHtml(bodyHtml)
    .replaceAll("{{ .SiteURL }}", siteUrl.replace(/\/$/, ""))
    .replaceAll("{{ .TokenHash }}", "SAMPLE_TOKEN_HASH")
}

/** Derives the Supabase project ref from the project URL. */
function projectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).host // <ref>.supabase.co
    const ref = host.split(".")[0]
    return ref || null
  } catch {
    return null
  }
}

export type PublishResult = { published: boolean; reason?: string }

/**
 * Pushes the subject + composed body to the live Supabase "Confirm signup"
 * template via the Management API.
 *
 * Gated: requires a `SUPABASE_ACCESS_TOKEN` (personal access token). When it is
 * absent the draft is still saved, but nothing touches the live email — the
 * caller surfaces `reason` to the admin. This keeps the live template unchanged
 * until the environment is deliberately configured and a test signup verified.
 */
export async function publishConfirmationTemplate(input: {
  subject: string
  bodyHtml: string
}): Promise<PublishResult> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    return {
      published: false,
      reason:
        "Live publishing is not configured. Set SUPABASE_ACCESS_TOKEN (a Supabase personal access token) in the Vercel Production environment to push saved wording to the live confirmation email.",
    }
  }

  // Ref pinning (defense in depth). The live publish path is only ever allowed
  // to write to the confirmed production project, and ONLY from an environment
  // that is itself wired to that project. Two independent checks must both hold:
  //
  //   1. Intent — if an explicit target ref (SUPABASE_PROD_PROJECT_REF) is set,
  //      it MUST equal the pinned production ref.
  //   2. Reality — the Supabase project this runtime actually talks to (derived
  //      from its own SUPABASE_URL) MUST be the pinned production ref.
  //
  // Check 2 is what makes the DEV sandbox safe: its SUPABASE_URL points at the
  // DEV project, so it can never overwrite the live production template even if
  // SUPABASE_PROD_PROJECT_REF happens to be present in its environment. Only the
  // real production deployment (whose SUPABASE_URL is the prod project) publishes.
  const configuredRef = process.env.SUPABASE_PROD_PROJECT_REF ?? null
  const runtimeRef = projectRefFromUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  )

  if (configuredRef && configuredRef !== PRODUCTION_PROJECT_REF) {
    return {
      published: false,
      reason:
        `Refusing to publish: SUPABASE_PROD_PROJECT_REF (${configuredRef}) is not the permitted ` +
        `production project (${PRODUCTION_PROJECT_REF}). Saved as draft only.`,
    }
  }

  if (runtimeRef !== PRODUCTION_PROJECT_REF) {
    return {
      published: false,
      reason:
        `Refusing to publish: this environment's Supabase project (${runtimeRef ?? "unknown"}) is not ` +
        `${PRODUCTION_PROJECT_REF}. The live confirmation email can only be published from the production ` +
        `deployment (gigstar-production), not from a preview or the DEV sandbox. Saved as draft only.`,
    }
  }

  const ref = PRODUCTION_PROJECT_REF

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_subjects_confirmation: input.subject,
        mailer_templates_confirmation_content: composeConfirmationEmailHtml(input.bodyHtml),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return { published: false, reason: `Supabase Management API returned ${res.status}. ${detail}`.trim() }
    }

    return { published: true }
  } catch (err) {
    return { published: false, reason: err instanceof Error ? err.message : "Unknown error publishing template." }
  }
}
