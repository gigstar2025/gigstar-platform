-- GigStar migration 0019 — Data API grants for the profile avatar read path.
--
-- ROOT CAUSE
-- Migration 0018 rebuilt public.public_profiles (a security_invoker view) to
-- join media_assets and expose ma.public_url as avatar_url. security_invoker
-- views execute against base tables WITH THE CALLER'S privileges. Migration
-- 0010 granted anon/authenticated only a fixed column list on public.profiles
-- (which did NOT include the later-added avatar_media_id column) and granted
-- nothing on public.media_assets. As a result every anon/authenticated read
-- through public_profiles now fails with "permission denied for table
-- profiles" (the join references the ungranted avatar_media_id column) and
-- would also fail on media_assets.
--
-- FIX
-- Additively grant the MINIMUM extra column privileges the avatar read path
-- needs: SELECT (avatar_media_id) on profiles and column-scoped SELECT on
-- media_assets. Column grants are additive, so this leaves the existing 0010
-- grants intact.
--
-- SECURITY POSTURE
-- * RLS is unchanged. media_assets.media_select already restricts rows to
--   public profiles (profile_is_public) or members (has_profile_access).
-- * No write privileges are granted; writes still go through the
--   set_profile_avatar SECURITY DEFINER RPC and existing service-role paths.
set local search_path = public, extensions;

-- profiles — add the avatar foreign-key column to the readable column set.
grant select (avatar_media_id) on table public.profiles to anon, authenticated;

-- media_assets — column-scoped SELECT for the public read surface. RLS still
-- governs which rows are visible. No sensitive columns exist on this table;
-- the grant is kept explicit for parity with the 0010 least-privilege pattern.
grant select (
  id,
  profile_id,
  storage_path,
  public_url,
  kind,
  alt_text,
  width,
  height,
  byte_size,
  created_at
) on table public.media_assets to anon, authenticated;
