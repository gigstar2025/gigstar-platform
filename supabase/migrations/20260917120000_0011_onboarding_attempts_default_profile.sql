-- GigStar Phase Six — migration 0011
-- Multi-profile onboarding database foundation:
--   * profile_creation_attempts  — server-minted idempotency keys, retry-safe
--   * onboarding_state           — resumable per-account onboarding progress
--   * user_accounts.default_profile_id + secured default management
--   * create_profile(...)        — atomic, retry-safe, 5-active-profile-limited
--   * slug_available(...)        — boolean-only availability probe
--
-- Additive only. Migrations 0001–0010 are NOT edited. All new tables enable
-- RLS (owner-only), all new functions revoke PUBLIC/anon and grant authenticated
-- only, use SECURITY DEFINER where they must bypass RLS, pin `search_path = ''`,
-- and fully schema-qualify every object. No sensitive column (location_exact,
-- draft_content) is exposed. Migration 0010's grants/RLS posture is preserved.
set local search_path = public, extensions;

-- ===========================================================================
-- 0. Canonical, single-source configuration.
-- ===========================================================================
-- The maximum number of ACTIVE (non-archived) profiles a single account may
-- own. Change the literal here to adjust the launch limit everywhere; the
-- create_profile transaction and any UI (via this RPC) read from this one spot.
create or replace function public.max_active_profiles_per_account()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 5;
$$;
comment on function public.max_active_profiles_per_account() is
  'Canonical limit: maximum active (non-archived) profiles per account. Single source of truth — change the literal here to adjust.';

revoke all on function public.max_active_profiles_per_account() from public;
revoke all on function public.max_active_profiles_per_account() from anon;
grant execute on function public.max_active_profiles_per_account() to authenticated;

-- ===========================================================================
-- 1. Enums.
-- ===========================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_creation_status') then
    create type public.profile_creation_status as enum ('pending', 'completed', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'onboarding_step') then
    create type public.onboarding_step as enum ('type', 'details', 'handle', 'review', 'completed');
  end if;
end
$$;

-- ===========================================================================
-- 2. profile_creation_attempts — one row per creation attempt. The primary
--    key IS the server-minted idempotency key; the browser never inserts or
--    updates rows here (SELECT-own only). All writes go through the definer
--    RPCs below.
-- ===========================================================================
create table if not exists public.profile_creation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_accounts(id) on delete cascade,
  status public.profile_creation_status not null default 'pending',
  created_profile_id uuid references public.profiles(id) on delete set null,
  requested_slug extensions.citext,
  requested_type public.profile_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
comment on table public.profile_creation_attempts is
  'Idempotency ledger for profile creation. PK is the server-minted attempt key. Client has SELECT-own only; all writes via SECURITY DEFINER RPCs.';

create index if not exists profile_creation_attempts_user_idx
  on public.profile_creation_attempts (user_id, status);
-- Exactly one profile may ever be attributed to a given attempt.
create unique index if not exists profile_creation_attempts_profile_uidx
  on public.profile_creation_attempts (created_profile_id)
  where created_profile_id is not null;

drop trigger if exists trg_profile_creation_attempts_updated_at on public.profile_creation_attempts;
create trigger trg_profile_creation_attempts_updated_at
  before update on public.profile_creation_attempts
  for each row execute function public.set_updated_at();

alter table public.profile_creation_attempts enable row level security;
-- Owner may read only their own attempts. No insert/update/delete policy exists,
-- so those are denied for authenticated even before the grant restriction below.
drop policy if exists attempts_select_own on public.profile_creation_attempts;
create policy attempts_select_own on public.profile_creation_attempts
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- 3. onboarding_state — resumable per-account onboarding progress (1 row/user).
-- ===========================================================================
create table if not exists public.onboarding_state (
  user_id uuid primary key references public.user_accounts(id) on delete cascade,
  current_step public.onboarding_step not null default 'type',
  active_attempt_id uuid references public.profile_creation_attempts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.onboarding_state is
  'Resumable onboarding progress, one row per account. Client has SELECT-own only; writes via set_onboarding_step RPC.';

drop trigger if exists trg_onboarding_state_updated_at on public.onboarding_state;
create trigger trg_onboarding_state_updated_at
  before update on public.onboarding_state
  for each row execute function public.set_updated_at();

alter table public.onboarding_state enable row level security;
drop policy if exists onboarding_state_select_own on public.onboarding_state;
create policy onboarding_state_select_own on public.onboarding_state
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- 4. Default profile pointer on user_accounts.
--    Nullable; an account may transiently have zero profiles. FK nulls on
--    profile delete so a dangling default can never occur.
-- ===========================================================================
alter table public.user_accounts
  add column if not exists default_profile_id uuid references public.profiles(id) on delete set null;
comment on column public.user_accounts.default_profile_id is
  'The account''s chosen default profile. Nullable. FK on delete set null. Validity (membership/archival) is re-checked at read time by resolve_default_profile().';

-- ===========================================================================
-- 5. Grants — least privilege. New tables: authenticated SELECT-own (via RLS),
--    never anon, never write. user_accounts grants are intentionally NOT
--    changed here; the default pointer is read through resolve_default_profile().
-- ===========================================================================
revoke all on table public.profile_creation_attempts from anon, authenticated;
grant select on table public.profile_creation_attempts to authenticated;

revoke all on table public.onboarding_state from anon, authenticated;
grant select on table public.onboarding_state to authenticated;

-- ===========================================================================
-- 6. slug_available(candidate) -> boolean.
--    Authenticated-only (onboarding runs post-confirmation). Normalizes and
--    validates the candidate, checks live slugs AND retired slugs, and blocks
--    reserved route words. Returns ONLY a boolean — never any profile data.
--    SECURITY DEFINER so it can see all slugs (RLS would hide non-public rows);
--    the unique constraint on profiles.slug remains the final race guard.
-- ===========================================================================
create or replace function public.slug_available(p_candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with normalized as (
    select lower(btrim(coalesce(p_candidate, ''))) as s
  )
  select case
    when n.s !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then false
    when length(n.s) < 3 or length(n.s) > 40 then false
    when n.s in (
      'admin','api','app','auth','dev','gigs','onboarding','profile','profiles',
      'settings','account','accounts','login','logout','signup','sign-up','signin',
      'sign-in','new','manage','support','help','about','terms','privacy','static',
      'public','assets','images','favicon','robots','sitemap','www','root','system'
    ) then false
    when exists (select 1 from public.profiles pr where pr.slug = n.s::extensions.citext) then false
    when exists (select 1 from public.profile_slug_history h where h.previous_slug = n.s::extensions.citext) then false
    else true
  end
  from normalized n;
$$;
comment on function public.slug_available(text) is
  'Boolean-only slug availability probe (normalized, validated, reserved-word + history aware). Reveals no profile data. Unique constraint is the final race guard.';

revoke all on function public.slug_available(text) from public;
revoke all on function public.slug_available(text) from anon;
grant execute on function public.slug_available(text) to authenticated;

-- ===========================================================================
-- 7. start_profile_creation_attempt() -> uuid.
--    Mints a fresh server-side attempt key for the caller and returns it.
--    The client never supplies the key. Used by both initial onboarding and
--    "Create another profile".
-- ===========================================================================
create or replace function public.start_profile_creation_attempt()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_accounts u where u.id = v_uid) then
    raise exception 'user account not initialised' using errcode = '42501';
  end if;

  insert into public.profile_creation_attempts (user_id, status)
  values (v_uid, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;
comment on function public.start_profile_creation_attempt() is
  'Mint a server-side profile-creation idempotency key for the caller. Returns the attempt id used by create_profile().';

revoke all on function public.start_profile_creation_attempt() from public;
revoke all on function public.start_profile_creation_attempt() from anon;
grant execute on function public.start_profile_creation_attempt() to authenticated;

-- ===========================================================================
-- 8. set_onboarding_step(step, active_attempt_id) -> void.
--    Owner-scoped upsert of onboarding progress. Validates that any referenced
--    attempt belongs to the caller. Replaces unrestricted client writes.
-- ===========================================================================
create or replace function public.set_onboarding_step(
  p_step public.onboarding_step,
  p_active_attempt_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_active_attempt_id is not null
     and not exists (
       select 1 from public.profile_creation_attempts a
       where a.id = p_active_attempt_id and a.user_id = v_uid
     ) then
    raise exception 'attempt does not belong to caller' using errcode = '42501';
  end if;

  insert into public.onboarding_state (user_id, current_step, active_attempt_id)
  values (v_uid, p_step, p_active_attempt_id)
  on conflict (user_id) do update
    set current_step = excluded.current_step,
        active_attempt_id = excluded.active_attempt_id,
        updated_at = now();
end;
$$;
comment on function public.set_onboarding_step(public.onboarding_step, uuid) is
  'Owner-scoped upsert of onboarding progress. Validates attempt ownership.';

revoke all on function public.set_onboarding_step(public.onboarding_step, uuid) from public;
revoke all on function public.set_onboarding_step(public.onboarding_step, uuid) from anon;
grant execute on function public.set_onboarding_step(public.onboarding_step, uuid) to authenticated;

-- ===========================================================================
-- 9. set_default_profile(profile_id) -> void.
--    Sets the caller's default profile. Requires an active membership and a
--    non-archived, non-deleted profile. Draft profiles ARE valid defaults.
-- ===========================================================================
create or replace function public.set_default_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.has_profile_access(p_profile_id, 'analyst') then
    raise exception 'active membership required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and p.deleted_at is null
      and p.archived_at is null
      and p.lifecycle_status <> 'archived'
  ) then
    raise exception 'profile is not a valid default' using errcode = '22023';
  end if;

  update public.user_accounts
  set default_profile_id = p_profile_id, updated_at = now()
  where id = v_uid;
end;
$$;
comment on function public.set_default_profile(uuid) is
  'Set the caller''s default profile after confirming active membership and that the profile is not archived/deleted.';

revoke all on function public.set_default_profile(uuid) from public;
revoke all on function public.set_default_profile(uuid) from anon;
grant execute on function public.set_default_profile(uuid) to authenticated;

-- ===========================================================================
-- 10. resolve_default_profile() -> uuid.
--     Returns the caller's default profile id IF it is still valid (active
--     membership, not archived/deleted); otherwise NULL. Pure read (no
--     side effects) so routing can decide to fall back to /profiles/manage.
--     Definer so it needs no direct user_accounts SELECT grant.
-- ===========================================================================
create or replace function public.resolve_default_profile()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ua.default_profile_id
  from public.user_accounts ua
  where ua.id = (select auth.uid())
    and ua.default_profile_id is not null
    and exists (
      select 1
      from public.profiles p
      join public.profile_memberships m on m.profile_id = p.id
      where p.id = ua.default_profile_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and p.deleted_at is null
        and p.archived_at is null
        and p.lifecycle_status <> 'archived'
    );
$$;
comment on function public.resolve_default_profile() is
  'Return the caller''s default profile id if still valid (active membership, not archived/deleted), else NULL. No side effects.';

revoke all on function public.resolve_default_profile() from public;
revoke all on function public.resolve_default_profile() from anon;
grant execute on function public.resolve_default_profile() to authenticated;

-- ===========================================================================
-- 11. create_profile(attempt, slug, type, display_name, tagline, location...)
--     Atomic, retry-safe profile creation keyed by a server-issued attempt id.
--       * requires auth + a matching, owned attempt
--       * serializes concurrent identical submits via a per-attempt advisory
--         lock, then re-checks status FOR UPDATE
--       * a completed attempt returns the SAME profile (idempotent replay)
--       * enforces the active-profile limit INSIDE the transaction
--       * delegates the profile+owner+modules+slug-history insert to the tested
--         create_profile_with_owner() helper, then applies coarse location
--       * new profile starts hidden/draft/unpublished (table defaults)
--       * assigns the account default only when no valid default exists
--     Never touches location_exact. No service role required.
-- ===========================================================================
create or replace function public.create_profile(
  p_attempt_id uuid,
  p_slug text,
  p_type public.profile_type,
  p_display_name text,
  p_tagline text default null,
  p_location_label text default null,
  p_location_lon double precision default null,
  p_location_lat double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_attempt public.profile_creation_attempts%rowtype;
  v_slug extensions.citext;
  v_profile_id uuid;
  v_active_count integer;
  v_has_valid_default boolean;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Serialize concurrent submits that share the same attempt key.
  perform pg_advisory_xact_lock(hashtextextended(p_attempt_id::text, 0));

  select * into v_attempt
  from public.profile_creation_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'unknown creation attempt' using errcode = '42501';
  end if;
  if v_attempt.user_id <> v_uid then
    raise exception 'attempt does not belong to caller' using errcode = '42501';
  end if;

  -- Idempotent replay: a completed attempt always returns its one profile.
  if v_attempt.status = 'completed' and v_attempt.created_profile_id is not null then
    return v_attempt.created_profile_id;
  end if;

  -- Normalize + validate the slug up front for a clean error (the DB check
  -- constraint and unique index remain the ultimate guards).
  v_slug := lower(btrim(coalesce(p_slug, '')));
  if v_slug::text !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(v_slug::text) < 3 or length(v_slug::text) > 40 then
    raise exception 'invalid_slug' using errcode = '22023';
  end if;

  -- Enforce the active-profile ceiling within the transaction. Archived and
  -- soft-deleted profiles do not count.
  select count(*) into v_active_count
  from public.profiles p
  join public.profile_memberships m on m.profile_id = p.id
  where m.user_id = v_uid
    and m.role = 'owner'
    and m.status = 'active'
    and p.deleted_at is null
    and p.archived_at is null
    and p.lifecycle_status <> 'archived';

  if v_active_count >= public.max_active_profiles_per_account() then
    raise exception 'profile_limit_reached' using errcode = 'P0001';
  end if;

  -- Delegate the atomic profile + owner membership + default modules + slug
  -- history insert to the existing tested helper. A slug race surfaces as a
  -- controlled 'slug_taken'.
  begin
    v_profile_id := public.create_profile_with_owner(v_slug::text, p_type, p_display_name, p_tagline);
  exception when unique_violation then
    raise exception 'slug_taken' using errcode = '23505';
  end;

  -- Apply the coarse, publicly-safe location only. location_exact is never set.
  if p_location_label is not null or (p_location_lon is not null and p_location_lat is not null) then
    update public.profiles
    set location_label = coalesce(p_location_label, location_label),
        location_centroid = case
          when p_location_lon is not null and p_location_lat is not null
          then extensions.st_setsrid(extensions.st_makepoint(p_location_lon, p_location_lat), 4326)::extensions.geography
          else location_centroid
        end
    where id = v_profile_id;
  end if;

  -- Mark the attempt completed (idempotency record).
  update public.profile_creation_attempts
  set status = 'completed',
      created_profile_id = v_profile_id,
      requested_slug = v_slug,
      requested_type = p_type,
      completed_at = now()
  where id = p_attempt_id;

  -- Assign the account default only when the current default is missing/invalid.
  v_has_valid_default := public.resolve_default_profile() is not null;
  if not v_has_valid_default then
    update public.user_accounts
    set default_profile_id = v_profile_id, updated_at = now()
    where id = v_uid;
  end if;

  return v_profile_id;
end;
$$;
comment on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) is
  'Atomic, retry-safe profile creation keyed by a server-issued attempt id. Enforces the active-profile limit, starts hidden/draft, sets the account default when none valid. Never sets location_exact.';

revoke all on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) from public;
revoke all on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) from anon;
grant execute on function public.create_profile(uuid, text, public.profile_type, text, text, text, double precision, double precision) to authenticated;

-- ===========================================================================
-- 12. Harden the underlying helper: create_profile_with_owner is now an
--     internal building block reached through create_profile(). Remove the
--     default PUBLIC (hence anon) EXECUTE and restrict to authenticated.
--     Additive hardening only — 0009 is not edited and the function body is
--     unchanged.
-- ===========================================================================
revoke all on function public.create_profile_with_owner(text, public.profile_type, text, text) from public;
revoke all on function public.create_profile_with_owner(text, public.profile_type, text, text) from anon;
grant execute on function public.create_profile_with_owner(text, public.profile_type, text, text) to authenticated;
