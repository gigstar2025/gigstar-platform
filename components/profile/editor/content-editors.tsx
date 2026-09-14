'use client'

import type {
  AudioTrack,
  FactItem,
  MediaItem,
  MenuItem,
  MenuSection,
  MusicRelease,
  Partner,
  RelatedRef,
  Review,
  ReviewSummary,
  SampleMenu,
  ShowcaseEvent,
  ShowcaseProfile,
  TechnicalDetails,
  VenueSpace,
  VideoItem,
} from '@/lib/profiles/showcase/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChipsEditor, ParagraphsEditor } from './list-editor'
import { RepeatingList, genId } from './repeating-list'
import { ImageInline } from './image-inline'

// Small labelled input helpers for dense repeating forms -------------------

function Line({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-foreground"
      />
    </label>
  )
}

function Area({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <Textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-foreground"
      />
    </label>
  )
}

const EVENT_STATUS: ShowcaseEvent['status'][] = [
  'on-sale',
  'free',
  'selling-fast',
  'last-tickets',
  'sold-out',
  'coming-soon',
]

type Setter = (recipe: (d: ShowcaseProfile) => ShowcaseProfile) => void

// --- About -----------------------------------------------------------------

export function AboutEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  return (
    <ParagraphsEditor
      label="About / biography"
      hint="Each paragraph renders as a separate block on the profile."
      values={base.bio}
      placeholder="Tell people who you are…"
      onChange={(bio) => set((d) => ({ ...d, bio }))}
    />
  )
}

// --- Facts -----------------------------------------------------------------

export function FactsEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.facts ?? []
  return (
    <RepeatingList<FactItem>
      items={items}
      onChange={(facts) => set((d) => ({ ...d, facts }))}
      newItem={() => ({ label: '', value: '' })}
      addLabel="Add fact"
      emptyLabel="No quick facts yet."
      itemLabel={(it) => it.label || 'New fact'}
      render={(it, _i, patch) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Line label="Label" value={it.label} placeholder="e.g. Based in" onChange={(v) => patch({ label: v })} />
          <Line label="Value" value={it.value} placeholder="e.g. Manchester" onChange={(v) => patch({ value: v })} />
        </div>
      )}
    />
  )
}

// --- Events / Past events --------------------------------------------------

function EventFields({ it, patch }: { it: ShowcaseEvent; patch: (p: Partial<ShowcaseEvent>) => void }) {
  return (
    <>
      <Line label="Title" value={it.title} onChange={(v) => patch({ title: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Line label="Date" type="date" value={it.date} onChange={(v) => patch({ date: v })} />
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Status
          <Select value={it.status} onValueChange={(v) => patch({ status: v as ShowcaseEvent['status'] })}>
            <SelectTrigger className="text-sm text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Line label="Venue name" value={it.venueName} onChange={(v) => patch({ venueName: v })} />
        <Line label="Town" value={it.town} onChange={(v) => patch({ town: v })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Line label="Price from" value={it.priceFrom ?? ''} placeholder="£12" onChange={(v) => patch({ priceFrom: v })} />
        <Line label="Ticket URL" value={it.ticketUrl ?? ''} placeholder="https://" onChange={(v) => patch({ ticketUrl: v })} />
      </div>
      <Area label="Description" value={it.description} onChange={(v) => patch({ description: v })} />
      <ImageInline label="Poster" value={it.poster} onChange={(src) => patch({ poster: src ?? '' })} />
    </>
  )
}

export function EventsEditor({
  base,
  set,
  field,
}: {
  base: ShowcaseProfile
  set: Setter
  field: 'events' | 'pastEvents'
}) {
  const items = (base[field] as ShowcaseEvent[] | undefined) ?? []
  return (
    <RepeatingList<ShowcaseEvent>
      items={items}
      onChange={(next) => set((d) => ({ ...d, [field]: next }))}
      newItem={() => {
        const id = genId('event')
        return {
          id,
          slug: id,
          title: '',
          date: new Date().toISOString().slice(0, 10),
          venueName: '',
          town: '',
          description: '',
          poster: '',
          status: 'on-sale',
        }
      }}
      addLabel="Add event"
      emptyLabel="No events yet."
      itemLabel={(it) => it.title || 'New event'}
      render={(it, _i, patch) => <EventFields it={it} patch={patch} />}
    />
  )
}

export function FeaturedEventEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const ev = base.featuredEvent
  if (!ev) {
    return (
      <button
        type="button"
        onClick={() =>
          set((d) => {
            const id = genId('event')
            return {
              ...d,
              featuredEvent: {
                id,
                slug: id,
                title: '',
                date: new Date().toISOString().slice(0, 10),
                venueName: '',
                town: '',
                description: '',
                poster: '',
                status: 'on-sale',
              },
            }
          })
        }
        className="rounded-lg border border-dashed border-border p-6 text-sm font-medium text-primary"
      >
        + Create a featured event
      </button>
    )
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <EventFields it={ev} patch={(p) => set((d) => ({ ...d, featuredEvent: { ...d.featuredEvent!, ...p } }))} />
      </div>
    </div>
  )
}

// --- Releases --------------------------------------------------------------

export function ReleasesEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.releases ?? []
  return (
    <RepeatingList<MusicRelease>
      items={items}
      onChange={(releases) => set((d) => ({ ...d, releases }))}
      newItem={() => ({ id: genId('rel'), title: '', type: 'Single', releaseDate: '', artwork: '' })}
      addLabel="Add release"
      emptyLabel="No releases yet."
      itemLabel={(it) => it.title || 'New release'}
      render={(it, _i, patch) => (
        <>
          <Line label="Title" value={it.title} onChange={(v) => patch({ title: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Type
              <Select value={it.type} onValueChange={(v) => patch({ type: v as MusicRelease['type'] })}>
                <SelectTrigger className="text-sm text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Album', 'EP', 'Single'] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Line label="Release date" type="date" value={it.releaseDate} onChange={(v) => patch({ releaseDate: v })} />
          </div>
          <Line label="Listen URL" value={it.listenUrl ?? ''} placeholder="https://" onChange={(v) => patch({ listenUrl: v })} />
          <ImageInline label="Artwork" value={it.artwork} onChange={(src) => patch({ artwork: src ?? '' })} />
        </>
      )}
    />
  )
}

// --- Audio -----------------------------------------------------------------

export function AudioEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.audio ?? []
  return (
    <RepeatingList<AudioTrack>
      items={items}
      onChange={(audio) => set((d) => ({ ...d, audio }))}
      newItem={() => ({ id: genId('audio'), title: '', artwork: '', duration: '', platform: '', url: '' })}
      addLabel="Add audio"
      emptyLabel="No audio yet."
      itemLabel={(it) => it.title || 'New track'}
      render={(it, _i, patch) => (
        <>
          <Line label="Title" value={it.title} onChange={(v) => patch({ title: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Line label="Duration" value={it.duration} placeholder="1:02:14" onChange={(v) => patch({ duration: v })} />
            <Line label="Platform" value={it.platform} placeholder="SoundCloud" onChange={(v) => patch({ platform: v })} />
          </div>
          <Line label="URL" value={it.url} placeholder="https://" onChange={(v) => patch({ url: v })} />
          <ImageInline label="Artwork" value={it.artwork} onChange={(src) => patch({ artwork: src ?? '' })} />
        </>
      )}
    />
  )
}

// --- Videos ----------------------------------------------------------------

export function VideosEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.videos ?? []
  return (
    <RepeatingList<VideoItem>
      items={items}
      onChange={(videos) => set((d) => ({ ...d, videos }))}
      newItem={() => ({ id: genId('vid'), title: '', thumbnail: '', url: '', provider: 'YouTube' })}
      addLabel="Add video"
      emptyLabel="No videos yet."
      itemLabel={(it) => it.title || 'New video'}
      render={(it, _i, patch) => (
        <>
          <Line label="Title" value={it.title} onChange={(v) => patch({ title: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Line label="Provider" value={it.provider} placeholder="YouTube" onChange={(v) => patch({ provider: v })} />
            <Line label="Duration" value={it.duration ?? ''} placeholder="4:12" onChange={(v) => patch({ duration: v })} />
          </div>
          <Line label="URL" value={it.url} placeholder="https://" onChange={(v) => patch({ url: v })} />
          <ImageInline label="Thumbnail" value={it.thumbnail} onChange={(src) => patch({ thumbnail: src ?? '' })} />
        </>
      )}
    />
  )
}

// --- Gallery ---------------------------------------------------------------

export function GalleryEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.gallery ?? []
  return (
    <RepeatingList<MediaItem>
      items={items}
      onChange={(gallery) => set((d) => ({ ...d, gallery }))}
      newItem={() => ({ id: genId('img'), type: 'image', src: '', alt: '' })}
      addLabel="Add image"
      emptyLabel="No gallery images yet."
      itemLabel={(it) => it.caption || it.alt || 'New image'}
      render={(it, _i, patch) => (
        <>
          <ImageInline label="Image" value={it.src} onChange={(src) => patch({ src: src ?? '' })} />
          <Line label="Alt text" value={it.alt} placeholder="Describe the image" onChange={(v) => patch({ alt: v })} />
          <Line label="Caption" value={it.caption ?? ''} onChange={(v) => patch({ caption: v })} />
        </>
      )}
    />
  )
}

// --- Spaces (venue) --------------------------------------------------------

export function SpacesEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.spaces ?? []
  return (
    <RepeatingList<VenueSpace>
      items={items}
      onChange={(spaces) => set((d) => ({ ...d, spaces }))}
      newItem={() => ({
        id: genId('space'),
        name: '',
        image: '',
        capacity: '',
        layouts: [],
        suitableFor: [],
        facilities: [],
        hirePrice: '',
      })}
      addLabel="Add space"
      emptyLabel="No spaces yet."
      itemLabel={(it) => it.name || 'New space'}
      render={(it, _i, patch) => (
        <>
          <Line label="Name" value={it.name} onChange={(v) => patch({ name: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Line label="Capacity" value={it.capacity} placeholder="Up to 400 standing" onChange={(v) => patch({ capacity: v })} />
            <Line label="Hire price" value={it.hirePrice} placeholder="From £900" onChange={(v) => patch({ hirePrice: v })} />
          </div>
          <ImageInline label="Image" value={it.image} onChange={(src) => patch({ image: src ?? '' })} />
          <ChipsEditor label="Layouts" values={it.layouts} onChange={(layouts) => patch({ layouts })} placeholder="e.g. Standing" />
          <ChipsEditor label="Suitable for" values={it.suitableFor} onChange={(suitableFor) => patch({ suitableFor })} placeholder="e.g. Club nights" />
          <ChipsEditor label="Facilities" values={it.facilities} onChange={(facilities) => patch({ facilities })} placeholder="e.g. Green room" />
        </>
      )}
    />
  )
}

// --- Menu (venue) ----------------------------------------------------------

export function MenuEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const menu: SampleMenu = base.menu ?? { sections: [], allergenNote: '' }
  function setMenu(next: SampleMenu) {
    set((d) => ({ ...d, menu: next }))
  }
  return (
    <div className="flex flex-col gap-4">
      <RepeatingList<MenuSection>
        items={menu.sections}
        onChange={(sections) => setMenu({ ...menu, sections })}
        newItem={() => ({ name: '', items: [] })}
        addLabel="Add menu section"
        emptyLabel="No menu sections yet."
        itemLabel={(it) => it.name || 'New section'}
        render={(section, si, patchSection) => (
          <>
            <Line label="Section name" value={section.name} placeholder="Small plates" onChange={(v) => patchSection({ name: v })} />
            <RepeatingList<MenuItem>
              items={section.items}
              onChange={(dishItems) => patchSection({ items: dishItems })}
              newItem={() => ({ name: '', price: '' })}
              addLabel="Add dish"
              emptyLabel="No dishes yet."
              itemLabel={(d) => d.name || 'New dish'}
              render={(dish, _di, patchDish) => (
                <>
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <Line label="Dish" value={dish.name} onChange={(v) => patchDish({ name: v })} />
                    <Line label="Price" value={dish.price} placeholder="£8" onChange={(v) => patchDish({ price: v })} />
                  </div>
                  <Line label="Description" value={dish.description ?? ''} onChange={(v) => patchDish({ description: v })} />
                </>
              )}
            />
            <span className="sr-only">Section {si + 1}</span>
          </>
        )}
      />
      <Area
        label="Allergen note"
        value={menu.allergenNote}
        placeholder="Please let staff know about allergies…"
        onChange={(v) => setMenu({ ...menu, allergenNote: v })}
      />
    </div>
  )
}

// --- Technical -------------------------------------------------------------

export function TechnicalEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const tech: TechnicalDetails = base.technical ?? { items: [] }
  function setTech(next: TechnicalDetails) {
    set((d) => ({ ...d, technical: next }))
  }
  return (
    <div className="flex flex-col gap-4">
      <RepeatingList<FactItem>
        items={tech.items}
        onChange={(items) => setTech({ ...tech, items })}
        newItem={() => ({ label: '', value: '' })}
        addLabel="Add specification"
        emptyLabel="No specifications yet."
        itemLabel={(it) => it.label || 'New spec'}
        render={(it, _i, patch) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Line label="Label" value={it.label} placeholder="PA system" onChange={(v) => patch({ label: v })} />
            <Line label="Value" value={it.value} placeholder="Funktion-One" onChange={(v) => patch({ value: v })} />
          </div>
        )}
      />
      <ChipsEditor
        label="Formats / notes"
        values={tech.formats ?? []}
        onChange={(formats) => setTech({ ...tech, formats })}
        placeholder="e.g. CDJ-3000"
      />
    </div>
  )
}

// --- Reviews ---------------------------------------------------------------

export function ReviewsEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const summary: ReviewSummary = base.reviews ?? { average: 0, count: 0, items: [] }
  function setReviews(next: ReviewSummary) {
    set((d) => ({ ...d, reviews: next }))
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Line
          label="Average rating"
          type="number"
          value={String(summary.average)}
          onChange={(v) => setReviews({ ...summary, average: Number(v) || 0 })}
        />
        <Line
          label="Total review count"
          type="number"
          value={String(summary.count)}
          onChange={(v) => setReviews({ ...summary, count: Number(v) || 0 })}
        />
      </div>
      <RepeatingList<Review>
        items={summary.items}
        onChange={(items) => setReviews({ ...summary, items })}
        newItem={() => ({ id: genId('rev'), author: '', role: '', rating: 5, date: '', quote: '' })}
        addLabel="Add review"
        emptyLabel="No testimonials yet."
        itemLabel={(it) => it.author || 'New review'}
        render={(it, _i, patch) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Line label="Author" value={it.author} onChange={(v) => patch({ author: v })} />
              <Line label="Role" value={it.role} placeholder="Promoter, Warehouse Project" onChange={(v) => patch({ role: v })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Line label="Rating (1–5)" type="number" value={String(it.rating)} onChange={(v) => patch({ rating: Math.max(1, Math.min(5, Number(v) || 5)) })} />
              <Line label="Date" value={it.date} placeholder="March 2026" onChange={(v) => patch({ date: v })} />
            </div>
            <Area label="Quote" value={it.quote} onChange={(v) => patch({ quote: v })} />
          </>
        )}
      />
    </div>
  )
}

// --- Partners (organiser) --------------------------------------------------

export function PartnersEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.partners ?? []
  return (
    <RepeatingList<Partner>
      items={items}
      onChange={(partners) => set((d) => ({ ...d, partners }))}
      newItem={() => ({ name: '', kind: '' })}
      addLabel="Add partner"
      emptyLabel="No partners yet."
      itemLabel={(it) => it.name || 'New partner'}
      render={(it, _i, patch) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Line label="Name" value={it.name} onChange={(v) => patch({ name: v })} />
          <Line label="Kind" value={it.kind} placeholder="Headline sponsor" onChange={(v) => patch({ kind: v })} />
        </div>
      )}
    />
  )
}

// --- Mailing list (organiser) ----------------------------------------------

export function MailingListEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const ml = base.mailingList ?? { blurb: '', perks: [] }
  return (
    <div className="flex flex-col gap-4">
      <Area
        label="Signup blurb"
        value={ml.blurb}
        placeholder="Be first to hear about new dates…"
        onChange={(v) => set((d) => ({ ...d, mailingList: { ...ml, blurb: v } }))}
      />
      <ChipsEditor
        label="Perks"
        values={ml.perks}
        onChange={(perks) => set((d) => ({ ...d, mailingList: { ...ml, perks } }))}
        placeholder="e.g. Presale access"
      />
    </div>
  )
}

// --- Related ---------------------------------------------------------------

export function RelatedEditor({ base, set }: { base: ShowcaseProfile; set: Setter }) {
  const items = base.related ?? []
  return (
    <RepeatingList<RelatedRef>
      items={items}
      onChange={(related) => set((d) => ({ ...d, related }))}
      newItem={() => ({ slug: '', relationship: '' })}
      addLabel="Add related profile"
      emptyLabel="No related profiles yet."
      itemLabel={(it) => it.slug || 'New link'}
      render={(it, _i, patch) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Line label="Profile slug" value={it.slug} placeholder="the-lumen-rooms" onChange={(v) => patch({ slug: v })} />
          <Line label="Relationship" value={it.relationship} placeholder="Resident venue" onChange={(v) => patch({ relationship: v })} />
        </div>
      )}
    />
  )
}
