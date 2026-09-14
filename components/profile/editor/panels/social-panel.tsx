'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ProfileDraft } from '@/lib/profiles/editor/types'
import type { Errors } from '@/lib/profiles/editor/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoveControls, moveItem, type MoveAction } from '../move-controls'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  errors: Errors
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
}

const SUGGESTED = ['Instagram', 'SoundCloud', 'Mixcloud', 'Spotify', 'YouTube', 'TikTok', 'Bandcamp', 'Facebook']

export function SocialPanel({ draft, errors, update }: Props) {
  const socials = draft.base.socials

  function setSocials(next: typeof socials) {
    update((d) => ({ ...d, base: { ...d.base, socials: next } }))
  }

  function updateAt(i: number, patch: Partial<(typeof socials)[number]>) {
    setSocials(socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Social links"
        description="Links shown in your profile header. Order controls how they appear left to right."
      />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        {socials.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No social links yet. Add your first one below.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {socials.map((s, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-start">
                <div className="grid flex-1 gap-2 sm:grid-cols-[10rem_1fr]">
                  <Input
                    aria-label={`Platform for link ${i + 1}`}
                    value={s.platform}
                    placeholder="Platform"
                    list="social-suggestions"
                    onChange={(e) => updateAt(i, { platform: e.target.value })}
                  />
                  <div className="flex flex-col gap-1">
                    <Input
                      aria-label={`URL for ${s.platform || `link ${i + 1}`}`}
                      value={s.url}
                      placeholder="https://"
                      aria-invalid={Boolean(errors[`social-${i}`])}
                      onChange={(e) => updateAt(i, { url: e.target.value })}
                    />
                    {errors[`social-${i}`] ? (
                      <p className="text-xs font-medium text-destructive">{errors[`social-${i}`]}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MoveControls
                    index={i}
                    count={socials.length}
                    labelPrefix="link"
                    onMove={(a: MoveAction) => setSocials(moveItem(socials, i, a))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSocials(socials.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${s.platform || `link ${i + 1}`}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <datalist id="social-suggestions">
          {SUGGESTED.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSocials([...socials, { platform: '', url: '' }])}
          >
            <Plus className="size-4" /> Add social link
          </Button>
        </div>
      </section>
    </div>
  )
}
