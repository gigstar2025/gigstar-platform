-- GigStar Phase Five foundation — migration 0007
-- Public-safe views. These expose ONLY coarse location + published, non-hidden
-- content, and NEVER location_exact. security_invoker so the caller's RLS on
-- the base tables still applies (defence in depth).
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- public_profiles: coarse, publicly-safe projection of active+public profiles.
-- location_exact is deliberately omitted; only the centroid is exposed, and
-- only as lon/lat numbers (no raw geography blob).
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.type,
  p.display_name,
  p.tagline,
  p.verification_status,
  p.location_label,
  extensions.st_y(p.location_centroid::extensions.geometry) as location_lat,
  extensions.st_x(p.location_centroid::extensions.geometry) as location_lon,
  p.travel_radius_km,
  p.published_at
from public.profiles p
where p.visibility = 'public'
  and p.lifecycle_status = 'active'
  and p.deleted_at is null
  and p.archived_at is null;
comment on view public.public_profiles is 'Publicly-safe profile projection: coarse centroid only, never location_exact.';

-- ---------------------------------------------------------------------------
-- public_profile_modules: published, non-hidden modules for public profiles.
-- Only published_content is exposed — never draft_content.
-- ---------------------------------------------------------------------------
create or replace view public.public_profile_modules
with (security_invoker = true) as
select
  m.id,
  m.profile_id,
  m.module_key,
  m.position,
  m.published_content as content,
  m.published_at
from public.profile_modules m
join public.profiles p on p.id = m.profile_id
where m.is_hidden = false
  and m.published_content is not null
  and m.archived_at is null
  and p.visibility = 'public'
  and p.lifecycle_status = 'active'
  and p.deleted_at is null
  and p.archived_at is null;
comment on view public.public_profile_modules is 'Published, non-hidden modules for public profiles. Exposes published_content only, never draft_content.';

-- ---------------------------------------------------------------------------
-- public_profile_directory: lightweight discovery row that also carries the
-- coarse geography for distance filtering (kept as geography for ST_DWithin).
-- ---------------------------------------------------------------------------
create or replace view public.public_profile_directory
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.type,
  p.display_name,
  p.tagline,
  p.location_label,
  p.location_centroid,
  p.travel_radius_km,
  p.verification_status
from public.profiles p
where p.visibility = 'public'
  and p.lifecycle_status = 'active'
  and p.deleted_at is null
  and p.archived_at is null;
comment on view public.public_profile_directory is 'Discovery directory of public profiles with coarse centroid for distance queries.';

grant select on public.public_profiles to anon, authenticated;
grant select on public.public_profile_modules to anon, authenticated;
grant select on public.public_profile_directory to anon, authenticated;
