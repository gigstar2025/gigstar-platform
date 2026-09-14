import Link from "next/link"
import { BadgeCheck, Globe, MapPin, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import {
  PRIMARY_CTA,
  TYPE_LABELS,
  type ShowcaseProfile,
} from "@/lib/profiles/showcase/types"
import { ProfileActions } from "./profile-actions"

export function ShowcaseHeader({ profile }: { profile: ShowcaseProfile }) {
  const isLogo = profile.type === "venue" || profile.type === "organiser"

  return (
    <header>
      <div className="relative h-44 w-full overflow-hidden sm:h-56 md:h-72">
        <img
          src={profile.cover || "/placeholder.svg"}
          alt={`${profile.displayName} cover image`}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="mx-auto -mt-16 max-w-5xl px-4 sm:-mt-20 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <img
            src={profile.avatar || "/placeholder.svg"}
            alt={`${profile.displayName} ${isLogo ? "logo" : "photo"}`}
            className={cn(
              "size-28 shrink-0 border-4 border-background object-cover shadow-xl sm:size-36",
              isLogo ? "rounded-2xl" : "rounded-full",
            )}
          />
          <div className="flex flex-1 flex-col gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-primary/15 font-mono text-xs uppercase tracking-wider text-primary">
                {TYPE_LABELS[profile.type]}
              </Badge>
              {profile.verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              ) : null}
            </div>
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-pretty text-muted-foreground">
                {profile.tagline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {profile.location}
              </span>
              {profile.website ? (
                <a
                  href={profile.website}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <Globe className="size-4" /> Website
                </a>
              ) : null}
              {profile.followers ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span className="font-semibold text-foreground">{profile.followers}</span> followers
                </span>
              ) : null}
              {profile.reviews ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">
                    {profile.reviews.average.toFixed(1)}
                  </span>
                  · {profile.reviews.count} reviews
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {profile.chips.map((chip) => (
            <Badge key={chip} variant="outline" className="border-border/70">
              {chip}
            </Badge>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-start gap-x-3 gap-y-4">
          <Button size="lg" nativeButton={false} render={<Link href="#contact" />}>
            {PRIMARY_CTA[profile.type]}
          </Button>
          <ProfileActions displayName={profile.displayName} />
          <div className="flex flex-wrap gap-2 sm:ml-auto sm:self-center">
            {profile.socials.map((s) => (
              <Button
                key={s.platform}
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<a href={s.url} />}
              >
                {s.platform}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
