import Link from "next/link"
import {
  Clock,
  Disc3,
  Download,
  Leaf,
  Mail,
  MapPin,
  Play,
  Star,
  Ticket,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"
import { ShowcaseSection } from "./section"
import { SECTION_LABELS } from "./section-config"
import { EventCard } from "./event-card"
import { EventStatusBadge } from "./status-badge"
import { GalleryGrid } from "./gallery-grid"
import {
  formatEventDate,
  PRIMARY_CTA,
  TYPE_LABELS,
  type ShowcaseProfile,
} from "@/lib/profiles/showcase/types"
import { getShowcaseProfile } from "@/lib/profiles/showcase"

function eyebrow(profile: ShowcaseProfile, key: keyof typeof SECTION_LABELS) {
  return SECTION_LABELS[key]
}

export function AboutSection({ profile }: { profile: ShowcaseProfile }) {
  return (
    <ShowcaseSection id="about" eyebrow={eyebrow(profile, "about")} title={`About ${profile.displayName}`}>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {profile.bio.map((p, i) => (
            <p key={i} className="text-pretty leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </div>
        <div className="space-y-4">
          {profile.members ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Line-up</h3>
              <ul className="space-y-1 text-sm">
                {profile.members.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {profile.performanceFormats ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Formats</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.performanceFormats.map((f) => (
                  <Badge key={f} variant="outline" className="border-border/70">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {profile.bookingPrice || profile.availability ? (
            <Card size="sm" className="bg-muted/40">
              <CardContent className="space-y-2">
                {profile.bookingPrice ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Booking from</p>
                    <p className="text-lg font-semibold">{profile.bookingPrice}</p>
                  </div>
                ) : null}
                {profile.availability ? (
                  <p className="text-sm text-muted-foreground">{profile.availability}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          {profile.address ? (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <MapPin className="size-4" /> Address
              </h3>
              <address className="text-sm not-italic leading-relaxed text-foreground/90">
                {profile.address.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            </div>
          ) : null}
        </div>
      </div>
    </ShowcaseSection>
  )
}

export function FactsSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.facts) return null
  return (
    <ShowcaseSection id="facts" eyebrow={eyebrow(profile, "facts")} title="At a glance">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profile.facts.map((f) => (
          <Card key={f.label} size="sm" className="bg-muted/40">
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-xl font-semibold text-balance">{f.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function FeaturedEventSection({ profile }: { profile: ShowcaseProfile }) {
  const event = profile.featuredEvent
  if (!event) return null
  return (
    <ShowcaseSection id="featured-event" eyebrow="Featured" title="Don’t miss">
      <Link
        href={`/event/${event.slug}`}
        className="group grid overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-primary/50 md:grid-cols-[minmax(0,320px)_1fr]"
      >
        <div className="relative aspect-[3/4] overflow-hidden md:aspect-auto">
          <img
            src={event.poster || "/placeholder.svg"}
            alt={`${event.title} poster`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <EventStatusBadge status={event.status} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              {formatEventDate(event.date)}
            </span>
          </div>
          <h3 className="text-pretty font-sans text-2xl font-bold leading-tight md:text-3xl">
            {event.title}
          </h3>
          <p className="text-pretty leading-relaxed text-muted-foreground">{event.description}</p>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> {event.venueName}, {event.town}
            </span>
            {event.doorsTime ? (
              <span className="flex items-center gap-2">
                <Clock className="size-4" /> Doors {event.doorsTime}
                {event.endTime ? ` – ${event.endTime}` : ""}
              </span>
            ) : null}
            {event.attendance ? (
              <span className="flex items-center gap-2">
                <Users className="size-4" /> {event.attendance}
              </span>
            ) : null}
          </div>
          {event.lineup ? (
            <div className="flex flex-wrap gap-1.5">
              {event.lineup.map((a) => (
                <Badge key={a} variant="outline" className="border-border/70">
                  {a}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-auto flex items-center gap-3 pt-2">
            <span className="text-lg font-semibold">
              {event.free ? "Free entry" : event.priceFrom ? `From ${event.priceFrom}` : "See tickets"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-primary">
              <Ticket className="size-4" /> View event
            </span>
          </div>
        </div>
      </Link>
    </ShowcaseSection>
  )
}

function EventsGrid({
  profile,
  id,
  events,
  title,
}: {
  profile: ShowcaseProfile
  id: "events" | "past-events"
  events: ShowcaseProfile["events"]
  title: string
}) {
  if (!events || events.length === 0) return null
  return (
    <ShowcaseSection id={id} eyebrow={SECTION_LABELS[id]} title={title}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {events.map((e) => (
          <EventCard key={e.id} event={e} className={id === "past-events" ? "opacity-80" : ""} />
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function EventsSection({ profile }: { profile: ShowcaseProfile }) {
  const title =
    profile.type === "venue"
      ? "What’s on"
      : profile.type === "organiser"
        ? "Upcoming events"
        : "Live dates"
  return <EventsGrid profile={profile} id="events" events={profile.events} title={title} />
}

export function PastEventsSection({ profile }: { profile: ShowcaseProfile }) {
  return <EventsGrid profile={profile} id="past-events" events={profile.pastEvents} title="Past highlights" />
}

export function ReleasesSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.releases) return null
  return (
    <ShowcaseSection id="releases" eyebrow={SECTION_LABELS.releases} title="Discography">
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.releases.map((r) => (
          <Card key={r.id} className="flex-row items-center gap-4 p-4">
            <img
              src={r.artwork || "/placeholder.svg"}
              alt={`${r.title} artwork`}
              className="size-24 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10 sm:size-28"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{r.type}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(`${r.releaseDate}T00:00:00`).getFullYear()}
                </span>
              </div>
              <h3 className="truncate text-lg font-semibold">{r.title}</h3>
              {r.featuredTrack ? (
                <p className="text-sm text-muted-foreground">
                  {r.trackCount} tracks · feat. “{r.featuredTrack}”
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(r.services ?? []).map((s) => (
                  <Button
                    key={s.name}
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<a href={s.url} />}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function AudioSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.audio) return null
  return (
    <ShowcaseSection id="audio" eyebrow={SECTION_LABELS.audio} title="Latest mixes">
      <div className="divide-y divide-border/60 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {profile.audio.map((t) => (
          <a
            key={t.id}
            href={t.url}
            className="group flex items-center gap-4 p-3 transition-colors hover:bg-muted/50"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
              <img src={t.artwork || "/placeholder.svg"} alt="" className="size-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="size-5 fill-foreground" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.title}</p>
              <p className="text-sm text-muted-foreground">{t.platform}</p>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-3.5" /> {t.duration}
            </span>
          </a>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function VideosSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.videos) return null
  return (
    <ShowcaseSection id="videos" eyebrow={SECTION_LABELS.videos} title="Watch">
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.videos.map((v) => (
          <a
            key={v.id}
            href={v.url}
            className="group overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={v.thumbnail || "/placeholder.svg"}
                alt={`${v.title} thumbnail`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                  <Play className="size-6 translate-x-0.5 fill-current" />
                </span>
              </span>
              {v.duration ? (
                <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs">
                  {v.duration}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between p-3">
              <p className="truncate font-medium">{v.title}</p>
              <span className="text-xs text-muted-foreground">{v.provider}</span>
            </div>
          </a>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function GallerySection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.gallery) return null
  return (
    <ShowcaseSection id="gallery" eyebrow={SECTION_LABELS.gallery} title="Gallery">
      <GalleryGrid items={profile.gallery} />
    </ShowcaseSection>
  )
}

export function SpacesSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.spaces) return null
  return (
    <ShowcaseSection
      id="spaces"
      eyebrow={SECTION_LABELS.spaces}
      title="Spaces & hire"
      description="Flexible rooms for gigs, club nights and private events."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {profile.spaces.map((s) => (
          <Card key={s.id} className="overflow-hidden p-0">
            <img
              src={s.image || "/placeholder.svg"}
              alt={s.name}
              className="aspect-[4/3] w-full object-cover"
            />
            <CardContent className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <Badge className="border-0 bg-primary/15 text-primary">{s.hirePrice}</Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4" /> {s.capacity}
              </p>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Facilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.facilities.map((f) => (
                    <Badge key={f} variant="outline" className="border-border/70">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button className="w-full" variant="outline" render={<Link href="#contact" />}>
                Enquire about {s.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function MenuSection({ profile }: { profile: ShowcaseProfile }) {
  const menu = profile.menu
  if (!menu) return null
  return (
    <ShowcaseSection
      id="menu"
      eyebrow={SECTION_LABELS.menu}
      title="Sample menu"
      action={
        menu.downloadUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={menu.downloadUrl} />}
          >
            <Download className="size-4" /> Full menu
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {menu.sections.map((sec) => (
          <div key={sec.name}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">{sec.name}</h3>
            <ul className="space-y-3">
              {sec.items.map((item) => (
                <li key={item.name} className="flex items-baseline gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      {item.name}
                      {item.vegan ? (
                        <Leaf className="size-3.5 text-emerald-400" aria-label="Vegan" />
                      ) : item.veg ? (
                        <Leaf className="size-3.5 text-emerald-300/70" aria-label="Vegetarian" />
                      ) : null}
                    </p>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-sm">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{menu.allergenNote}</p>
    </ShowcaseSection>
  )
}

export function TechnicalSection({ profile }: { profile: ShowcaseProfile }) {
  const tech = profile.technical
  if (!tech) return null
  return (
    <ShowcaseSection id="technical" eyebrow={SECTION_LABELS.technical} title="Technical specifications">
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <dl className="grid gap-px overflow-hidden rounded-xl bg-border/60 ring-1 ring-foreground/10 sm:grid-cols-2">
          {tech.items.map((i) => (
            <div key={i.label} className="bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{i.label}</dt>
              <dd className="mt-1 font-medium">{i.value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-4">
          {tech.formats ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Suitable for</h3>
              <div className="flex flex-wrap gap-1.5">
                {tech.formats.map((f) => (
                  <Badge key={f} variant="outline" className="border-border/70">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {tech.riderUrl ? (
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<a href={tech.riderUrl} />}
            >
              <Download className="size-4" /> Download tech rider
            </Button>
          ) : null}
        </div>
      </div>
    </ShowcaseSection>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  )
}

export function ReviewsSection({ profile }: { profile: ShowcaseProfile }) {
  const reviews = profile.reviews
  if (!reviews) return null
  return (
    <ShowcaseSection id="reviews" eyebrow={SECTION_LABELS.reviews} title="Reviews & references">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <Card className="flex flex-col items-center justify-center gap-1 p-6 text-center md:w-52">
          <span className="font-sans text-4xl font-bold">{reviews.average.toFixed(1)}</span>
          <Stars rating={reviews.average} />
          <span className="text-sm text-muted-foreground">{reviews.count} reviews</span>
        </Card>
        <div className="space-y-4">
          {reviews.items.map((r) => (
            <figure key={r.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Stars rating={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(`${r.date}T00:00:00`).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <blockquote className="text-pretty leading-relaxed">“{r.quote}”</blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{r.author}</span> · {r.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </ShowcaseSection>
  )
}

export function PartnersSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.partners) return null
  return (
    <ShowcaseSection id="partners" eyebrow={SECTION_LABELS.partners} title="Partners & affiliations">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profile.partners.map((p) => (
          <Card key={p.name} size="sm" className="items-center justify-center gap-1 p-4 text-center">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.kind}</p>
          </Card>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function MailingListSection({ profile }: { profile: ShowcaseProfile }) {
  const ml = profile.mailingList
  if (!ml) return null
  return (
    <ShowcaseSection id="mailing-list" eyebrow={SECTION_LABELS["mailing-list"]} title="Join the list">
      <Card className="gap-6 bg-gradient-to-br from-primary/10 to-card p-6 md:flex-row md:items-center md:p-8">
        <div className="flex-1 space-y-3">
          <p className="text-pretty leading-relaxed">{ml.blurb}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {ml.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" /> {perk}
              </li>
            ))}
          </ul>
        </div>
        <form className="flex w-full gap-2 md:w-auto" aria-label="Mailing list signup">
          <input
            type="email"
            required
            placeholder="you@email.com"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-56"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      </Card>
    </ShowcaseSection>
  )
}

export function ContactSection({ profile }: { profile: ShowcaseProfile }) {
  return (
    <ShowcaseSection id="contact" eyebrow={SECTION_LABELS.contact} title={PRIMARY_CTA[profile.type]}>
      <Card className="gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="space-y-2">
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Send an enquiry with your date, budget and any details. Online booking is coming soon —
            for now, get in touch by email.
          </p>
          <p className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-primary" /> {profile.contactEmail}
          </p>
        </div>
        <Button
          size="lg"
          nativeButton={false}
          render={<a href={`mailto:${profile.contactEmail}`} />}
        >
          {PRIMARY_CTA[profile.type]}
        </Button>
      </Card>
    </ShowcaseSection>
  )
}

export function RelatedSection({ profile }: { profile: ShowcaseProfile }) {
  if (!profile.related || profile.related.length === 0) return null
  const refs = profile.related
    .map((r) => ({ ref: r, target: getShowcaseProfile(r.slug) }))
    .filter((x) => x.target)
  if (refs.length === 0) return null
  return (
    <ShowcaseSection id="related" eyebrow={SECTION_LABELS.related} title="Connected on GigStar">
      <div className="grid gap-4 sm:grid-cols-3">
        {refs.map(({ ref, target }) => {
          const t = target!
          const isLogo = t.type === "venue" || t.type === "organiser"
          return (
            <Link
              key={t.slug}
              href={`/p/${t.slug}`}
              className="group flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
            >
              <img
                src={t.avatar || "/placeholder.svg"}
                alt=""
                className={cn(
                  "size-14 shrink-0 object-cover ring-1 ring-foreground/10",
                  isLogo ? "rounded-lg" : "rounded-full",
                )}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold group-hover:text-primary">{t.displayName}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[t.type]}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{ref.relationship}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </ShowcaseSection>
  )
}
