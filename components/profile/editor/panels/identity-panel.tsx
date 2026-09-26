'use client'

import { BadgeCheck } from 'lucide-react'
import type { ProfileDraft } from '@/lib/profiles/editor/types'
import type { Errors } from '@/lib/profiles/editor/validation'
import { TYPE_LABELS } from '@/lib/profiles/showcase/types'
import { TextField } from '../controls'
import { ChipsEditor } from '../list-editor'
import { ImageField } from '../image-field'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  errors: Errors
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
}

const CHIP_LABEL: Record<string, { label: string; hint: string; placeholder: string }> = {
  dj: { label: 'Genres', hint: 'The styles you play. Shown as tags and used in discovery.', placeholder: 'e.g. Melodic House' },
  artist: { label: 'Genres', hint: 'Your musical styles. Shown as tags and used in discovery.', placeholder: 'e.g. Indie Rock' },
  venue: { label: 'Categories', hint: 'What defines the space. Shown as tags and used in discovery.', placeholder: 'e.g. Live music' },
  organiser: { label: 'Categories', hint: 'The kind of events you run. Shown as tags.', placeholder: 'e.g. Warehouse events' },
}

export function IdentityPanel({ draft, errors, update }: Props) {
  const { base } = draft
  const isLogo = base.type === 'venue' || base.type === 'organiser'
  const chip = CHIP_LABEL[base.type] ?? CHIP_LABEL.dj

  function set<K extends keyof typeof base>(key: K, value: (typeof base)[K]) {
    update((d) => ({ ...d, base: { ...d.base, [key]: value } }))
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Identity"
        description="Your public name, tagline, images and headline details. These appear in the profile header and across discovery."
      />

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          This is an example profile for the showcase. Images picked here are kept with your local draft only. Real
          profiles now upload a profile photo to our servers from the profile editor, where it&apos;s saved and shown
          publicly.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageField
            label="Cover image"
            hint="Wide banner behind the header (recommended 1600×600)."
            value={base.cover}
            aspect="wide"
            onChange={(src) => set('cover', src ?? '')}
          />
          <ImageField
            label={isLogo ? 'Logo' : 'Profile photo'}
            hint={isLogo ? 'Square logo shown in the header.' : 'Square headshot shown in the header.'}
            value={base.avatar}
            aspect="square"
            onChange={(src) => set('avatar', src ?? '')}
          />
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-primary">
            {TYPE_LABELS[base.type]}
          </span>
          {base.verified ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <BadgeCheck className="size-4" /> Verified
            </span>
          ) : null}
          <span className="text-xs">Profile type is fixed for this example.</span>
        </div>

        <TextField
          label="Display name"
          required
          value={base.displayName}
          error={errors.displayName}
          onChange={(v) => set('displayName', v)}
        />
        <TextField
          label="Tagline"
          required
          hint="One line that sums you up. Shown under your name."
          value={base.tagline}
          error={errors.tagline}
          onChange={(v) => set('tagline', v)}
        />
        <TextField
          label="Public location"
          required
          hint="City or region shown publicly."
          value={base.location}
          error={errors.location}
          onChange={(v) => set('location', v)}
        />
        <TextField
          label="Website"
          type="url"
          placeholder="https://"
          value={base.website ?? ''}
          error={errors.website}
          onChange={(v) => set('website', v)}
        />
        <ChipsEditor
          label={chip.label}
          hint={chip.hint}
          placeholder={chip.placeholder}
          values={base.chips}
          onChange={(v) => set('chips', v)}
        />
      </section>
    </div>
  )
}
