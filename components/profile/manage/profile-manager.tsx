"use client"

import { useState, useTransition } from "react"
import {
  Archive,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Star,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { EditorModal } from "@/components/profile/editor/editor-modal"
import { cn } from "@/lib/utils"
import { TYPE_LABELS } from "@/lib/profiles/showcase/types"
import type { ManagedProfile, ProfileManagerData } from "@/lib/profiles/manage"
import type { MembershipRole, ProfileVisibility } from "@/lib/db/types"
import {
  archiveProfileAction,
  createAnotherProfileAction,
  setDefaultProfileAction,
  switchActiveProfileAction,
} from "@/app/profiles/manage/actions"

const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: "Owner",
  administrator: "Admin",
  editor: "Editor",
  event_manager: "Event manager",
  content_contributor: "Contributor",
  analyst: "Analyst",
}

const VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Public",
  hidden: "Hidden",
  unlisted: "Unlisted",
}

function monogram(name: string): string {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "")
  return letters.join("").toUpperCase() || "?"
}

export function ProfileManager({ data }: { data: ProfileManagerData }) {
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<ManagedProfile | null>(null)
  const [replacementId, setReplacementId] = useState<string>("")

  const otherActive = archiveTarget
    ? data.active.filter((p) => p.id !== archiveTarget.id)
    : []
  const archivingDefault = archiveTarget != null && archiveTarget.id === data.defaultProfileId
  const isLastActive = archiveTarget != null && data.active.length === 1
  const needsReplacement = archivingDefault && otherActive.length > 0

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      const result = await fn()
      setBusyId(null)
      if (!result.ok && result.error) setError(result.error)
    })
  }

  function handleCreate() {
    setError(null)
    setBusyId("create")
    startTransition(async () => {
      const result = await createAnotherProfileAction()
      // On success the action redirects and this line is never reached.
      setBusyId(null)
      if (!result.ok && result.error) setError(result.error)
    })
  }

  function confirmArchive() {
    if (!archiveTarget) return
    const target = archiveTarget
    const replacement = needsReplacement ? replacementId : undefined
    if (needsReplacement && !replacement) {
      setError("Choose which profile becomes your default.")
      return
    }
    run(target.id, () => archiveProfileAction(target.id, replacement))
    // Optimistically close; any error surfaces in the page-level banner.
    setArchiveTarget(null)
    setReplacementId("")
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
            Your profiles
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.activeCount} of {data.maxActive} active {data.activeCount === 1 ? "profile" : "profiles"}
            {" · "}Switch between them, set your default, or archive the ones you no longer run.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button onClick={handleCreate} disabled={!data.canCreate || pending}>
            {busyId === "create" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Create profile
          </Button>
          {!data.canCreate ? (
            <span className="text-xs text-muted-foreground">
              Archive a profile to free up a slot.
            </span>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section aria-labelledby="active-heading" className="flex flex-col gap-3">
        <h2 id="active-heading" className="sr-only">
          Active profiles
        </h2>
        {data.active.map((profile) => {
          const isDefault = profile.id === data.defaultProfileId
          const isActive = profile.id === data.activeProfileId
          const rowBusy = busyId === profile.id && pending
          return (
            <article
              key={profile.id}
              className={cn(
                "flex flex-col gap-4 rounded-xl border bg-card p-4 transition-colors sm:flex-row sm:items-center",
                isActive ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                >
                  {monogram(profile.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {profile.displayName}
                    </span>
                    {isDefault ? (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="size-3 fill-current" />
                        Default
                      </Badge>
                    ) : null}
                    {isActive ? (
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {TYPE_LABELS[profile.type]} · {ROLE_LABELS[profile.role]} · @{profile.slug}
                    {" · "}
                    {VISIBILITY_LABELS[profile.visibility]}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {!isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => run(profile.id, () => switchActiveProfileAction(profile.id))}
                    disabled={pending}
                  >
                    {rowBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                    Switch to
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 text-xs font-medium text-primary">
                    <Check className="size-4" />
                    Active
                  </span>
                )}
                {!isDefault ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => run(profile.id, () => setDefaultProfileAction(profile.id))}
                    disabled={pending}
                  >
                    <Star className="size-4" />
                    Set default
                  </Button>
                ) : null}
                <a
                  href={`/profile/${profile.slug}/edit`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <Pencil className="size-4" />
                  Edit
                </a>
                <a
                  href={`/p/${profile.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <ExternalLink className="size-4" />
                  Open
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setError(null)
                    setReplacementId("")
                    setArchiveTarget(profile)
                  }}
                  disabled={pending}
                >
                  <Archive className="size-4" />
                  Archive
                </Button>
              </div>
            </article>
          )
        })}
      </section>

      {data.archived.length > 0 ? (
        <ArchivedSection profiles={data.archived} />
      ) : null}

      <EditorModal
        open={archiveTarget != null}
        onClose={() => {
          setArchiveTarget(null)
          setReplacementId("")
        }}
        size="md"
        title="Archive this profile?"
        description={
          archiveTarget
            ? `${archiveTarget.displayName} will be hidden from discovery and moved to your archived list.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setArchiveTarget(null)
                setReplacementId("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmArchive}
              disabled={isLastActive || (needsReplacement && !replacementId)}
            >
              <Archive className="size-4" />
              Archive profile
            </Button>
          </>
        }
      >
        {isLastActive ? (
          <p className="text-sm text-muted-foreground">
            This is your only active profile, so it can&apos;t be archived. Create another
            profile first if you want to step away from this one.
          </p>
        ) : needsReplacement ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This is your default profile. Pick which profile should become your new default:
            </p>
            <label htmlFor="replacement-default" className="sr-only">
              New default profile
            </label>
            <div className="relative">
              <select
                id="replacement-default"
                value={replacementId}
                onChange={(e) => setReplacementId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Choose a profile…
                </option>
                {otherActive.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({TYPE_LABELS[p.type]})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can restore an archived profile later — archiving is reversible and never deletes
            your content.
          </p>
        )}
      </EditorModal>
    </div>
  )
}

function ArchivedSection({ profiles }: { profiles: ManagedProfile[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section aria-labelledby="archived-heading" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        <span id="archived-heading">
          Archived ({profiles.length})
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4"
            >
              <div
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground"
              >
                {monogram(profile.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="truncate font-medium text-muted-foreground">
                  {profile.displayName}
                </span>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {TYPE_LABELS[profile.type]} · @{profile.slug} · Archived
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
