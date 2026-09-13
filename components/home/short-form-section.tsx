'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Pause, Volume2, VolumeX, X, Heart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REELS, exampleHrefForType, type Reel } from '@/lib/home/feed-data'
import { SectionHeading } from './section-heading'

// Short-form vertical video section — a TikTok/Reels-style row of portrait
// cards opening a prototype vertical viewer with local play/pause and mute.
export function ShortFormSection() {
  const [active, setActive] = useState<Reel | null>(null)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading
        title="Short-form"
        subtitle="DJ sets, live moments, venue tours and event trailers."
      />
      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {REELS.map((reel) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => setActive(reel)}
            className="group relative aspect-[9/16] w-40 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted sm:w-44"
          >
            <img
              src={reel.poster || '/placeholder.svg'}
              alt={reel.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
            <span className="absolute left-2 top-2 rounded-full bg-background/70 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur">
              {reel.tag}
            </span>
            <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/70 backdrop-blur">
              <Play className="size-3.5 translate-x-px" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3 text-left">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{reel.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3" />
                {reel.views}
              </p>
            </div>
          </button>
        ))}
      </div>

      {active && <ReelViewer reel={active} onClose={() => setActive(null)} />}
    </section>
  )
}

function ReelViewer({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={reel.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4 backdrop-blur"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-muted text-foreground"
      >
        <X className="size-5" />
      </button>
      <div
        className="relative aspect-[9/16] w-full max-w-[min(90vw,380px)] overflow-hidden rounded-2xl bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={reel.poster || '/placeholder.svg'} alt={reel.title} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="absolute inset-0 grid place-items-center"
        >
          <span
            className={cn(
              'grid size-16 place-items-center rounded-full bg-background/70 backdrop-blur transition-opacity',
              playing && 'opacity-0',
            )}
          >
            <Play className="size-7 translate-x-0.5" />
          </span>
        </button>

        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            aria-pressed={liked}
            aria-label="Like"
            className="grid size-11 place-items-center rounded-full bg-background/70 backdrop-blur"
          >
            <Heart className={cn('size-5', liked && 'fill-primary text-primary')} />
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="grid size-11 place-items-center rounded-full bg-background/70 backdrop-blur"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="rounded-full bg-background/60 px-2 py-0.5 text-[0.7rem] font-medium backdrop-blur w-fit">
            {reel.tag}
          </p>
          <p className="mt-2 text-sm font-semibold">{reel.title}</p>
          <Link
            href={exampleHrefForType(reel.authorType)}
            className="text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            @{reel.authorName}
          </Link>
        </div>
      </div>
    </div>
  )
}
