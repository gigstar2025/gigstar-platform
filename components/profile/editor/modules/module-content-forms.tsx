'use client'

// ---------------------------------------------------------------------------
// Per-module content editors for the DB-backed modular profile editor (PR-5b).
//
// Each form is a controlled component over the canonical content shape from
// lib/profiles/modules/content.ts. They never touch the network: the parent
// (db-module-editor) owns draft state, validation, saving and publishing.
//
// Photo/gallery uploads depend on Supabase Storage and are explicitly out of
// scope here (PR-5c); the four supported editors are audio, videos, radio and
// gigs.
// ---------------------------------------------------------------------------

import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  AudioContent,
  GigsContent,
  GigStatus,
  MixProvider,
  RadioContent,
  VideoProvider,
  VideosContent,
} from '@/lib/profiles/modules/content'
import type { ModuleKey } from '@/lib/profiles/modules/registry'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/** Build empty, valid-by-shape content for a module key. */
export function emptyContentFor(key: ModuleKey): unknown {
  switch (key) {
    case 'audio':
      return { items: [] } satisfies AudioContent
    case 'videos':
      return { items: [] } satisfies VideosContent
    case 'radio':
      return {
        radio: { stationName: '', streamUrl: '', showTitle: '', schedule: '', onAir: false },
      } satisfies RadioContent
    case 'gigs':
      return { gigs: [] } satisfies GigsContent
    case 'gallery':
      return { photos: [] }
  }
}

const GIG_STATUS_OPTIONS: { value: GigStatus; label: string }[] = [
  { value: 'on-sale', label: 'On sale' },
  { value: 'free', label: 'Free entry' },
  { value: 'selling-fast', label: 'Selling fast' },
  { value: 'last-tickets', label: 'Last tickets' },
  { value: 'sold-out', label: 'Sold out' },
  { value: 'coming-soon', label: 'Coming soon' },
]

const AUDIO_PROVIDERS: { value: MixProvider; label: string }[] = [
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'mixcloud', label: 'Mixcloud' },
  { value: 'other', label: 'Other' },
]

const VIDEO_PROVIDERS: { value: VideoProvider; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'other', label: 'Other' },
]

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

function ItemCard({
  index,
  onRemove,
  children,
}: {
  index: number
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Item {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" aria-hidden="true" /> Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={onClick}>
      <Plus className="size-3.5" aria-hidden="true" /> {label}
    </Button>
  )
}

// --- Audio -----------------------------------------------------------------

export function AudioForm({
  content,
  onChange,
}: {
  content: AudioContent
  onChange: (next: AudioContent) => void
}) {
  const items = content.items ?? []
  const setItems = (next: AudioContent['items']) => onChange({ items: next })

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <ItemCard key={item.id} index={i} onRemove={() => setItems(items.filter((_, j) => j !== i))}>
          <FieldRow>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`audio-title-${item.id}`}>Title</Label>
              <Input
                id={`audio-title-${item.id}`}
                value={item.title}
                onChange={(e) =>
                  setItems(items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)))
                }
                placeholder="Warehouse Set"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`audio-provider-${item.id}`}>Provider</Label>
              <Select
                value={item.provider ?? 'soundcloud'}
                onValueChange={(v) =>
                  setItems(
                    items.map((it, j) => (j === i ? { ...it, provider: v as MixProvider } : it)),
                  )
                }
              >
                <SelectTrigger id={`audio-provider-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldRow>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`audio-embed-${item.id}`}>Embed / share URL</Label>
            <Input
              id={`audio-embed-${item.id}`}
              value={item.embedUrl}
              inputMode="url"
              onChange={(e) =>
                setItems(items.map((it, j) => (j === i ? { ...it, embedUrl: e.target.value } : it)))
              }
              placeholder="https://soundcloud.com/you/your-set"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`audio-desc-${item.id}`}>Description (optional)</Label>
            <Textarea
              id={`audio-desc-${item.id}`}
              value={item.description ?? ''}
              rows={2}
              onChange={(e) =>
                setItems(
                  items.map((it, j) =>
                    j === i ? { ...it, description: e.target.value || undefined } : it,
                  ),
                )
              }
              placeholder="Two hours of deep, rolling house."
            />
          </div>
        </ItemCard>
      ))}
      <AddButton
        label="Add mix"
        onClick={() =>
          setItems([...items, { id: newId(), title: '', embedUrl: '', provider: 'soundcloud' }])
        }
      />
    </div>
  )
}

// --- Videos ----------------------------------------------------------------

export function VideosForm({
  content,
  onChange,
}: {
  content: VideosContent
  onChange: (next: VideosContent) => void
}) {
  const items = content.items ?? []
  const setItems = (next: VideosContent['items']) => onChange({ items: next })

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <ItemCard key={item.id} index={i} onRemove={() => setItems(items.filter((_, j) => j !== i))}>
          <FieldRow>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`video-title-${item.id}`}>Title</Label>
              <Input
                id={`video-title-${item.id}`}
                value={item.title}
                onChange={(e) =>
                  setItems(items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)))
                }
                placeholder="Boiler Room — live"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`video-provider-${item.id}`}>Provider</Label>
              <Select
                value={item.provider ?? 'youtube'}
                onValueChange={(v) =>
                  setItems(
                    items.map((it, j) => (j === i ? { ...it, provider: v as VideoProvider } : it)),
                  )
                }
              >
                <SelectTrigger id={`video-provider-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldRow>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`video-embed-${item.id}`}>Video URL</Label>
            <Input
              id={`video-embed-${item.id}`}
              value={item.embedUrl}
              inputMode="url"
              onChange={(e) =>
                setItems(items.map((it, j) => (j === i ? { ...it, embedUrl: e.target.value } : it)))
              }
              placeholder="https://youtube.com/watch?v=…"
            />
          </div>
        </ItemCard>
      ))}
      <AddButton
        label="Add video"
        onClick={() =>
          setItems([...items, { id: newId(), title: '', embedUrl: '', provider: 'youtube' }])
        }
      />
    </div>
  )
}

// --- Radio -----------------------------------------------------------------

export function RadioForm({
  content,
  onChange,
}: {
  content: RadioContent
  onChange: (next: RadioContent) => void
}) {
  const radio = content.radio
  const set = (patch: Partial<RadioContent['radio']>) => onChange({ radio: { ...radio, ...patch } })

  return (
    <div className="flex flex-col gap-4">
      <FieldRow>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="radio-station">Station name</Label>
          <Input
            id="radio-station"
            value={radio.stationName}
            onChange={(e) => set({ stationName: e.target.value })}
            placeholder="Reform Radio"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="radio-show">Show title (optional)</Label>
          <Input
            id="radio-show"
            value={radio.showTitle ?? ''}
            onChange={(e) => set({ showTitle: e.target.value || undefined })}
            placeholder="Afterglow"
          />
        </div>
      </FieldRow>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="radio-stream">Live stream URL</Label>
        <Input
          id="radio-stream"
          value={radio.streamUrl}
          inputMode="url"
          onChange={(e) => set({ streamUrl: e.target.value })}
          placeholder="https://station.example/live"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="radio-schedule">Schedule (optional)</Label>
        <Input
          id="radio-schedule"
          value={radio.schedule ?? ''}
          onChange={(e) => set({ schedule: e.target.value || undefined })}
          placeholder="Every other Thursday, 20:00–22:00"
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="radio-onair">Currently on air</Label>
          <span className="text-xs text-muted-foreground">
            Shows a live indicator on your public profile.
          </span>
        </div>
        <Switch
          id="radio-onair"
          checked={radio.onAir ?? false}
          onCheckedChange={(checked) => set({ onAir: checked })}
        />
      </div>
    </div>
  )
}

// --- Gigs ------------------------------------------------------------------

export function GigsForm({
  content,
  onChange,
}: {
  content: GigsContent
  onChange: (next: GigsContent) => void
}) {
  const gigs = content.gigs ?? []
  const setGigs = (next: GigsContent['gigs']) => onChange({ gigs: next })

  return (
    <div className="flex flex-col gap-4">
      {gigs.map((gig, i) => (
        <ItemCard key={gig.id} index={i} onRemove={() => setGigs(gigs.filter((_, j) => j !== i))}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`gig-title-${gig.id}`}>Event title</Label>
            <Input
              id={`gig-title-${gig.id}`}
              value={gig.title}
              onChange={(e) =>
                setGigs(gigs.map((g, j) => (j === i ? { ...g, title: e.target.value } : g)))
              }
              placeholder="Warehouse Project"
            />
          </div>
          <FieldRow>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`gig-date-${gig.id}`}>Date</Label>
              <Input
                id={`gig-date-${gig.id}`}
                type="date"
                value={gig.date}
                onChange={(e) =>
                  setGigs(gigs.map((g, j) => (j === i ? { ...g, date: e.target.value } : g)))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`gig-status-${gig.id}`}>Ticket status</Label>
              <Select
                value={gig.status}
                onValueChange={(v) =>
                  setGigs(gigs.map((g, j) => (j === i ? { ...g, status: v as GigStatus } : g)))
                }
              >
                <SelectTrigger id={`gig-status-${gig.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GIG_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldRow>
          <FieldRow>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`gig-venue-${gig.id}`}>Venue</Label>
              <Input
                id={`gig-venue-${gig.id}`}
                value={gig.venueName}
                onChange={(e) =>
                  setGigs(gigs.map((g, j) => (j === i ? { ...g, venueName: e.target.value } : g)))
                }
                placeholder="Depot"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`gig-town-${gig.id}`}>Town / city</Label>
              <Input
                id={`gig-town-${gig.id}`}
                value={gig.town}
                onChange={(e) =>
                  setGigs(gigs.map((g, j) => (j === i ? { ...g, town: e.target.value } : g)))
                }
                placeholder="Manchester"
              />
            </div>
          </FieldRow>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`gig-ticket-${gig.id}`}>Ticket URL (optional)</Label>
            <Input
              id={`gig-ticket-${gig.id}`}
              value={gig.ticketUrl ?? ''}
              inputMode="url"
              onChange={(e) =>
                setGigs(
                  gigs.map((g, j) => (j === i ? { ...g, ticketUrl: e.target.value || undefined } : g)),
                )
              }
              placeholder="https://tickets.example/event"
            />
          </div>
        </ItemCard>
      ))}
      <AddButton
        label="Add gig"
        onClick={() =>
          setGigs([
            ...gigs,
            { id: newId(), title: '', date: '', venueName: '', town: '', status: 'on-sale' },
          ])
        }
      />
    </div>
  )
}
