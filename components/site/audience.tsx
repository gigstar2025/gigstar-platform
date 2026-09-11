import {
  CalendarDays,
  CreditCard,
  Guitar,
  LineChart,
  MapPin,
  MessagesSquare,
  Search,
  Ticket,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Feature = { icon: React.ElementType; title: string; description: string }

const ARTIST_FEATURES: Feature[] = [
  {
    icon: Search,
    title: 'Get discovered',
    description:
      'Build a rich profile with tracks, video, and past shows so the right venues find you.',
  },
  {
    icon: MessagesSquare,
    title: 'Receive real offers',
    description:
      'Field booking requests with dates, fees, and terms laid out clearly — no back-and-forth.',
  },
  {
    icon: CreditCard,
    title: 'Get paid on time',
    description:
      'Accept deposits and final payments securely, with everything tracked in one place.',
  },
]

const VENUE_FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: 'Find the right act',
    description:
      'Filter by genre, draw, budget, and availability to book talent that fits your room.',
  },
  {
    icon: CalendarDays,
    title: 'Manage your calendar',
    description:
      'See every hold, confirmation, and load-in detail across all your rooms at a glance.',
  },
  {
    icon: Ticket,
    title: 'Run smoother events',
    description:
      'Share riders, settlements, and day-of details with your team and the artist automatically.',
  },
]

function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="mt-8 space-y-6">
      {features.map((feature) => (
        <li key={feature.title} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary/60 text-primary">
            <feature.icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display font-semibold text-foreground">{feature.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One platform, both sides of the stage
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Whether you play the shows or host them, GigStar gives you the tools to
          book with confidence.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <div id="artists" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8">
          <Badge variant="secondary" className="gap-1.5">
            <Guitar className="size-3.5" aria-hidden="true" />
            For Artists
          </Badge>
          <h3 className="mt-5 text-balance font-display text-2xl font-bold tracking-tight">
            Spend less time chasing gigs, more time playing them
          </h3>
          <FeatureList features={ARTIST_FEATURES} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<a href="/profile/luna-vega" />}
            >
              View example profile
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href="/profile/luna-vega/edit" />}
            >
              Try the profile editor
            </Button>
          </div>
        </div>

        <div id="venues" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8">
          <Badge variant="secondary" className="gap-1.5">
            <LineChart className="size-3.5" aria-hidden="true" />
            For Venues
          </Badge>
          <h3 className="mt-5 text-balance font-display text-2xl font-bold tracking-tight">
            Fill your calendar with acts your crowd will love
          </h3>
          <FeatureList features={VENUE_FEATURES} />
        </div>
      </div>
    </section>
  )
}
