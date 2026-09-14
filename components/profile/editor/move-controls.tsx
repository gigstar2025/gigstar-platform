'use client'

import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type MoveAction = 'up' | 'down' | 'top' | 'bottom'

interface Props {
  index: number
  count: number
  onMove: (action: MoveAction) => void
  labelPrefix?: string
  className?: string
}

/** Keyboard-accessible reordering controls (no drag required). */
export function MoveControls({ index, count, onMove, labelPrefix = 'item', className }: Props) {
  const isFirst = index === 0
  const isLast = index === count - 1
  const btn =
    'grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <button type="button" className={btn} disabled={isFirst} onClick={() => onMove('top')} aria-label={`Move ${labelPrefix} to top`}>
        <ArrowUpToLine className="size-4" />
      </button>
      <button type="button" className={btn} disabled={isFirst} onClick={() => onMove('up')} aria-label={`Move ${labelPrefix} up`}>
        <ChevronUp className="size-4" />
      </button>
      <button type="button" className={btn} disabled={isLast} onClick={() => onMove('down')} aria-label={`Move ${labelPrefix} down`}>
        <ChevronDown className="size-4" />
      </button>
      <button type="button" className={btn} disabled={isLast} onClick={() => onMove('bottom')} aria-label={`Move ${labelPrefix} to bottom`}>
        <ArrowDownToLine className="size-4" />
      </button>
    </div>
  )
}

/** Pure helper: return a new array with the item at `index` moved. */
export function moveItem<T>(arr: T[], index: number, action: MoveAction): T[] {
  const next = [...arr]
  const [item] = next.splice(index, 1)
  if (action === 'up') next.splice(Math.max(0, index - 1), 0, item)
  else if (action === 'down') next.splice(Math.min(next.length, index + 1), 0, item)
  else if (action === 'top') next.unshift(item)
  else next.push(item)
  return next
}
