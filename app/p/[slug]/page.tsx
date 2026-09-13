import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { ShowcaseHeader } from "@/components/profile/showcase/showcase-header"
import { SectionNav } from "@/components/profile/showcase/section-nav"
import { ShowcaseBody } from "@/components/profile/showcase/showcase-body"
import { getShowcaseProfile, SHOWCASE_PROFILES } from "@/lib/profiles/showcase"

export function generateStaticParams() {
  return SHOWCASE_PROFILES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = getShowcaseProfile(slug)
  if (!profile) return { title: "Profile not found — GigStar" }
  return {
    title: `${profile.displayName} — ${profile.tagline} | GigStar`,
    description: profile.bio[0],
  }
}

export default async function ShowcaseProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = getShowcaseProfile(slug)
  if (!profile) notFound()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ShowcaseHeader profile={profile} />
        <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
          <SectionNav sections={profile.sections} />
        </div>
        <ShowcaseBody profile={profile} />
      </main>
      <SiteFooter />
    </div>
  )
}
