import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { GuestBanner } from '@/components/home/guest-banner'
import { LocationDiscovery } from '@/components/home/location-discovery'
import { HomeFeed } from '@/components/home/home-feed'
import { ShortFormSection } from '@/components/home/short-form-section'
import {
  EventsNearYou,
  TrendingDjs,
  FeaturedArtists,
  PopularVenues,
  FeaturedOrganisers,
} from '@/components/home/discovery-sections'
import { MobileBottomNav } from '@/components/home/mobile-bottom-nav'
import { Audience } from '@/components/site/audience'
import { HowItWorks } from '@/components/site/how-it-works'
import { Faq } from '@/components/site/faq'
import { Cta } from '@/components/site/cta'

export default function Page() {
  return (
    <div id="top" className="flex min-h-screen flex-col pb-16 md:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <GuestBanner />
        <div className="border-b border-border/60">
          <LocationDiscovery />
        </div>
        <HomeFeed />
        <div className="border-t border-border/60">
          <ShortFormSection />
        </div>
        <div className="border-t border-border/60">
          <EventsNearYou />
        </div>
        <TrendingDjs />
        <FeaturedArtists />
        <PopularVenues />
        <FeaturedOrganisers />
        <div className="border-t border-border/60">
          <Audience />
          <HowItWorks />
          <Faq />
          <Cta />
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
