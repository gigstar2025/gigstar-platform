import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { ShowcaseHeader } from "@/components/profile/showcase/showcase-header"
import { SectionNav } from "@/components/profile/showcase/section-nav"
import { ShowcaseBody } from "@/components/profile/showcase/showcase-body"
import { ModuleView } from "@/components/profile/module-view"
import { getShowcaseProfile, SHOWCASE_PROFILES } from "@/lib/profiles/showcase"
import { getPublicModularProfile } from "@/lib/profiles/modules/public-profile"
import { MODULAR_PROFILES_FLOW } from "@/lib/flags"

export function generateStaticParams() {
  return SHOWCASE_PROFILES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  if (MODULAR_PROFILES_FLOW) {
    const modular = await getPublicModularProfile(slug)
    if (modular) {
      return {
        title: `${modular.displayName} · GigStar`,
        description: modular.tagline ?? `${modular.displayName} on GigStar`,
      }
    }
  }

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

  // Modular flow (PR-5b): when enabled, /p/[slug] is the canonical public URL
  // and renders PUBLISHED module content read through the public-safe views.
  // Draft content and hidden/unpublished profiles are unreachable here by
  // construction. Showcase demo slugs remain available as a fallback so the
  // marketing examples keep working while the flag is on.
  if (MODULAR_PROFILES_FLOW) {
    const modular = await getPublicModularProfile(slug)
    if (modular) {
      return (
        <div className="flex min-h-dvh flex-col bg-background">
          <SiteHeader />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6">
            <header className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
                {modular.displayName}
              </h1>
              {modular.tagline ? (
                <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                  {modular.tagline}
                </p>
              ) : null}
              {modular.locationLabel ? (
                <p className="text-sm text-muted-foreground">{modular.locationLabel}</p>
              ) : null}
            </header>

            {modular.modules.length > 0 ? (
              <div className="mt-10 flex flex-col gap-12">
                {modular.modules.map((module) => (
                  <ModuleView key={module.id} module={module} />
                ))}
              </div>
            ) : (
              <p className="mt-10 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                This profile hasn&apos;t published any content yet.
              </p>
            )}
          </main>
          <SiteFooter />
        </div>
      )
    }
  }

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
