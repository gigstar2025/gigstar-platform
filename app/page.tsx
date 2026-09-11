import { SiteHeader } from '@/components/site/site-header'
import { Hero } from '@/components/site/hero'
import { Stats } from '@/components/site/stats'
import { Audience } from '@/components/site/audience'
import { HowItWorks } from '@/components/site/how-it-works'
import { Faq } from '@/components/site/faq'
import { Cta } from '@/components/site/cta'
import { SiteFooter } from '@/components/site/site-footer'

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Audience />
        <HowItWorks />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
