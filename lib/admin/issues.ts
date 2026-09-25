// Pure, client-safe shared module: types, constants, and label/guard helpers.
// No server-only imports here — client components (forms, badges) import from
// this file, so it must never pull in `next/headers`. DB queries that need the
// request-bound Supabase client live in `issues-queries.ts` (server-only).

export type IssueCategory = "bug" | "improvement" | "task" | "other"
export type IssueStatus = "open" | "in_progress" | "ready_for_signoff" | "signed_off"
export type IssueCommentKind = "comment" | "fix" | "status_change" | "signoff"

export const ISSUE_CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "improvement", label: "Improvement" },
  { value: "task", label: "Task" },
  { value: "other", label: "Other" },
]

// Statuses an admin can move an issue to via the status control. Reaching
// "signed_off" is deliberately NOT here — sign-off is a separate, explicit
// action that also records who and when.
export const ISSUE_WORKFLOW_STATUSES: { value: Exclude<IssueStatus, "signed_off">; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "ready_for_signoff", label: "Ready for sign-off" },
]

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  improvement: "Improvement",
  task: "Task",
  other: "Other",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  ready_for_signoff: "Ready for sign-off",
  signed_off: "Signed off",
}

const COMMENT_KIND_LABELS: Record<string, string> = {
  comment: "Comment",
  fix: "Fix recorded",
  status_change: "Status change",
  signoff: "Signed off",
}

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value
}

export function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value
}

export function commentKindLabel(value: string): string {
  return COMMENT_KIND_LABELS[value] ?? value
}

export function isIssueCategory(value: string): value is IssueCategory {
  return value in CATEGORY_LABELS
}

export function isWorkflowStatus(value: string): value is Exclude<IssueStatus, "signed_off"> {
  return ISSUE_WORKFLOW_STATUSES.some((s) => s.value === value)
}

export type AdminIssue = {
  id: string
  title: string
  description: string
  category: IssueCategory
  status: IssueStatus
  created_by: string
  created_by_email: string | null
  created_at: string
  updated_at: string
  signed_off_by: string | null
  signed_off_by_email: string | null
  signed_off_at: string | null
}

export type AdminIssueComment = {
  id: string
  issue_id: string
  author_id: string
  author_email: string | null
  body: string
  kind: IssueCommentKind
  created_at: string
}

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
