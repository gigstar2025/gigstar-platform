-- GigStar Phase Six — migration 0013
-- Secured, atomic profile archival for the multi-profile manager (PR-4).
--
--   * archive_profile(profile_id, replacement_default_id) — SECURITY DEFINER,
--     owner-only, soft-archive that preserves memberships and history,
--     reassigns the account default atomically when the archived profile IS
--     the default, and refuses to strand the account (never archives the
--     caller's last active profile).
--
-- Additive only. Migrations 0001–0012 are NOT edited. The function pins an
-- explicit empty search_path, derives identity solely from auth.uid(), never
-- accepts a caller-supplied account/user id, revokes PUBLIC + anon and grants
-- EXECUTE to authenticated only. It is soft-archive — it never DELETEs rows,
-- never touches profile_memberships (so trg_protect_last_owner stays intact
-- and enabled), and never sets location_exact. This is NOT deletion or account
-- teardown (issue #7 remains a separate concern).
set local search_path = public, extensions;

-- ===========================================================================
-- archive_profile(profile_id, replacement_default_id) -> uuid
--   Returns the archived profile id on success. Raises controlled, stable
--   errors that the server action maps to friendly messages:
--     * 42501 'authentication required'   — no session
--     * 42501 'owner_required'            — caller is not an active owner
--                                            (also covers cross-account: a
--                                            non-member has no access at all)
--     * 22023 'not_archivable'            — target already archived/deleted or
--                                            not an active profile
--     * P0001 'last_active_profile'       — would archive the caller's last
--                                            remaining active profile
--     * 22023 'replacement_required'      — archiving the default without a
--                                            replacement default
--     * 22023 'invalid_replacement'       — replacement is not a caller-owned,
--                                            active, non-archived profile
--                                            (cross-account / archived / gone)
-- ===========================================================================
create or replace function public.archive_profile(
  p_profile_id uuid,
  p_replacement_default_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_active_count integer;
  v_is_default boolean;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Require an ACTIVE OWNER membership on the target. has_profile_access is a
  -- SECURITY DEFINER membership check keyed on auth.uid(), so a non-member —
  -- including any other account — is denied here. The caller can never pass a
  -- foreign account/user identity: only their own auth.uid() is consulted.
  if not public.has_profile_access(p_profile_id, 'owner') then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  -- Target must currently be an active, non-archived, non-deleted profile.
  if not exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and p.deleted_at is null
      and p.archived_at is null
      and p.lifecycle_status <> 'archived'
  ) then
    raise exception 'not_archivable' using errcode = '22023';
  end if;

  -- Never strand the account: refuse to archive the caller's LAST active
  -- profile. Archived / soft-deleted profiles do not count (mirrors the
  -- active-profile ceiling in create_profile).
  select count(*) into v_active_count
  from public.profiles p
  join public.profile_memberships m on m.profile_id = p.id
  where m.user_id = v_uid
    and m.role = 'owner'
    and m.status = 'active'
    and p.deleted_at is null
    and p.archived_at is null
    and p.lifecycle_status <> 'archived';

  if v_active_count <= 1 then
    raise exception 'last_active_profile' using errcode = 'P0001';
  end if;

  -- Is the target the account's current default?
  select (ua.default_profile_id = p_profile_id) into v_is_default
  from public.user_accounts ua
  where ua.id = v_uid;

  if coalesce(v_is_default, false) then
    -- Archiving the default demands a valid replacement default so the account
    -- is never left pointing at an archived profile.
    if p_replacement_default_id is null or p_replacement_default_id = p_profile_id then
      raise exception 'replacement_required' using errcode = '22023';
    end if;

    -- Replacement must be a caller-owned (active membership), non-archived,
    -- non-deleted profile. has_profile_access denies cross-account choices.
    if not public.has_profile_access(p_replacement_default_id, 'analyst') then
      raise exception 'invalid_replacement' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.profiles p
      where p.id = p_replacement_default_id
        and p.deleted_at is null
        and p.archived_at is null
        and p.lifecycle_status <> 'archived'
    ) then
      raise exception 'invalid_replacement' using errcode = '22023';
    end if;

    -- Reassign the default atomically (same transaction as the archive below).
    update public.user_accounts
    set default_profile_id = p_replacement_default_id, updated_at = now()
    where id = v_uid;
  end if;

  -- Soft-archive only. Memberships, modules, revisions and history are all
  -- preserved. Set the profile hidden as well so it drops out of every
  -- public-safe surface immediately (the views also filter on archived_at /
  -- lifecycle_status, this is belt-and-braces).
  update public.profiles
  set lifecycle_status = 'archived',
      archived_at = now(),
      visibility = 'hidden',
      updated_at = now()
  where id = p_profile_id;

  return p_profile_id;
end;
$$;
comment on function public.archive_profile(uuid, uuid) is
  'Owner-only atomic soft-archive. Preserves memberships/history, reassigns the account default atomically when archiving the default (validated replacement required), and refuses to archive the caller''s last active profile. Never deletes, never touches location_exact.';

revoke all on function public.archive_profile(uuid, uuid) from public;
revoke all on function public.archive_profile(uuid, uuid) from anon;
grant execute on function public.archive_profile(uuid, uuid) to authenticated;
