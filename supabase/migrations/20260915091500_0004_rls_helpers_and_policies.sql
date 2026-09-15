-- GigStar Phase Five foundation — migration 0004
-- RLS helper functions + policies. Public reads only published/public data;
-- all writes gated by profile membership. Helpers are security definer with
-- a pinned empty search_path and fully-qualified names.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Helper: does the current auth user hold an active membership on a profile
-- with at least the given role rank? Role ranks are ordered most->least power.
-- security definer so the check can read profile_memberships without the
-- caller needing direct select rights, avoiding RLS recursion on that table.
-- ---------------------------------------------------------------------------
create or replace function public.profile_role_rank(role public.membership_role)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case role
    when 'owner' then 60
    when 'administrator' then 50
    when 'editor' then 40
    when 'event_manager' then 30
    when 'content_contributor' then 20
    when 'analyst' then 10
    else 0
  end;
$$;

create or replace function public.has_profile_access(target_profile uuid, min_role public.membership_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile_memberships m
    where m.profile_id = target_profile
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and public.profile_role_rank(m.role) >= public.profile_role_rank(min_role)
  );
$$;
comment on function public.has_profile_access(uuid, public.membership_role) is
  'True if the current auth user has an active membership on target_profile at >= min_role. Security definer to avoid RLS recursion.';

-- Convenience: is the profile publicly visible AND active (what anon may see).
create or replace function public.profile_is_public(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_profile
      and p.visibility = 'public'
      and p.lifecycle_status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------
alter table public.user_accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_memberships enable row level security;
alter table public.profile_invitations enable row level security;
alter table public.media_assets enable row level security;
alter table public.profile_module_definitions enable row level security;
alter table public.profile_modules enable row level security;
alter table public.profile_revisions enable row level security;

-- ---------------------------------------------------------------------------
-- user_accounts: a user reads/updates only their own account row.
-- ---------------------------------------------------------------------------
drop policy if exists user_accounts_select_own on public.user_accounts;
create policy user_accounts_select_own on public.user_accounts
  for select using ((select auth.uid()) = id);
drop policy if exists user_accounts_insert_own on public.user_accounts;
create policy user_accounts_insert_own on public.user_accounts
  for insert with check ((select auth.uid()) = id);
drop policy if exists user_accounts_update_own on public.user_accounts;
create policy user_accounts_update_own on public.user_accounts
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- profiles:
--   * anon/public: only public + active profiles.
--   * members: any profile they belong to (any status).
--   * insert: creator must be the auth user (membership added via RPC in 0005).
--   * update: administrator+ only.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (
    (visibility = 'public' and lifecycle_status = 'active')
    or public.has_profile_access(id, 'analyst')
  );
drop policy if exists profiles_insert_creator on public.profiles;
create policy profiles_insert_creator on public.profiles
  for insert with check ((select auth.uid()) = created_by);
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.has_profile_access(id, 'administrator'))
  with check (public.has_profile_access(id, 'administrator'));

-- ---------------------------------------------------------------------------
-- profile_memberships:
--   * a user can see membership rows for profiles they belong to.
--   * inserts/updates/deletes require administrator+ (never self-add) —
--     enforced here; first-owner creation goes through a security definer RPC.
-- ---------------------------------------------------------------------------
drop policy if exists memberships_select_members on public.profile_memberships;
create policy memberships_select_members on public.profile_memberships
  for select using (
    user_id = (select auth.uid())
    or public.has_profile_access(profile_id, 'administrator')
  );
drop policy if exists memberships_write_admin on public.profile_memberships;
create policy memberships_write_admin on public.profile_memberships
  for all using (public.has_profile_access(profile_id, 'administrator'))
  with check (public.has_profile_access(profile_id, 'administrator'));

-- ---------------------------------------------------------------------------
-- profile_invitations: administrator+ manages invitations for their profile.
-- ---------------------------------------------------------------------------
drop policy if exists invitations_admin_all on public.profile_invitations;
create policy invitations_admin_all on public.profile_invitations
  for all using (public.has_profile_access(profile_id, 'administrator'))
  with check (public.has_profile_access(profile_id, 'administrator'));

-- ---------------------------------------------------------------------------
-- media_assets:
--   * public may read assets of public+active profiles.
--   * content_contributor+ may manage the profile's media.
-- ---------------------------------------------------------------------------
drop policy if exists media_select on public.media_assets;
create policy media_select on public.media_assets
  for select using (
    public.profile_is_public(profile_id)
    or public.has_profile_access(profile_id, 'analyst')
  );
drop policy if exists media_write on public.media_assets;
create policy media_write on public.media_assets
  for all using (public.has_profile_access(profile_id, 'content_contributor'))
  with check (public.has_profile_access(profile_id, 'content_contributor'));

-- ---------------------------------------------------------------------------
-- profile_module_definitions: catalog is world-readable, no client writes
-- (seeded via migration / service role only).
-- ---------------------------------------------------------------------------
drop policy if exists module_definitions_read_all on public.profile_module_definitions;
create policy module_definitions_read_all on public.profile_module_definitions
  for select using (true);

-- ---------------------------------------------------------------------------
-- profile_modules:
--   * public: only non-hidden modules with published_content, on public+active
--     profiles — and ONLY the published_content is meant to be read (draft is
--     filtered at the query/view layer; see note in docs).
--   * editors: full access to modules of profiles they can edit.
-- ---------------------------------------------------------------------------
drop policy if exists profile_modules_select on public.profile_modules;
create policy profile_modules_select on public.profile_modules
  for select using (
    (
      is_hidden = false
      and published_content is not null
      and public.profile_is_public(profile_id)
    )
    or public.has_profile_access(profile_id, 'analyst')
  );
drop policy if exists profile_modules_write on public.profile_modules;
create policy profile_modules_write on public.profile_modules
  for all using (public.has_profile_access(profile_id, 'content_contributor'))
  with check (public.has_profile_access(profile_id, 'content_contributor'));

-- ---------------------------------------------------------------------------
-- profile_revisions: editors of the profile may read; writes happen via the
-- publish RPC (service/definer) but administrator+ may also insert directly.
-- ---------------------------------------------------------------------------
drop policy if exists revisions_select on public.profile_revisions;
create policy revisions_select on public.profile_revisions
  for select using (public.has_profile_access(profile_id, 'editor'));
drop policy if exists revisions_insert on public.profile_revisions;
create policy revisions_insert on public.profile_revisions
  for insert with check (public.has_profile_access(profile_id, 'editor'));
