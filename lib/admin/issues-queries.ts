import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AdminIssue, AdminIssueComment } from "@/lib/admin/issues"

const ISSUE_COLUMNS =
  "id, title, description, category, status, created_by, created_by_email, created_at, updated_at, signed_off_by, signed_off_by_email, signed_off_at"

const COMMENT_COLUMNS = "id, issue_id, author_id, author_email, body, kind, created_at"

/** All issues, newest first. Reads through the RLS client (admins only). */
export async function listIssues(): Promise<AdminIssue[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_issues")
    .select(ISSUE_COLUMNS)
    .order("created_at", { ascending: false })

  if (error) {
    console.warn(`[admin-issues] list failed: ${error.message}`)
    return []
  }
  return (data ?? []) as AdminIssue[]
}

/**
 * A single issue plus its full comment thread (oldest first), or null if the
 * id is unknown/unreadable. An invalid uuid surfaces as a query error, which
 * we treat as "not found" so the route can render a 404.
 */
export async function getIssue(
  id: string,
): Promise<{ issue: AdminIssue; comments: AdminIssueComment[] } | null> {
  const supabase = await createClient()

  const { data: issue, error } = await supabase
    .from("admin_issues")
    .select(ISSUE_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.warn(`[admin-issues] get(${id}) failed: ${error.message}`)
    return null
  }
  if (!issue) return null

  const { data: comments, error: commentsError } = await supabase
    .from("admin_issue_comments")
    .select(COMMENT_COLUMNS)
    .eq("issue_id", id)
    .order("created_at", { ascending: true })

  if (commentsError) {
    console.warn(`[admin-issues] comments(${id}) failed: ${commentsError.message}`)
  }

  return {
    issue: issue as AdminIssue,
    comments: (comments ?? []) as AdminIssueComment[],
  }
}
