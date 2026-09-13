import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, MapPin } from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { Badge } from "@/components/ui/badge"
import { SHOWCASE_PROFILES } from "@/lib/profiles/showcase"
import { TYPE_LABELS } from "@/lib/profiles/showcase/types"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Profiles — GigStar",
  description:
    "Explore example GigStar profiles for DJs, artists and bands, venues and event organisers.",
}

export default function ProfilesDirectoryPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Example profiles
          </p>
          <h1 className="font-sans text-4xl font-bold tracking-tight text-balance md:text-5xl">
            One platform, every kind of talent
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-lg text-muted-foreground">
            The same profile framework adapts to who you are — browse a live example of each
            account type.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {SHOWCASE_PROFILES.map((p) => {
              const isLogo = p.type === "venue" || p.type === "organiser"
              return (
                <Link
                  key={p.slug}
                  href={`/p/${p.slug}`}
                  className="group overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-colors hover:ring-primary/50"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={p.cover || "/placeholder.svg"}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <Badge className="absolute left-3 top-3 border-0 bg-primary/20 font-mono text-xs uppercase tracking-wider text-primary backdrop-blur">
                      {TYPE_LABELS[p.type]}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-4 p-5">
                    <img
                      src={p.avatar || "/placeholder.svg"}
                      alt=""
                      className={cn(
                        "-mt-12 size-20 shrink-0 border-4 border-card object-cover",
                        isLogo ? "rounded-xl" : "rounded-full",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-xl font-semibold group-hover:text-primary">
                          {p.displayName}
                        </h2>
                        {p.verified ? (
                          <BadgeCheck className="size-4 shrink-0 text-primary" />
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{p.tagline}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" /> {p.location}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
