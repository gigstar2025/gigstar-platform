"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ISSUE_CATEGORIES, type IssueCategory } from "@/lib/admin/issues"

import { createIssue } from "./actions"

export function NewIssueForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<IssueCategory>("bug")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitle("")
    setDescription("")
    setCategory("bug")
    setError(null)
  }

  function onSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await createIssue({ title, description, category })
      if (!res.ok) {
        setError(res.error ?? "Could not create the issue.")
        return
      }
      reset()
      setOpen(false)
      if (res.id) router.push(`/admin/issues/${res.id}`)
      else router.refresh()
    })
  }

  if (!open) {
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          New issue
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New issue</CardTitle>
        <CardDescription>Record a bug, improvement, or task. All admins are emailed when you create it.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="issue-title">Title</Label>
          <Input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the issue"
            maxLength={200}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="issue-category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
            <SelectTrigger id="issue-category" className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="issue-description">Description</Label>
          <Textarea
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What needs doing, and any detail that helps."
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Creating…" : "Create issue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              setOpen(false)
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
