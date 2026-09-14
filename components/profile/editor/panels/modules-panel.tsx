'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Pencil,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProfileDraft, SectionKey } from '@/lib/profiles/editor/types'
import { MODULE_REGISTRY, moduleLabel } from '@/lib/profiles/editor/module-registry'
import { ensureModuleContent } from '@/lib/profiles/editor/draft'
import { moduleHasContent } from '@/lib/profiles/editor/validation'
import { MoveControls, moveItem, type MoveAction } from '../move-controls'
import { AddModuleDialog } from '../add-module-dialog'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
  onEditModule: (key: SectionKey) => void
}

export function ModulesPanel({ draft, update, onEditModule }: Props) {
  const [adding, setAdding] = useState(false)
  const enabled = draft.modules.filter((m) => m.enabled)
  const hidden = draft.modules.filter((m) => !m.enabled)

  function reorderEnabled(from: number, action: MoveAction) {
    update((d) => {
      const on = d.modules.filter((m) => m.enabled)
      const off = d.modules.filter((m) => !m.enabled)
      const moved = moveItem(on, from, action)
      return { ...d, modules: [...moved, ...off] }
    })
  }

  function setEnabled(key: SectionKey, value: boolean) {
    update((d) => ({
      ...d,
      modules: d.modules.map((m) => (m.key === key ? { ...m, enabled: value } : m)),
    }))
  }

  function addModule(key: SectionKey) {
    update((d) => {
      const next = { ...d }
      const exists = next.modules.some((m) => m.key === key)
      next.modules = exists
        ? next.modules.map((m) => (m.key === key ? { ...m, enabled: true } : m))
        : [...next.modules, { key, enabled: true }]
      ensureModuleContent(next, key)
      return next
    })
    setAdding(false)
    onEditModule(key)
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Modules"
        description="Turn profile sections on or off and set their order. Required modules stay on. Some modules can also surface your content in GigStar discovery."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add module
          </Button>
        }
      />

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Eye className="size-4" /> Active on your profile
          <span className="text-xs font-normal text-muted-foreground">({enabled.length})</span>
        </h3>
        <ul className="flex flex-col gap-2">
          {enabled.map((m, i) => (
            <ModuleRow
              key={m.key}
              draft={draft}
              moduleKey={m.key}
              index={i}
              count={enabled.length}
              onMove={(a) => reorderEnabled(i, a)}
              onEdit={() => onEditModule(m.key)}
              onHide={() => setEnabled(m.key, false)}
            />
          ))}
        </ul>
      </section>

      {hidden.length > 0 ? (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <EyeOff className="size-4" /> Hidden
            <span className="text-xs font-normal">({hidden.length})</span>
          </h3>
          <ul className="flex flex-col gap-2">
            {hidden.map((m) => {
              const def = MODULE_REGISTRY[m.key]
              return (
                <li
                  key={m.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {moduleLabel(m.key, draft.type)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Hidden from your public profile. Content is kept.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEnabled(m.key, true)}>
                    <Eye className="size-4" /> Show
                  </Button>
                  {/* def referenced to keep content intent explicit */}
                  <span className="sr-only">{def.description}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <AddModuleDialog
        open={adding}
        draft={draft}
        onClose={() => setAdding(false)}
        onAdd={addModule}
      />
    </div>
  )
}

function ModuleRow({
  draft,
  moduleKey,
  index,
  count,
  onMove,
  onEdit,
  onHide,
}: {
  draft: ProfileDraft
  moduleKey: SectionKey
  index: number
  count: number
  onMove: (a: MoveAction) => void
  onEdit: () => void
  onHide: () => void
}) {
  const def = MODULE_REGISTRY[moduleKey]
  const hasContent = moduleHasContent(draft, def.dataField)
  const editable = def.dataField !== 'contactEmail' // contact edited in its own panel

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      <MoveControls
        index={index}
        count={count}
        labelPrefix={moduleLabel(moduleKey, draft.type)}
        onMove={onMove}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{moduleLabel(moduleKey, draft.type)}</span>
          {def.required ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Lock className="size-3" /> Required
            </Badge>
          ) : null}
          {def.canFeedDiscovery ? (
            <Badge className="gap-1 border-0 bg-primary/10 text-[10px] text-primary">
              <Globe className="size-3" /> Discovery
            </Badge>
          ) : null}
          {!hasContent ? (
            <Badge className="gap-1 border-0 bg-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" /> Empty
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{def.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {editable ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" /> Edit
          </Button>
        ) : null}
        {def.canHide ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHide}
            className={cn(!def.canHide && 'hidden')}
          >
            <EyeOff className="size-4" /> Hide
          </Button>
        ) : null}
      </div>
    </li>
  )
}
