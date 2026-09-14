'use client'

import { Globe, Plus } from 'lucide-react'
import type { ProfileDraft, SectionKey } from '@/lib/profiles/editor/types'
import { Badge } from '@/components/ui/badge'
import {
  EDITOR_GROUPS,
  MODULE_REGISTRY,
  moduleLabel,
  type EditorGroup,
} from '@/lib/profiles/editor/module-registry'
import { addableModuleKeys } from '@/lib/profiles/editor/draft'
import { EditorModal } from './editor-modal'

interface Props {
  open: boolean
  draft: ProfileDraft
  onClose: () => void
  onAdd: (key: SectionKey) => void
}

export function AddModuleDialog({ open, draft, onClose, onAdd }: Props) {
  const addable = addableModuleKeys(draft)
  const byGroup = EDITOR_GROUPS.map((group) => ({
    group,
    keys: addable.filter((k) => MODULE_REGISTRY[k].group === group),
  })).filter((g) => g.keys.length > 0)

  return (
    <EditorModal
      open={open}
      onClose={onClose}
      title="Add a module"
      description={`Only modules relevant to a ${draft.type} profile are shown. Modules already on your profile are hidden.`}
      size="lg"
    >
      {addable.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Every module available for this profile type is already in use.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {byGroup.map(({ group, keys }) => (
            <GroupBlock key={group} group={group} keys={keys} draft={draft} onAdd={onAdd} />
          ))}
        </div>
      )}
    </EditorModal>
  )
}

function GroupBlock({
  group,
  keys,
  draft,
  onAdd,
}: {
  group: EditorGroup
  keys: SectionKey[]
  draft: ProfileDraft
  onAdd: (key: SectionKey) => void
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {keys.map((key) => {
          const def = MODULE_REGISTRY[key]
          const recommended = def.recommendedFor.includes(draft.type)
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onAdd(key)}
                className="flex h-full w-full flex-col gap-1.5 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{moduleLabel(key, draft.type)}</span>
                  {recommended ? (
                    <Badge className="border-0 bg-primary/15 text-[10px] text-primary">Recommended</Badge>
                  ) : null}
                  {def.canFeedDiscovery ? (
                    <span title="Can appear in discovery" className="text-muted-foreground">
                      <Globe className="size-3.5" />
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">{def.description}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary">
                  <Plus className="size-3.5" /> Add module
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
