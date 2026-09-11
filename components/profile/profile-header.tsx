import Image from 'next/image'
import { MapPin, Globe, Mail, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ROLE_LABELS, type Profile } from '@/lib/profiles/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function contactHref(contact: string) {
  return contact.includes('@') && !contact.startsWith('http') ? `mailto:${contact}` : contact
}

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex flex-col">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-border/70 bg-muted sm:h-64">
        {profile.cover ? (
          <Image
            src={profile.cover || '/placeholder.svg'}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : (
          <div className="spotlight-grid size-full" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      </div>

      {/* Identity row */}
      <div className="-mt-12 flex flex-col gap-4 px-1 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
        <Avatar className="size-24 rounded-2xl border-4 border-background shadow-lg sm:size-32">
          <AvatarImage src={profile.avatar || '/placeholder.svg'} alt={profile.displayName} />
          <AvatarFallback className="rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            {initials(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-3 pb-1">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
              {profile.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {profile.roles.map((role) => (
                <Badge key={role} className="bg-primary/15 text-primary hover:bg-primary/15">
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Contact / booking */}
        {profile.contact && (
          <div className="pb-1 sm:self-center">
            <Button
              nativeButton={false}
              render={
                <a href={contactHref(profile.contact)} target="_blank" rel="noopener noreferrer" />
              }
              size="lg"
              className="w-full sm:w-auto"
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact / Book
            </Button>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-5 flex flex-col gap-4 px-1">
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{profile.bio}</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {profile.location}
          </span>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              <Globe className="size-4 text-primary" aria-hidden="true" />
              Website
            </a>
          )}
        </div>

        {profile.genres.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Music2 className="size-4 text-muted-foreground" aria-hidden="true" />
            {profile.genres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {profile.socials.length > 0 && (
          <nav aria-label="Social links" className="flex flex-wrap gap-2">
            {profile.socials.map((social) => (
              <Button
                key={social.platform}
                nativeButton={false}
                render={<a href={social.url} target="_blank" rel="noopener noreferrer" />}
                variant="outline"
                size="sm"
              >
                {social.platform}
              </Button>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
