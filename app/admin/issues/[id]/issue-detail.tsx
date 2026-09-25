"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ISSUE_WORKFLOW_STATUSES,
  categoryLabel,
  commentKindLabel,
  type AdminIssue,
  type AdminIssueComment,
} from "@/lib/admin/issues"

import { StatusBadge } from "../status-badge"
import { addComment, changeStatus, signOffIssue } from "../actions"

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type Props = {
  issue: AdminIssue
  comments: AdminIssueComment[]
}

export function IssueDetail({ issue, comments }: Props) {
  const router = useRouter()
  const isSignedOff = issue.status === "signed_off"

  const [commentBody, setCommentBody] = useState("")
  const [commentKind, setCommentKind] = useState<"comment" | "fix">("comment")
  const [status, setStatus] = useState(
    issue.status === "signed_off" ? "ready_for_signoff" : issue.status,
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmingSignOff, setConfirmingSignOff] = useState(false)

  const [isCommentPending, startComment] = useTransition()
  const [isStatusPending, startStatus] = useTransition()
  const [isSignOffPending, startSignOff] = useTransition()

  function submitComment() {
    setError(null)
    startComment(async () => {
      const res = await addComment({ issueId: issue.id, body: commentBody, kind: commentKind })
      if (!res.ok) {
        setError(res.error ?? "Could not add the comment.")
        return
      }
      setCommentBody("")
      setCommentKind("comment")
      router.refresh()
    })
  }

  function submitStatus() {
    setError(null)
    startStatus(async () => {
      const res = await changeStatus({ issueId: issue.id, status })
      if (!res.ok) {
        setError(res.error ?? "Could not update the status.")
        return
      }
      router.refresh()
    })
  }

  function submitSignOff() {
    setError(null)
    startSignOff(async () => {
      const res = await signOffIssue({ issueId: issue.id })
      if (!res.ok) {
        setError(res.error ?? "Could not sign off the issue.")
        return
      }
      setConfirmingSignOff(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{issue.title}</h1>
          <StatusBadge status={issue.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{categoryLabel(issue.category)}</Badge>
          <span>Created by {issue.created_by_email ?? "Unknown"}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDateTime(issue.created_at)}</span>
        </div>
        {isSignedOff ? (
          <p className="text-xs text-muted-foreground">
            Signed off by {issue.signed_off_by_email ?? "an admin"}
            {issue.signed_off_at ? ` on ${formatDateTime(issue.signed_off_at)}` : ""}. This issue is kept as history.
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-pretty">{issue.description}</p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Discussion</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author_email ?? "Admin"}</span>
                  <Badge variant={c.kind === "fix" ? "default" : "outline"}>{commentKindLabel(c.kind)}</Badge>
                  <span aria-hidden="true">·</span>
                  <span>{formatDateTime(c.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {isSignedOff ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="comment-body">Add a comment or record a fix</Label>
              <Textarea
                id="comment-body"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={4}
                placeholder="Share an update, ask a question, or describe what was done to fix it."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Select value={commentKind} onValueChange={(v) => setCommentKind(v as "comment" | "fix")}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="fix">Record a fix</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={submitComment} disabled={isCommentPending}>
                  {isCommentPending ? "Posting…" : commentKind === "fix" ? "Record fix" : "Add comment"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label htmlFor="status-select">Status</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status-select" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_WORKFLOW_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={submitStatus} disabled={isStatusPending}>
                  {isStatusPending ? "Updating…" : "Update status"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>Sign off</Label>
              <p className="text-sm text-muted-foreground text-pretty">
                Signing off marks the issue complete and locks it as history. This records you and the time.
              </p>
              {confirmingSignOff ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={submitSignOff} disabled={isSignOffPending}>
                    {isSignOffPending ? "Signing off…" : "Confirm sign-off"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmingSignOff(false)}
                    disabled={isSignOffPending}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div>
                  <Button type="button" onClick={() => setConfirmingSignOff(true)}>
                    Sign off
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
