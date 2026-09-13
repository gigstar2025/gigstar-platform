'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HIGHLIGHTS, type Highlight } from '@/lib/home/feed-data'

// ProfileHighlight row — stories-style circular highlights. Clicking opens a
// lightweight prototype viewer (no stories backend).
export function ProfileHighlights() {
  const [active, setActive] = useState<Highlight | null>(null)

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {HIGHLIGHTS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setActive(h)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                'grid size-16 place-items-center rounded-full p-0.5',
                h.live ? 'bg-gradient-to-tr from-primary to-primary/40' : 'bg-border',
              )}
            >
              <span className="block size-full overflow-hidden rounded-full border-2 border-background">
                <img src={h.image || '/placeholder.svg'} alt="" className="size-full object-cover" />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs text-muted-foreground">{h.label}</span>
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${active.label} highlight`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4 backdrop-blur"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-muted text-foreground"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <X className="size-5" />
          </button>
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-x-3 top-3 z-10 h-1 overflow-hidden rounded-full bg-background/40">
              <div className="h-full w-1/3 rounded-full bg-background" />
            </div>
            <img src={active.image || '/placeholder.svg'} alt={active.label} className="aspect-[9/16] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4">
              <p className="font-display text-lg font-semibold">{active.label}</p>
              <p className="text-sm text-muted-foreground">Preview · tap outside to close</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
