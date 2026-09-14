'use client'

import { useState } from 'react'
import { ImageIcon, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaLibraryDialog } from './media-library-dialog'

interface Props {
  label: string
  value?: string
  onChange: (src: string | undefined) => void
}

/** Compact image picker for use inside dense repeating-item forms. */
export function ImageInline({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {value ? (
          <img src={value || '/placeholder.svg'} alt={`${label} preview`} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="size-3.5" /> {value ? 'Replace' : 'Choose'}
          </Button>
          {value ? (
            <Button variant="ghost" size="icon" onClick={() => onChange(undefined)} aria-label={`Remove ${label}`}>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <MediaLibraryDialog open={open} current={value} onClose={() => setOpen(false)} onSelect={(src) => onChange(src)} />
    </div>
  )
}
