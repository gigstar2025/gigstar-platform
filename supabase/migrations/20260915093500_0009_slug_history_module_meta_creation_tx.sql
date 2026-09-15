-- GigStar Phase Five foundation — migration 0009
-- Slug history, module-definition metadata enrichment, and a full atomic
-- profile-creation transaction (profile + owner + default modules + slug row).
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- profile_slug_history: records previous slugs so future redirects can resolve
-- an old URL to the current profile. No redirect handler is built this phase.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_slug_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  previous_slug extensions.citext not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.user_accounts(id) on delete set null
);
comment on table public.profile_slug_history is 'Historical profile slugs for future URL redirect resolution.';
create index if not exists profile_slug_history_profile_idx on public.profile_slug_history (profile_id);
create unique index if not exists profile_slug_history_slug_idx on public.profile_slug_history (previous_slug);

alter table public.profile_slug_history enable row level security;
drop policy if exists slug_history_select on public.profile_slug_history;
create policy slug_history_select on public.profile_slug_history
  for select using (public.has_profile_access(profile_id, 'analyst'));
drop policy if exists slug_history_write on public.profile_slug_history;
create policy slug_history_write on public.profile_slug_history
  for all using (public.has_profile_access(profile_id, 'administrator'))
  with check (public.has_profile_access(profile_id, 'administrator'));

-- ---------------------------------------------------------------------------
-- Enrich module definitions to express per-type recommendation, hideability,
-- and an active flag. `is_required` (global) already covers required-for-all
-- modules (about, contact); recommended_for is per-type.
-- ---------------------------------------------------------------------------
alter table public.profile_module_definitions
  add column if not exists recommended_for public.profile_type[] not null default array[]::public.profile_type[];
alter table public.profile_module_definitions
  add column if not exists can_hide boolean not null default true;
alter table public.profile_module_definitions
  add column if not exists is_active boolean not null default true;

-- Re-seed the per-type recommendation + hide metadata from the app registry.
update public.profile_module_definitions set recommended_for = v.rec, can_hide = v.hide
from (values
  ('about',          array['dj','artist','venue','organiser']::public.profile_type[], false),
  ('facts',          array['dj','artist','venue','organiser']::public.profile_type[], true),
  ('featured-event', array['organiser']::public.profile_type[],                        true),
  ('events',         array['dj','artist','venue','organiser']::public.profile_type[], true),
  ('past-events',    array['organiser']::public.profile_type[],                        true),
  ('releases',       array['artist']::public.profile_type[],                           true),
  ('audio',          array['dj']::public.profile_type[],                               true),
  ('videos',         array[]::public.profile_type[],                                   true),
  ('gallery',        array['venue','organiser']::public.profile_type[],                true),
  ('spaces',         array['venue']::public.profile_type[],                            true),
  ('menu',           array[]::public.profile_type[],                                   true),
  ('technical',      array[]::public.profile_type[],                                   true),
  ('reviews',        array[]::public.profile_type[],                                   true),
  ('partners',       array[]::public.profile_type[],                                   true),
  ('mailing-list',   array['organiser']::public.profile_type[],                        true),
  ('contact',        array['dj','artist','venue','organiser']::public.profile_type[], false),
  ('related',        array[]::public.profile_type[],                                   true)
) as v(key, rec, hide)
where public.profile_module_definitions.key = v.key;

-- ---------------------------------------------------------------------------
-- Full atomic profile-creation transaction (section 32). Replaces the earlier
-- minimal version. Creates: profile, owner membership, required + recommended
-- default modules (allowed for the type), and the initial slug-history row.
-- Caller can only create a profile for themselves as initial Owner.
-- ---------------------------------------------------------------------------
create or replace function public.create_profile_with_owner(
  p_slug text,
  p_type public.profile_type,
  p_display_name text,
  p_tagline text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile_id uuid;
  v_slug extensions.citext := lower(p_slug);
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_accounts u where u.id = v_uid) then
    raise exception 'user account not initialised' using errcode = '42501';
  end if;

  insert into public.profiles (slug, type, display_name, tagline, created_by)
  values (v_slug, p_type, p_display_name, p_tagline, v_uid)
  returning id into v_profile_id;

  insert into public.profile_memberships (profile_id, user_id, role, status)
  values (v_profile_id, v_uid, 'owner', 'active');

  -- Required + recommended modules that are allowed for this profile type.
  insert into public.profile_modules (profile_id, module_key, position, is_hidden, draft_content, created_by, updated_by)
  select
    v_profile_id,
    d.key,
    d.default_position,
    false,
    '{}'::jsonb,
    v_uid,
    v_uid
  from public.profile_module_definitions d
  where d.is_active
    and (array_length(d.applies_to, 1) is null or p_type = any (d.applies_to))
    and (d.is_required or p_type = any (d.recommended_for));

  insert into public.profile_slug_history (profile_id, previous_slug, changed_by)
  values (v_profile_id, v_slug, v_uid);

  return v_profile_id;
end;
$$;
comment on function public.create_profile_with_owner(text, public.profile_type, text, text) is
  'Atomic profile creation: profile + owner membership + required/recommended default modules + initial slug row.';
