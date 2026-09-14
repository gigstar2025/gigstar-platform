'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ChipsEditorProps {
  label: string
  hint?: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

/** Tag-style editor for a list of short strings (genres, categories, chips). */
export function ChipsEditor({ label, hint, values, onChange, placeholder }: ChipsEditorProps) {
  const [entry, setEntry] = useState('')

  function add() {
    const v = entry.trim()
    if (!v || values.includes(v)) {
      setEntry('')
      return
    }
    onChange([...values, v])
    setEntry('')
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <li
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 py-1 pl-3 pr-1 text-sm"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label={`Remove ${v}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={entry}
          placeholder={placeholder ?? 'Add and press Enter'}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  )
}

interface ParagraphsEditorProps {
  label: string
  hint?: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

/** Editor for an ordered list of paragraphs (e.g. the About/bio module). */
export function ParagraphsEditor({ label, hint, values, onChange, placeholder }: ParagraphsEditorProps) {
  const rows = values.length > 0 ? values : ['']

  function setAt(index: number, text: string) {
    const next = [...rows]
    next[index] = text
    onChange(next.filter((p, i) => p.trim().length > 0 || i < next.length - 1 || p.length > 0))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-3">
        {rows.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              rows={3}
              value={p}
              placeholder={placeholder}
              onChange={(e) => setAt(i, e.target.value)}
            />
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                aria-label={`Remove paragraph ${i + 1}`}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, ''])}>
          <Plus className="size-4" /> Add paragraph
        </Button>
      </div>
    </div>
  )
}
