-- GigStar Phase Five — migration 0015
-- Modular profile pages: give the persisted module system an owner-authorised
-- PUBLISH step that promotes draft_content -> published_content and records an
-- immutable revision snapshot.
--
-- WHAT THIS MIGRATION CHANGES
--   1. Adds one SECURITY DEFINER RPC:
--        * publish_profile_modules(profile_id)   [owner only]
--      It copies draft_content into published_content for every module row on
--      the profile, stamps published_at, and writes a snapshot of the resulting
--      published module set into profile_revisions.
--
-- WHY SECURITY DEFINER
--   Publishing writes published_content, which anon/authenticated cannot write
--   directly (see 0010 least-privilege grants). The definer function performs
--   the membership check internally, mirroring save_profile_module_draft in
--   0014 and publish_profile in 0005. Publishing is a higher-privilege action
--   than drafting, so it requires OWNER rank rather than content_contributor.
--
-- WHAT THIS MIGRATION DOES NOT DO
--   * No RLS changes and no new table-level grants.
--   * It does not change the profile's own lifecycle/visibility; that remains
--     the responsibility of publish_profile (0005). This RPC only publishes the
--     module CONTENT and snapshots it.
--
-- SAFETY
--   * Idempotent DDL: create or replace + explicit grant/revoke.
--   * Re-running the RPC re-copies drafts and appends another revision row.
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
  'Promote all module draft_content to published_content for a profile and record a revision snapshot. Owner only.';

-- EXECUTE grants: publishing always requires an authenticated owner session.
-- Postgres grants EXECUTE to PUBLIC by default and Supabase default privileges
-- additionally grant it directly to anon. Revoke from PUBLIC and anon so
-- anonymous callers cannot execute this RPC at all, then grant to authenticated
-- (owner enforcement happens inside the function via has_profile_access).
revoke execute on function public.publish_profile_modules(uuid) from public, anon;
grant execute on function public.publish_profile_modules(uuid) to authenticated;
