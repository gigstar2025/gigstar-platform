import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import type { FeedAuthor } from '@/lib/home/feed-data'

// ProfileIdentity — avatar + name + type + verification, reused in every feed
// post header. Ready to receive a real profile record later.
export function ProfileIdentity({
  author,
  time,
  location,
}: {
  author: FeedAuthor
  time?: string
  location?: string
}) {
  const meta = [author.typeLabel, location, time].filter(Boolean).join('  ·  ')
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link href={author.href} className="shrink-0" aria-label={author.name}>
        <img
          src={author.avatar || '/placeholder.svg'}
          alt=""
          className="size-10 rounded-full object-cover ring-1 ring-border"
        />
      </Link>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <Link
            href={author.href}
            className="truncate text-sm font-semibold text-foreground hover:underline"
          >
            {author.name}
          </Link>
          {author.verified && (
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  )
}
