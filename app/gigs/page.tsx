import type { Metadata } from 'next'
import { Compass, SearchX } from 'lucide-react'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { LocationBar } from '@/components/gigs/location-bar'
import { DevLocationControl } from '@/components/gigs/dev-location-control'
import { GigCard } from '@/components/gigs/gig-card'
import {
  DEV_TOWN_COOKIE,
  RADIUS_OPTIONS,
  getActiveLocation,
  getRadius,
  getTownNames,
  isDevEnvironment,
} from '@/lib/geo/location'
import { GIGS } from '@/lib/gigs/data'
import { queryGigs } from '@/lib/gigs/query'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find gigs near you | GigStar',
  description:
    'Discover live music happening near you. GigStar finds gigs by town or postcode and sorts them by distance.',
}

export default async function GigsPage() {
  const location = await getActiveLocation()
  const radius = await getRadius()
  const townNames = getTownNames()
  const dev = isDevEnvironment()
  const devTown = dev ? (await cookies()).get(DEV_TOWN_COOKIE)?.value ?? null : null

  const results = location ? queryGigs(GIGS, location, radius) : []

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Live near you
            </p>
            <h1 className="mt-2 text-pretty text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {location ? `Gigs near ${location.label}` : 'Gigs near you'}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
              {location
                ? `Showing gigs within ${radius} miles, sorted by distance.`
                : 'We couldn’t detect your location automatically. Choose a town or enter a UK postcode to see gigs nearby.'}
            </p>
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
          {dev && <DevLocationControl towns={townNames} current={devTown} />}

          <LocationBar
            label={location?.label ?? null}
            source={location?.source ?? null}
            detail={location?.detail}
            radius={radius}
            radiusOptions={RADIUS_OPTIONS}
            townSuggestions={townNames}
          />

          {!location ? (
            <EmptyState
              icon={<Compass className="size-6" aria-hidden="true" />}
              title="Pick a location to get started"
              description="Use the search above to choose a UK town or enter a postcode. We’ll remember it for next time."
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-6" aria-hidden="true" />}
              title={`No gigs within ${radius} miles of ${location.label}`}
              description="Try widening the radius or searching a different town. We’re adding new gigs all the time."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {results.length} {results.length === 1 ? 'gig' : 'gigs'} found
                </h2>
              </div>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((gig) => (
                  <li key={gig.id} className="flex">
                    <div className="flex-1">
                      <GigCard gig={gig} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-pretty text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
