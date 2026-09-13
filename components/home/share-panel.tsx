'use client'

import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'

const TARGETS = ['Copy link', 'Instagram', 'WhatsApp', 'X', 'Facebook', 'Messages']

// SharePanel — mock share sheet. "Copy link" copies a placeholder URL; other
// targets are visual only.
export function SharePanel({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    try {
      navigator.clipboard?.writeText('https://gigstar.co.uk/share/demo')
    } catch {
      // ignore — prototype only
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Share</p>
        <button type="button" onClick={onClose} aria-label="Close share" className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={t === 'Copy link' ? copy : undefined}
            className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <span className="grid size-9 place-items-center rounded-full bg-background text-sm font-semibold text-foreground">
              {t === 'Copy link' ? (
                copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />
              ) : (
                t[0]
              )}
            </span>
            {t === 'Copy link' && copied ? 'Copied!' : t}
          </button>
        ))}
      </div>
    </div>
  )
}
