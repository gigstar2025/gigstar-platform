import "server-only"

import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Resolve the email address of every CURRENT platform admin.
 *
 * `platform_admins` only stores `user_id`, and the addresses live in the
 * managed `auth.users` schema, so this needs the service-role client. It is
 * only ever called from trusted server code that has already authorized the
 * caller as an admin.
 */
async function resolveAdminEmails(): Promise<string[]> {
  const admin = createServiceRoleClient()

  const { data: rows, error } = await admin.from("platform_admins").select("user_id")
  if (error) {
    console.warn(`[admin-notify] could not load platform_admins: ${error.message}`)
    return []
  }
  const adminIds = new Set((rows ?? []).map((r) => r.user_id as string))
  if (adminIds.size === 0) return []

  const emails: string[] = []
  const perPage = 200
  let page = 1

  // listUsers paginates; walk pages until we've seen every admin or run out.
  while (adminIds.size > emails.length) {
    const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage })
    if (listError) {
      console.warn(`[admin-notify] listUsers page ${page} failed: ${listError.message}`)
      break
    }
    const users = data?.users ?? []
    for (const u of users) {
      if (adminIds.has(u.id) && u.email) emails.push(u.email)
    }
    if (users.length < perPage) break
    page += 1
  }

  return emails
}

export type AdminIssueNotification = {
  subject: string
  heading: string
  intro: string
  issueUrl: string
  facts?: { label: string; value: string }[]
  comment?: { author: string; kind: string; body: string }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderHtml(n: AdminIssueNotification): string {
  const facts = (n.facts ?? [])
    .map(
      (f) =>
        `<p style="margin:0 0 6px"><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.value)}</p>`,
    )
    .join("")

  const comment = n.comment
    ? `<div style="margin:16px 0;padding:12px 14px;border-left:3px solid #d4d4d8;background:#fafafa">
         <p style="margin:0 0 4px;font-size:12px;color:#71717a">${escapeHtml(
           n.comment.kind,
         )} · ${escapeHtml(n.comment.author)}</p>
         <p style="margin:0;white-space:pre-wrap">${escapeHtml(n.comment.body)}</p>
       </div>`
    : ""

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;line-height:1.5">
    <h2 style="margin:0 0 8px;font-size:18px">${escapeHtml(n.heading)}</h2>
    <p style="margin:0 0 12px">${escapeHtml(n.intro)}</p>
    ${facts}
    ${comment}
    <p style="margin:16px 0 0">
      <a href="${escapeHtml(n.issueUrl)}" style="color:#2563eb">View the issue in the admin area</a>
    </p>
  </div>`
}

function renderText(n: AdminIssueNotification): string {
  const facts = (n.facts ?? []).map((f) => `${f.label}: ${f.value}`).join("\n")
  const comment = n.comment ? `\n${n.comment.kind} — ${n.comment.author}:\n${n.comment.body}\n` : ""
  return [n.heading, "", n.intro, "", facts, comment, "", n.issueUrl].filter(Boolean).join("\n")
}

/**
 * Notify every current platform admin about an issue event.
 *
 * Degrades gracefully: if no email provider is configured (no
 * `RESEND_API_KEY`), it logs the intended notification server-side and returns
 * without throwing. Add `RESEND_API_KEY` (and optionally `ADMIN_NOTIFY_FROM`)
 * later and delivery starts automatically — no code change required.
 *
 * Never throws: notification failures must not roll back the issue mutation
 * that triggered them.
 */
export async function notifyAdminsOfIssueEvent(n: AdminIssueNotification): Promise<void> {
  try {
    const recipients = await resolveAdminEmails()
    if (recipients.length === 0) {
      console.warn("[admin-notify] no admin recipients resolved; skipping notification")
      return
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log(
        `[admin-notify] email provider not configured — would email ${recipients.length} admin(s): "${n.subject}" (${n.issueUrl})`,
      )
      return
    }

    const from = process.env.ADMIN_NOTIFY_FROM ?? "GigStar Admin <onboarding@resend.dev>"
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: n.subject,
        html: renderHtml(n),
        text: renderText(n),
      }),
    })

    if (!res.ok) {
      console.warn(`[admin-notify] send failed: HTTP ${res.status}`)
    }
  } catch (error) {
    console.warn(`[admin-notify] send error: ${(error as Error).message}`)
  }
}
