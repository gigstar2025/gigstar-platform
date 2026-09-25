"use client"

import { useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CONFIRMATION_LINK_HREF, previewConfirmationEmailHtml } from "@/lib/admin/confirmation-email"

import { saveConfirmationEmail, type SaveConfirmationEmailResult } from "../actions"

type Props = {
  initial: {
    subject: string
    bodyHtml: string
    updatedAt: string | null
    publishedAt: string | null
  }
  livePublishConfigured: boolean
}

export function ConfirmationEmailEditor({ initial, livePublishConfigured }: Props) {
  const [subject, setSubject] = useState(initial.subject)
  const [body, setBody] = useState(initial.bodyHtml)
  const [showPreview, setShowPreview] = useState(false)
  const [result, setResult] = useState<SaveConfirmationEmailResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const previewHtml = useMemo(() => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : ""
    return previewConfirmationEmailHtml(body || "<p></p>", siteUrl)
  }, [body])

  function onSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveConfirmationEmail({ subject, bodyHtml: body })
      setResult(res)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Confirmation Email</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Edit the subject and wording of the email new users receive to confirm their address. The confirmation link
          and its authentication are fixed and always included.
        </p>
      </div>

      {!livePublishConfigured ? (
        <div
          className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <strong className="font-medium text-foreground">Draft mode.</strong> Live publishing is not configured yet, so
          Save stores your wording as a draft without changing the email new users currently receive. Live publishing is
          pinned to the <code className="rounded bg-background px-1 py-0.5 text-xs">gigstar-production</code> Supabase
          project and only activates once{" "}
          <code className="rounded bg-background px-1 py-0.5 text-xs">SUPABASE_ACCESS_TOKEN</code> is set in the Vercel
          Production environment and a test signup is verified.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content</CardTitle>
          <CardDescription>
            Wording only. You can use basic HTML (for example {"<p>"}, {"<strong>"}, {"<a>"}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Confirm your email for GigStar"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Email wording</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="<p>Welcome to GigStar!</p>"
            />
          </div>

          <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Fixed confirmation link (not editable): </span>
            <code className="break-all">{CONFIRMATION_LINK_HREF}</code>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Hide preview" : "Preview"}
            </Button>
            <Button type="button" onClick={onSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>

          {result ? (
            <p
              className={result.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}
              role={result.ok ? "status" : "alert"}
            >
              {result.ok
                ? result.published
                  ? "Saved and published to the live confirmation email."
                  : `Saved as draft. ${result.publishReason ?? ""}`.trim()
                : (result.error ?? "Could not save.")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {showPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>
              Subject: <span className="font-medium text-foreground">{subject || "(no subject)"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-md border border-border bg-white p-6 text-black"
              // Preview of admin-authored wording composed with the fixed link.
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The link above uses a sample token for preview. The real token is injected by Supabase when the email is
              sent.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
