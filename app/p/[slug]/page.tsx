import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { ShowcaseHeaderClient } from "@/components/profile/showcase/showcase-header-client"
import { SectionNav } from "@/components/profile/showcase/section-nav"
import { ShowcaseBody } from "@/components/profile/showcase/showcase-body"
import { ModuleView } from "@/components/profile/module-view"
import { getShowcaseProfile, SHOWCASE_PROFILES } from "@/lib/profiles/showcase"
import { getPublicModularProfile } from "@/lib/profiles/modules/public-profile"
import { MODULAR_PROFILES_FLOW } from "@/lib/flags"
import { decidePublicRender, isDemoFallbackAllowed } from "@/lib/profiles/public-render-decision"

function demoFallbackAllowed() {
  return isDemoFallbackAllowed({
    vercelEnv: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    demoFallbackFlag: process.env.PROFILE_DEMO_FALLBACK,
  })
}

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
  const decision = decidePublicRender({
    modularFlow: MODULAR_PROFILES_FLOW,
    modularFound: false,
    isShowcaseSlug: Boolean(profile),
    demoFallbackAllowed: demoFallbackAllowed(),
  })
  if (!profile || decision === "not-found") return { title: "Profile not found — GigStar" }
  const titlePrefix = decision === "demo" ? "Demo example: " : ""
  return {
    title: `${titlePrefix}${profile.displayName} — ${profile.tagline} | GigStar`,
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
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              {modular.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modular.avatarUrl || "/placeholder.svg"}
                  alt={`${modular.displayName} profile photo`}
                  className="size-24 shrink-0 rounded-full border border-border object-cover"
                />
              ) : null}
              <div className="flex flex-col gap-3">
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
              </div>
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
  const decision = decidePublicRender({
    modularFlow: MODULAR_PROFILES_FLOW,
    modularFound: false,
    isShowcaseSlug: Boolean(profile),
    demoFallbackAllowed: demoFallbackAllowed(),
  })

  // In production, a modular-lookup miss on a demo slug must NOT silently render
  // sample content dressed up as a real profile — that masks data/persistence
  // failures. Only render the demo when it is explicitly allowed, and always
  // label it so it can never be mistaken for a real published profile.
  if (!profile || decision === "not-found") notFound()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      {decision === "demo" ? (
        <div
          role="status"
          className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900"
        >
          Demo example — sample content, not a real GigStar profile.
        </div>
      ) : null}
      <main className="flex-1">
        <ShowcaseHeaderClient profile={profile} />
        <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
          <SectionNav sections={profile.sections} />
        </div>
        <ShowcaseBody profile={profile} />
      </main>
      <SiteFooter />
    </div>
  )
}
