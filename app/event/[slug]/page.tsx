import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, Clock, MapPin, Ticket, Users } from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventStatusBadge } from "@/components/profile/showcase/status-badge"
import {
  getShowcaseEvent,
  getShowcaseProfile,
  SHOWCASE_EVENTS,
} from "@/lib/profiles/showcase"
import { formatEventDate, TYPE_LABELS } from "@/lib/profiles/showcase/types"
import { cn } from "cn"

export function generateStaticParams() {
  return SHOWCASE_EVENTS.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = getShowcaseEvent(slug)
  if (!event) return { title: "Event not found — GigStar" }
  return {
    title: `${event.title} — ${event.venueName}, ${event.town} | GigStar`,
    description: event.description,
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = getShowcaseEvent(slug)
  if (!event) notFound()

  const soldOut = event.status === "sold-out"
  const related = (event.relatedProfiles ?? [])
    .map((s) => getShowcaseProfile(s))
    .filter(Boolean)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-80">
          <img
            src={event.poster || "/placeholder.svg"}
            alt=""
            className="size-full scale-110 object-cover blur-xl"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>

        <div className="mx-auto -mt-40 max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-foreground/10">
              <img
                src={event.poster || "/placeholder.svg"}
                alt={`${event.title} poster`}
                className="size-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-5 pt-2 md:pt-32">
              <div className="flex flex-wrap items-center gap-3">
                <EventStatusBadge status={event.status} />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  {formatEventDate(event.date)}
                </span>
              </div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-balance md:text-5xl">
                {event.title}
              </h1>

              <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  {event.venueSlug ? (
                    <Link href={`/p/${event.venueSlug}`} className="hover:text-foreground">
                      {event.venueName}
                    </Link>
                  ) : (
                    event.venueName
                  )}
                  , {event.town}
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" /> {formatEventDate(event.date)}
                </span>
                {event.doorsTime ? (
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" /> Doors {event.doorsTime}
                    {event.endTime ? ` – ${event.endTime}` : ""}
                  </span>
                ) : null}
                {event.attendance ? (
                  <span className="flex items-center gap-2">
                    <Users className="size-4 text-primary" /> {event.attendance}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {event.free ? "Entry" : "Tickets from"}
                  </p>
                  <p className="text-2xl font-bold">
                    {event.free ? "Free" : event.priceFrom ?? "TBA"}
                  </p>
                </div>
                <Button
                  size="lg"
                  className={cn("ml-auto", soldOut && "pointer-events-none opacity-60")}
                  nativeButton={false}
                  render={<a href={soldOut ? undefined : event.ticketUrl ?? "#"} />}
                >
                  <Ticket className="size-4" />
                  {soldOut ? "Sold out" : event.free ? "Register" : "Get tickets"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <h2 className="font-sans text-2xl font-semibold">About this event</h2>
              <p className="text-pretty leading-relaxed text-foreground/90">{event.description}</p>
              {event.lineup ? (
                <div className="pt-2">
                  <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
                    Line-up
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.lineup.map((a) => (
                      <Badge key={a} variant="outline" className="border-border/70 px-3 py-1 text-sm">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {related.length > 0 ? (
              <aside className="space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  Featuring
                </h3>
                {related.map((p) => {
                  const t = p!
                  const isLogo = t.type === "venue" || t.type === "organiser"
                  return (
                    <Link
                      key={t.slug}
                      href={`/p/${t.slug}`}
                      className="group flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                    >
                      <img
                        src={t.avatar || "/placeholder.svg"}
                        alt=""
                        className={cn(
                          "size-12 shrink-0 object-cover ring-1 ring-foreground/10",
                          isLogo ? "rounded-lg" : "rounded-full",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:text-primary">
                          {t.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">{TYPE_LABELS[t.type]}</p>
                      </div>
                    </Link>
                  )
                })}
              </aside>
            ) : null}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
