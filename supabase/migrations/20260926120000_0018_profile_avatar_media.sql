-- GigStar Phase Five — migration 0018
-- Server-backed profile avatar/photo.
--
-- WHAT THIS MIGRATION CHANGES
--   1. profiles.avatar_media_id -> media_assets(id)  (mirrors the existing
--      user_accounts.avatar_media_id relationship from migration 0003).
--   2. A public Storage bucket `profile-media` for profile images, with RLS on
--      storage.objects: world-readable, but writes gated by active profile
--      membership at content_contributor+ (same rank the media_assets
--      media_write policy uses). Object paths are `<profile_id>/<file>`, so the
--      first path segment identifies the owning profile for the access check.
--   3. set_profile_avatar(...) — a SECURITY DEFINER RPC that records the upload
--      in media_assets and points profiles.avatar_media_id at it, after an
--      internal content_contributor+ membership check. This mirrors the
--      definer-RPC write pattern of save_profile_module_draft (0014) and
--      publish_profile_modules (0015): direct profile UPDATE requires
--      administrator+, but managing profile media is a content_contributor
--      capability, so the RPC performs the privileged write behind that check.
--   4. public_profiles view gains avatar_url (public_url of the linked asset),
--      so the canonical public page and discovery both read the saved image.
--
-- SAFETY
--   * Idempotent: add column if not exists, create or replace, drop policy if
--     exists before create, bucket upsert on conflict.
--   * No existing data is modified; avatar_media_id defaults to NULL.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 1. profiles.avatar_media_id -> media_assets(id)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_media_id uuid;
alter table public.profiles
  drop constraint if exists profiles_avatar_media_fk;
alter table public.profiles
  add constraint profiles_avatar_media_fk
  foreign key (avatar_media_id) references public.media_assets(id) on delete set null;
comment on column public.profiles.avatar_media_id is
  'Profile avatar/photo. References the media_assets row holding the uploaded image.';

-- ---------------------------------------------------------------------------
-- 2. Storage bucket + RLS for profile media.
--    Path convention: '<profile_id>/<filename>'. The first folder segment is
--    the owning profile id, which the write policies check membership against.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  2097152, -- 2 MiB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read: anyone may read objects in this bucket (images are public).
drop policy if exists profile_media_read on storage.objects;
create policy profile_media_read on storage.objects
  for select
  using (bucket_id = 'profile-media');

-- Insert: authenticated members with content_contributor+ on the profile whose
-- id is the first path segment.
drop policy if exists profile_media_insert on storage.objects;
create policy profile_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

-- Update (used by upsert / overwrite): same membership requirement.
drop policy if exists profile_media_update on storage.objects;
create policy profile_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  )
  with check (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

-- Delete: same membership requirement (for replace/cleanup).
drop policy if exists profile_media_delete on storage.objects;
create policy profile_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-media'
    and public.has_profile_access(((storage.foldername(name))[1])::uuid, 'content_contributor')
  );

-- ---------------------------------------------------------------------------
-- 3. set_profile_avatar RPC (content_contributor+; definer).
-- ---------------------------------------------------------------------------
create or replace function public.set_profile_avatar(
  p_profile_id uuid,
  p_storage_path text,
  p_public_url text,
  p_alt_text text default null,
  p_width integer default null,
  p_height integer default null,
  p_byte_size bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_account uuid;
  v_media_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not public.has_profile_access(p_profile_id, 'content_contributor') then
    raise exception 'not authorised to edit this profile' using errcode = '42501';
  end if;

  -- uploaded_by references user_accounts(id); auth.uid() == user_accounts.id.
  select id into v_account from public.user_accounts where id = v_uid;

  insert into public.media_assets (
    profile_id, storage_path, public_url, kind, alt_text, width, height, byte_size, uploaded_by
  )
  values (
    p_profile_id, p_storage_path, p_public_url, 'image', p_alt_text, p_width, p_height, p_byte_size, v_account
  )
  returning id into v_media_id;

  update public.profiles
  set avatar_media_id = v_media_id,
      updated_at = now()
  where id = p_profile_id;

  return v_media_id;
end;
$$;
comment on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) is
  'Record an uploaded profile avatar in media_assets and point profiles.avatar_media_id at it. content_contributor+ only.';

revoke execute on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) from public, anon;
grant execute on function public.set_profile_avatar(uuid, text, text, text, integer, integer, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Expose avatar_url through the public-safe profile projection.
--    security_invoker view: the join to media_assets is still subject to the
--    caller's RLS (media_select allows public read for public profiles), so no
--    private media leaks. Column is appended at the end (create-or-replace
--    view requires preserving the existing column list/order).
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
  p.published_at,
  ma.public_url as avatar_url
from public.profiles p
left join public.media_assets ma on ma.id = p.avatar_media_id
where p.visibility = 'public'
  and p.lifecycle_status = 'active'
  and p.deleted_at is null
  and p.archived_at is null;
comment on view public.public_profiles is
  'Publicly-safe profile projection: coarse centroid only, never location_exact. avatar_url is the linked media asset public URL.';

grant select on public.public_profiles to anon, authenticated;
