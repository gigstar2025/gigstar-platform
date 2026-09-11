import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-16">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]"
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your next great show is one booking away
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            Join thousands of artists and venues already booking smarter with
            GigStar. Get set up in minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2">
              Get started free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline">
              Talk to our team
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
