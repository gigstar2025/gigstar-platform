'use client'

import { ArrowRight, Blocks, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorSectionId, ProfileDraft } from '@/lib/profiles/editor/types'
import { TYPE_LABELS } from '@/lib/profiles/showcase/types'
import type { CompletionResult } from '@/lib/profiles/editor/completion'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  completion: CompletionResult
  onNavigate: (section: EditorSectionId) => void
}

export function OverviewPanel({ draft, completion, onNavigate }: Props) {
  const activeModules = draft.modules.filter((m) => m.enabled).length

  const stats = [
    { label: 'Profile type', value: TYPE_LABELS[draft.type] },
    { label: 'Active modules', value: String(activeModules) },
    {
      label: 'Visibility',
      value: draft.settings.isPublic ? 'Public' : 'Private',
      icon: draft.settings.isPublic ? Eye : EyeOff,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title={`Editing ${draft.base.displayName}`}
        description="A summary of this profile's completeness and what to tackle next. Everything here is a front-end prototype driven by example data."
      />

      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <span className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
                {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                {s.value}
              </span>
            </div>
          )
        })}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Profile completion</h3>
            <p className="text-xs text-muted-foreground">Based on your essentials and recommended modules.</p>
          </div>
          <span className="font-mono text-2xl font-semibold text-primary">{completion.percent}%</span>
        </div>
        <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion.percent}%` }} />
        </div>

        <ul className="flex flex-col gap-1.5">
          {completion.checks.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onNavigate(c.section)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                {c.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn('flex-1 text-sm', c.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  {c.label}
                  {c.optional ? <span className="ml-2 text-xs text-muted-foreground">optional</span> : null}
                </span>
                {!c.done ? (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onNavigate('modules')}
          className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Blocks className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Manage modules</span>
            <span className="block text-xs text-muted-foreground">Add, reorder, hide sections</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('preview')}
          className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Eye className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Preview profile</span>
            <span className="block text-xs text-muted-foreground">See the public view</span>
          </span>
        </button>
      </section>
    </div>
  )
}
