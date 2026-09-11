const STATS = [
  { value: '18k+', label: 'Active artists' },
  { value: '3,200', label: 'Partner venues' },
  { value: '$9M+', label: 'Paid to artists' },
  { value: '4.9/5', label: 'Average rating' },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-2 py-8 text-center sm:py-10">
            <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
