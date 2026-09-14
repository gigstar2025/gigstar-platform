import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/site-header'
import { ProfileEditor } from '@/components/profile/editor/profile-editor'
import { getShowcaseProfile, SHOWCASE_PROFILES } from '@/lib/profiles/showcase'
import { MANAGED_PROFILES } from '@/lib/profiles/editor/demo-account'

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
  return { title: profile ? `Edit ${profile.displayName} · GigStar` : 'Edit profile · GigStar' }
}

export default async function EditProfilePage({
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
      <main className="flex-1 bg-muted/20">
        <ProfileEditor profiles={MANAGED_PROFILES} initialProfile={profile} />
      </main>
    </div>
  )
}
