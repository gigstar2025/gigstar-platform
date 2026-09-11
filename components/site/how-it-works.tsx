const STEPS = [
  {
    step: '01',
    title: 'Create your profile',
    description:
      'Artists showcase their sound and story. Venues describe their room, capacity, and vibe.',
  },
  {
    step: '02',
    title: 'Match & make an offer',
    description:
      'Browse, filter, and connect. Send or accept an offer with dates, fees, and terms locked in.',
  },
  {
    step: '03',
    title: 'Play the show & get paid',
    description:
      'Coordinate the details, run the event, and settle payments securely — all inside GigStar.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-border bg-secondary/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From first hello to final encore
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Booking a gig should take minutes, not weeks. Here is how it works.
          </p>
        </div>

        <ol className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.step} className="relative rounded-2xl border border-border bg-card p-8">
              <span className="font-display text-5xl font-bold text-primary/25">
                {step.step}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
