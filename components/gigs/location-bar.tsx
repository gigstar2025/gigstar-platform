'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  LocateFixed,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  applyLocation,
  applyPreciseLocation,
  clearLocation,
  setRadius,
  type LocationFormState,
} from '@/app/gigs/actions'
import type { LocationSource } from '@/lib/geo/location'

type LocationBarProps = {
  label: string | null
  source: LocationSource | null
  detail?: string
  radius: number
  radiusOptions: readonly number[]
  townSuggestions: string[]
}

const SOURCE_HINT: Record<LocationSource, string> = {
  auto: 'Detected automatically',
  'manual-town': 'Chosen by you',
  'manual-postcode': 'From your postcode',
  precise: 'From your device location',
  dev: 'Simulated (development)',
}

type GeoStatus = 'idle' | 'locating' | 'ready' | 'error'

/** Turn a Geolocation accuracy radius (metres) into plain language. */
function formatAccuracy(metres: number): string {
  if (metres < 1000) return `within about ${Math.round(metres)} m`
  const km = metres / 1000
  return `within about ${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

/** Accuracy of 5 km or worse is treated as approximate. */
const APPROXIMATE_THRESHOLD_METRES = 5000

const initialState: LocationFormState = { status: 'idle' }

export function LocationBar({
  label,
  source,
  detail,
  radius,
  radiusOptions,
  townSuggestions,
}: LocationBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(label === null)
  const [isPending, startTransition] = useTransition()
  const [state, formAction, formPending] = useActionState(applyLocation, initialState)
  const inputRef = useRef<HTMLInputElement>(null)

  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoMessage, setGeoMessage] = useState<string | null>(null)
  const [geoApproximate, setGeoApproximate] = useState(false)

  useEffect(() => {
    if (state.status === 'success') {
      setOpen(false)
      router.refresh()
    }
  }, [state.status, router])

  function handlePreciseLocation() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoApproximate(false)
      setGeoMessage(
        'Your browser cannot share a precise location. Enter a town or postcode instead.',
      )
      setOpen(true)
      return
    }

    setGeoStatus('locating')
    setGeoMessage(null)
    setGeoApproximate(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const approximate = accuracy >= APPROXIMATE_THRESHOLD_METRES
        setGeoApproximate(approximate)
        setGeoStatus('ready')
        setGeoMessage(
          approximate
            ? `We could only locate you ${formatAccuracy(accuracy)}, so this is approximate. For accurate results, enter your town or postcode below.`
            : `Located ${formatAccuracy(accuracy)}.`,
        )
        if (approximate) setOpen(true)

        startTransition(async () => {
          const result = await applyPreciseLocation(latitude, longitude)
          if (result.status === 'success') {
            router.refresh()
          } else {
            setGeoStatus('error')
            setGeoMessage(result.message ?? 'We could not use that location. Please try again.')
            setOpen(true)
          }
        })
      },
      (error) => {
        setGeoStatus('error')
        setGeoApproximate(false)
        setOpen(true)
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location access was blocked. Enter a town or postcode instead.'
            : error.code === error.TIMEOUT
              ? 'Locating you took too long. Enter a town or postcode instead.'
              : 'We could not determine your location. Enter a town or postcode instead.'
        setGeoMessage(message)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  function handleRadiusChange(value: string) {
    startTransition(async () => {
      await setRadius(Number(value))
      router.refresh()
    })
  }

  function handleClear() {
    startTransition(async () => {
      await clearLocation()
      router.refresh()
    })
  }

  const hasError =
    state.status === 'invalid-postcode' ||
    state.status === 'not-found' ||
    state.status === 'error'

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {label ?? 'Location not set'}
            </span>
            <span className="text-xs text-muted-foreground">
              {source ? SOURCE_HINT[source] : 'Choose a town or postcode to see gigs'}
              {detail ? ` · ${detail}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="radius" className="text-xs text-muted-foreground">
              Radius
            </Label>
            <Select
              value={String(radius)}
              onValueChange={(value) => {
                if (value !== null) handleRadiusChange(value)
              }}
              disabled={label === null || isPending}
            >
              <SelectTrigger id="radius" className="h-9 w-[110px]" aria-label="Search radius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} miles
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreciseLocation}
            disabled={geoStatus === 'locating' || isPending}
          >
            {geoStatus === 'locating' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="size-4" aria-hidden="true" />
            )}
            Use my precise location
          </Button>

          <Button
            type="button"
            variant={open ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="location-panel"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Change location
          </Button>
        </div>
      </div>

      {geoMessage && (
        <p
          role="status"
          className={`mt-3 inline-flex items-start gap-2 text-sm ${
            geoStatus === 'error' || geoApproximate ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {(geoStatus === 'error' || geoApproximate) && (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{geoMessage}</span>
        </p>
      )}

      {open && (
        <div id="location-panel" className="mt-4 border-t border-border/60 pt-4">
          <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Label htmlFor="query" className="sr-only">
                UK town or postcode
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="query"
                  name="query"
                  ref={inputRef}
                  list="town-suggestions"
                  placeholder="e.g. Chingford or E4 8SP"
                  autoComplete="off"
                  className="pl-9"
                  aria-invalid={hasError}
                  aria-describedby={hasError ? 'location-error' : undefined}
                />
                <datalist id="town-suggestions">
                  {townSuggestions.map((town) => (
                    <option key={town} value={town} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={formPending}>
                {formPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                Search
              </Button>
              {source && source !== 'auto' && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClear}
                  disabled={isPending}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>

          {hasError && (
            <p
              id="location-error"
              role="alert"
              className="mt-3 inline-flex items-start gap-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{state.message}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
