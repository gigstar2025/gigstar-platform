import Image from 'next/image'
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import heroImage from '@/public/images/hero-stage.png'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 spotlight-grid" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            The modern booking platform for live music
          </span>

          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Book live music.{' '}
            <span className="text-primary text-glow">Fill every stage.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            GigStar connects artists and venues in one place — discover talent,
            send offers, manage events, and get paid without the endless email
            threads and spreadsheets.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2">
              Get started free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <PlayCircle className="size-4" aria-hidden="true" />
              See how it works
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free for artists. No credit card required.
          </p>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/40 sm:aspect-[4/3] lg:aspect-[4/5]">
            <Image
              src={heroImage}
              alt="A performer on stage under warm amber spotlights facing a crowd at a live music venue"
              className="object-cover"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:block">
            <p className="font-display text-2xl font-bold text-foreground">12,400+</p>
            <p className="text-xs text-muted-foreground">gigs booked this month</p>
          </div>
        </div>
      </div>
    </section>
  )
}
