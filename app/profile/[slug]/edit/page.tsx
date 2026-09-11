import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/site-header'
import { ProfileEditor } from '@/components/profile/editor/profile-editor'
import { getProfileBySlug, SAMPLE_PROFILES } from '@/lib/profiles/data'

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
  return { title: profile ? `Edit ${profile.displayName} · GigStar` : 'Edit profile · GigStar' }
}

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = getProfileBySlug(slug)
  if (!profile) notFound()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ProfileEditor initialProfile={profile} />
      </main>
    </div>
  )
}
