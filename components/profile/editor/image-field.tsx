'use client'

import { useState } from 'react'
import { ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MediaLibraryDialog } from './media-library-dialog'

interface Props {
  label: string
  value?: string
  onChange: (src: string | undefined) => void
  hint?: string
  aspect?: 'square' | 'wide'
  removable?: boolean
}

export function ImageField({ label, value, onChange, hint, aspect = 'wide', removable = true }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted',
            aspect === 'square' ? 'size-24' : 'aspect-video w-40',
          )}
        >
          {value ? (
            <img src={value || '/placeholder.svg'} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="size-4" /> {value ? 'Replace' : 'Add image'}
          </Button>
          {removable && value ? (
            <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>

      <MediaLibraryDialog
        open={open}
        current={value}
        onClose={() => setOpen(false)}
        onSelect={(src) => onChange(src)}
      />
    </div>
  )
}
