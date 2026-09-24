-- GigStar Phase Five — migration 0017
-- Publishing a modular profile must also take it LIVE.
--
-- BACKGROUND / BUG
--   Profiles are created hidden + draft (table defaults: visibility='hidden',
--   lifecycle_status='draft'). The DB module editor's only go-live control is
--   the "Publish changes" button, which calls publish_profile_modules (0015).
--   That RPC promotes draft_content -> published_content but, by its original
--   design, deliberately left visibility/lifecycle untouched — delegating that
--   to publish_profile (0005). But publish_profile is NOT called anywhere in
--   the modular flow, and it never set visibility='public' either. The result:
--   a freshly created + published profile stays hidden/draft forever, so:
--     * public_profiles (visibility='public' AND lifecycle_status='active')
--       returns no row -> /p/<slug> 404s for everyone,
--     * /profiles/manage keeps labelling it "Hidden".
--   There was no working owner control to make a profile public.
--
-- WHAT THIS MIGRATION CHANGES
--   Redefines publish_profile_modules so that, after promoting module content,
--   it also promotes the profile itself to a live state:
--     * lifecycle_status: draft -> active (leaves active/archived as-is),
--     * visibility:       hidden -> public (leaves an explicit 'unlisted' as-is),
--     * published_at:     stamped once (coalesce).
--   This mirrors the lifecycle logic of publish_profile (0005) and makes the
--   "Publish changes" button do exactly what its label promises.
--
-- WHAT THIS MIGRATION DOES NOT DO
--   * No RLS changes and no new grants. The RPC is already SECURITY DEFINER and
--     already grants EXECUTE to authenticated (owner enforced inside via
--     has_profile_access). Row visibility on the base tables is unchanged.
--   * It does not force a re-hidden ('unlisted') profile back to public, so a
--     future explicit hide/unpublish control is not overridden.
--
-- SAFETY
--   * Idempotent: create or replace; re-running publish keeps the profile
--     public/active (no-op on the profile row after the first publish).
--   * Owner-only, unchanged from 0015.
set local search_path = public, extensions;

create or replace function public.publish_profile_modules(p_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
  v_snapshot jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not public.has_profile_access(p_profile_id, 'owner') then
    raise exception 'not authorised to publish this profile' using errcode = '42501';
  end if;

  -- Promote draft_content -> published_content for every module row on the
  -- profile. Rows with a null draft become null published (i.e. unpublished).
  update public.profile_modules m
  set published_content = m.draft_content,
      published_at      = now(),
      updated_by        = v_uid,
      updated_at        = now()
  where m.profile_id = p_profile_id;

  get diagnostics v_count = row_count;

  -- Take the profile LIVE. Publishing is the go-live action for the modular
  -- editor, so promote a draft/hidden profile to active/public. Leaves an
  -- already-active lifecycle and an explicit 'unlisted' visibility untouched.
  update public.profiles
  set lifecycle_status = case when lifecycle_status = 'draft' then 'active' else lifecycle_status end,
      visibility       = case when visibility = 'hidden' then 'public' else visibility end,
      published_at     = coalesce(published_at, now()),
      updated_at       = now()
  where id = p_profile_id;

  -- Snapshot the resulting published module set for the revision history.
  select jsonb_build_object(
    'kind', 'modules',
    'published_at', now(),
    'modules', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'module_key', m.module_key,
          'position', m.position,
          'is_hidden', m.is_hidden,
          'published_content', m.published_content
        )
        order by m.position asc, m.module_key asc
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot
  from public.profile_modules m
  where m.profile_id = p_profile_id;

  insert into public.profile_revisions (profile_id, snapshot, created_by)
  values (p_profile_id, v_snapshot, v_uid);

  return v_count;
end;
$$;
comment on function public.publish_profile_modules(uuid) is
  'Promote all module draft_content to published_content, take the profile live (draft->active, hidden->public), and record a revision snapshot. Owner only.';

-- EXECUTE grants unchanged from 0015 (re-asserted for idempotency).
revoke execute on function public.publish_profile_modules(uuid) from public, anon;
grant execute on function public.publish_profile_modules(uuid) to authenticated;
