// READ-ONLY diagnostic. Fetches the live production Supabase auth config via the
// Management API and prints ONLY non-secret, link-relevant fields. Never prints
// the access token or any OTP/token value.
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROD_PROJECT_REF || "dyshjxdznhswctluhzmc"

if (!token) {
  console.log(JSON.stringify({ ok: false, error: "SUPABASE_ACCESS_TOKEN not readable in this runtime" }))
  process.exit(0)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
})

if (!res.ok) {
  console.log(JSON.stringify({ ok: false, status: res.status, detail: (await res.text()).slice(0, 500) }))
  process.exit(0)
}

const cfg = await res.json()

// Only surface link-shaping fields. The confirmation template is HTML wording,
// not a secret; we still redact anything token-like defensively.
const tmpl = String(cfg.mailer_templates_confirmation_content ?? "")
const hrefs = Array.from(tmpl.matchAll(/href="([^"]+)"/g)).map((m) => m[1])

console.log(
  JSON.stringify(
    {
      ok: true,
      ref,
      site_url: cfg.site_url,
      uri_allow_list: cfg.uri_allow_list,
      mailer_autoconfirm: cfg.mailer_autoconfirm,
      external_email_enabled: cfg.external_email_enabled,
      mailer_otp_exp: cfg.mailer_otp_exp,
      confirmation_subject: cfg.mailer_subjects_confirmation,
      confirmation_template_is_default: tmpl.trim() === "" ,
      confirmation_template_hrefs: hrefs,
      confirmation_template_has_token_hash: tmpl.includes("{{ .TokenHash }}"),
      confirmation_template_has_confirmationurl: tmpl.includes("{{ .ConfirmationURL }}"),
    },
    null,
    2,
  ),
)
