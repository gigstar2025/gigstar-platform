"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { requirePlatformAdmin } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { notifyAdminsOfIssueEvent } from "@/lib/admin/notify"
import {
  categoryLabel,
  isIssueCategory,
  isWorkflowStatus,
  statusLabel,
} from "@/lib/admin/issues"

const TITLE_MAX = 200
const BODY_MAX = 10_000

export type ActionResult = { ok: boolean; error?: string; id?: string }

async function resolveBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return host ? `${proto}://${host}` : "https://www.gigstar.co.uk"
}

export async function createIssue(input: {
  title: string
  description: string
  category: string
}): Promise<ActionResult> {
  const user = await requirePlatformAdmin()

  const title = input.title.trim()
  const description = input.description.trim()
  const category = input.category.trim()

  if (!title) return { ok: false, error: "Title is required." }
  if (title.length > TITLE_MAX) return { ok: false, error: `Title must be ${TITLE_MAX} characters or fewer.` }
  if (!description) return { ok: false, error: "Description is required." }
  if (description.length > BODY_MAX) return { ok: false, error: "Description is too long." }
  if (!isIssueCategory(category)) return { ok: false, error: "Choose a valid category." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_issues")
    .insert({
      title,
      description,
      category,
      created_by: user.id,
      created_by_email: user.email ?? null,
    })
    .select("id")
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create the issue." }

  const issueUrl = `${await resolveBaseUrl()}/admin/issues/${data.id}`
  await notifyAdminsOfIssueEvent({
    subject: `New issue: ${title}`,
    heading: "A new issue was created",
    intro: `${user.email ?? "An admin"} created a new ${categoryLabel(category)} issue.`,
    issueUrl,
    facts: [
      { label: "Title", value: title },
      { label: "Category", value: categoryLabel(category) },
      { label: "Description", value: description },
    ],
  })

  revalidatePath("/admin/issues")
  return { ok: true, id: data.id }
}

export async function addComment(input: {
  issueId: string
  body: string
  kind: "comment" | "fix"
}): Promise<ActionResult> {
  const user = await requirePlatformAdmin()

  const body = input.body.trim()
  if (!body) return { ok: false, error: "Write something first." }
  if (body.length > BODY_MAX) return { ok: false, error: "Comment is too long." }
  const kind = input.kind === "fix" ? "fix" : "comment"

  const supabase = await createClient()

  const { data: issue, error: issueError } = await supabase
    .from("admin_issues")
    .select("id, title, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: false, error: "This issue is signed off and locked as history." }

  const { error } = await supabase.from("admin_issue_comments").insert({
    issue_id: input.issueId,
    author_id: user.id,
    author_email: user.email ?? null,
    body,
    kind,
  })
  if (error) return { ok: false, error: error.message }

  await supabase.from("admin_issues").update({ updated_at: new Date().toISOString() }).eq("id", input.issueId)

  const issueUrl = `${await resolveBaseUrl()}/admin/issues/${input.issueId}`
  await notifyAdminsOfIssueEvent({
    subject: kind === "fix" ? `Fix recorded: ${issue.title}` : `New comment: ${issue.title}`,
    heading: kind === "fix" ? "A fix was recorded" : "A new comment was added",
    intro: `${user.email ?? "An admin"} updated the issue "${issue.title}".`,
    issueUrl,
    comment: {
      author: user.email ?? "Admin",
      kind: kind === "fix" ? "Fix recorded" : "Comment",
      body,
    },
  })

  revalidatePath(`/admin/issues/${input.issueId}`)
  revalidatePath("/admin/issues")
  return { ok: true }
}

export async function changeStatus(input: { issueId: string; status: string }): Promise<ActionResult> {
  const user = await requirePlatformAdmin()

  if (!isWorkflowStatus(input.status)) {
    return { ok: false, error: "Choose a valid status. Use Sign off to complete an issue." }
  }

  const supabase = await createClient()

  const { data: issue, error: issueError } = await supabase
    .from("admin_issues")
    .select("id, title, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: false, error: "This issue is signed off and locked as history." }
  if (issue.status === input.status) return { ok: true }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("admin_issues")
    .update({ status: input.status, updated_at: now })
    .eq("id", input.issueId)
  if (error) return { ok: false, error: error.message }

  await supabase.from("admin_issue_comments").insert({
    issue_id: input.issueId,
    author_id: user.id,
    author_email: user.email ?? null,
    body: `Status changed to ${statusLabel(input.status)}.`,
    kind: "status_change",
  })

  const issueUrl = `${await resolveBaseUrl()}/admin/issues/${input.issueId}`
  await notifyAdminsOfIssueEvent({
    subject: `Status: ${statusLabel(input.status)} — ${issue.title}`,
    heading: "An issue status changed",
    intro: `${user.email ?? "An admin"} moved "${issue.title}" to ${statusLabel(input.status)}.`,
    issueUrl,
  })

  revalidatePath(`/admin/issues/${input.issueId}`)
  revalidatePath("/admin/issues")
  return { ok: true }
}

export async function signOffIssue(input: { issueId: string }): Promise<ActionResult> {
  const user = await requirePlatformAdmin()

  const supabase = await createClient()

  const { data: issue, error: issueError } = await supabase
    .from("admin_issues")
    .select("id, title, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: true }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("admin_issues")
    .update({
      status: "signed_off",
      signed_off_by: user.id,
      signed_off_by_email: user.email ?? null,
      signed_off_at: now,
      updated_at: now,
    })
    .eq("id", input.issueId)
  if (error) return { ok: false, error: error.message }

  await supabase.from("admin_issue_comments").insert({
    issue_id: input.issueId,
    author_id: user.id,
    author_email: user.email ?? null,
    body: `Signed off by ${user.email ?? "an admin"}.`,
    kind: "signoff",
  })

  const issueUrl = `${await resolveBaseUrl()}/admin/issues/${input.issueId}`
  await notifyAdminsOfIssueEvent({
    subject: `Signed off: ${issue.title}`,
    heading: "An issue was signed off",
    intro: `${user.email ?? "An admin"} signed off "${issue.title}". It is now kept as history.`,
    issueUrl,
  })

  revalidatePath(`/admin/issues/${input.issueId}`)
  revalidatePath("/admin/issues")
  return { ok: true }
}
