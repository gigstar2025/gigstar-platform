import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/site-header'
import { ProfileEditor } from '@/components/profile/editor/profile-editor'
import { DbModuleEditor } from '@/components/profile/editor/modules/db-module-editor'
import { ProfileCreatedLanding } from '@/components/onboarding/profile-created-landing'
import { getShowcaseProfile, SHOWCASE_PROFILES } from '@/lib/profiles/showcase'
import { MANAGED_PROFILES } from '@/lib/profiles/editor/demo-account'
import { PROFILE_TYPE_OPTIONS } from '@/lib/onboarding/constants'
import { createClient } from '@/lib/supabase/server'
import { MODULAR_PROFILES_FLOW } from '@/lib/flags'
import { getEditorModules } from '@/lib/profiles/modules/persistence'
import { isProfileType } from '@/lib/profiles/modules/registry'

// This route reads cookies (Supabase session) in the DB-backed branch for
// freshly created onboarding profiles. With generateStaticParams present, Next
// otherwise treats the route as statically generable and throws
// DYNAMIC_SERVER_USAGE in production when the dynamic (non-showcase) branch
// accesses cookies. Force dynamic rendering — this is a per-user, authenticated
// editor, so it should never be statically cached.
export const dynamic = 'force-dynamic'

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
    .select('id, slug, display_name, type, avatar_media_id')
    .eq('slug', slug)
    .maybeSingle()
  if (!owned) notFound()

  // Modular flow (PR-5b): render the persisted, DB-backed module editor for
  // profile types that support modules. Ownership for both the initial load and
  // every write is enforced inside the SECURITY DEFINER RPCs, not here.
  if (MODULAR_PROFILES_FLOW && isProfileType(owned.type)) {
    const initialModules = await getEditorModules(owned.id)

    // Current avatar (if any) for the uploader preview. RLS lets a member read
    // their own profile's media even while the profile is still a draft.
    let initialAvatarUrl: string | null = null
    if (owned.avatar_media_id) {
      const { data: media } = await supabase
        .from('media_assets')
        .select('public_url')
        .eq('id', owned.avatar_media_id)
        .maybeSingle()
      initialAvatarUrl = (media?.public_url as string | null) ?? null
    }

    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 bg-muted/20">
          <DbModuleEditor
            profileId={owned.id}
            slug={owned.slug}
            displayName={owned.display_name}
            profileType={owned.type}
            initialModules={initialModules}
            initialAvatarUrl={initialAvatarUrl}
          />
        </main>
      </div>
    )
  }

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
