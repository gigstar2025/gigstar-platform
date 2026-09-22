import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ModuleView } from '@/components/profile/module-view'
import { getProfileBySlug, SAMPLE_PROFILES } from '@/lib/profiles/data'
import { MODULAR_PROFILES_FLOW } from '@/lib/flags'

export function generateStaticParams() {
  return SAMPLE_PROFILES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) return { title: 'Profile not found · GigStar' }
  return {
    title: `${profile.displayName} · GigStar`,
    description: profile.bio,
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Convergence (PR-5): /p/[slug] is the canonical public profile URL. When the
  // modular flow is enabled, permanently redirect the legacy /profile/[slug]
  // URL to it. OFF by default, so existing URLs render unchanged for now.
  if (MODULAR_PROFILES_FLOW) {
    permanentRedirect(`/p/${slug}`)
  }

  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  const visibleModules = profile.modules.filter((m) => !m.hidden)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6">
        <div className="mb-4 flex justify-end">
          <Button
            nativeButton={false}
            render={<Link href={`/profile/${profile.slug}/edit`} />}
            variant="outline"
            size="sm"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit profile
          </Button>
        </div>

        <ProfileHeader profile={profile} />

        <div className="mt-10 flex flex-col gap-12">
          {visibleModules.map((module) => (
            <ModuleView key={module.id} module={module} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
