'use client'

import { RotateCcw } from 'lucide-react'
import type { ProfileDraft, ProfileSettings } from '@/lib/profiles/editor/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PanelHeader } from './panel-header'

interface Props {
  draft: ProfileDraft
  update: (recipe: (d: ProfileDraft) => ProfileDraft) => void
  onResetToExample: () => void
}

interface ToggleRow {
  key: keyof ProfileSettings
  label: string
  description: string
}

const TOGGLES: ToggleRow[] = [
  { key: 'isPublic', label: 'Profile is public', description: 'When off, the public URL shows a private notice instead of the profile.' },
  { key: 'showFollowerCount', label: 'Show follower count', description: 'Display the follower number in the profile header.' },
  { key: 'showReviewSummary', label: 'Show review summary', description: 'Show the average rating and review count in the header.' },
  { key: 'showApproxLocation', label: 'Show approximate location', description: 'Display your public city/region on the profile.' },
]

const ENQUIRY_TYPES = ['Booking enquiry', 'General enquiry', 'Availability check', 'Press & media']

export function SettingsPanel({ draft, update, onResetToExample }: Props) {
  const { settings } = draft

  function setSetting<K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) {
    update((d) => ({ ...d, settings: { ...d.settings, [key]: value } }))
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Settings"
        description="Prototype profile settings for visibility and enquiries. Account, billing and security settings will live elsewhere."
      />

      <section className="flex flex-col divide-y divide-border/60 rounded-xl border border-border bg-card">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <Switch
              checked={Boolean(settings[t.key])}
              onCheckedChange={(v) => setSetting(t.key, v as never)}
              aria-label={t.label}
            />
          </div>
        ))}
      </section>

      <section className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Default enquiry type
          <Select value={settings.defaultEnquiryType} onValueChange={(v) => v && setSetting('defaultEnquiryType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENQUIRY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Content visibility
          <Select
            value={settings.contentVisibility}
            onValueChange={(v) => v && setSetting('contentVisibility', v as ProfileSettings['contentVisibility'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Everyone</SelectItem>
              <SelectItem value="followers">Followers only</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Reset to original example</p>
          <p className="text-xs text-muted-foreground">
            Discard all local edits for this profile and restore the original example content. This clears the saved draft on this device.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={onResetToExample} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <RotateCcw className="size-4" /> Reset this profile
          </Button>
        </div>
      </section>
    </div>
  )
}
