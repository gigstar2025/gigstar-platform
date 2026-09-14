'use client'

import { Info } from 'lucide-react'
import type { ProfileDraft } from '@/lib/profiles/editor/types'
import type { Errors } from '@/lib/profiles/editor/validation'
import { Switch } from '@/components/ui/switch'
import { TextField } from '../controls'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  errors: Errors
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
}

export function ContactPanel({ draft, errors, update }: Props) {
  const { base, settings } = draft

  function set<K extends keyof typeof base>(key: K, value: (typeof base)[K]) {
    update((d) => ({ ...d, base: { ...d.base, [key]: value } }))
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Contact & enquiries"
        description="Booking details and how people reach you. The public profile renders a type-specific enquiry form from these settings."
      />

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <TextField
          label="Contact email"
          type="email"
          required
          hint="Where enquiry notifications would be sent (not shown publicly in full)."
          value={base.contactEmail}
          error={errors.contactEmail}
          onChange={(v) => set('contactEmail', v)}
        />
        <TextField
          label="Booking price guide"
          hint="Optional. Shown as a guide, e.g. “From £450 / set”."
          value={base.bookingPrice ?? ''}
          onChange={(v) => set('bookingPrice', v)}
        />
        <TextField
          label="Availability note"
          hint="Optional. e.g. “Booking Fri & Sat nights — Spring 2026”."
          value={base.availability ?? ''}
          onChange={(v) => set('availability', v)}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Accept enquiries</p>
            <p className="text-xs text-muted-foreground">
              When off, the enquiry form is replaced with a note that bookings are closed.
            </p>
          </div>
          <Switch
            checked={settings.allowEnquiries}
            onCheckedChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, allowEnquiries: v } }))}
            aria-label="Accept enquiries"
          />
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          This is a front-end prototype. Submitting an enquiry on the public profile shows a confirmation only — no message is sent or stored.
        </p>
      </section>
    </div>
  )
}
