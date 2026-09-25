import { requirePlatformAdmin } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { CONFIRMATION_TEMPLATE_KEY } from "@/lib/admin/confirmation-email"

import { ConfirmationEmailEditor } from "./confirmation-email-editor"

export const metadata = {
  title: "Confirmation Email · GigStar Admin",
}

export default async function ConfirmationEmailPage() {
  await requirePlatformAdmin()

  const supabase = await createClient()
  const { data } = await supabase
    .from("admin_email_templates")
    .select("subject, body_html, updated_at, published_at")
    .eq("template_key", CONFIRMATION_TEMPLATE_KEY)
    .maybeSingle()

  return (
    <ConfirmationEmailEditor
      initial={{
        subject: data?.subject ?? "",
        bodyHtml: data?.body_html ?? "",
        updatedAt: data?.updated_at ?? null,
        publishedAt: data?.published_at ?? null,
      }}
      livePublishConfigured={Boolean(process.env.SUPABASE_ACCESS_TOKEN)}
    />
  )
}
