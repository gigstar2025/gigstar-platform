'use client'

import Link from 'next/link'
import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TYPE_LABELS } from '@/lib/profiles/showcase/types'
import type { ManagedProfile } from '@/lib/profiles/editor/types'
import { EditorModal } from './editor-modal'

interface Props {
  profiles: ManagedProfile[]
  selectedId: string
  isPublic: boolean
  onSelect: (profile: ManagedProfile) => void
}

export function ManagedProfileSelector({ profiles, selectedId, isPublic, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const active = profiles.find((p) => p.id === selectedId) ?? profiles[0]

  function choose(p: ManagedProfile) {
    setOpen(false)
    if (p.id !== selectedId) onSelect(p)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/40 sm:w-auto sm:min-w-[19rem]"
        aria-haspopup="dialog"
      >
        <img
          src={active.avatar || '/placeholder.svg'}
          alt=""
          className="size-11 shrink-0 rounded-lg object-cover"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {active.displayName}
            </span>
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                isPublic ? 'bg-emerald-500' : 'bg-amber-500',
              )}
              aria-hidden
            />
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {TYPE_LABELS[active.type]} · {active.role}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <EditorModal
        open={open}
        onClose={() => setOpen(false)}
        title="Switch managed profile"
        description="Choose which professional profile to edit. Switching updates the editor, module library and preview."
        size="md"
      >
        <ul className="flex flex-col gap-2">
          {profiles.map((p) => {
            const selected = p.id === selectedId
            return (
              <li key={p.id}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3',
                    selected ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <img src={p.avatar || '/placeholder.svg'} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{p.displayName}</p>
                      {selected ? <Check className="size-4 text-primary" aria-label="Currently editing" /> : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">{TYPE_LABELS[p.type]}</Badge>
                      <span className="text-xs text-muted-foreground">{p.role}</span>
                      <Link
                        href={`/p/${p.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        target="_blank"
                      >
                        Public profile <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                  {!selected ? (
                    <button
                      type="button"
                      onClick={() => choose(p)}
                      className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </EditorModal>
    </>
  )
}
