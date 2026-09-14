'use client'

import { CategoryNav } from './category-nav'
import { ProfileHighlights } from './profile-highlights'
import { Feed } from './feed'
import { RightRail } from './right-rail'
import { useDiscovery } from './discovery-context'

// HomeFeed — the primary homepage experience. The category filter reads and
// writes the SHARED discovery state, so it stays in sync with the location
// panel's type chips and drives the feed together with the active location.
export function HomeFeed() {
  const { category, setCategory } = useDiscovery()

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <CategoryNav value={category} onChange={setCategory} variant="bar" />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Discover</p>
            <CategoryNav value={category} onChange={setCategory} variant="rail" />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6">
            <ProfileHighlights />
          </div>
          <Feed />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <RightRail />
          </div>
        </aside>
      </div>
    </>
  )
}
