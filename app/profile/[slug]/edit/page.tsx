import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/site-header'
import { ProfileEditor } from '@/components/profile/editor/profile-editor'
import { ProfileCreatedLanding } from '@/components/onboarding/profile-created-landing'
import { getShowcaseProfile, SHOWCASE_PROFILES } from '@/lib/profiles/showcase'
import { MANAGED_PROFILES } from '@/lib/profiles/editor/demo-account'
import { PROFILE_TYPE_OPTIONS } from '@/lib/onboarding/constants'
import { createClient } from '@/lib/supabase/server'

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

  if (profile) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 bg-muted/20">
          <ProfileEditor profiles={MANAGED_PROFILES} initialProfile={profile} />
        </main>
      </div>
    )
  }

  // Not a showcase slug: this is a real, DB-backed profile (e.g. one just
  // created through onboarding). The editor is not yet wired to the database,
  // so we confirm ownership via RLS and render the interim landing. RLS scopes
  // this SELECT to the owner/members of a draft, so unauthorized or unknown
  // slugs fall through to notFound().
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: owned } = await supabase
    .from('profiles')
    .select('slug, display_name, type')
    .eq('slug', slug)
    .maybeSingle()
  if (!owned) notFound()

  const typeLabel =
    PROFILE_TYPE_OPTIONS.find((option) => option.value === owned.type)?.label ??
    owned.type

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 bg-muted/20">
        <ProfileCreatedLanding
          displayName={owned.display_name}
          slug={owned.slug}
          typeLabel={typeLabel}
        />
      </main>
    </div>
  )
}
