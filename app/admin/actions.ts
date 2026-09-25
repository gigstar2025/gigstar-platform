"use server"

import { revalidatePath } from "next/cache"

import { requirePlatformAdmin } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import {
  CONFIRMATION_TEMPLATE_KEY,
  composeConfirmationEmailHtml,
  publishConfirmationTemplate,
} from "@/lib/admin/confirmation-email"

export type SaveConfirmationEmailResult = {
  ok: boolean
  error?: string
  published?: boolean
  publishReason?: string
}

export async function saveConfirmationEmail(input: {
  subject: string
  bodyHtml: string
}): Promise<SaveConfirmationEmailResult> {
  // Authorization: re-checked server-side, never trusting the client.
  const user = await requirePlatformAdmin()

  const subject = input.subject.trim()
  const bodyHtml = input.bodyHtml.trim()
  if (!subject) return { ok: false, error: "Subject is required." }
  if (!bodyHtml) return { ok: false, error: "Email wording is required." }

  const supabase = await createClient()

  // Attempt to publish to the live Supabase template. Gated on
  // SUPABASE_ACCESS_TOKEN — when absent this is a no-op that reports why.
  const publish = await publishConfirmationTemplate({ subject, bodyHtml })

  const now = new Date().toISOString()
  const row: Record<string, unknown> = {
    template_key: CONFIRMATION_TEMPLATE_KEY,
    subject,
    body_html: bodyHtml,
    updated_at: now,
    updated_by: user.id,
  }
  // Only stamp the published snapshot when the live push actually succeeded.
  if (publish.published) {
    row.published_at = now
    row.published_subject = subject
    row.published_body_html = composeConfirmationEmailHtml(bodyHtml)
  }

  const { error } = await supabase
    .from("admin_email_templates")
    .upsert(row, { onConflict: "template_key" })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/confirmation-email")
  return { ok: true, published: publish.published, publishReason: publish.reason }
}
