'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Ticket,
  Music2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProfileIdentity } from './profile-identity'
import { FollowButton } from './follow-button'
import { SocialActions } from './social-actions'
import { CommentPreview } from './comment-preview'
import { SharePanel } from './share-panel'
import { TicketStatus } from './ticket-status'
import type { FeedPost as FeedPostType } from '@/lib/home/feed-data'

const SHAPE: Record<FeedPostType['shape'], string> = {
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
  landscape: 'aspect-[16/10]',
}

function PlayableMedia({
  src,
  alt,
  shape,
  kind,
  duration,
}: {
  src: string
  alt: string
  shape: FeedPostType['shape']
  kind: 'video' | 'audio'
  duration?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-muted', SHAPE[shape])}>
      <img src={src || '/placeholder.svg'} alt={alt} className="size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'Pause' : 'Play'}
        className="absolute inset-0 grid place-items-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-transform hover:scale-105">
          {playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
        </span>
      </button>
      {duration && (
        <span className="absolute right-3 top-3 rounded-md bg-background/80 px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur">
          {duration}
        </span>
      )}
      {kind === 'video' && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      )}
      {kind === 'audio' && (
        <div className="absolute inset-x-3 bottom-3">
          <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur">
            <Music2 className="size-3.5 shrink-0 text-primary" />
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  'h-full rounded-full bg-primary transition-all duration-500',
                  playing ? 'w-2/3' : 'w-1/4',
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)

  function go(delta: number) {
    const el = ref.current
    if (!el) return
    const next = Math.max(0, Math.min(images.length - 1, idx + delta))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    setIdx(next)
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      <div
        ref={ref}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src || '/placeholder.svg'}
            alt={`${alt} — ${i + 1} of ${images.length}`}
            className="size-full shrink-0 snap-center object-cover"
            style={{ width: '100%' }}
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={idx === 0}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-opacity disabled:opacity-0"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={idx === images.length - 1}
            aria-label="Next image"
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-opacity disabled:opacity-0"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn('size-1.5 rounded-full transition-colors', i === idx ? 'bg-primary' : 'bg-background/60')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// FeedPost — dispatches by content kind and composes the social layer
// (ProfileIdentity, SocialActions, CommentPreview, SharePanel). Every field
// maps onto a real published-content record later.
export function FeedPost({ post }: { post: FeedPostType }) {
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const isEvent = post.kind === 'event' || post.kind === 'lineup'

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 p-4">
        <ProfileIdentity author={post.author} time={post.time} location={post.location} />
        <FollowButton size="sm" />
      </div>

      <div className="px-4">
        {post.kind === 'gallery' && <Gallery images={post.images} alt={post.mediaAlt} />}
        {(post.kind === 'video' || post.kind === 'audio' || post.kind === 'release') && (
          <PlayableMedia
            src={post.images[0]}
            alt={post.mediaAlt}
            shape={post.shape}
            kind={post.kind === 'video' ? 'video' : 'audio'}
            duration={post.duration}
          />
        )}
        {(post.kind === 'photo' || isEvent) && (
          <div className={cn('relative overflow-hidden rounded-xl bg-muted', SHAPE[post.shape])}>
            <Link href={isEvent && post.event ? post.event.href : post.author.href}>
              <img src={post.images[0] || '/placeholder.svg'} alt={post.mediaAlt} className="size-full object-cover" />
            </Link>
            {isEvent && post.event && (
              <div className="absolute left-3 top-3">
                <TicketStatus status={post.event.status} />
              </div>
            )}
          </div>
        )}
      </div>

      {post.kind === 'release' && post.release && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
          <img src={post.release.artwork || '/placeholder.svg'} alt="" className="size-12 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{post.release.title}</p>
            <p className="text-xs text-muted-foreground">
              {post.release.type} · {post.author.name}
            </p>
          </div>
          <Button size="sm">
            <Play className="size-3.5" />
            Preview
          </Button>
        </div>
      )}

      {isEvent && post.event && (
        <div className="mx-4 mt-3 rounded-xl border border-border/60 bg-muted/40 p-3">
          <p className="font-medium leading-snug text-balance">{post.event.name}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {post.event.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {post.event.venue}, {post.event.town}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Ticket className="size-3.5" />
              {post.event.price}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={post.event.href} />}>
              View event
            </Button>
            {post.event.status !== 'sold-out' && (
              <Button size="sm" nativeButton={false} render={<Link href={post.event.href} />}>
                Get tickets
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        <p className="text-sm leading-relaxed text-foreground text-pretty">{post.caption}</p>
        {post.tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-2 text-sm font-medium text-primary">
            {post.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        )}
        <div className="mt-3">
          <SocialActions
            likes={post.likes}
            commentCount={post.commentCount}
            shares={post.shares}
            onToggleComments={() => setShowComments((v) => !v)}
            onToggleShare={() => setShowShare((v) => !v)}
          />
        </div>
        {showShare && <SharePanel onClose={() => setShowShare(false)} />}
        {showComments && <CommentPreview comments={post.comments} />}
      </div>
    </article>
  )
}
