"use server"

import { revalidatePath } from "next/cache"

import { requirePlatformAdmin } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { isIssueCategory, isWorkflowStatus, statusLabel } from "@/lib/admin/issues"

const TITLE_MAX = 200
const BODY_MAX = 10_000

const SIGNED_OFF_LOCKED = "This issue is signed off and locked as history."

export type ActionResult = { ok: boolean; error?: string; id?: string }

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
    .select("id, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: false, error: SIGNED_OFF_LOCKED }

  const { error } = await supabase.from("admin_issue_comments").insert({
    issue_id: input.issueId,
    author_id: user.id,
    author_email: user.email ?? null,
    body,
    kind,
  })
  if (error) return { ok: false, error: error.message }

  await supabase.from("admin_issues").update({ updated_at: new Date().toISOString() }).eq("id", input.issueId)

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
    .select("id, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: false, error: SIGNED_OFF_LOCKED }
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

  revalidatePath(`/admin/issues/${input.issueId}`)
  revalidatePath("/admin/issues")
  return { ok: true }
}

export async function signOffIssue(input: { issueId: string }): Promise<ActionResult> {
  const user = await requirePlatformAdmin()

  const supabase = await createClient()

  const { data: issue, error: issueError } = await supabase
    .from("admin_issues")
    .select("id, status")
    .eq("id", input.issueId)
    .maybeSingle()
  if (issueError || !issue) return { ok: false, error: "Issue not found." }
  if (issue.status === "signed_off") return { ok: true }

  const now = new Date().toISOString()

  // Record the sign-off in the thread BEFORE locking the issue: the database
  // blocks any comment once the parent issue is signed off, so this final
  // history entry must be written while the issue is still open.
  const { error: commentError } = await supabase.from("admin_issue_comments").insert({
    issue_id: input.issueId,
    author_id: user.id,
    author_email: user.email ?? null,
    body: `Signed off by ${user.email ?? "an admin"}.`,
    kind: "signoff",
  })
  if (commentError) return { ok: false, error: commentError.message }

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

  revalidatePath(`/admin/issues/${input.issueId}`)
  revalidatePath("/admin/issues")
  return { ok: true }
}
