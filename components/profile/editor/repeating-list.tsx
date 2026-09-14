'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoveControls, moveItem, type MoveAction } from './move-controls'

interface Props<T> {
  items: T[]
  onChange: (items: T[]) => void
  render: (item: T, index: number, patch: (p: Partial<T>) => void) => React.ReactNode
  newItem: () => T
  addLabel: string
  itemLabel: (item: T, index: number) => string
  emptyLabel?: string
  /** Cap the number of items (optional). */
  max?: number
}

/** Generic add / remove / reorder list used by every module content editor. */
export function RepeatingList<T>({
  items,
  onChange,
  render,
  newItem,
  addLabel,
  itemLabel,
  emptyLabel = 'Nothing here yet.',
  max,
}: Props<T>) {
  function patchAt(index: number, patch: Partial<T>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const atMax = typeof max === 'number' && items.length >= max

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {itemLabel(item, i) || `Item ${i + 1}`}
                </span>
                <div className="flex items-center gap-1">
                  <MoveControls
                    index={i}
                    count={items.length}
                    labelPrefix="item"
                    onMove={(a: MoveAction) => onChange(moveItem(items, i, a))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${itemLabel(item, i) || `item ${i + 1}`}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3">{render(item, i, (p) => patchAt(i, p))}</div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={atMax}
          onClick={() => onChange([...items, newItem()])}
        >
          <Plus className="size-4" /> {addLabel}
        </Button>
        {atMax ? <span className="ml-3 text-xs text-muted-foreground">Maximum reached.</span> : null}
      </div>
    </div>
  )
}

let counter = 0
export function genId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
